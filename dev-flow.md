## notes while building

### folder structure

easydeploy-ai/
backend/
index.js
package.json
.env.example
frontend/
pages/
index.jsx
token/[address].jsx
package.json
.env.local.example
contracts/
SimpleERC20.sol
TokenFactory.sol
scripts/deployFactory.js
hardhat.config.js
README.md

### env vars

Sepolia RPC URL (Alchemy or Infura): SEPOLIA_RPC_URL.

Private key for the account that will be the ENS name owner on Sepolia (or the account that manages it): ENS_OWNER_PRIVATE_KEY. This must own easydeployai.eth on Sepolia (or you must register the name on Sepolia first). I explain how to check below.

GEMINI_API_KEY (Google Generative AI).

NFT_STORAGE_KEY (nft.storage).

Optional: ONEINCH_API_KEY (not required for public 1inch endpoints) and PYTH_HERMES_URL + PYTH_PRODUCT_ID (for Pyth pull).

ALCHEMY_API_KEY (Sepolia RPC via Alchemy) or set SEPOLIA_RPC_URL directly.
