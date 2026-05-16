# ProcureGuard

## Overview
ProcureGuard is an AI-powered supply-chain risk intelligence platform that unifies procurement fraud detection and regulatory compliance. The stack combines a FastAPI backend (Neo4j knowledge graph, Weaviate vector store, DuckDB analytical DB) with a React frontend.

## Quick Start

```bash
docker compose up --build
```

- **Backend API**: http://localhost:8000
- **Frontend**: http://localhost:5173
- **Neo4j**: http://localhost:7475
- **Weaviate**: http://localhost:8080

## Local Development

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn src.main:app --host 0.0.0.0 --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Services

- **FastAPI Backend** (`src/main.py`) - Risk detection, RAG intelligence agent, invoice ingestion
- **React Frontend** (`src/App.tsx`) - Dashboard with real-time risk visualization
- **Neo4j** - Knowledge graph of vendors, approvers, regulations, and relationships
- **Weaviate** - Vector store for contract/policy semantic search
- **Kafka** - Event stream for invoice validation pipeline
- **DuckDB** - Analytics DB for financial anomaly detection
