#!/bin/bash

# EasyDeployAI Deployment Script
# This script deploys the complete EasyDeployAI stack

echo "🚀 Starting EasyDeployAI deployment..."

# Check if required environment variables are set
if [ -z "$GEMINI_API_KEY" ]; then
    echo "❌ GEMINI_API_KEY is not set"
    exit 1
fi

if [ -z "$NFT_STORAGE_KEY" ]; then
    echo "❌ NFT_STORAGE_KEY is not set"
    exit 1
fi

if [ -z "$SEPOLIA_RPC_URL" ]; then
    echo "❌ SEPOLIA_RPC_URL is not set"
    exit 1
fi

if [ -z "$ENS_OWNER_PRIVATE_KEY" ]; then
    echo "❌ ENS_OWNER_PRIVATE_KEY is not set"
    exit 1
fi

echo "✅ Environment variables check passed"

# Deploy contracts
echo "📦 Deploying contracts to Sepolia..."
cd contracts
npm install
npx hardhat compile
npx hardhat run scripts/deployFactory.js --network sepolia
FACTORY_ADDRESS=$(npx hardhat run scripts/deployFactory.js --network sepolia 2>&1 | grep "TokenFactory deployed to:" | cut -d: -f2 | xargs)
echo "Factory deployed at: $FACTORY_ADDRESS"
cd ..

# Set factory address in frontend
echo "NEXT_PUBLIC_FACTORY_ADDRESS=$FACTORY_ADDRESS" >> frontend/.env.local

# Install backend dependencies
echo "🔧 Installing backend dependencies..."
cd backend
npm install
cd ..

# Install frontend dependencies
echo "🔧 Installing frontend dependencies..."
cd frontend
npm install
cd ..

echo "✅ Deployment complete!"
echo ""
echo "To start the application:"
echo "1. Backend: cd backend && npm start"
echo "2. Frontend: cd frontend && npm run dev"
echo ""
echo "Factory Address: $FACTORY_ADDRESS"
echo "Make sure to add this to your frontend/.env.local file"
