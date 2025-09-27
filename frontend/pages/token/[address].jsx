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
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Futuristic animated background */}
      <div className="absolute inset-0">
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
        
        {/* Floating orbs with different animations */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full filter blur-3xl opacity-20 animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full filter blur-3xl opacity-20 animate-float-reverse"></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full filter blur-3xl opacity-15 animate-pulse-slow"></div>
        
        {/* Animated lines */}
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-line"></div>
        <div className="absolute bottom-0 right-0 w-full h-px bg-gradient-to-l from-transparent via-purple-400 to-transparent animate-line-reverse"></div>
        
        {/* Particle effects */}
        <div className="absolute inset-0">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full animate-particle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${3 + Math.random() * 4}s`
              }}
            ></div>
          ))}
        </div>
      </div>

      <div className="relative z-10">
        <header className="flex justify-between items-center p-8 relative">
          <div className="flex items-center space-x-6">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-2xl">
                <span className="text-3xl animate-pulse">🪙</span>
              </div>
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 rounded-2xl blur opacity-30 animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-4xl font-black bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent tracking-tight">
                TOKEN DETAILS
              </h1>
              <div className="flex items-center space-x-2 mt-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <p className="text-sm text-gray-300 font-mono">LIVE ON SEPOLIA</p>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
            <div className="relative backdrop-blur-xl bg-black/40 rounded-2xl border border-white/20 p-1">
              <ConnectButton />
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-8">
          {/* Token Header */}
          <div className="relative group mb-12">
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 rounded-3xl blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
            <div className="relative backdrop-blur-xl bg-black/40 rounded-3xl border border-white/20 p-8">
              <div className="flex items-center gap-8 mb-8">
                <div className="relative">
                  <div className="w-24 h-24 bg-gradient-to-br from-cyan-400 via-purple-500 to-pink-500 rounded-3xl flex items-center justify-center text-white font-black text-3xl shadow-2xl">
                    {tokenData.symbol?.charAt(0) || 'T'}
                  </div>
                  <div className="absolute -inset-2 bg-gradient-to-br from-cyan-400 via-purple-500 to-pink-500 rounded-3xl blur opacity-30 animate-pulse"></div>
                </div>
                <div className="flex-1">
                  <h1 className="text-5xl font-black bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                    {tokenData.name}
                  </h1>
                  <div className="text-2xl text-purple-300 font-mono mb-2">{tokenData.symbol}</div>
                  {tokenData.ensName && (
                    <div className="text-lg text-cyan-400 font-mono bg-black/20 px-4 py-2 rounded-xl inline-block">
                      {tokenData.ensName}
                    </div>
                  )}
                </div>
              </div>
              
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">{tokenData.description}</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="p-4 bg-white/5 rounded-2xl">
                  <div className="text-sm text-gray-400 mb-2 font-medium">TOTAL SUPPLY</div>
                  <div className="text-2xl font-bold text-white font-mono">{parseInt(tokenData.supply).toLocaleString()}</div>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl">
                  <div className="text-sm text-gray-400 mb-2 font-medium">DECIMALS</div>
                  <div className="text-2xl font-bold text-white font-mono">{tokenData.decimals}</div>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl">
                  <div className="text-sm text-gray-400 mb-2 font-medium">CONTRACT</div>
                  <div className="text-sm font-mono text-cyan-400 break-all">
                    <a 
                      href={`https://sepolia.etherscan.io/address/${tokenData.address}`}
                      target="_blank"
                      className="hover:text-cyan-300 transition-colors"
                    >
                      {tokenData.address}
                    </a>
                  </div>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl">
                  <div className="text-sm text-gray-400 mb-2 font-medium">PRICE</div>
                  <div className="text-2xl font-bold text-green-400 font-mono">
                    {price ? `$${price.price?.toFixed(2) || 'N/A'}` : 'Loading...'}
                    {price?.source && (
                      <span className="text-xs text-gray-500 ml-2">({price.source})</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
              <div className="relative backdrop-blur-xl bg-black/40 rounded-2xl border border-white/20 p-8">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-2xl flex items-center justify-center">
                    <span className="text-2xl">🔄</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white">Trade Token</h3>
                </div>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  Buy or sell this token on decentralized exchanges with the best rates
                </p>
                <a
                  href={swapLink}
                  target="_blank"
                  className="inline-flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-2xl font-bold text-white transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-blue-500/25"
                >
                  <span className="text-xl">⚡</span>
                  <span>Trade on 1inch</span>
                </a>
              </div>
            </div>
            
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
              <div className="relative backdrop-blur-xl bg-black/40 rounded-2xl border border-white/20 p-8">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center">
                    <span className="text-2xl">📊</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white">Analytics</h3>
                </div>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  View detailed analytics, trading data, and blockchain information
                </p>
                <a
                  href={`https://sepolia.etherscan.io/token/${tokenData.address}`}
                  target="_blank"
                  className="inline-flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 rounded-2xl font-bold text-white transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-emerald-500/25"
                >
                  <span className="text-xl">🔍</span>
                  <span>View on Etherscan</span>
                </a>
              </div>
            </div>
          </div>

          {/* Metadata */}
          {tokenData.metadataUri && (
            <div className="relative group mb-12">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-400 to-pink-500 rounded-3xl blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
              <div className="relative backdrop-blur-xl bg-black/40 rounded-3xl border border-white/20 p-8">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center">
                    <span className="text-2xl">📄</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white">Token Metadata</h3>
                </div>
                <div className="bg-black/20 rounded-2xl p-6">
                  <div className="text-sm text-gray-400 mb-2 font-medium">IPFS URI</div>
                  <div className="text-lg font-mono text-cyan-400 break-all bg-black/40 p-4 rounded-xl">
                    {tokenData.metadataUri}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Back to Home */}
          <div className="text-center mb-12">
            <div className="relative group inline-block">
              <div className="absolute -inset-1 bg-gradient-to-r from-gray-400 to-gray-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
              <button 
                onClick={() => router.push('/')}
                className="relative px-8 py-4 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 rounded-2xl font-bold text-white transition-all duration-300 transform hover:scale-105 shadow-2xl"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-xl">←</span>
                  <span>Back to Home</span>
                </div>
              </button>
            </div>
          </div>
      </main>
      </div>
    </div>
  );
}
