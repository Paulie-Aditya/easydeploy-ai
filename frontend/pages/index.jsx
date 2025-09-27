import { useState } from 'react';
import axios from 'axios';
import { useAccount, useSigner } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { ethers } from 'ethers';

// minimal TokenFactory ABI (only deploy function + event)
const FACTORY_ABI = [
  "function deployERC20(string name, string symbol, uint256 supply) public returns (address)",
  "event TokenDeployed(address indexed owner, address tokenAddress, string name, string symbol)"
];

export default function Home() {
  const [desc, setDesc] = useState('');
  const [genResult, setGenResult] = useState(null);
  const [loadingGen, setLoadingGen] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [deployedAddr, setDeployedAddr] = useState(null);
  const [metadataUri, setMetadataUri] = useState('');
  const [logoSvg, setLogoSvg] = useState(null);

  const { address } = useAccount();
  const { data: signer } = useSigner();

  async function onGenerate() {
    setLoadingGen(true);
    setGenResult(null);
    try {
      const r = await axios.post(process.env.NEXT_PUBLIC_BACKEND_URL + '/generate-token', { description: desc });
      setGenResult(r.data.generated);
    } catch (e) {
      alert('AI generate failed: ' + (e?.response?.data?.error || e.message));
    } finally {
      setLoadingGen(false);
    }
  }

  // quick SVG logo generator (fallback) — creates circle with symbol
  function createSvg(symbol) {
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='512' height='512'>
      <rect width='100%' height='100%' fill='#0f172a'/>
      <circle cx='256' cy='200' r='160' fill='#06b6d4'/>
      <text x='50%' y='60%' dominant-baseline='middle' text-anchor='middle' font-size='150' fill='white' font-family='Arial'>${symbol}</text>
    </svg>`;
    return svg;
  }

  async function onUploadLogo() {
    if (!genResult) return alert('generate first');
    // create SVG
    const svg = createSvg(genResult.symbol || 'TKN');
    setLogoSvg(svg);
    // send to backend
    const payload = { name: genResult.name, description: genResult.description, imageSvg: svg };
    const r = await axios.post(process.env.NEXT_PUBLIC_BACKEND_URL + '/upload-logo', payload);
    setMetadataUri(r.data.metadataUri || r.data.metadata_uri || `ipfs://${r.data.metaCid}/metadata.json`);
  }

  async function onDeploy() {
    if (!signer) return alert('connect wallet');
    if (!genResult) return alert('generate first');

    try {
      setDeploying(true);
      const factoryAddress = process.env.NEXT_PUBLIC_FACTORY_ADDRESS;
      const factory = new ethers.Contract(factoryAddress, FACTORY_ABI, signer);

      // supply must be in wei (use decimals from genResult, default 18)
      const decimals = genResult.decimals || 18;
      const supply = BigInt(genResult.supply || 1000000) * (BigInt(10) ** BigInt(decimals));
      const tx = await factory.deployERC20(genResult.name, genResult.symbol, supply.toString());
      const receipt = await tx.wait();
      // parse event to get deployed address (TokenDeployed)
      const event = receipt.events?.find((e) => e.event === 'TokenDeployed') || receipt.events?.[0];
      const tokenAddress = event?.args?.tokenAddress || null;
      setDeployedAddr(tokenAddress || '0x' + receipt.transactionHash);
    } catch (e) {
      console.error(e);
      alert('deploy failed: ' + (e?.message || e));
    } finally {
      setDeploying(false);
    }
  }

  return (
    <div className="min-h-screen p-8 bg-slate-900 text-slate-100">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">EasyDeploy AI</h1>
        <div className="flex items-center gap-4">
          <ConnectButton />
        </div>
      </header>

      <main className="max-w-3xl mx-auto">
        <section className="mb-6">
          <label className="block text-sm text-slate-300">Describe your token in plain English</label>
          <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={4} className="w-full p-3 mt-2 bg-slate-800 rounded" placeholder="e.g. A meme token for coffee lovers with community minting" />
          <div className="mt-3 flex gap-2">
            <button onClick={onGenerate} className="px-4 py-2 bg-emerald-500 rounded">Generate</button>
            <button onClick={onUploadLogo} className="px-4 py-2 bg-blue-600 rounded" disabled={!genResult}>Upload Logo → IPFS</button>
            <button onClick={onDeploy} className="px-4 py-2 bg-violet-600 rounded" disabled={!genResult || !signer}>{deploying ? 'Deploying...' : 'Deploy Token'}</button>
          </div>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold">AI Preview</h2>
          {loadingGen && <div>Generating…</div>}
          {!loadingGen && genResult && (
            <div className="mt-3 p-4 bg-slate-800 rounded">
              <div className="flex gap-4 items-center">
                <div style={{width:96,height:96}} dangerouslySetInnerHTML={{__html: logoSvg || (genResult.symbol ? createSvg(genResult.symbol) : '')}} />
                <div>
                  <div className="font-bold text-xl">{genResult.name} <span className="text-slate-400">({genResult.symbol})</span></div>
                  <div className="text-sm text-slate-400">{genResult.description}</div>
                  <div className="mt-2 text-xs text-slate-500">supply: {genResult.supply} · decimals: {genResult.decimals || 18}</div>
                  <div className="mt-1 text-xs text-slate-500">features: {JSON.stringify(genResult.features)}</div>
                </div>
              </div>
              <div className="mt-3 text-xs text-slate-400">metadata: {metadataUri || 'not uploaded'}</div>
            </div>
          )}
        </section>

        <section>
          <h2 className="text-lg font-semibold">Deployed</h2>
          {deployedAddr ? (
            <div className="mt-2">
              <div>Token Address: <a className="text-emerald-400" target="_blank" rel="noreferrer" href={`https://mumbai.polygonscan.com/address/${deployedAddr}`}>{deployedAddr}</a></div>
              {/* 1inch buy link (opens 1inch for polygon mainnet; on testnet it will be a demonstration) */}
              <div className="mt-2">
                <a target="_blank" className="px-3 py-1 bg-blue-500 rounded" rel="noreferrer"
                  href={`https://app.1inch.io/#/137/swap/ETH/${deployedAddr}`}>Buy on 1inch (mainnet)</a>
              </div>
            </div>
          ) : <div className="mt-2 text-slate-500">Not deployed yet</div>}
        </section>
      </main>
    </div>
  );
}
