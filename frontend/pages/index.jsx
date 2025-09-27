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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 text-white relative overflow-hidden">
      {/* Ultra-modern background with mesh gradient */}
      <div className="absolute inset-0">
        {/* Sophisticated mesh background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(147,51,234,0.1),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(6,182,212,0.1),transparent_50%)]"></div>
        
        {/* Subtle grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:100px_100px]"></div>
        
        {/* Floating elements with premium animations */}
        <div className="absolute top-20 left-20 w-64 h-64 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-full filter blur-3xl animate-float opacity-40"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full filter blur-3xl animate-float-reverse opacity-40"></div>
        <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-full filter blur-3xl animate-pulse-slow opacity-30"></div>
        
        {/* Sophisticated scan lines */}
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent animate-line"></div>
        <div className="absolute bottom-0 right-0 w-full h-px bg-gradient-to-l from-transparent via-purple-400/50 to-transparent animate-line-reverse"></div>
        
        {/* Premium particle system */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full animate-particle opacity-60"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 8}s`,
                animationDuration: `${4 + Math.random() * 6}s`
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
                <span className="text-3xl animate-pulse">⚡</span>
              </div>
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 rounded-2xl blur opacity-30 animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-4xl font-black bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent tracking-tight">
                EASY DEPLOY AI
              </h1>
              <div className="flex items-center space-x-2 mt-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <p className="text-sm text-gray-300 font-mono">SEPOLIA TESTNET</p>
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
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center shadow-2xl">
                <span className="text-2xl">🚀</span>
              </div>
              <h2 className="text-5xl font-black bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                AI-POWERED TOKEN CREATION
              </h2>
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-2xl">
                <span className="text-2xl">⚡</span>
              </div>
            </div>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Create, deploy, and launch your token in seconds with AI assistance. 
              <span className="text-cyan-400 font-bold"> No coding required.</span>
            </p>
          </div>

          {/* Process Steps */}
          <div className="grid md:grid-cols-4 gap-6 mb-16">
            {[
              { icon: "🔗", title: "Connect Wallet", desc: "Link your Web3 wallet", color: "from-green-400 to-emerald-500" },
              { icon: "💭", title: "Describe Vision", desc: "Tell AI your token idea", color: "from-blue-400 to-cyan-500" },
              { icon: "🤖", title: "AI Generation", desc: "AI creates specifications", color: "from-purple-400 to-pink-500" },
              { icon: "🚀", title: "Deploy & Launch", desc: "Deploy with ENS subname", color: "from-orange-400 to-red-500" }
            ].map((step, i) => (
              <div key={i} className="relative group">
                <div className={`absolute -inset-1 bg-gradient-to-r ${step.color} rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-300`}></div>
                <div className="relative backdrop-blur-xl bg-black/40 rounded-2xl border border-white/20 p-6 text-center">
                  <div className={`w-16 h-16 bg-gradient-to-r ${step.color} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl`}>
                    <span className="text-3xl">{step.icon}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-300">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Input Section */}
          <div className="relative group mb-12">
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 rounded-3xl blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
            <div className="relative backdrop-blur-xl bg-black/40 rounded-3xl border border-white/20 p-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center shadow-2xl">
                  <span className="text-2xl">💭</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Describe Your Token Vision</h3>
                  <p className="text-gray-300">Let AI understand your creative vision</p>
                </div>
              </div>
              
              <div className="relative">
                <textarea 
                  rows={6} 
                  className="w-full p-6 bg-black/20 backdrop-blur-sm border border-white/10 rounded-2xl focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 transition-all duration-300 text-white placeholder-gray-400 resize-none text-lg leading-relaxed" 
                  value={description} 
                  onChange={e=>setDescription(e.target.value)} 
                  placeholder="Describe your token idea... e.g., 'A meme token for coffee lovers with community governance features, deflationary mechanics, and NFT rewards for holders'"
                />
                <div className="absolute bottom-4 right-4 flex items-center space-x-2">
                  <div className="text-xs text-gray-500 font-mono">
                    {description.length}/500
                  </div>
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
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
  );
}
