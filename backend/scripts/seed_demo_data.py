
import json
import logging
from graph_db.neo4j_client import neo4j_client
from src.ingestion import ingest_invoice_to_pipeline

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def seed_graph_data():
    logger.info("Seeding Neo4j Knowledge Graph...")
    
    # 1. Create Nodes
    neo4j_client.query("""
    MERGE (v1:Vendor {id: 'V-001', name: 'Global Tech Supplies', tier: 1})
    MERGE (v2:Vendor {id: 'V-002', name: 'JD Holdings LLC', tier: 2})
    MERGE (v3:Vendor {id: 'V-003', name: 'Shadow Traders LLC', tier: 3})
    
    MERGE (r1:Regulation {name: 'FCPA Section 30A', framework: 'FCPA'})
    
    MERGE (a:Approver {name: 'John Doe', id: 'A-77'})
    
    MERGE (i1:Invoice {id: 'INV-001', amount: 5500.0})
    MERGE (i2:Invoice {id: 'INV-002', amount: 5500.0})
    
    // 2. Create Relationships
    MERGE (v1)-[:DEPENDS_ON]->(v2)
    MERGE (v2)-[:DEPENDS_ON]->(v3)
    MERGE (v3)-[:VIOLATES]->(r1)
    
    // Fraud Loop: Approver affiliated with sub-vendor, but approving primary vendor invoices
    // (Simplified for demo: Approver and Vendor both share affiliation to JD Holdings)
    MERGE (a)-[:HAS_AFFILIATION]->(v2)
    MERGE (v1)-[:HAS_AFFILIATION]->(v2)
    
    // Connect Invoices for loop detection
    MERGE (v1)-[:ISSUES]->(i1)
    MERGE (v1)-[:ISSUES]->(i2)
    MERGE (i1)-[:APPROVED_BY]->(a)
    MERGE (i2)-[:APPROVED_BY]->(a)
    """)
    logger.info("Graph seeding complete.")

def seed_transactional_data():
    logger.info("Seeding Invoices via Ingestion Pipeline...")
    
    invoices = [
        # Split Purchase Loop (2 invoices totaling $11k on same day for same PO)
        {
            "invoice_id": "INV-001",
            "vendor_id": "V-001",
            "vendor_name": "Global Tech Supplies",
            "po_number": "PO-12345",
            "amount": 5500.0,
            "date_issued": "2026-05-15T10:00:00Z"
        },
        {
            "invoice_id": "INV-002",
            "vendor_id": "V-001",
            "vendor_name": "Global Tech Supplies",
            "po_number": "PO-12345",
            "amount": 5500.0,
            "date_issued": "2026-05-15T11:00:00Z"
        },
        # Duplicate Invoice
        {
            "invoice_id": "INV-003",
            "vendor_id": "V-001",
            "vendor_name": "Global Tech Supplies",
            "po_number": "PO-99999",
            "amount": 1500.0,
            "date_issued": "2026-05-14T09:00:00Z"
        },
        {
            "invoice_id": "INV-004",
            "vendor_id": "V-001",
            "vendor_name": "Global Tech Supplies",
            "po_number": "PO-99999",
            "amount": 1500.0,
            "date_issued": "2026-05-14T10:00:00Z"
        }
    ]
    
    for inv in invoices:
        res = ingest_invoice_to_pipeline(inv)
        logger.info(f"Ingested {inv['invoice_id']}: {res['status']}")

if __name__ == "__main__":
    try:
        seed_graph_data()
        seed_transactional_data()
        print("\nDEMO DATA SEEDED SUCCESSFULLY.")
        print("Vendor V-001 now has:")
        print(" - 1 Split Purchase Anomaly (+35 Risk)")
        print(" - 1 Duplicate Invoice Anomaly (+25 Risk)")
        print(" - 1 Supply Chain Regulatory Violation (+50 Risk)")
        print(" - 1 Approver Fraud Loop (+40 Risk)")
        print("Unified Score should reach the 100/100 ceiling.")
    except Exception as e:
        logger.error(f"Seeding failed: {e}")
