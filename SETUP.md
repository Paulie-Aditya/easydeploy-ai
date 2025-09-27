# EasyDeployAI Setup Guide

This guide will walk you through setting up the complete EasyDeployAI application on Sepolia testnet.

## Prerequisites

- Node.js 16+ installed
- Git installed
- Sepolia testnet ETH (get from faucets)
- Required API keys (see below)

## Required API Keys

### 1. Google Gemini API Key

- Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
- Create a new API key
- Copy the key for `GEMINI_API_KEY`

### 2. NFT.Storage API Key

- Go to [NFT.Storage](https://nft.storage/)
- Sign up and create an account
- Go to API Keys section
- Create a new API key
- Copy the key for `NFT_STORAGE_KEY`

### 3. Sepolia RPC URL

- Option A: Use Alchemy
  - Go to [Alchemy](https://www.alchemy.com/)
  - Create a new app on Sepolia
  - Copy the HTTPS URL for `SEPOLIA_RPC_URL`
- Option B: Use Infura
  - Go to [Infura](https://infura.io/)
  - Create a new project
  - Copy the Sepolia endpoint URL

### 4. ENS Owner Private Key

- You need to own `easydeployai.eth` on Sepolia
- If you don't own it, register it first or use a test domain
- Export your private key for `ENS_OWNER_PRIVATE_KEY`

## Quick Setup

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd EasyDeployAI
```

### 2. Environment Setup

Copy environment files:

```bash
# Backend
cp backend/env.example backend/.env

# Frontend
cp frontend/env.local.example frontend/.env.local

# Contracts
cp contracts/env.example contracts/.env
```

### 3. Fill Environment Variables

**Backend (.env):**

```env
GEMINI_API_KEY=your_gemini_api_key_here
NFT_STORAGE_KEY=your_nft_storage_key_here
SEPOLIA_RPC_URL=https://eth-sepolia.alchemyapi.io/v2/your_key
ENS_OWNER_PRIVATE_KEY=0x_your_private_key_here
DEPLOYER_PRIVATE_KEY=0x_your_private_key_here
PORT=5001
```

**Frontend (.env.local):**

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:5001
NEXT_PUBLIC_FACTORY_ADDRESS=0x_after_deployment
```

**Contracts (.env):**

```env
SEPOLIA_RPC_URL=https://eth-sepolia.alchemyapi.io/v2/your_key
DEPLOYER_PRIVATE_KEY=0x_your_private_key_here
```

### 4. Deploy Contracts

```bash
cd contracts
npm install
npx hardhat compile
npx hardhat run scripts/deployFactory.js --network sepolia
```

Copy the factory address and add it to `frontend/.env.local`:

```env
NEXT_PUBLIC_FACTORY_ADDRESS=0x_deployed_factory_address
```

### 5. Start Backend

```bash
cd backend
npm install
npm start
```

The backend will start on `http://localhost:5001`

### 6. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend will start on `http://localhost:3000`

## Verification Steps

### 1. Check ENS Ownership

```bash
cd backend
node check-owner.js
```

This should show that you own `easydeployai.eth` on Sepolia.

### 2. Test Backend Endpoints

```bash
# Test Gemini integration
curl -X POST http://localhost:5001/generate-token \
  -H "Content-Type: application/json" \
  -d '{"description":"A meme token for coffee lovers"}'

# Test NFT.Storage integration
curl -X POST http://localhost:5001/upload-logo \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","description":"Test logo","imageSvg":"<svg>...</svg>"}'

# Test 1inch integration
curl "http://localhost:5001/1inch/quote?chainId=1&fromTokenAddress=0x0000000000000000000000000000000000000000&toTokenAddress=0xA0b86a33E6441b8C4C8C0E4A8e4C0E4A8e4C0E4A8&amount=1000000000000000000"

# Test Pyth integration
curl "http://localhost:5001/pyth/price"
```

### 3. Test Frontend

1. Open `http://localhost:3000`
2. Connect your wallet to Sepolia
3. Describe a token
4. Generate token specifications
5. Upload logo
6. Deploy token
7. Verify ENS subname creation

## Troubleshooting

### Common Issues

1. **ENS Ownership Error**

   - Make sure you own `easydeployai.eth` on Sepolia
   - Check your private key is correct
   - Run `node check-owner.js` to verify

2. **Contract Deployment Fails**

   - Ensure you have Sepolia ETH
   - Check your RPC URL is correct
   - Verify your private key has funds

3. **Backend API Errors**

   - Check all API keys are valid
   - Ensure backend is running on port 5001
   - Check CORS settings

4. **Frontend Connection Issues**
   - Make sure backend is running
   - Check environment variables
   - Verify factory address is correct

### Getting Sepolia ETH

- [Sepolia Faucet](https://sepoliafaucet.com/)
- [Alchemy Faucet](https://sepoliafaucet.com/)
- [Infura Faucet](https://infura.io/faucet/sepolia)

### ENS Registration on Sepolia

1. Go to [ENS Sepolia App](https://app.ens.domains/)
2. Search for `easydeployai.eth`
3. If available, register it
4. If not available, use a test domain you own

## Production Deployment

### Backend (Railway/Render)

1. Create account on Railway or Render
2. Connect your GitHub repo
3. Set environment variables
4. Deploy

### Frontend (Vercel)

1. Create account on Vercel
2. Import your GitHub repo
3. Set environment variables:
   - `NEXT_PUBLIC_BACKEND_URL`
   - `NEXT_PUBLIC_FACTORY_ADDRESS`
4. Deploy

## Demo Flow

1. **Connect Wallet**: User connects MetaMask to Sepolia
2. **Describe Token**: "A meme token for coffee lovers with governance"
3. **AI Generation**: Gemini creates token specifications
4. **Logo Upload**: SVG logo uploaded to IPFS
5. **Token Deployment**: Factory contract deploys ERC20
6. **ENS Registration**: Creates `{tokenname}.easydeployai.eth`
7. **Token Page**: Shows deployed token with trading links

## Integration Details

- **Gemini AI**: Generates structured JSON token specs
- **NFT.Storage**: Decentralized logo and metadata storage
- **ENS**: Automatic subname creation and resolution
- **1inch**: Quote endpoints and deep-link generation
- **Pyth**: Real-time price feeds with CoinGecko fallback
- **Sepolia**: Full testnet deployment and verification

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Verify all environment variables are set
3. Ensure you have sufficient Sepolia ETH
4. Check that you own the ENS domain on Sepolia
5. Review the console logs for specific error messages
