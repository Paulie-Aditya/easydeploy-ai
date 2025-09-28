import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ethers } from 'ethers';

export default function TokenPage() {
  const router = useRouter();
  const { address: userAddress } = useAccount();
  const [tokenData, setTokenData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [price, setPrice] = useState(null);
  const [swapLink, setSwapLink] = useState('');
  const [referencePrice, setReferencePrice] = useState(null);

  
  const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';
  const { address } = router.query;

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    async function initializeTokenData() {
      if (address) {
        setLoading(true);
        try {
          // Fetch token data first with abort signal
          const data = await fetchTokenDataFromSepolia(address, signal);
          if (!signal.aborted) {
            setTokenData({
              ...data,
              address,
              description: 'A token fetched from Sepolia',
              metadataUri: 'N/A',
              ensName: `${data.symbol.toLowerCase()}.easydeployai.eth`
            });
            // Then fetch price data
            await fetchPrice();
          }
        } catch (error) {
          if (!signal.aborted) {
            console.error("Error initializing token data:", error);
          }
        } finally {
          if (!signal.aborted) {
            setLoading(false);
          }
        }
      }
    }
    
    initializeTokenData();

    // Cleanup function to cancel ongoing requests
    return () => {
      controller.abort();
    };
  }, [address]);

  async function fetchTokenDataFromSepolia(address, signal) {
    let provider;
    let retries = 3;
    
    while (retries > 0) {
        try {
            provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL);
            await provider.getNetwork(); // Test the connection
            break;
        } catch (error) {
            retries--;
            if (retries === 0) throw new Error('Failed to connect to Sepolia RPC');
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
        }
    }

    const ERC20_ABI = [
        "function name() view returns (string)",
        "function symbol() view returns (string)",
        "function totalSupply() view returns (uint256)",
        "function decimals() view returns (uint8)"
    ];

    const contract = new ethers.Contract(address, ERC20_ABI, provider);

    // Check if request was cancelled
    if (signal?.aborted) throw new Error('Request cancelled');

    // Make sequential requests instead of batch requests
    const name = await contract.name();
    if (signal?.aborted) throw new Error('Request cancelled');
    
    const symbol = await contract.symbol();
    if (signal?.aborted) throw new Error('Request cancelled');
    
    const decimals = await contract.decimals();
    if (signal?.aborted) throw new Error('Request cancelled');
    
    const totalSupply = await contract.totalSupply();

    return {
        name,
        symbol,
        supply: ethers.formatUnits(totalSupply, decimals),
        decimals
    };
  }

  async function fetchTokenData() {
    try {
      const data = await fetchTokenDataFromSepolia(address);
      setTokenData({
        ...data,
        address,
        description: 'A token fetched from Sepolia',
        metadataUri: 'N/A',
        ensName: `${data.symbol.toLowerCase()}.easydeployai.eth`
      });
    } catch (error) {
      console.error('Error fetching token data from Sepolia:', error);
    } finally {
      setLoading(false);
    }
  }

  // async function fetchPrice() {
  //   try {
  //     const response = await axios.get(`${BACKEND}/pyth/price?price_id=${address}`);
  //     const tokenPrice = response.data.price
  //     console.log("Price: "+ tokenPrice)
  //     setPrice(tokenPrice);
  //   } catch (error) {
  //     console.error('Error fetching price:', error);
  //     // Fallback price
  //     setPrice({ source: 'fallback', price: 2500 });
  //   }
  // }
  async function fetchPrice() {
    try {
        // Get ETH/USD price as reference
        const response = await axios.get(`${BACKEND}/pyth/price/ETH/USD`);
        if (response.data.ok) {
            setReferencePrice(response.data.price);
            
            // For newly deployed tokens, we show that price feed is not available
            // Note: In the future, we could:
            // 1. Check if token has liquidity pairs with ETH/USDC
            // 2. Get price from DEX if liquidity exists
            // 3. Calculate token price based on the liquidity pair and reference price
            setPrice("Price feed not available - New token");
        }
    } catch (error) {
        console.error('Error fetching price:', error);
        setPrice("Price data unavailable");
        setReferencePrice(null);
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
    <div className="container mx-auto p-6">
      {loading ? (
        <LoadingSpinner />
      ) : (
        <Card className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white">
          <CardHeader>
            <CardTitle>{tokenData.name} ({tokenData.symbol})</CardTitle>
          </CardHeader>
          <CardContent>
            <p><strong>Address:</strong> {tokenData.address}</p>
            <p><strong>Total Supply:</strong> {tokenData.supply}</p>
            <p><strong>Decimals:</strong> {tokenData.decimals}</p>
            <p><strong>Description:</strong> {tokenData.description}</p>
            <p><strong>Metadata URI:</strong> <a href={tokenData.metadataUri} target="_blank" rel="noopener noreferrer">{tokenData.metadataUri}</a></p>
            <p><strong>ENS Name:</strong> {tokenData.ensName}</p>
            <div>
                <p><strong>Token Price:</strong> {price}</p>
                {referencePrice && (
                    <p className="text-sm text-muted-foreground">
                        Reference ETH/USD: ${referencePrice.toLocaleString()}
                    </p>
                )}
            </div>
            <Button onClick={() => window.open(swapLink, "_blank")}>Swap Token</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
