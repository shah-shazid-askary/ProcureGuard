// Neo4j Database Initialization and Constraints

CREATE CONSTRAINT vendor_id_unique IF NOT EXISTS FOR (v:Vendor) REQUIRE v.id IS UNIQUE;
CREATE CONSTRAINT contract_id_unique IF NOT EXISTS FOR (c:Contract) REQUIRE c.id IS UNIQUE;
CREATE CONSTRAINT invoice_id_unique IF NOT EXISTS FOR (i:Invoice) REQUIRE i.id IS UNIQUE;
CREATE CONSTRAINT approver_id_unique IF NOT EXISTS FOR (a:Approver) REQUIRE a.id IS UNIQUE;
CREATE CONSTRAINT department_id_unique IF NOT EXISTS FOR (d:Department) REQUIRE d.id IS UNIQUE;
CREATE CONSTRAINT regulation_id_unique IF NOT EXISTS FOR (r:Regulation) REQUIRE r.id IS UNIQUE;
CREATE CONSTRAINT riskevent_id_unique IF NOT EXISTS FOR (re:RiskEvent) REQUIRE re.id IS UNIQUE;
