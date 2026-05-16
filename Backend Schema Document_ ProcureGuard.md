# Backend Schema Document: ProcureGuard

## 1. Introduction

This document defines the backend data schema for **ProcureGuard**, an AI-powered supply chain risk intelligence platform that unifies procurement fraud detection and regulatory compliance. The system utilizes a polyglot persistence strategy, employing Neo4j for the expanded knowledge graph to model complex relationships and Weaviate as a vector store for semantic search and Retrieval-Augmented Generation (RAG).

## 2. Knowledge Graph Schema (Neo4j)

The Neo4j database is designed to capture the intricate web of relationships within the unified procurement and compliance domains. It models entities as nodes and their interactions as edges (relationships), enabling complex traversals for insights into financial anomalies and regulatory breaches.

### 2.1. Nodes (Entities)

| Node Label   | Description                                                                                                  | Key Properties                                                                                                                                |
| :----------- | :----------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------- |
| `Vendor`     | Represents a company providing goods or services.                                                            | `id` (String, Unique), `name` (String), `tier` (Integer), `region` (String), `risk_score` (Float), `status` (String), `jurisdiction` (String) |
| `Contract`   | Represents a legal agreement between the enterprise and a vendor.                                            | `id` (String, Unique), `title` (String), `start_date` (Date), `end_date` (Date), `value` (Float), `status` (String)                           |
| `Invoice`    | Represents a financial request for payment from a vendor.                                                    | `id` (String, Unique), `invoice_number` (String), `amount` (Float), `date_issued` (Date), `status` (String), `po_number` (String)             |
| `Product`    | Represents a specific item or service procured.                                                              | `id` (String, Unique), `name` (String), `category` (String), `criticality` (String)                                                           |
| `Approver`   | Represents an individual who approves payments or contracts.                                                 | `id` (String, Unique), `name` (String), `role` (String)                                                                                       |
| `Department` | Represents an organizational department.                                                                     | `id` (String, Unique), `name` (String)                                                                                                        |
| `Regulation` | Represents a regulatory framework (e.g., SOX, FCPA, GDPR).                                                   | `id` (String, Unique), `name` (String), `description` (String), `jurisdiction` (String)                                                       |
| `Policy`     | Represents an internal policy derived from a regulation.                                                     | `id` (String, Unique), `name` (String), `description` (String), `version` (String)                                                            |
| `RiskEvent`  | Represents an identified risk or anomaly (e.g., natural disaster, financial instability, regulatory breach). | `id` (String, Unique), `type` (String), `severity` (String), `date_detected` (Date), `description` (String), `category` (String)              |

### 2.2. Relationships (Edges)

| Relationship Type | Source Node               | Target Node                         | Description                                                  | Key Properties                                     |
| :---------------- | :------------------------ | :---------------------------------- | :----------------------------------------------------------- | :------------------------------------------------- |
| `SUPPLIES`        | `Vendor`                  | `Product`                           | Indicates a vendor provides a specific product.              | `lead_time_days` (Integer), `unit_price` (Float)   |
| `HAS_CONTRACT`    | `Vendor`                  | `Contract`                          | Links a vendor to an active contract.                        | `role` (String)                                    |
| `ISSUES`          | `Vendor`                  | `Invoice`                           | Indicates a vendor issued an invoice.                        | `date` (Date)                                      |
| `REFERENCES_PO`   | `Invoice`                 | `Contract`                          | An invoice references a specific contract (via PO).          | `po_match` (Boolean)                               |
| `APPROVED_BY`     | `Invoice`                 | `Approver`                          | An invoice was approved by an approver.                      | `date_approved` (Date)                             |
| `BELONGS_TO`      | `Approver`                | `Department`                        | An approver belongs to a department.                         |                                                    |
| `DEPENDS_ON`      | `Vendor`                  | `Vendor`                            | Represents Tier-2/Tier-3 dependencies between vendors.       | `dependency_type` (String), `criticality` (String) |
| `AFFECTS`         | `RiskEvent`               | `Vendor` / `Product` / `Department` | Indicates a risk event impacting a specific entity.          | `impact_level` (String)                            |
| `DERIVED_FROM`    | `Policy`                  | `Regulation`                        | An internal policy is derived from a regulation.             |                                                    |
| `GOVERNS`         | `Regulation`              | `Vendor` / `Department`             | A regulation applies to a vendor or department.              | `scope` (String)                                   |
| `VIOLATES`        | `Invoice` / `Transaction` | `Regulation` / `Policy`             | An invoice or transaction violates a regulation or policy.   | `violation_type` (String), `severity` (String)     |
| `HAS_GAP`         | `Department`              | `Regulation`                        | A department has a known policy gap related to a regulation. | `description` (String)                             |

## 3. Vector Store Schema (Weaviate)

Weaviate is used to store vector embeddings of unstructured text data (e.g., contract clauses, news articles, audit reports, regulatory documents) to enable semantic search for the RAG system. Weaviate's capabilities allow for both vector search and property-based filtering.

### 3.1. Class Configuration

- **Class Name:** `DocumentChunk`
- **Vectorizer:** `text2vec-ollama` (or similar, compatible with `qwen3.5:cloud` embeddings)
- **Module Config:** Configured to use `qwen3.5:cloud` for embeddings.

### 3.2. Properties (Metadata)

Each object (document chunk) stored in Weaviate will include properties (metadata) to facilitate filtering and contextual retrieval.

| Property Name         | Data Type | Description                                                                          |
| :-------------------- | :-------- | :----------------------------------------------------------------------------------- |
| `documentId`          | Text      | Unique identifier for the source document.                                           |
| `chunkId`             | Text      | Unique identifier for the specific text chunk.                                       |
| `sourceType`          | Text      | Type of document (e.g., "Contract", "News", "Audit Report", "Regulation", "Policy"). |
| `vendorId`            | Text      | ID of the associated vendor (if applicable).                                         |
| `datePublished`       | Date      | Date the document was published or created.                                          |
| `textContent`         | Text      | The original text chunk corresponding to the embedding.                              |
| `regulatoryFramework` | Text      | Name of the regulatory framework (if applicable, e.g., "FCPA", "SOX").               |
| `policyId`            | Text      | ID of the internal policy (if applicable).                                           |

## 4. Analytical Database (DuckDB)

For hackathon purposes, DuckDB will be used for fast, in-memory analytical queries on sample data. This avoids the overhead of distributed systems like Apache Spark while providing powerful SQL capabilities for data exploration and aggregation during demonstrations.

## 5. Data Validation (Great Expectations)

Great Expectations will be integrated into the data pipeline to define, validate, and document data quality expectations. This ensures that data entering the system meets predefined quality and compliance standards.
