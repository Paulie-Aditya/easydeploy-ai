"use client";

import { useRef, useState } from "react";
import axios from "axios";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useWalletClient } from "wagmi";
import { ethers } from "ethers";
import { Button } from "@/components/ui/button";
// import { Toast } from "@/components/ui/toast";
// import { SuccessPopup } from "@/components/ui/success-popup";
// import { LoadingSpinner } from "@/components/ui/loading-spinner";
// import { motion, useScroll, useInView } from "framer-motion";

// Minimal ABI for factory
const FACTORY_ABI = [
  "function deployERC20(string name, string symbol, uint256 supply) public returns (address)",
  "event TokenDeployed(address indexed owner, address tokenAddress, string name, string symbol)",
];


export default function Home() {
  const [description, setDescription] = useState("");
  const [gen, setGen] = useState(null);
  const [metaUri, setMetaUri] = useState("");
  const [deployed, setDeployed] = useState(null);
  const [loadingGenerate, setLoadingGenerate] = useState(false);
  const [loadingDeploy, setLoadingDeploy] = useState(false);
  const [ensSubname, setEnsSubname] = useState("");
  const [toast, setToast] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // const tokenPreviewRef = useRef(null);
  // const isPreviewInView = useInView(tokenPreviewRef);
  const [activeStep, setActiveStep] = useState(0);
  const [progress, setProgress] = useState(0);

  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();

  const BACKEND =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001";
  const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_FACTORY_ADDRESS;

  async function generateToken() {
    setLoadingGenerate(true);
    try {
      const r = await axios.post(`${BACKEND}/generate-token`, { description });
      setGen(r.data.generated);
      setActiveStep(1);
      
      // Show toast and scroll to preview
      setToast({ message: 'Token specifications generated!', type: 'success' });
      // if (!isPreviewInView && tokenPreviewRef.current) {
      //   tokenPreviewRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // }
    } catch (e) {
      setToast({ message: `Generation failed: ${e?.response?.data?.error || e.message}`, type: 'error' });
    } finally {
      setLoadingGenerate(false);
    }

  function createSvg(symbol) {
    const safe = (symbol || "TKN").slice(0, 4);
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='512' height='512'>
      <rect width='100%' height='100%' fill='hsl(222,47%,11%)'/>
      <circle cx='256' cy='200' r='160' fill='hsl(199,89%,48%)'/>
      <text x='50%' y='60%' dominantBaseline='middle' textAnchor='middle' fontSize='150' fill='white' fontFamily='Arial, Helvetica, sans-serif'>${safe}</text>
    </svg>`;
    return svg;
  }

  async function uploadLogo() {
    if (!gen) return alert("Generate first");
    try {
      const svg = createSvg(gen.symbol || "TKN");
      const r = await axios.post(`${BACKEND}/upload-logo`, {
        name: gen.name,
        description: gen.description,
        imageSvg: svg,
      });
      setMetaUri(r.data.metadataUri);
      return r.data;
    } catch (e) {
      alert("Upload failed: " + (e?.response?.data?.error || e.message));
    }
  }

  function sanitizeLabel(name) {
    return name
      .toLowerCase()
      .replace(/[^  a-z0-9-]/g, "")
      .slice(0, 50);
  }

async function deploy() {
  if (!walletClient) return alert("Connect wallet");
  if (!gen) return alert("Generate token first");
  if (!FACTORY_ADDRESS) return alert("Missing NEXT_PUBLIC_FACTORY_ADDRESS");

  try {
    setLoadingDeploy(true);
    const decimals = gen.decimals ?? 18;
    const supply =
      BigInt(gen.supply ?? 1_000_000) * BigInt(10) ** BigInt(decimals);

    // Convert walletClient to ethers signer (ethers v6)
    const provider = new ethers.BrowserProvider(walletClient);
    const signer = await provider.getSigner();
    const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, signer);

    // 1) deploy
    const tx = await factory.deployERC20(gen.name, gen.symbol, supply.toString());
    const receipt = await tx.wait(); // wait for factory tx to be mined

    // 2) parse logs robustly to get token address
    let tokenAddr = null;
    const iface = factory.interface;
    for (const log of receipt.logs || []) {
      try {
        const parsed = iface.parseLog(log);
        const name = parsed.name || parsed.event || parsed.topic;
        if (
          name === "TokenDeployed" ||
          name === "TokenCreated" ||
          name === "ERC20Deployed"
        ) {
          // try several common arg names
          tokenAddr =
            parsed.args?.tokenAddress ||
            parsed.args?.token ||
            parsed.args?._token ||
            parsed.args?.newToken;
          if (tokenAddr) break;
        }
      } catch (err) {
        // not an event from this iface => ignore
      }
    }

    // IMPORTANT: if tokenAddr couldn't be found in logs, abort ENS step
    if (!tokenAddr) {
      console.warn("Factory did not emit token address in logs. Aborting ENS registration.");
      setDeployed({ address: null, txHash: receipt.transactionHash });
      alert(
        "Token deployed (tx: " +
          receipt.transactionHash +
          ") but factory did not emit the token address. ENS creation skipped."
      );
      return;
    }

    // normalize address (ethers v6)
    try {
      tokenAddr = ethers.getAddress(tokenAddr.toString());
    } catch (err) {
      console.warn("Invalid token address parsed:", tokenAddr);
      setDeployed({ address: null, txHash: receipt.transactionHash });
      alert("Token deployed but parsed token address is invalid. ENS creation skipped.");
      return;
    }

    setDeployed({ address: tokenAddr, txHash: receipt.transactionHash });

    // 3) ENS subname registration only now (valid tokenAddr)
    const label = sanitizeLabel(gen.name);
    try {
      const ensRes = await axios.post(`${BACKEND}/ens/register-subname`, {
        label,
        ownerAddress: address,     // user's wallet address
        tokenAddress: tokenAddr,   // properly found and normalized
        parentName: "easydeployai.eth",
      });
      setEnsSubname(ensRes.data.subname);
      setShowSuccess(true);
      setToast({ message: `ENS subname created: ${ensRes.data.subname}`, type: 'success' });
    } catch (ensErr) {
      console.warn("ENS creation failed:", ensErr?.response?.data?.error || ensErr.message);
      setToast({
        message: `Token deployed but ENS creation failed: ${ensErr?.response?.data?.error || ensErr.message}`,
        type: 'error'
      });
    }
  } catch (e) {
    console.error(e);
    alert("Deploy failed: " + (e?.response?.data?.error || e?.message));
  } finally {
    setLoadingDeploy(false);
  }
}


  // Stable subtle background (no randomization, non-interactive)
  const bgId = useRef("bg-deco");

  return (
    <main className="relative min-h-screen bg-background text-foreground">
      {/* Decorative, non-interactive background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(1200px_600px_at_50%_-50%,_color(display-p3_0.15_0.35_1/_0.12),_transparent),radial-gradient(800px_400px_at_10%_120%,_color(display-p3_0_0.8_0.9/_0.10),_transparent)]"
      />

      {/* Top bar */}
      <header className="sticky top-0 z-10 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-md bg-gradient-to-r from-[var(--brand)] to-[var(--accent)]" />
            <div className="text-balance">
              <h1 className="text-lg font-semibold">EasyDeploy AI</h1>
              <p className="text-xs text-muted-foreground">Sepolia Network</p>
            </div>
          </div>
          <div className="shrink-0">
            <ConnectButton />
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pt-10 pb-8 md:pt-16 md:pb-12">
        <div className="grid gap-6 md:grid-cols-2 md:items-center">
          <div className="space-y-4">
            <p className="text-xl text-pretty font-medium text-muted-foreground">
              AI‑Powered
            </p>
            <h2 className="text-pretty text-4xl font-extrabold leading-tight md:text-5xl">
              Token Creation
              without code
            </h2>
            <p className="text-pretty text-muted-foreground leading-relaxed">
              Describe your idea, and we’ll generate, deploy, and name your
              ERC‑20 with an elegant, guided flow.
            </p>
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="rounded-full bg-card/50 px-3 py-1 border border-border">
                No coding
              </span>
              <span className="rounded-full bg-card/50 px-3 py-1 border border-border">
                Instant deploy
              </span>
              <span className="rounded-full bg-card/50 px-3 py-1 border border-border">
                ENS integration
              </span>
            </div>
          </div>

          <div className="glass-card rounded-xl border border-border/60 p-4 md:p-6">
            <label htmlFor="desc" className="block text-sm font-medium mb-2">
              Describe your token vision
            </label>
            <textarea
              id="desc"
              rows={6}
              className="w-full rounded-lg border border-border bg-background/60 p-4 outline-none focus:ring-2 focus:ring-[var(--brand)]"
              placeholder="Example: A community-driven coffee meme token with deflationary burns, LP incentives, and governance."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
            />
            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
              <span>AI will propose name, symbol, supply and features</span>
              <span>{description.length}/500</span>
            </div>
            <div className="mt-4 flex gap-3 sm:grid-cols-3">
              <Button
                className="w-full bg-gradient-to-r from-[var(--brand)] to-[var(--accent)] text-primary-foreground hover:opacity-95"
                onClick={generateToken}
                disabled={loadingGenerate || loadingDeploy || !description.trim()}
              >
                {loadingGenerate ? "AI thinking…" : "Generate"}
              </Button>
              {/* <Button
                variant="secondary"
                className="w-full"
                onClick={uploadLogo}
                disabled={!gen || loading}
              >
                Upload Logo
              </Button> */}
              <Button
                className="w-full bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50"
                onClick={deploy}
                disabled={!gen || !walletClient || loadingGenerate || loadingDeploy || !FACTORY_ADDRESS}
                title={
                  !FACTORY_ADDRESS
                    ? "Missing NEXT_PUBLIC_FACTORY_ADDRESS"
                    : undefined
                }
              >
                {loadingDeploy ? "Deploying…" : "Deploy"}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 pb-10 md:pb-16">
        <h3 className="text-xl font-semibold mb-4">How it works</h3>
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { t: "Connect Wallet", d: "Securely link your Web3 wallet" },
            { t: "Describe Vision", d: "Share your token concept with AI" },
            { t: "AI Generation", d: "We create specs and metadata" },
            { t: "Deploy & Launch", d: "Instant contract + ENS" },
          ].map((s, i) => (
            <div
              key={i}
              className="rounded-xl border border-border p-4 bg-card/40"
            >
              <div className="text-xs text-muted-foreground mb-1">
                Step {String(i + 1).padStart(2, "0")}
              </div>
              <div className="font-medium">{s.t}</div>
              <div className="text-sm text-muted-foreground mt-1">{s.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Token preview */}
      <section className="mx-auto max-w-6xl px-4 pb-10 md:pb-16">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-6 w-6 rounded-md bg-gradient-to-r from-[var(--brand)] to-[var(--accent)]" />
          <h4 className="font-semibold">Token Preview</h4>
        </div>

        {gen ? (
          <div className="rounded-xl border border-border p-6 bg-card/50">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="h-16 w-16 rounded-lg bg-gradient-to-r from-[var(--brand)] to-[var(--accent)] text-background grid place-items-center text-xl font-bold">
                {(gen.symbol?.charAt(0) || "T").toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="text-lg font-semibold">{gen.name}</div>
                <div className="text-sm text-muted-foreground font-mono">
                  {gen.symbol}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {gen.description}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-border p-3">
                <div className="text-xs text-muted-foreground">
                  Total Supply
                </div>
                <div className="font-mono">
                  {gen.supply?.toLocaleString() ?? "—"}
                </div>
              </div>
              <div className="rounded-lg border border-border p-3">
                <div className="text-xs text-muted-foreground">Decimals</div>
                <div className="font-mono">{gen.decimals ?? 18}</div>
              </div>
              <div className="rounded-lg border border-border p-3">
                <div className="text-xs text-muted-foreground">Type</div>
                <div>{gen.type ?? "ERC‑20"}</div>
              </div>
              <div className="rounded-lg border border-border p-3">
                <div className="text-xs text-muted-foreground">Features</div>
                <div className="text-sm">
                  {Object.entries(gen.features || {})
                    .filter(([, v]) => v)
                    .map(([k]) => k)
                    .join(", ") || "None"}
                </div>
              </div>
            </div>

            {metaUri && (
              <div className="mt-4 rounded-lg border border-border p-3 bg-card/40">
                <div className="text-xs text-muted-foreground mb-1">
                  Metadata URI
                </div>
                <div className="font-mono text-sm break-all">{metaUri}</div>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-border p-6 bg-card/40 text-sm text-muted-foreground">
            AI hasn’t generated your token yet. Describe your vision above to
            get started.
          </div>
        )}
      </section>

      {/* Deployment status */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-6 w-6 rounded-md bg-foreground" />
          <h4 className="font-semibold">Deployment Status</h4>
        </div>

        {deployed ? (
          <div className="rounded-xl border border-border p-6 bg-card/50 space-y-4">
            <div className="text-green-400 font-medium">
              Successfully deployed on Sepolia
            </div>
            <div className="grid gap-3 md:grid-cols-[1fr_auto]">
              <div className="rounded-lg border border-border p-3">
                <div className="text-xs text-muted-foreground mb-1">
                  Contract Address
                </div>
                <div className="font-mono text-sm break-all">
                  {deployed.address}
                </div>
              </div>
              <a
                className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-card/70"
                target="_blank"
                href={`https://sepolia.etherscan.io/address/${deployed.address}`}
                rel="noreferrer"
              >
                View on Etherscan
              </a>
            </div>

            {ensSubname && (
              <div className="rounded-lg border border-border p-3">
                <div className="text-xs text-muted-foreground mb-1">
                  ENS Name
                </div>
                <div className="font-mono text-sm">{ensSubname}</div>
              </div>
            )}

            <div className="grid gap-3 md:grid-cols-[1fr_auto]">
              <div className="rounded-lg border border-border p-3">
                <div className="text-xs text-muted-foreground mb-1">
                  Transaction Hash
                </div>
                <div className="font-mono text-sm break-all">
                  {deployed.txHash}
                </div>
              </div>
              <a
                className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-card/70"
                target="_blank"
                href={`https://sepolia.etherscan.io/tx/${deployed.txHash}`}
                rel="noreferrer"
              >
                View on Etherscan
              </a>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-border p-6 bg-card/40 text-sm text-muted-foreground">
            Ready to deploy your token. Generate and configure above.
          </div>
        )}
      </section>
      {/* Toasts */}
      {/* {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )} */}

      {/* Success Popup */}
      {/* {showSuccess && deployed && (
        <SuccessPopup
          title="🎉 Token Deployed Successfully!"
          message={
            <div className="space-y-4">
              <p>Your token has been deployed and is ready for trading!</p>
              <div className="bg-card/30 p-4 rounded-lg space-y-2">
                <div>
                  <span className="text-muted-foreground">Token Address:</span>
                  <code className="block text-xs bg-background/50 p-2 rounded mt-1">{deployed.address}</code>
                </div>
                {ensSubname && (
                  <div>
                    <span className="text-muted-foreground">ENS Name:</span>
                    <code className="block text-xs bg-background/50 p-2 rounded mt-1">{ensSubname}</code>
                  </div>
                )}
              </div>
              <div className="flex gap-3 mt-4">
                <Button
                  className="flex-1"
                  variant="secondary"
                  onClick={() => window.open(`https://sepolia.etherscan.io/address/${deployed.address}`, '_blank')}
                >
                  View on Etherscan
                </Button>
                <Button
                  className="flex-1"
                  variant="secondary"
                  onClick={() => window.open(`https://app.1inch.io/#/1/swap/ETH/${deployed.address}`, '_blank')}
                >
                  Trade on 1inch
                </Button>
              </div>
            </div>
          }
          onClose={() => setShowSuccess(false)}
        />
      )} */}
    </main>
  );
}}
