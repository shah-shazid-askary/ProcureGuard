import weaviate
from core.config import settings
import logging

logger = logging.getLogger(__name__)

def get_weaviate_client():
    try:
        client = weaviate.Client(
            url=settings.WEAVIATE_URL
        )
        if client.is_ready():
            logger.info("Successfully connected to Weaviate.")
            return client
        else:
            logger.warning("Weaviate is not ready.")
            return None
    except Exception as e:
        logger.error(f"Failed to connect to Weaviate: {e}")
        return None

weaviate_client = get_weaviate_client()

def init_schema():
    """
    Initializes the schema inside Weaviate exactly as defined in the Unified Master Requirements.
    """
    if not weaviate_client:
        logger.error("Cannot initialize schema, client is not connected.")
        return
        
    schema = {
        "classes": [
            {
                "class": "DocumentChunk",
                "description": "A chunk of text from a regulatory or procurement document",
                "vectorizer": "text2vec-ollama",
                "moduleConfig": {
                    "text2vec-ollama": {
                        "apiEndpoint": settings.OLLAMA_URL,
                        "model": settings.OLLAMA_MODEL,
                    }
                },
                "properties": [
                    {"name": "documentId", "dataType": ["text"], "description": "Unique identifier for the source document"},
                    {"name": "chunkId", "dataType": ["text"], "description": "Unique identifier for the chunk"},
                    {"name": "sourceType", "dataType": ["text"], "description": "Type of document (e.g., Contract, News, Audit Report, Regulation, Policy)"},
                    {"name": "vendorId", "dataType": ["text"]},
                    {"name": "datePublished", "dataType": ["date"]},
                    {"name": "textContent", "dataType": ["text"], "description": "The original text chunk"},
                    {"name": "regulatoryFramework", "dataType": ["text"], "description": "Name of regulatory framework (e.g., FCPA, SOX)"},
                    {"name": "policyId", "dataType": ["text"]}
                ]
            }
        ]
    }
    
    # Check if schema already exists, else create it
    try:
        existing_schema = weaviate_client.schema.get()
        existing_classes = [c.get("class") for c in existing_schema.get("classes", [])]
        
        if "DocumentChunk" not in existing_classes:
            weaviate_client.schema.create(schema)
            logger.info("Initialized Weaviate schema for DocumentChunk.")
        else:
            logger.info("Weaviate schema for DocumentChunk already exists.")
    except Exception as e:
        logger.error(f"Failed to check or create Weaviate schema: {e}")
