"use client"
import { useState } from 'react';
import axios from 'axios';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useWalletClient } from 'wagmi';
import { ethers } from 'ethers';

// Minimal ABI for factory
const FACTORY_ABI = [
  "function deployERC20(string name, string symbol, uint256 supply) public returns (address)",
  "event TokenDeployed(address indexed owner, address tokenAddress, string name, string symbol)"
];

export default function Home() {
  const [description, setDescription] = useState('');
  const [gen, setGen] = useState(null);
  const [metaUri, setMetaUri] = useState('');
  const [deployed, setDeployed] = useState(null);
  const [loading, setLoading] = useState(false);
  const [ensSubname, setEnsSubname] = useState('');
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();

  const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';
  const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_FACTORY_ADDRESS;

  async function generateToken(){
    setLoading(true);
    try {
      const r = await axios.post(BACKEND + '/generate-token', { description });
      setGen(r.data.generated);
    } catch(e) {
      alert('generate failed: ' + (e?.response?.data?.error || e.message));
    } finally { setLoading(false); }
  }

  function createSvg(symbol){
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='512' height='512'>
      <rect width='100%' height='100%' fill='#0f172a'/>
      <circle cx='256' cy='200' r='160' fill='#06b6d4'/>
      <text x='50%' y='60%' dominant-baseline='middle' text-anchor='middle' font-size='150' fill='white' font-family='Arial'>${symbol}</text>
    </svg>`;
    return svg;
  }

  async function uploadLogo(){
    if(!gen) return alert('generate first');
    const svg = createSvg(gen.symbol || 'TKN');
    const r = await axios.post(BACKEND + '/upload-logo', { name: gen.name, description: gen.description, imageSvg: svg });
    setMetaUri(r.data.metadataUri);
    return r.data;
  }

  function sanitizeLabel(name){
    return name.toLowerCase().replace(/[^a-z0-9\-]/g,'').slice(0,50);
  }

  async function deploy(){
    if(!walletClient) return alert('connect wallet');
    if(!gen) return alert('generate token first');
    try {
      setLoading(true);
      // convert supply to wei using decimals (if ERC20)
      const decimals = gen.decimals || 18;
      const supply = BigInt(gen.supply || 1000000) * (BigInt(10) ** BigInt(decimals));
      
      // Convert walletClient to ethers signer
      const provider = new ethers.BrowserProvider(walletClient);
      const signer = await provider.getSigner();
      const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, signer);
      const tx = await factory.deployERC20(gen.name, gen.symbol, supply.toString());
      const receipt = await tx.wait();
      // parse event or fallback to tx hash as "address"
      let tokenAddr = null;
      for(const e of receipt.events || []) {
        if(e.event === 'TokenDeployed') { tokenAddr = e.args?.tokenAddress; break; }
      }
      if(!tokenAddr) tokenAddr = '0x' + receipt.transactionHash; // fallback
      setDeployed({ address: tokenAddr, txHash: receipt.transactionHash });
      
      // call backend to create ENS subname
      const label = sanitizeLabel(gen.name);
      try {
      const ensRes = await axios.post(BACKEND + '/ens/register-subname', {
        label, ownerAddress: address, tokenAddress: tokenAddr, parentName: 'easydeployai.eth'
      });
      console.log('ensRes', ensRes.data);
        setEnsSubname(ensRes.data.subname);
      alert('Deployed and ENS subname created: ' + ensRes.data.subname);
      } catch(ensErr) {
        console.warn('ENS creation failed:', ensErr?.response?.data?.error || ensErr.message);
        alert('Token deployed but ENS creation failed: ' + (ensErr?.response?.data?.error || ensErr.message));
      }
    } catch(e){
      console.error(e);
      alert('deploy failed: ' + (e?.response?.data?.error || e?.message));
    } finally { setLoading(false); }
  }

  return (
    <div>
      
    <div className="min-h-screen text-white relative overflow-hidden" style={{
      background: 'linear-gradient(to bottom right, #0f172a, #1e3a8a, #0f172a)'
    }}>
      {/* Ultra-modern background with mesh gradient */}
      <div className="absolute inset-0">
        {/* Sophisticated mesh background */}
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(59,130,246,0.1), transparent 50%)'
        }}></div>
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(circle at 80% 20%, rgba(147,51,234,0.1), transparent 50%)'
        }}></div>
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(circle at 20% 80%, rgba(6,182,212,0.1), transparent 50%)'
        }}></div>
        
        {/* Subtle grid overlay */}
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(59,130,246,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.03) 1px, transparent 1px)',
          backgroundSize: '100px 100px'
        }}></div>
        
        {/* Floating elements with premium animations */}
        <div className="absolute top-20 left-20 w-64 h-64 rounded-full filter blur-3xl animate-float" style={{
          background: 'linear-gradient(to right, rgba(59, 130, 246, 0.2), rgba(6, 182, 212, 0.2))',
          opacity: 0.4
        }}></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 rounded-full filter blur-3xl animate-float-reverse" style={{
          background: 'linear-gradient(to right, rgba(147, 51, 234, 0.2), rgba(236, 72, 153, 0.2))',
          opacity: 0.4
        }}></div>
        <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full filter blur-3xl animate-pulse-slow" style={{
          background: 'linear-gradient(to right, rgba(16, 185, 129, 0.2), rgba(20, 184, 166, 0.2))',
          opacity: 0.3
        }}></div>
        
        {/* Sophisticated scan lines */}
        <div className="absolute top-0 left-0 w-full h-px animate-line" style={{
          background: 'linear-gradient(to right, transparent, rgba(59, 130, 246, 0.5), transparent)'
        }}></div>
        <div className="absolute bottom-0 right-0 w-full h-px animate-line-reverse" style={{
          background: 'linear-gradient(to left, transparent, rgba(147, 51, 234, 0.5), transparent)'
        }}></div>
        
        {/* Premium particle system */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-blue-400 rounded-full animate-particle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${3 + Math.random() * 4}s`,
                opacity: 0.6
              }}
            ></div>
          ))}
        </div>
      </div>

      <div className="relative z-10">
        {/* Premium Navigation Bar */}
        <nav className="relative">
          <div className="absolute inset-0 border-b" style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(20px)',
            borderColor: 'rgba(255, 255, 255, 0.1)'
          }}></div>
          <div className="relative flex justify-between items-center px-8 py-6">
            <div className="flex items-center space-x-6">
              <div className="relative group">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 via-purple-600 to-cyan-500 rounded-2xl flex items-center justify-center shadow-2xl group-hover:shadow-blue-500/25 transition-all duration-300">
                  <div className="text-2xl font-bold text-white">⚡</div>
                </div>
                <div className="absolute -inset-0.5 bg-gradient-to-br from-blue-500 via-purple-600 to-cyan-500 rounded-2xl blur-sm opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
              </div>
              <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight" style={{
                  background: 'linear-gradient(to right, #ffffff, #dbeafe, #cffafe)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  EasyDeploy AI
                </h1>
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shadow-sm shadow-emerald-400/50"></div>
                  <span className="text-xs font-medium text-gray-400 tracking-wider uppercase">Sepolia Network</span>
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shadow-sm shadow-emerald-400/50"></div>
                </div>
              </div>
            </div>
            
            <div className="relative group">
              <div className="absolute -inset-1 rounded-2xl blur transition duration-300" style={{
                background: 'linear-gradient(to right, #3b82f6, #06b6d4)',
                opacity: 0.3
              }}></div>
              <div className="relative rounded-2xl border shadow-2xl" style={{
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(20px)',
                borderColor: 'rgba(255, 255, 255, 0.2)'
              }}>
        <ConnectButton />
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-8 pt-12 pb-20">
          {/* Premium Hero Section */}
          <div className="text-center mb-20">
            <div className="inline-flex items-center justify-center mb-8">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-purple-600 to-cyan-500 rounded-3xl flex items-center justify-center shadow-2xl">
                  <span className="text-4xl">🚀</span>
                </div>
                <div className="absolute -inset-1 bg-gradient-to-br from-blue-500 via-purple-600 to-cyan-500 rounded-3xl blur opacity-40 animate-pulse"></div>
              </div>
            </div>
            
            <h2 className="text-6xl md:text-7xl font-black mb-6 leading-tight">
              <span style={{
                background: 'linear-gradient(to right, #ffffff, #dbeafe, #cffafe)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                AI-Powered
              </span>
              <br />
              <span style={{
                background: 'linear-gradient(to right, #60a5fa, #a855f7, #06b6d4)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                Token Creation
              </span>
            </h2>
            
            <div className="max-w-4xl mx-auto mb-12">
              <p className="text-xl md:text-2xl text-gray-300 leading-relaxed mb-6">
                Transform your ideas into blockchain reality with intelligent automation.
              </p>
              <div className="flex flex-wrap justify-center gap-4 text-lg">
                <div className="flex items-center space-x-2 rounded-full px-4 py-2 border" style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(10px)',
                  borderColor: 'rgba(255, 255, 255, 0.1)'
                }}>
                  <span className="text-emerald-400">✓</span>
                  <span className="text-gray-300">No Coding Required</span>
                </div>
                <div className="flex items-center space-x-2 rounded-full px-4 py-2 border" style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(10px)',
                  borderColor: 'rgba(255, 255, 255, 0.1)'
                }}>
                  <span className="text-emerald-400">✓</span>
                  <span className="text-gray-300">Instant Deployment</span>
                </div>
                <div className="flex items-center space-x-2 rounded-full px-4 py-2 border" style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(10px)',
                  borderColor: 'rgba(255, 255, 255, 0.1)'
                }}>
                  <span className="text-emerald-400">✓</span>
                  <span className="text-gray-300">ENS Integration</span>
                </div>
              </div>
            </div>
          </div>

          {/* Premium Process Flow */}
          <div className="mb-20">
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold mb-4" style={{
                background: 'linear-gradient(to right, #ffffff, #d1d5db)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                How It Works
              </h3>
              <p className="text-gray-400 text-lg">Four simple steps to launch your token</p>
            </div>
            
            <div className="grid md:grid-cols-4 gap-8">
              {[
                { icon: "🔗", title: "Connect Wallet", desc: "Securely link your Web3 wallet", color: "from-emerald-400 to-teal-500", step: "01" },
                { icon: "💭", title: "Describe Vision", desc: "Share your token concept with AI", color: "from-blue-400 to-cyan-500", step: "02" },
                { icon: "🤖", title: "AI Generation", desc: "Advanced AI creates specifications", color: "from-purple-400 to-pink-500", step: "03" },
                { icon: "🚀", title: "Deploy & Launch", desc: "Instant deployment with ENS", color: "from-orange-400 to-red-500", step: "04" }
              ].map((step, i) => (
                <div key={i} className="relative group">
                  <div className="absolute -inset-0.5 rounded-3xl blur opacity-20 group-hover:opacity-40 transition-all duration-500" style={{
                    background: step.color.includes('emerald') ? 'linear-gradient(to right, #10b981, #14b8a6)' :
                                step.color.includes('blue') ? 'linear-gradient(to right, #60a5fa, #06b6d4)' :
                                step.color.includes('purple') ? 'linear-gradient(to right, #a855f7, #ec4899)' :
                                'linear-gradient(to right, #fb923c, #ef4444)'
                  }}></div>
                  <div className="relative rounded-3xl border p-8 text-center transition-all duration-300" style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(20px)',
                    borderColor: 'rgba(255, 255, 255, 0.1)'
                  }}>
                    <div className="absolute top-4 right-4 text-xs font-mono text-gray-500 px-2 py-1 rounded-full" style={{
                      background: 'rgba(255, 255, 255, 0.05)'
                    }}>
                      {step.step}
                    </div>
                    <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl group-hover:scale-110 transition-transform duration-300" style={{
                      background: step.color.includes('emerald') ? 'linear-gradient(to bottom right, #10b981, #14b8a6)' :
                                  step.color.includes('blue') ? 'linear-gradient(to bottom right, #60a5fa, #06b6d4)' :
                                  step.color.includes('purple') ? 'linear-gradient(to bottom right, #a855f7, #ec4899)' :
                                  'linear-gradient(to bottom right, #fb923c, #ef4444)'
                    }}>
                      <span className="text-3xl">{step.icon}</span>
                    </div>
                    <h4 className="text-xl font-bold text-white mb-3">{step.title}</h4>
                    <p className="text-gray-400 leading-relaxed">{step.desc}</p>
                  </div>
                  
                  {/* Connection line */}
                  {i < 3 && (
                    <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-px" style={{
                      background: 'linear-gradient(to right, rgba(255, 255, 255, 0.2), transparent)'
                    }}></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Premium Input Section */}
          <div className="mb-16">
            <div className="relative group">
              <div className="absolute -inset-1 rounded-3xl blur opacity-20 group-hover:opacity-30 transition-all duration-500" style={{
                background: 'linear-gradient(to right, #3b82f6, #7c3aed, #06b6d4)'
              }}></div>
              <div className="relative rounded-3xl border p-10 transition-all duration-300" style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(20px)',
                borderColor: 'rgba(255, 255, 255, 0.1)'
              }}>
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-purple-600 to-cyan-500 rounded-2xl flex items-center justify-center shadow-2xl">
                      <span className="text-3xl">💭</span>
                    </div>
                    <div>
                      <h3 className="text-3xl font-bold text-white mb-2">Describe Your Vision</h3>
                      <p className="text-gray-400 text-lg">Tell our AI about your token concept and goals</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500 font-mono mb-1">Characters</div>
                    <div className="text-lg font-bold text-white">
                      {description.length}<span className="text-gray-500">/500</span>
                    </div>
                  </div>
                </div>
                
                <div className="relative group">
                  <textarea 
                    rows={8} 
                    className="w-full p-8 border rounded-2xl focus:outline-none transition-all duration-300 text-white text-lg leading-relaxed resize-none"
                    style={{
                      background: 'rgba(0, 0, 0, 0.2)',
                      backdropFilter: 'blur(10px)',
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                      color: '#ffffff'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#60a5fa';
                      e.target.style.boxShadow = '0 0 0 2px rgba(96, 165, 250, 0.3)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                      e.target.style.boxShadow = 'none';
                    }}
                    value={description} 
                    onChange={e=>setDescription(e.target.value)} 
                    placeholder="Example: 'Create a community-driven meme token for coffee enthusiasts with governance features, automatic liquidity provision, and rewards for long-term holders. Include deflationary tokenomics and partnership opportunities with local coffee shops.'"
                  />
                  <div className="absolute top-4 right-4">
                    <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse shadow-lg shadow-blue-400/50"></div>
                  </div>
                </div>
                
                <div className="mt-6 flex items-center justify-between text-sm text-gray-400">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                      <span>AI-Powered Analysis</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      <span>Smart Contract Generation</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                      <span>Tokenomics Optimization</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
              <button 
                className="relative w-full px-8 py-6 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-2xl font-bold text-white transition-all duration-300 transform hover:scale-105 disabled:scale-100 disabled:opacity-50 shadow-2xl hover:shadow-emerald-500/25" 
                onClick={generateToken} 
                disabled={loading || !description.trim()}
              >
                <div className="flex items-center justify-center space-x-3">
                  {loading ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <span className="text-2xl">🤖</span>
                  )}
                  <div className="text-center">
                    <div className="text-lg font-bold">{loading ? 'AI Thinking...' : 'Generate Token'}</div>
                    <div className="text-sm opacity-80">AI creates specifications</div>
                  </div>
                </div>
              </button>
            </div>
            
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
              <button 
                className="relative w-full px-8 py-6 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-2xl font-bold text-white transition-all duration-300 transform hover:scale-105 disabled:scale-100 disabled:opacity-50 shadow-2xl hover:shadow-blue-500/25" 
                onClick={uploadLogo} 
                disabled={!gen || loading}
              >
                <div className="flex items-center justify-center space-x-3">
                  <span className="text-2xl">🎨</span>
                  <div className="text-center">
                    <div className="text-lg font-bold">Upload Logo</div>
                    <div className="text-sm opacity-80">Add visual identity</div>
                  </div>
                </div>
              </button>
            </div>
            
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-400 to-pink-500 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
              <button 
                className="relative w-full px-8 py-6 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-2xl font-bold text-white transition-all duration-300 transform hover:scale-105 disabled:scale-100 disabled:opacity-50 shadow-2xl hover:shadow-purple-500/25" 
                onClick={deploy} 
                disabled={!gen || !walletClient || loading}
              >
                <div className="flex items-center justify-center space-x-3">
                  {loading ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <span className="text-2xl">🚀</span>
                  )}
                  <div className="text-center">
                    <div className="text-lg font-bold">{loading ? 'Deploying...' : 'Deploy & Launch'}</div>
                    <div className="text-sm opacity-80">Deploy with ENS</div>
                  </div>
                </div>
              </button>
            </div>
        </div>

          <section className="mb-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <span className="text-lg">📋</span>
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Token Preview
              </h2>
            </div>
            
            {gen ? (
              <div className="p-8 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 rounded-3xl shadow-2xl">
                <div className="flex items-center gap-6 mb-6">
                  <div className="relative">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                      {gen.symbol?.charAt(0) || 'T'}
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-xs">✓</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="text-3xl font-bold mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                      {gen.name}
                    </div>
                    <div className="text-xl text-purple-300 font-mono mb-2">
                      {gen.symbol}
                    </div>
                    <div className="text-gray-300 leading-relaxed">
                      {gen.description}
                    </div>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl">
                      <span className="text-gray-400">Total Supply</span>
                      <span className="font-mono text-lg font-bold text-white">
                        {gen.supply?.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl">
                      <span className="text-gray-400">Decimals</span>
                      <span className="font-mono text-lg font-bold text-white">
                        {gen.decimals}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl">
                      <span className="text-gray-400">Type</span>
                      <span className="text-lg font-bold text-cyan-400">
                        {gen.type}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl">
                      <span className="text-gray-400">Features</span>
                      <span className="text-sm text-purple-400">
                        {Object.entries(gen.features || {}).filter(([k,v]) => v).map(([k]) => k).join(', ') || 'None'}
                      </span>
                    </div>
                  </div>
                </div>
                
                {metaUri && (
                  <div className="p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl border border-blue-500/20">
                    <div className="text-sm text-blue-400 mb-2 font-medium">📄 Metadata URI</div>
                    <div className="text-sm font-mono text-gray-300 break-all bg-black/20 p-3 rounded-lg">
                      {metaUri}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 bg-white/5 backdrop-blur-sm border border-white/20 rounded-3xl text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-gray-500 to-gray-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🤖</span>
                </div>
                <p className="text-gray-400 text-lg">AI hasn't generated your token yet</p>
                <p className="text-gray-500 text-sm mt-2">Describe your vision above to get started</p>
              </div>
            )}
        </section>

          <section className="mb-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                <span className="text-lg">🎯</span>
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                Deployment Status
              </h2>
            </div>
            
            {deployed ? (
              <div className="p-8 bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-sm border border-green-500/20 rounded-3xl shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center">
                    <span className="text-2xl">🚀</span>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-400 mb-1">Successfully Deployed!</div>
                    <div className="text-gray-300">Your token is live on Sepolia</div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="p-4 bg-white/5 rounded-xl">
                    <div className="text-sm text-gray-400 mb-2 font-medium">📄 Contract Address</div>
                    <div className="flex items-center space-x-3">
                      <div className="flex-1 font-mono text-sm text-white bg-black/20 p-3 rounded-lg break-all">
                        {deployed.address}
                      </div>
                      <a 
                        className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-lg text-white text-sm font-medium transition-all duration-300 transform hover:scale-105" 
                        target="_blank" 
                        href={`https://sepolia.etherscan.io/address/${deployed.address}`}
                      >
                        View
                      </a>
                    </div>
                  </div>
                  
                  {ensSubname && (
                    <div className="p-4 bg-white/5 rounded-xl">
                      <div className="text-sm text-gray-400 mb-2 font-medium">🌐 ENS Name</div>
                      <div className="text-lg font-mono text-blue-400 bg-black/20 p-3 rounded-lg">
                        {ensSubname}
                      </div>
                    </div>
                  )}
                  
                  <div className="p-4 bg-white/5 rounded-xl">
                    <div className="text-sm text-gray-400 mb-2 font-medium">🔗 Transaction Hash</div>
                    <div className="flex items-center space-x-3">
                      <div className="flex-1 font-mono text-sm text-white bg-black/20 p-3 rounded-lg break-all">
                        {deployed.txHash}
                      </div>
                      <a 
                        className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg text-white text-sm font-medium transition-all duration-300 transform hover:scale-105" 
                        target="_blank" 
                        href={`https://sepolia.etherscan.io/tx/${deployed.txHash}`}
                      >
                        View
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 bg-white/5 backdrop-blur-sm border border-white/20 rounded-3xl text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-gray-500 to-gray-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">⏳</span>
                </div>
                <p className="text-gray-400 text-lg">Ready to deploy your token</p>
                <p className="text-gray-500 text-sm mt-2">Generate and configure your token above</p>
              </div>
            )}
        </section>
      </main>
      </div>
    </div>
    </div>
  );
}
