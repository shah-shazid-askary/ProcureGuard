# ProcureGuard

**ProcureGuard** is an AI-powered supply chain risk intelligence platform designed to unify procurement fraud detection and regulatory compliance. It leverages advanced data intelligence capabilities to provide procurement and compliance teams with actionable insights, mitigating financial and regulatory risks, and improving operational efficiency.

> "Ask your procurement data anything, catch bad invoices before payment, and know the moment a vendor relationship creates a regulatory liability."

## Features

- **Unified Data Ingestion & Validation Pipeline:** Real-time validation of incoming data (e.g., invoices) for missing PO numbers, duplicate IDs (procurement checks), and simultaneous screening against regulatory thresholds (compliance checks).
- **RAG System (Retrieval-Augmented Generation):** Ingests and processes diverse data sources including contracts, invoices, purchase orders (POs), vendor master lists, and regulatory frameworks.
- **Natural Language Analytics Agent:** Query the system using natural language for complex, cross-domain insights.
- **Anomaly Detection and Forecasting:** Generates a unified vendor risk score by combining financial behavior anomalies with regulatory exposure.
- **Knowledge Graph Extraction:** Extracts and visualizes a comprehensive knowledge graph connecting procurement operations with regulatory compliance.

## Architecture & Tech Stack

ProcureGuard adopts a microservices-oriented architecture:

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, Three.js (for GLSL Hero Banner), D3.js (for visualizations).
- **Backend API:** FastAPI, Python.
- **AI Models:** Ollama Cloud (`gemma4:31b` via API) for high-performance generation, LangChain for RAG orchestration.
- **Databases:**
  - **Neo4j:** Knowledge Graph database.
  - **Weaviate:** Vector store for semantic search.
  - **DuckDB:** Fast analytical DB for structured risk engine calculations.
  - **SQLite:** Local application analytics database.
- **Message Broker:** Kafka for real-time data streaming and pipeline validation.
- **Data Validation:** Great Expectations.
- **Orchestration:** Docker Compose.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) & [Docker Compose](https://docs.docker.com/compose/install/)
- Node.js (v18+) & npm (if running frontend locally)
- Python 3.10+ (if running backend locally)

## Installation & Setup

### Using Docker Compose (Recommended)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/shah-shazid-askary/ProcureGuard.git
   cd ProcureGuard
   ```

2. **Configure Environment Variables:**
   Create a `.env` file in the root directory and add your Ollama Cloud API Key:
   ```env
   OLLAMA_API_KEY=your_ollama_api_key_here
   ```

3. **Start the Services:**
   Run the following command to start the backend, frontend, Neo4j, Weaviate, and Kafka services:
   ```bash
   docker-compose up --build -d
   ```

4. **Access the Application:**
   - **Frontend:** http://localhost:5173
   - **Backend API Docs:** http://localhost:8000/docs
   - **Neo4j Browser:** http://localhost:7475

### Local Development Setup

#### Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the FastAPI server:
   ```bash
   uvicorn src.main:app --reload --port 8000
   ```

#### Frontend

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```

## Documentation

For more detailed information, please refer to the documents located in the root directory:
- `Product Requirements Document_ ProcureGuard.md`
- `Technical Requirements Document_ ProcureGuard.md`
- `Implementation Plan_ ProcureGuard.md`
- `Backend Schema Document_ ProcureGuard.md`
- `UI_UX Design Document_ ProcureGuard.md`

## License

This project is licensed under the MIT License.
   