#!/bin/bash

echo "🚀 Deploying Bedrock Salesforce MCP Server"
echo "=========================================="

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found"
    echo "Please copy .env.example to .env and configure your credentials"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Run tests
echo "🧪 Running tests..."
npm test

if [ $? -ne 0 ]; then
    echo "⚠️  Tests failed, but continuing deployment..."
fi

# Build Docker image (optional)
if command -v docker &> /dev/null; then
    echo "🐳 Building Docker image..."
    docker build -t bedrock-mcp-server:latest .
    
    if [ $? -eq 0 ]; then
        echo "✅ Docker image built successfully"
        echo "Run with: docker run -p 3000:3000 --env-file .env bedrock-mcp-server:latest"
    fi
fi

# Start server
echo "🚀 Starting MCP Server..."
npm start

echo "✅ Deployment complete!"
