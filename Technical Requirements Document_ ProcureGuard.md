# Technical Requirements Document: ProcureGuard

## 1. Introduction

This Technical Requirements Document (TRD) outlines the technical architecture, components, and implementation details for **ProcureGuard**, an AI-powered supply chain risk intelligence platform that unifies procurement fraud detection and regulatory compliance. It serves as a guide for the development team, ensuring that the system is built to meet the functional and non-functional requirements defined in the Product Requirements Document (PRD).

## 2. System Architecture Overview

ProcureGuard will adopt a microservices-oriented architecture, leveraging cloud-native technologies for scalability, resilience, and maintainability. The core components will include a unified data ingestion and validation pipeline, a knowledge graph database, a vector store for RAG, an analytics engine, and a user-facing API. The architecture is designed to seamlessly integrate procurement and compliance data for holistic risk assessment.

## 3. Technical Stack (Revised for Hackathon Build)

The following technologies will form the foundation of the ProcureGuard system, optimized for a hackathon build while retaining core functionalities:

| Category           | Technology       | Purpose                                                                                             |
| :----------------- | :--------------- | :-------------------------------------------------------------------------------------------------- |
| **RAG Framework**  | LangChain        | Orchestration and management of Retrieval-Augmented Generation processes.                           |
| **Vector Store**   | Weaviate         | Efficient storage and retrieval of vector embeddings for RAG system, handling diverse data types.   |
| **Knowledge Graph**| Neo4j            | Storing and querying complex supplier relationships, contracts, and regulatory dependencies.        |
| **Messaging Queue**| Kafka            | Real-time data ingestion, streaming, and inter-service communication.                               |
| **Data Validation**| Great Expectations | Ensuring data quality and validation within the pipeline.                                           |
| **Analytical DB**  | DuckDB           | Fast analytical queries on sample data for hackathon demonstration.                                 |
| **AI Model**       | Ollama (`qwen3.5:cloud`) | High-performance free cloud model with 256K context window, native tool calling, and vision.        |
| **API Framework**  | FastAPI          | Building high-performance APIs for internal and external service communication.                     |
| **Frontend**       | Streamlit or React | Building the user interface for interactive dashboards and analytics.                               |

## 4. Component-Specific Technical Requirements

### 4.1. Unified Data Ingestion and Validation Pipeline

*   **Objective:** Ingest diverse data sources (contracts, invoices, POs, vendor master lists, regulatory frameworks, news feeds) and ensure data quality and compliance simultaneously.
*   **Components:**
    *   **Kafka:** Used as the primary messaging queue for ingesting raw data streams from various sources.
    *   **Data Validation Service (Great Expectations):** A dedicated microservice responsible for real-time validation of incoming data. This service will:
        *   Identify and correct data duplicates and format errors.
        *   Enforce data quality checks for missing PO numbers and critical risk fields.
        *   Screen incoming data (e.g., invoices) against regulatory thresholds and internal policies simultaneously.
    *   **Data Transformation Service:** Transforms validated data into a format suitable for storage in Neo4j and Weaviate.

### 4.2. RAG System Implementation

*   **Objective:** Provide accurate and contextually relevant information retrieval from combined procurement and regulatory data.
*   **Components:**
    *   **LangChain:** Manages the indexing of documents and orchestrates the retrieval process, integrating with Weaviate and Ollama.
    *   **Weaviate:** Stores vector embeddings of ingested documents (contracts, invoices, regulatory documents), enabling semantic search and efficient retrieval across both domains.
    *   **Embedding Model:** A pre-trained embedding model will be used to convert text into vector embeddings.
    *   **Ollama (`qwen3.5:cloud`):** Utilized for generating responses based on retrieved information. The 256K context window allows loading entire vendor contracts and regulatory documents without chunking. "Thinking mode" enables step-by-step reasoning for complex queries like "Does this vendor invoice violate both our PO policy and FCPA's third-party payment rules?"

### 4.3. Natural Language Analytics Agent

*   **Objective:** Enable users to query the system using natural language, combining insights from procurement and compliance data.
*   **Components:**
    *   **FastAPI Endpoint:** Exposes an API endpoint for receiving natural language queries.
    *   **NL Processing Service (LangChain):** Interprets user queries, translates them into structured queries for the RAG system and knowledge graph. It can handle complex queries like "which vendors have duplicate invoices AND operate in FCPA high-risk jurisdictions?"
    *   **Ollama (`qwen3.5:cloud`):** Processes natural language queries and generates human-readable answers, citing sources from both procurement and regulatory documents. Native tool calling allows for seamless integration with LangChain agents to execute complex data retrieval and analysis tasks.

### 4.4. Anomaly Detection and Forecasting Engine

*   **Objective:** Detect anomalies in data patterns and forecast future risks, providing a unified vendor risk score.
*   **Components:**
    *   **Kafka Streams/Consumers:** Consumes real-time data from the ingestion pipeline.
    *   **Machine Learning Service:** A microservice implementing various anomaly detection algorithms (e.g., for unusual payment patterns, policy drift, transaction clusters) and forecasting models. This service will generate a single vendor risk score that factors in both financial behavior anomalies and regulatory exposure.
    *   **DuckDB:** Used for fast analytical queries on sample data during development and for hackathon demonstrations, avoiding the overhead of Apache Spark.
    *   **Data Storage:** Stores historical data and model outputs for analysis and retraining.

### 4.5. Expanded Knowledge Graph Service

*   **Objective:** Extract, store, and visualize complex relationships within the supply chain, encompassing procurement operations and regulatory compliance.
*   **Components:**
    *   **Neo4j Database:** The core database for storing the expanded knowledge graph, representing entities (vendors, contracts, invoices, approvers, departments, regulations, policies, transactions) and their relationships.
    *   **Graph Extraction Service:** Processes structured and unstructured data to identify entities and relationships, populating the Neo4j database with connections like: `vendors → contracts → invoices → approvers → departments → applicable regulations → known violations`.
    *   **Graph Visualization Library:** (Frontend consideration, but relevant for data exposure) A library like D3.js or similar for rendering interactive knowledge graphs, showcasing the "wow moment" of traversing combined procurement and regulatory data.

## 5. Non-Functional Requirements

*   **Performance:**
    *   Data ingestion: Support X records/second.
    *   Query response time: < Y seconds for 90% of queries.
*   **Scalability:** The architecture must support horizontal scaling of all microservices and databases to accommodate increasing data volumes and user loads.
*   **Security:**
    *   Data encryption at rest and in transit.
    *   Role-based access control (RBAC) for all system components.
    *   Compliance with relevant data privacy regulations (e.g., GDPR, CCPA).
*   **Reliability:** High availability (e.g., 99.9% uptime) with disaster recovery mechanisms.
*   **Maintainability:** Modular codebase, comprehensive documentation, and automated testing.

## 6. Deployment Strategy

ProcureGuard will be deployed on a cloud platform (e.g., AWS, GCP, Azure) using containerization (Docker) and orchestration (Kubernetes) for efficient management and scaling of microservices. For hackathon purposes, a simplified local deployment using Docker Compose might be considered.

## 7. Future Technical Considerations

*   Integration with existing enterprise systems (ERP, CRM).
*   Advanced analytics and reporting tools.
*   Support for additional data sources and formats.
