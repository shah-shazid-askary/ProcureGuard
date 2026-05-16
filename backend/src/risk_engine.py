import logging
from graph_db.neo4j_client import neo4j_client
from src.ingestion import duckdb_conn

logger = logging.getLogger(__name__)


def _record_to_dict(record) -> dict:
    """Convert a Neo4j Record to a plain dict safely."""
    try:
        return dict(record)
    except Exception:
        return {}


class RiskEngine:
    """
    The RiskEngine executes graph traversals against Neo4j and financial
    analytics against DuckDB to produce a Unified Risk Score.
    """

    def detect_approver_fraud_loops(self) -> list[dict]:
        """
        Detects scenarios where an Approver is authorizing invoices for a Vendor
        they have a hidden affiliation with (e.g., shared shell company).
        """
        query = """
        MATCH (a:Approver)<-[:APPROVED_BY]-(i:Invoice)<-[:ISSUES]-(v:Vendor)
        MATCH (a)-[:HAS_AFFILIATION]->(hidden_node)<-[:HAS_AFFILIATION]-(v)
        RETURN a.name AS approver,
               v.name AS vendor,
               v.id   AS vendor_id,
               count(i) AS invoice_count,
               sum(i.amount) AS total_amount
        """
        records = neo4j_client.query(query) or []
        results = [_record_to_dict(r) for r in records]
        if results:
            logger.warning(f"CRITICAL: Detected {len(results)} potential approver fraud loops.")
        return results

    def calculate_cascading_risk_score(self, vendor_id: str) -> list[dict]:
        """
        Traverses Tier-2 and Tier-3 sub-vendor dependencies, identifying
        Regulatory Violations and active RiskEvents in the supply chain.
        """
        query = """
        MATCH (primary:Vendor {id: $vendor_id})-[:DEPENDS_ON*1..3]->(sub_vendor:Vendor)
        OPTIONAL MATCH (sub_vendor)-[:VIOLATES]->(reg:Regulation)
        OPTIONAL MATCH (event:RiskEvent)-[:AFFECTS]->(sub_vendor)
        RETURN primary.id        AS target_vendor,
               sub_vendor.name   AS risk_source,
               sub_vendor.tier   AS tier,
               reg.name          AS regulation_violated,
               event.type        AS risk_event
        """
        records = neo4j_client.query(query, parameters={"vendor_id": vendor_id}) or []
        results = [_record_to_dict(r) for r in records]
        if results:
            logger.info(
                f"Cascading risk assessment complete for {vendor_id}. "
                f"Found {len(results)} exposure paths."
            )
        return results

    def flag_invoice_anomalies(self, invoice_id: str) -> list[dict]:
        """
        Checks an invoice against its parent contract's value ceiling.
        Creates a RiskEvent node in the graph if an overage is detected.
        """
        query = """
        MATCH (i:Invoice {id: $invoice_id})-[:REFERENCES_PO]->(c:Contract)
        MATCH (v:Vendor)-[:ISSUES]->(i)
        OPTIONAL MATCH (past_i:Invoice)-[:REFERENCES_PO]->(c)
        WITH i, c, v, sum(past_i.amount) AS total_billed_so_far
        WHERE total_billed_so_far > c.value
        RETURN i.id                AS anomalous_invoice,
               v.name              AS vendor,
               c.title             AS contract,
               total_billed_so_far AS total_billed,
               c.value             AS contract_limit
        """
        records = neo4j_client.query(query, parameters={"invoice_id": invoice_id}) or []
        results = [_record_to_dict(r) for r in records]

        if results:
            logger.warning(f"Invoice {invoice_id} triggered a contract overage anomaly.")
            # Use built-in randomUUID() — does NOT require APOC
            neo4j_client.query(
                """
                MATCH (i:Invoice {id: $invoice_id})
                CREATE (r:RiskEvent {
                    id:       randomUUID(),
                    type:     'Contract Overage',
                    severity: 'HIGH',
                    category: 'Financial Anomaly'
                })
                CREATE (r)-[:AFFECTS]->(i)
                """,
                parameters={"invoice_id": invoice_id},
            )

        return results

    def analyze_financial_anomalies(self, vendor_id: str) -> dict:
        """
        Uses DuckDB to detect split-purchase patterns and duplicate invoicing.
        """
        logger.info(f"Analyzing financial anomalies for {vendor_id} using DuckDB...")

        # 1. Split Purchases: multiple invoices on same day + PO, each < $10k
        #    but summing to >= $10k (structured to dodge approval threshold)
        split_results = duckdb_conn.execute(
            """
            SELECT count(*) AS split_count
            FROM invoices
            WHERE vendor_id = ?
              AND amount < 10000
            GROUP BY po_number, date_trunc('day', date_issued)
            HAVING sum(amount) >= 10000 AND count(*) > 1
            """,
            [vendor_id],
        ).fetchall()

        # 2. Duplicate Invoices: same amount + PO number submitted more than once
        duplicate_results = duckdb_conn.execute(
            """
            SELECT count(*) AS duplicate_count
            FROM invoices
            WHERE vendor_id = ?
            GROUP BY amount, po_number
            HAVING count(*) > 1
            """,
            [vendor_id],
        ).fetchall()

        return {
            "split_purchases": len(split_results),
            "duplicates": len(duplicate_results),
        }

    def get_unified_risk_score(self, vendor_id: str) -> dict:
        """
        Generates the Unified Risk Score (0-100) by combining:
          - DuckDB financial anomalies (split purchases, duplicates)
          - Neo4j compliance violations in the supply chain
          - Neo4j approver fraud-loop detection
        """
        score = 0
        anomalies = self.analyze_financial_anomalies(vendor_id)
        graph_risks = self.calculate_cascading_risk_score(vendor_id)
        fraud_loops = self.detect_approver_fraud_loops()

        # Financial layer
        if anomalies["split_purchases"] > 0:
            score += 35
            logger.warning(f"Unified Score: +35 for Split Purchases [{vendor_id}]")
        if anomalies["duplicates"] > 0:
            score += 25
            logger.warning(f"Unified Score: +25 for Duplicate Invoices [{vendor_id}]")

        # Compliance layer — sub-vendor regulatory violations
        compliance_hits = [r for r in graph_risks if r.get("regulation_violated")]
        if compliance_hits:
            score += 50
            logger.warning(
                f"Unified Score: +50 for Regulatory Violation in supply chain [{vendor_id}]"
            )

        # Fraud loop layer — vendor directly implicated in an approver loop
        fraud_loop_detected = any(f.get("vendor_id") == vendor_id for f in fraud_loops)
        if fraud_loop_detected:
            score += 40
            logger.warning(f"Unified Score: +40 for Approver Fraud Loop [{vendor_id}]")

        final_score = min(score, 100)
        logger.info(f"UNIFIED RISK SCORE for {vendor_id}: {final_score}/100")

        return {
            "vendor_id": vendor_id,
            "risk_score": final_score,
            "breakdown": {
                "financial_anomalies": anomalies,
                "graph_compliance_issues": len(compliance_hits),
                "fraud_loop_detected": fraud_loop_detected,
            },
        }


risk_engine = RiskEngine()
