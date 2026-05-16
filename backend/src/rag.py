import weaviate
import logging
from langchain_community.llms.ollama import Ollama
from langchain_community.vectorstores import Weaviate as LangchainWeaviate
from langchain_core.prompts import PromptTemplate
from langchain_core.runnables import RunnableLambda
from langchain_core.output_parsers import StrOutputParser
from langchain_community.embeddings.fastembed import FastEmbedEmbeddings

from graph_db.neo4j_client import neo4j_client
from core.config import settings

logger = logging.getLogger(__name__)

def _build_llm() -> Ollama:
    """Builds Ollama LLM using current settings (supports cloud API key)."""
    headers: dict = {}
    if settings.OLLAMA_API_KEY:
        headers["Authorization"] = f"Bearer {settings.OLLAMA_API_KEY}"
    logger.info("Initializing LLM: model=%s url=%s", settings.OLLAMA_MODEL, settings.OLLAMA_URL)
    return Ollama(
        base_url=settings.OLLAMA_URL,
        model=settings.OLLAMA_MODEL,
        headers=headers,
    )

try:
    embeddings = FastEmbedEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
except Exception as e:
    logger.exception("FastEmbed initialization failed")
    embeddings = None


def get_weaviate_client():
    try:
        return weaviate.Client(url=settings.WEAVIATE_URL)
    except TypeError:
        logger.exception(
            "Weaviate client initialization failed due to incompatible weaviate-client version"
        )
        return None
    except Exception:
        logger.exception("Weaviate client initialization failed")
        return None


def get_retriever():
    """Returns the Weaviate vector store retriever for the DocumentChunk class."""
    if embeddings is None:
        logger.warning("Vector retriever disabled because embeddings are unavailable.")
        return None

    client = get_weaviate_client()
    if client is None:
        logger.warning("Vector retriever disabled because Weaviate client is unavailable.")
        return None

    vectorstore = LangchainWeaviate(
        client=client,
        index_name="DocumentChunk",
        text_key="textContent",
        embedding=embeddings,
        by_text=False,
        attributes=["sourceType", "regulatoryFramework", "documentId"],
    )
    return vectorstore.as_retriever(search_kwargs={"k": 5})


def get_graph_context(query: str) -> str:
    """
    Retrieves relationship context from Neo4j by matching entities referenced in the query.
    """
    logger.info("Retrieving Knowledge Graph context from Neo4j...")
    cypher = """
    MATCH (n)
    WHERE any(prop IN ['name', 'id', 'invoice_number']
              WHERE n[prop] IS NOT NULL AND $query CONTAINS n[prop])
    MATCH (n)-[r]-(m)
    RETURN DISTINCT
        labels(n)[0] + ' ' + coalesce(n.id, '') + ' (' + coalesce(n.name, '') + ') '
        + type(r) + ' '
        + labels(m)[0] + ' ' + coalesce(m.id, '') + ' (' + coalesce(m.name, '') + ')' AS relationship
    LIMIT 10
    """
    results = neo4j_client.query(cypher, parameters={"query": query})
    if not results:
        return "No specific graph relationships found for this query."
    return "\n".join([r["relationship"] for r in results])


THINKING_PROMPT_TEMPLATE = """\
SYSTEM: You are the ProcureGuard Intelligence Agent. You possess cross-domain reasoning \
capabilities over Knowledge Graphs (Neo4j) and Vector Stores (Weaviate).

THINKING MODE: Before providing your final answer, analyze the data step-by-step.
1. Identify the entities and their relationships from the Graph Context.
2. Review the specific contract terms or policies from the Vector Context.
3. Compare the behavior (invoices/approvals) against the rules (contracts/frameworks).
4. Flag any anomalies or violations.

GRAPH CONTEXT (Relationships & Lineage):
{graph_context}

VECTOR CONTEXT (Contract Snippets & Policies):
{vector_context}

USER QUESTION: {question}

INSTRUCTIONS:
- Cite specific sources from the Vector Context using [Source: <documentId>].
- Use the Graph Context to explain hidden connections (e.g., shared shell companies or approver loops).
- If the context does not contain enough info, state that clearly.
- Format the response in clean markdown with short sections and bullet points for readability.
- Keep the response concise and action-oriented.

FINAL ANSWER:\
"""


def create_rag_chain():
    """
    Creates a Cross-Domain RAG chain that reasons over both
    Graph (relationships) and Vector (unstructured text) data.

    The chain input must be a dict with a 'question' key:
        chain.invoke({"question": "Is invoice INV-002 compliant?"})
    """
    retriever = get_retriever()
    prompt = PromptTemplate.from_template(THINKING_PROMPT_TEMPLATE)
    llm = _build_llm()

    def build_combined_context(input_data: dict) -> dict:
        question = input_data["question"]
        if retriever is None:
            v_context = "Vector retrieval unavailable: unable to access Weaviate context."
        else:
            try:
                v_docs = retriever.invoke(question)
                v_context = "\n".join(
                    f"[Source: {d.metadata.get('documentId', 'Unknown')}] {d.page_content}"
                    for d in v_docs
                )
                if not v_context:
                    v_context = "No relevant vector context found."
            except Exception:
                logger.exception("Vector retrieval failed during chain invocation")
                v_context = "Vector retrieval failed at runtime."
        g_context = get_graph_context(question)
        return {"graph_context": g_context, "vector_context": v_context, "question": question}

    chain = (
        RunnableLambda(build_combined_context)
        | prompt
        | llm
        | StrOutputParser()
    )
    return chain


# Lazy singleton — created on first use to avoid crashing on import
_rag_chain = None


def get_rag_chain():
    global _rag_chain
    if _rag_chain is None:
        _rag_chain = create_rag_chain()
    return _rag_chain
