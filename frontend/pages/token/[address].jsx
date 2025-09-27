import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';

export default function TokenPage() {
  const router = useRouter();
  const { address: userAddress } = useAccount();
  const [tokenData, setTokenData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [price, setPrice] = useState(null);
  const [swapLink, setSwapLink] = useState('');
  
  const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';
  const { address } = router.query;

  useEffect(() => {
    if (address) {
      fetchTokenData();
      fetchPrice();
      generateSwapLink();
    }
  }, [address]);

  async function fetchTokenData() {
    try {
      // In a real app, you'd fetch token data from the blockchain
      // For now, we'll simulate with mock data
      setTokenData({
        name: 'Coffee Token',
        symbol: 'COFFEE',
        address: address,
        supply: '1000000',
        decimals: 18,
        description: 'A meme token for coffee lovers',
        metadataUri: 'ipfs://QmExample...',
        ensName: `coffee.easydeployai.eth`
      });
    } catch (error) {
      console.error('Error fetching token data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchPrice() {
    try {
      const response = await axios.get(`${BACKEND}/pyth/price`);
      setPrice(response.data);
    } catch (error) {
      console.error('Error fetching price:', error);
      // Fallback price
      setPrice({ source: 'fallback', price: 2500 });
    }
  }

  async function generateSwapLink() {
    try {
      const response = await axios.get(`${BACKEND}/1inch/swapLink`, {
        params: { to: address, chain: 1 }
      });
      setSwapLink(response.data.link);
    } catch (error) {
      console.error('Error generating swap link:', error);
      setSwapLink(`https://app.1inch.io/#/1/swap/ETH/${address}`);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading token data...</p>
        </div>
      </div>
    );
  }

  if (!tokenData) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Token Not Found</h1>
          <p className="text-slate-400 mb-4">The token you're looking for doesn't exist.</p>
          <button 
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <header className="flex justify-between items-center p-6 border-b border-slate-800">
        <h1 className="text-2xl font-bold">Token Details</h1>
        <ConnectButton />
      </header>

      <main className="max-w-4xl mx-auto p-6">
        {/* Token Header */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 mb-8">
          <div className="flex items-center gap-6 mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-2xl">
              {tokenData.symbol?.charAt(0) || 'T'}
            </div>
            <div>
              <h1 className="text-3xl font-bold">{tokenData.name}</h1>
              <p className="text-slate-400 text-lg">{tokenData.symbol}</p>
              {tokenData.ensName && (
                <p className="text-blue-400 font-mono text-sm">{tokenData.ensName}</p>
              )}
            </div>
          </div>
          
          <p className="text-slate-300 mb-6">{tokenData.description}</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-slate-500">Total Supply</span>
              <div className="font-mono">{parseInt(tokenData.supply).toLocaleString()}</div>
            </div>
            <div>
              <span className="text-slate-500">Decimals</span>
              <div className="font-mono">{tokenData.decimals}</div>
            </div>
            <div>
              <span className="text-slate-500">Contract</span>
              <div className="font-mono text-xs break-all">
                <a 
                  href={`https://sepolia.etherscan.io/address/${tokenData.address}`}
                  target="_blank"
                  className="text-emerald-400 hover:text-emerald-300"
                >
                  {tokenData.address}
                </a>
              </div>
            </div>
            <div>
              <span className="text-slate-500">Price</span>
              <div className="font-mono">
                {price ? `$${price.price?.toFixed(2) || 'N/A'}` : 'Loading...'}
                {price?.source && (
                  <span className="text-xs text-slate-500 ml-1">({price.source})</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <h3 className="font-bold text-lg mb-4">🔄 Trade</h3>
            <p className="text-slate-400 text-sm mb-4">
              Buy or sell this token on decentralized exchanges
            </p>
            <a
              href={swapLink}
              target="_blank"
              className="inline-block px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg font-medium"
            >
              Trade on 1inch
            </a>
          </div>
          
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <h3 className="font-bold text-lg mb-4">📊 Analytics</h3>
            <p className="text-slate-400 text-sm mb-4">
              View detailed analytics and trading data
            </p>
            <a
              href={`https://sepolia.etherscan.io/token/${tokenData.address}`}
              target="_blank"
              className="inline-block px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg font-medium"
            >
              View on Etherscan
            </a>
          </div>
        </div>

        {/* Metadata */}
        {tokenData.metadataUri && (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <h3 className="font-bold text-lg mb-4">📄 Metadata</h3>
            <div className="bg-slate-700 rounded p-4">
              <div className="text-sm font-mono break-all">
                <span className="text-slate-500">IPFS URI:</span>
                <div className="mt-1 text-blue-400">{tokenData.metadataUri}</div>
              </div>
            </div>
          </div>
        )}

        {/* Back to Home */}
        <div className="mt-8 text-center">
          <button 
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium"
          >
            ← Back to Home
          </button>
        </div>
      </main>
    </div>
  );
}
