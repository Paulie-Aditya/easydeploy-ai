import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

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
            <p><strong>Price:</strong> {price ? `$${price}` : "Fetching..."}</p>
            <Button onClick={() => window.open(swapLink, "_blank")}>Swap Token</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
