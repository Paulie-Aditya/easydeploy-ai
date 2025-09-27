# EasyDeployAI - Complete Sepolia Implementation

🚀 **AI-powered token deployment platform** with ENS integration, 1inch quotes, and Pyth price feeds on Sepolia testnet.

## ✨ Features

- **🤖 AI Token Generation**: Google Gemini creates token specifications from natural language
- **📁 IPFS Storage**: NFT.Storage integration for decentralized logo and metadata storage
- **🌐 ENS Integration**: Automatic subname creation (`{tokenname}.easydeployai.eth`)
- **💱 1inch Integration**: Quote endpoints and deep-link generation for trading
- **📊 Pyth Price Feeds**: Real-time price data with CoinGecko fallback
- **⛓️ Sepolia Deployment**: Full testnet deployment with factory pattern
- **🎨 SVG Logo Generation**: Automatic logo creation based on token symbol

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, Wagmi v1, RainbowKit, Tailwind CSS
- **Backend**: Node.js, Express, Google Gemini AI, NFT.Storage, Web3.js
- **Smart Contracts**: Solidity 0.8.19, OpenZeppelin, Hardhat
- **Blockchain**: Sepolia testnet, ENS, Ethers.js v6

## 🚀 Quick Start

### Prerequisites

- Node.js 16+
- Sepolia testnet ETH
- Required API keys (see [SETUP.md](./SETUP.md))

### 1. Environment Setup

```bash
# Copy environment files
cp backend/env.example backend/.env
cp frontend/env.local.example frontend/.env.local
cp contracts/env.example contracts/.env

# Fill in your API keys (see SETUP.md for details)
```

### 2. Deploy Contracts

```bash
cd contracts
npm install
npx hardhat compile
npx hardhat run scripts/deployFactory.js --network sepolia
# Copy the factory address to frontend/.env.local
```

### 3. Start Services

```bash
# Terminal 1 - Backend
cd backend
npm install
npm start

# Terminal 2 - Frontend
cd frontend
npm install
npm run dev
```

Visit `http://localhost:3000` to use the application!

## 🔧 Required Environment Variables

### Backend (.env)

```env
GEMINI_API_KEY=your_gemini_api_key_here
NFT_STORAGE_KEY=your_nft_storage_key_here
SEPOLIA_RPC_URL=https://eth-sepolia.alchemyapi.io/v2/your_key
ENS_OWNER_PRIVATE_KEY=0x_your_private_key_here
DEPLOYER_PRIVATE_KEY=0x_your_private_key_here
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:5001
NEXT_PUBLIC_FACTORY_ADDRESS=0x_deployed_factory_address
```

## 🌐 API Endpoints

| Endpoint                | Method | Description                      |
| ----------------------- | ------ | -------------------------------- |
| `/generate-token`       | POST   | AI token generation via Gemini   |
| `/upload-logo`          | POST   | IPFS logo upload via NFT.Storage |
| `/ens/register-subname` | POST   | ENS subname creation             |
| `/1inch/quote`          | GET    | 1inch quote endpoint             |
| `/1inch/swapLink`       | GET    | 1inch deep-link generation       |
| `/pyth/price`           | GET    | Pyth price feed with fallback    |

## 🔗 Integration Details

### 🤖 Gemini AI Integration

- **Purpose**: Converts natural language descriptions into structured token specifications
- **Input**: User description (e.g., "A meme token for coffee lovers")
- **Output**: Structured JSON with name, symbol, supply, decimals, features
- **Model**: Gemini 2.1 with strict JSON formatting

### 📁 NFT.Storage Integration

- **Purpose**: Decentralized storage for token logos and metadata
- **Features**: SVG logo generation, IPFS upload, metadata JSON creation
- **Output**: IPFS URIs for decentralized access
- **Fallback**: Handles both base64 and SVG input formats

### 🌐 ENS Integration

- **Purpose**: Automatic human-readable names for deployed tokens
- **Process**: Creates subnames under `easydeployai.eth`
- **Requirements**: Must own parent domain on Sepolia
- **Output**: `{tokenname}.easydeployai.eth` resolves to token contract

### 💱 1inch Integration

- **Purpose**: Trading functionality and price discovery
- **Features**: Quote endpoints, deep-link generation
- **Chains**: Supports mainnet and Polygon
- **Fallback**: Graceful error handling for unsupported tokens

### 📊 Pyth Integration

- **Purpose**: Real-time price feeds for tokens
- **Primary**: Pyth Hermes API with configurable product IDs
- **Fallback**: CoinGecko API for reliability
- **Output**: USD price data with source attribution

## 🎯 Demo Flow

1. **🔗 Connect Wallet**: User connects MetaMask to Sepolia testnet
2. **📝 Describe Token**: Natural language input (e.g., "A governance token for coffee lovers")
3. **🤖 AI Generation**: Gemini creates token specifications
4. **🎨 Logo Upload**: SVG logo generated and uploaded to IPFS
5. **🚀 Token Deployment**: Factory contract deploys ERC20 token
6. **🌐 ENS Registration**: Creates `{tokenname}.easydeployai.eth` subname
7. **📄 Token Page**: Displays deployed token with trading links and price data

## 📋 Development Timeline

This implementation follows a structured 24-hour development roadmap:

- **Hours 0-2**: Environment setup and backend skeleton
- **Hours 2-4**: Smart contract deployment to Sepolia
- **Hours 4-8**: Frontend development and wallet integration
- **Hours 8-12**: Token deployment and ENS integration
- **Hours 12-16**: 1inch and Pyth integrations
- **Hours 16-20**: Landing pages and UI polish
- **Hours 20-24**: Deployment and documentation

## 🔍 Verification Steps

### ENS Ownership Check

```bash
cd backend
node check-owner.js
```

### Backend API Testing

```bash
# Test Gemini integration
curl -X POST http://localhost:5001/generate-token \
  -H "Content-Type: application/json" \
  -d '{"description":"A meme token for coffee lovers"}'

# Test NFT.Storage integration
curl -X POST http://localhost:5001/upload-logo \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","imageSvg":"<svg>...</svg>"}'
```

## 🚨 Troubleshooting

### Common Issues

1. **ENS Ownership Error**

   - Ensure you own `easydeployai.eth` on Sepolia
   - Run `node check-owner.js` to verify
   - Register the domain if needed

2. **Contract Deployment Fails**

   - Check you have Sepolia ETH
   - Verify RPC URL is correct
   - Ensure private key has sufficient funds

3. **API Integration Issues**
   - Verify all API keys are valid
   - Check backend is running on port 5001
   - Review CORS settings

## 📚 Documentation

- **[SETUP.md](./SETUP.md)**: Detailed setup instructions
- **[API Documentation](./API.md)**: Complete API reference
- **[Deployment Guide](./DEPLOY.md)**: Production deployment steps

## 🎥 Demo Video

[Watch the 2-minute demo](https://youtube.com/watch?v=your-demo-video) showing the complete token deployment flow.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

## 🙏 Acknowledgments

- **Google Gemini**: AI token generation
- **NFT.Storage**: Decentralized storage
- **ENS**: Human-readable names
- **1inch**: Trading infrastructure
- **Pyth**: Price feeds
- **OpenZeppelin**: Smart contract standards

---

**Built for ETHGlobal events** - Demonstrating the power of AI, blockchain, and decentralized infrastructure working together! 🚀
