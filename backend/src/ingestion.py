import json
import logging
import re
import duckdb
from core.config import settings

logger = logging.getLogger(__name__)

# --- Mock Sanctions List (Compliance) ---
MOCK_OFAC_SANCTIONS = {"Vanguard Corrupto", "Shadow Traders LLC", "Frontier Fronts"}

try:
    from confluent_kafka import Producer
    _kafka_config = {"bootstrap.servers": settings.KAFKA_BROKER}
    producer = Producer(_kafka_config)
    HAS_KAFKA = True
except (ImportError, NameError):
    # Added NameError just in case settings is still weirdly handled in try block
    class MockProducer:
        def produce(self, *args, **kwargs): pass
        def flush(self, *args, **kwargs): pass
    producer = MockProducer()
    HAS_KAFKA = False
    if 'logger' in globals():
        logger.warning("confluent_kafka not found or broken. Using mock producer.")

# --- DuckDB Analytics Setup (persistent file) ---
duckdb_conn = duckdb.connect(database="procureguard_analytics.db", read_only=False)

# Ensure the invoices table exists on startup
duckdb_conn.execute("""
    CREATE TABLE IF NOT EXISTS invoices (
        id VARCHAR PRIMARY KEY,
        vendor_id VARCHAR,
        amount DOUBLE,
        status VARCHAR,
        date_issued TIMESTAMP,
        po_number VARCHAR
    )
""")


def delivery_report(err, msg):
    if err is not None:
        logger.error(f"Kafka message delivery failed: {err}")
    else:
        logger.info(f"Kafka message delivered to {msg.topic()} [{msg.partition()}]")


def _validate_invoice_native(invoice_data: dict) -> tuple[bool, list[str]]:
    """
    Pure-Python validation that avoids Great Expectations v2/v3 API fragility.
    Returns (is_valid, list_of_error_strings).
    """
    errors: list[str] = []

    # 1. Procurement check: po_number must match PO-NNNNN format
    po = invoice_data.get("po_number", "")
    if not re.match(r"^PO-\d{3,10}$", str(po)):
        errors.append(
            f"expect_column_values_to_match_regex: po_number '{po}' "
            "does not match required format PO-NNNN"
        )

    # 2. Compliance check: vendor must not be on the OFAC sanctions list
    vendor_name = invoice_data.get("vendor_name", "")
    if vendor_name in MOCK_OFAC_SANCTIONS:
        errors.append(
            f"expect_column_values_to_not_be_in_set: vendor '{vendor_name}' "
            "is on the OFAC sanctions list"
        )

    return (len(errors) == 0), errors


def ingest_invoice_to_pipeline(invoice_data: dict) -> dict:
    """
    Unified ingestion gate: Validate → Pipe to Kafka.
    """
    is_valid, errors = _validate_invoice_native(invoice_data)

    if not is_valid:
        logger.warning(f"Invoice validation failed: {errors}")
        return {"status": "rejected", "reasons": errors}

    try:
        producer.produce(
            "procureguard.invoices.validated",
            key=str(invoice_data.get("invoice_id", "unknown")),
            value=json.dumps(invoice_data),
            callback=delivery_report,
        )
        producer.flush()
        return {
            "status": "accepted",
            "message": "Invoice validated and sent to processing stream.",
        }
    except Exception as e:
        logger.error(f"Kafka error: {e}")
        return {"status": "error", "message": "Internal processing failure."}
