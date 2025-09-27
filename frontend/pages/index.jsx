"use client";

import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useWalletClient } from "wagmi";
import { ethers } from "ethers";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Toast } from "@/components/ui/toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { SuccessPopup } from "@/components/ui/success-popup";
import { motion, useScroll, useInView } from "framer-motion";
import Confetti from "react-confetti";
import confetti from "canvas-confetti";
import { useRouter } from 'next/router';

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
  const [activeStep, setActiveStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [toast, setToast] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [confettiActive, setConfettiActive] = useState(false);
  
  const tokenPreviewRef = useRef(null);
  const isPreviewInView = useInView(tokenPreviewRef);

  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const router = useRouter(); // Ensure router is defined at the top level

  const BACKEND =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001";
  const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_FACTORY_ADDRESS;

  async function generateToken() {
    setLoadingGenerate(true);
    try {
      const r = await axios.post(`${BACKEND}/generate-token`, { description });
      setGen(r.data.generated);

      // Trigger screen shake and confetti animation
      const screen = document.querySelector("main");
      if (screen) {
        screen.classList.add("shake");
        setTimeout(() => screen.classList.remove("shake"), 500);
      }

      const duration = 5 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      function randomInRange(min, max) {
        return Math.random() * (max - min) + min;
      }

      const interval = setInterval(function () {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 20 * (timeLeft / duration);
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          colors: ["#ff69b4", "#00ffff", "#ff1493", "#7fffd4", "#ff4500"],
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          colors: ["#ff0000", "#ffa500", "#ffff00", "#00ff00", "#0000ff"],
        });
      }, 250);
    } catch (error) {
      console.error("Error generating token:", error);

      // Show error popup
      setToast({
        title: "Error",
        message: "Failed to generate token. Please try again.",
        type: "error",
      });

      // Add a 'Try Again' toast
      setToast({
        title: "Try Again",
        message: "Something went wrong. Click Generate to retry.",
        type: "warning",
      });
    } finally {
      setLoadingGenerate(false);
    }
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
  if (!walletClient) {
    setToast({ type: 'error', message: "Please connect your wallet first" });
    return;
  }
  if (!gen) {
    setToast({ type: 'error', message: "Please generate token details first" });
    return;
  }
  if (!FACTORY_ADDRESS) {
    setToast({ type: 'error', message: "Missing factory address configuration" });
    return;
  }

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
      setToast({
        type: 'success',
        message: `Token deployed successfully! ENS subname created: ${ensRes.data.subname}`
      });
    } catch (ensErr) {
      console.warn("ENS creation failed:", ensErr?.response?.data?.error || ensErr.message);
      setToast({
        type: 'warning',
        message: "Token deployed but ENS creation failed: " +
          (ensErr?.response?.data?.error || ensErr.message)
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

  useEffect(() => {
    // Add shake animation to CSS on the client side
    const styles = document.createElement("style");
    styles.innerHTML = `
      .shake {
        animation: shake 0.5s;
      }

      @keyframes shake {
        0% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        50% { transform: translateX(5px); }
        75% { transform: translateX(-5px); }
        100% { transform: translateX(0); }
      }
    `;
    document.head.appendChild(styles);

    return () => {
      // Clean up the injected styles
      document.head.removeChild(styles);
    };
  }, []);

  return (
    <main className="relative min-h-screen text-foreground">
      {/* Animated Background */}
      <div className="animated-bg" aria-hidden="true"></div>

      {/* Top Bar */}
      <header className="sticky top-0 z-10 backdrop-blur-md bg-background/60 border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-md bg-gradient-to-r from-[hsl(240,100%,50%)] to-[hsl(330,100%,50%)]" />
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

      {/* Hero Section */}
      <section className="mx-auto max-w-6xl px-4 pt-10 pb-8 md:pt-16 md:pb-12">
        <div className="grid gap-6 md:grid-cols-2 md:items-center">
          <div className="space-y-4">
            <p className="text-xl font-medium text-muted-foreground">AI‑Powered</p>
            <h2 className="text-4xl font-extrabold leading-tight md:text-5xl">
              Token Creation
              without code
            </h2>
            <p className="text-muted-foreground leading-relaxed">
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
              className="w-full rounded-lg border border-border bg-background/60 p-4 outline-none focus:ring-2 focus:ring-[hsl(240,100%,50%)]"
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
              <button
                className="neon-button w-full"
                onClick={generateToken}
                disabled={loadingGenerate || loadingDeploy || !description.trim()}
              >
                {loadingGenerate ? "AI thinking…" : "Generate"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Token Preview */}
      <section className="mx-auto max-w-6xl px-4 pb-10 md:pb-16">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-6 w-6 rounded-md bg-gradient-to-r from-[hsl(240,100%,50%)] to-[hsl(330,100%,50%)]" />
          <h4 className="font-semibold">Token Preview</h4>
        </div>

        {gen ? (
          <div className="glass-card rounded-xl border border-border p-6 bg-card/50">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="h-16 w-16 rounded-lg bg-gradient-to-r from-[hsl(240,100%,50%)] to-[hsl(330,100%,50%)] text-background grid place-items-center text-xl font-bold">
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

            <div className="mt-6 flex justify-end">
              <button
                className="neon-button"
                onClick={deploy}
                disabled={loadingDeploy || !gen}
              >
                {loadingDeploy ? "Deploying..." : "Deploy"}
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-border p-6 bg-card/40 text-sm text-muted-foreground">
            AI hasn’t generated your token yet. Describe your vision above to
            get started.
          </div>
        )}
      </section>

      {showSuccess && (
        <SuccessPopup
          title="Token Deployed!"
          message={`Your token has been successfully deployed at address: ${deployed?.address || "Unknown"}`}
          onAction={() => router.push(`/token/${deployed.address}`)}
          onClose={() => setShowSuccess(false)}
        />
      )}

      {confettiActive && <Confetti width={window.innerWidth} height={window.innerHeight} />}
    </main>
  );
}
