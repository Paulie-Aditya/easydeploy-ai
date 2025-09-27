import { useState } from 'react';
import axios from 'axios';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useSigner } from 'wagmi';
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
  const { data: signer } = useSigner();

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
    if(!signer) return alert('connect signer');
    if(!gen) return alert('generate token first');
    try {
      setLoading(true);
      // convert supply to wei using decimals (if ERC20)
      const decimals = gen.decimals || 18;
      const supply = BigInt(gen.supply || 1000000) * (BigInt(10) ** BigInt(decimals));
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
    <div className="min-h-screen p-8 bg-slate-900 text-slate-100">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">EasyDeploy AI (Sepolia)</h1>
        <ConnectButton />
      </header>

      <main className="max-w-3xl mx-auto">
        <div className="mb-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
          <h2 className="font-bold text-blue-300 mb-2">🚀 Quick Start</h2>
          <p className="text-sm text-blue-200">
            1. Connect your wallet to Sepolia testnet<br/>
            2. Describe your token in natural language<br/>
            3. AI generates token specifications<br/>
            4. Deploy and get ENS subname automatically
          </p>
        </div>

        <label className="block text-sm text-slate-300">Describe your token</label>
        <textarea 
          rows={4} 
          className="w-full p-3 mt-2 bg-slate-800 border border-slate-700 rounded-lg focus:border-blue-500 focus:outline-none" 
          value={description} 
          onChange={e=>setDescription(e.target.value)} 
          placeholder="A meme token for coffee lovers with community governance features"
        />
        
        <div className="flex gap-2 mt-3">
          <button 
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium" 
            onClick={generateToken} 
            disabled={loading || !description.trim()}
          >
            {loading ? 'Generating...' : '🤖 Generate Token'}
          </button>
          <button 
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium" 
            onClick={uploadLogo} 
            disabled={!gen || loading}
          >
            🎨 Upload Logo
          </button>
          <button 
            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium" 
            onClick={deploy} 
            disabled={!gen || !signer || loading}
          >
            {loading ? 'Deploying...' : '🚀 Deploy & Register ENS'}
          </button>
        </div>

        <section className="mt-8">
          <h2 className="font-bold text-lg mb-4">📋 Token Preview</h2>
          {gen ? (
            <div className="mt-3 p-6 bg-slate-800 border border-slate-700 rounded-lg">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  {gen.symbol?.charAt(0) || 'T'}
                </div>
                <div>
                  <div className="font-bold text-xl">{gen.name} ({gen.symbol})</div>
                  <div className="text-sm text-slate-400">{gen.description}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500">Supply:</span>
                  <span className="ml-2 font-mono">{gen.supply?.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-500">Decimals:</span>
                  <span className="ml-2 font-mono">{gen.decimals}</span>
                </div>
                <div>
                  <span className="text-slate-500">Type:</span>
                  <span className="ml-2">{gen.type}</span>
                </div>
                <div>
                  <span className="text-slate-500">Features:</span>
                  <span className="ml-2">{Object.entries(gen.features || {}).filter(([k,v]) => v).map(([k]) => k).join(', ') || 'None'}</span>
                </div>
              </div>
              {metaUri && (
                <div className="mt-4 p-3 bg-slate-700 rounded">
                  <div className="text-xs text-slate-400 mb-1">Metadata URI:</div>
                  <div className="text-sm font-mono break-all">{metaUri}</div>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-2 text-slate-500 italic">AI has not generated token yet.</div>
          )}
        </section>

        <section className="mt-8">
          <h2 className="font-bold text-lg mb-4">🎯 Deployment Status</h2>
          {deployed ? (
            <div className="mt-2 p-6 bg-slate-800 border border-slate-700 rounded-lg">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="font-medium text-green-400">Successfully Deployed</span>
              </div>
              <div className="space-y-3">
                <div>
                  <span className="text-slate-500 text-sm">Contract Address:</span>
                  <div className="mt-1">
                    <a 
                      className="text-emerald-400 hover:text-emerald-300 font-mono text-sm" 
                      target="_blank" 
                      href={`https://sepolia.etherscan.io/address/${deployed.address}`}
                    >
                      {deployed.address}
                    </a>
                  </div>
                </div>
                {ensSubname && (
                  <div>
                    <span className="text-slate-500 text-sm">ENS Name:</span>
                    <div className="mt-1 text-blue-400 font-mono text-sm">{ensSubname}</div>
                  </div>
                )}
                <div>
                  <span className="text-slate-500 text-sm">Transaction:</span>
                  <div className="mt-1">
                    <a 
                      className="text-blue-400 hover:text-blue-300 font-mono text-sm" 
                      target="_blank" 
                      href={`https://sepolia.etherscan.io/tx/${deployed.txHash}`}
                    >
                      {deployed.txHash}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-slate-500 italic">Not deployed yet</div>
          )}
        </section>
      </main>
    </div>
  );
}
