import os
import sys
from faker import Faker
import random

# Add project root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

from graph_db.neo4j_client import neo4j_client

fake = Faker()

def create_fraud_loop():
    """
    Creates a fraudulent loop that exactly matches the RiskEngine schema:
    (a:Approver)<-[:APPROVED_BY]-(i:Invoice)<-[:ISSUES]-(v:Vendor)
    (a)-[:HAS_AFFILIATION]->(hidden_node)<-[:HAS_AFFILIATION]-(v)
    """
    print("Seeding fraud loop into Neo4j...")
    
    approver_name = fake.name()
    vendor_name = fake.company()
    vendor_id = f"V-{random.randint(1000, 9999)}"
    invoice_id = f"INV-{random.randint(10000, 99999)}"
    amount = round(random.uniform(5000, 50000), 2)
    hidden_entity = fake.company() + " Holdings"
    
    query = """
    // 1. Create the entities
    MERGE (a:Approver {name: $approver_name, dept: 'Finance'})
    MERGE (v:Vendor {id: $vendor_id, name: $vendor_name, tier: 1})
    MERGE (i:Invoice {id: $invoice_id, amount: $amount})
    MERGE (hidden:Entity {name: $hidden_entity, type: 'Shell Company'})
    
    // 2. Create the hidden affiliation (fraud loop)
    MERGE (a)-[:HAS_AFFILIATION]->(hidden)
    MERGE (v)-[:HAS_AFFILIATION]->(hidden)
    
    // 3. Create the transaction flow
    MERGE (v)-[:ISSUES]->(i)
    MERGE (i)-[:APPROVED_BY]->(a)
    """
    
    neo4j_client.query(query, parameters={
        "approver_name": approver_name,
        "vendor_name": vendor_name,
        "vendor_id": vendor_id,
        "invoice_id": invoice_id,
        "amount": amount,
        "hidden_entity": hidden_entity
    })
    
    print(f"Created Fraud Loop: Approver '{approver_name}' <-> Vendor '{vendor_name}' (ID: {vendor_id}) via '{hidden_entity}'")

def create_cascading_risk():
    """
    Creates a cascading risk chain:
    (primary:Vendor)-[:DEPENDS_ON]->(sub_vendor:Vendor)
    (sub_vendor)-[:VIOLATES]->(reg:Regulation)
    """
    print("Seeding cascading risk into Neo4j...")
    primary_id = f"V-{random.randint(1000, 9999)}"
    sub_id = f"V-{random.randint(1000, 9999)}"
    
    query = """
    MERGE (primary:Vendor {id: $primary_id, name: $primary_name, tier: 1})
    MERGE (sub:Vendor {id: $sub_id, name: $sub_name, tier: 2})
    MERGE (reg:Regulation {name: 'FCPA Anti-Bribery'})
    
    MERGE (primary)-[:DEPENDS_ON]->(sub)
    MERGE (sub)-[:VIOLATES]->(reg)
    """
    
    neo4j_client.query(query, parameters={
        "primary_id": primary_id,
        "primary_name": fake.company(),
        "sub_id": sub_id,
        "sub_name": fake.company()
    })
    print(f"Created Cascading Risk for Vendor ID: {primary_id} depending on violating sub-vendor {sub_id}")

if __name__ == "__main__":
    print("Starting Neo4j Seeding...")
    create_fraud_loop()
    create_fraud_loop()
    create_cascading_risk()
    print("Done seeding data.")
