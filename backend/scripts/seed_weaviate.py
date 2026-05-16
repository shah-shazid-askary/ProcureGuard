
import weaviate
import logging
import os
from src.rag import embeddings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

WEAVIATE_URL = os.getenv("WEAVIATE_URL", "http://localhost:8080")

def seed_weaviate():
    client = weaviate.Client(url=WEAVIATE_URL)
    
    knowledge_base = [
        {
            "textContent": "Contract C-100 (Hardware Procurement): Total billings for Global Tech Supplies are capped at $500,000 for FY2026. Any amount exceeding this limit requires a VP-level sign-off.",
            "sourceType": "Contract",
            "documentId": "C-100-Hardware",
            "regulatoryFramework": "ProcurementPolicy"
        },
        {
            "textContent": "FCPA Compliance Alert: Vendor V-001 (Global Tech Supplies) shares a beneficial owner with Shadow Traders LLC, which has been flagged for regulatory violations in Tier 3 supply chains.",
            "sourceType": "Policy",
            "documentId": "FCPA-2026-Alert",
            "regulatoryFramework": "FCPA"
        },
        {
            "textContent": "Internal Investigation Memo: John Doe (Approver A-77) was found to have a family affiliation with JD Holdings LLC, a shell company that received sub-contracting payments from Global Tech Supplies.",
            "sourceType": "Memo",
            "documentId": "INTERNAL-MEMO-FRAUD",
            "regulatoryFramework": "InternalControls"
        }
    ]
    
    logger.info("Seeding Weaviate with regulatory and contract knowledge...")
    
    for item in knowledge_base:
        # Generate vector locally
        vector = embeddings.embed_query(item["textContent"])
        
        client.data_object.create(
            data_object=item,
            class_name="DocumentChunk",
            vector=vector
        )
        logger.info(f"Seeded document: {item['documentId']}")

if __name__ == "__main__":
    seed_weaviate()
