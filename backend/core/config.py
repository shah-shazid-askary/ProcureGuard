from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Neo4j Settings
    NEO4J_URI: str = "bolt://localhost:7688"
    NEO4J_USER: str = "neo4j"
    NEO4J_PASSWORD: str = "procureguard"
    
    # Weaviate Settings
    WEAVIATE_URL: str = "http://localhost:8080"
    
    # Kafka Settings
    KAFKA_BROKER: str = "localhost:9092"
    
    # Ollama Settings
    OLLAMA_URL: str = "https://ollama.com"
    OLLAMA_API_KEY: str = ""
    OLLAMA_MODEL: str = "gemma4:31b"

    class Config:
        env_file = ".env"

settings = Settings()
 