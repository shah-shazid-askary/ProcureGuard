#!/bin/bash
# setup_ollama.sh
# Initializes the Ollama container with the base qwen model 
# and creates a custom variant with a 256K context window.

echo "Waiting for the Ollama container to fully start..."
sleep 5

echo "Pulling the base qwen model (Note: standard qwen serves as a proxy for qwen3.5:cloud in local dev)..."
docker exec -it procureguard-ollama ollama pull qwen

echo "Creating custom Modelfile for the 256K context window setting..."
cat << 'EOF' > Modelfile.qwen-256k
FROM qwen
# Initialize a 256K context window (262144 tokens)
PARAMETER num_ctx 262144
EOF

# Copy the Modelfile into the container and create the new extended-context model
docker cp Modelfile.qwen-256k procureguard-ollama:/Modelfile.qwen-256k
docker exec -it procureguard-ollama ollama create procureguard-qwen -f /Modelfile.qwen-256k

echo "Model 'procureguard-qwen' successfully initialized with a 256K context window!"

# Clean up local artifact
rm Modelfile.qwen-256k
