import os
import logging
from neo4j import GraphDatabase
import weaviate

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- Database Configurations ---
NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7688")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "procureguard")

WEAVIATE_URL = os.getenv("WEAVIATE_URL", "http://localhost:8080")
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://ollama:11434")

def init_neo4j_schema():
    """
    Initializes the Neo4j Knowledge Graph schema.
    Specifically establishes constraints for Vendor, Invoice, and Regulation nodes,
    and sets up an index for the VIOLATES relationship.
    """
    logger.info("Initializing Neo4j Graph Schema...")
    try:
        driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
        with driver.session() as session:
            # Create uniqueness constraints for the primary nodes requested
            session.run("CREATE CONSTRAINT vendor_id_unique IF NOT EXISTS FOR (v:Vendor) REQUIRE v.id IS UNIQUE")
            session.run("CREATE CONSTRAINT invoice_id_unique IF NOT EXISTS FOR (i:Invoice) REQUIRE i.id IS UNIQUE")
            session.run("CREATE CONSTRAINT regulation_id_unique IF NOT EXISTS FOR (r:Regulation) REQUIRE r.id IS UNIQUE")
            
            # In Neo4j, relationship structures (like VIOLATES) are schema-less, but we can 
            # optimize traversals by indexing the properties commonly filtered on edges.
            # (Note: Relationship indexing syntax depends on Neo4j version, this is standard 5.x)
            try:
                session.run("CREATE INDEX violates_type_index IF NOT EXISTS FOR ()-[rel:VIOLATES]-() ON (rel.violation_type)")
            except Exception as e:
                logger.warning(f"Could not create relationship index (may not be supported in this edition): {e}")
            
        driver.close()
        logger.info("Neo4j constraints for Vendor, Invoice, Regulation, and VIOLATES created successfully.")
    except Exception as e:
        logger.error(f"Neo4j initialization failed: {e}")

def init_weaviate_schema():
    """
    Initializes the Weaviate semantic search schema by defining the DocumentChunk class.
    Ensures sourceType (Contract/Policy) and regulatoryFramework (FCPA/SOX) are indexed.
    """
    logger.info("Initializing Weaviate Vector Schema...")
    try:
        client = weaviate.Client(url=WEAVIATE_URL)
        if not client.is_ready():
            logger.error("Weaviate is not ready or unreachable.")
            return

        schema = {
            "classes": [
                {
                    "class": "DocumentChunk",
                    "description": "A chunk of text from a regulatory or procurement document",
                    "vectorizer": "none",
                    "properties": [
                        {"name": "documentId", "dataType": ["text"]},
                        {"name": "chunkId", "dataType": ["text"]},
                        {
                            "name": "sourceType", 
                            "dataType": ["text"],
                            "description": "Indexed for filtering by Contract, Policy, etc.",
                            "indexFilterable": True,
                            "indexSearchable": True
                        },
                        {
                            "name": "regulatoryFramework", 
                            "dataType": ["text"],
                            "description": "Indexed for filtering by FCPA, SOX, etc.",
                            "indexFilterable": True,
                            "indexSearchable": True
                        },
                        {"name": "vendorId", "dataType": ["text"]},
                        {"name": "datePublished", "dataType": ["date"]},
                        {"name": "textContent", "dataType": ["text"]}
                    ]
                }
            ]
        }

        # Check if the class already exists before creating
        existing_classes = [c.get("class") for c in client.schema.get().get("classes", [])]
        if "DocumentChunk" not in existing_classes:
            client.schema.create(schema)
            logger.info("Weaviate DocumentChunk class created successfully with sourceType and regulatoryFramework indexed.")
        else:
            logger.info("Weaviate DocumentChunk class already exists.")
            
    except Exception as e:
        logger.error(f"Weaviate initialization failed: {e}")

if __name__ == "__main__":
    logger.info("--- Starting Polyglot Database Schema Initialization ---")
    init_neo4j_schema()
    init_weaviate_schema()
    logger.info("--- Initialization Complete ---")
