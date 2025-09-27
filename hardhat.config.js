import '@nomicfoundation/hardhat-ethers'; // we've installed @nomicfoundation/hardhat-ethers
import 'dotenv/config';

const config = {
  solidity: {
    compilers: [
      { version: '0.8.20' },  // match OpenZeppelin ^0.8.20
      { version: '0.8.19' }   // optional fallback if you still have other contracts pinned to 0.8.19
    ]
  },
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || '',
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
    },
    hardhat: {}
  },
  mocha: {
    timeout: 200000
  }
};

export default config;
