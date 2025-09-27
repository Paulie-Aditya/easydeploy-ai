import '../styles/globals.css';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { RainbowKitProvider, getDefaultWallets } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Prevent WalletConnect Core from being initialized multiple times
if (typeof window !== 'undefined') {
  window.WalletConnect = window.WalletConnect || {};
  
  // Handle Chrome extension conflicts
  if (window.chrome && window.chrome.runtime) {
    const originalSendMessage = window.chrome.runtime.sendMessage;
    window.chrome.runtime.sendMessage = function(...args) {
      try {
        return originalSendMessage.apply(this, args);
      } catch (error) {
        console.warn('Chrome extension communication error:', error);
        return Promise.resolve();
      }
    };
  }
}

const chains = [sepolia];
const { connectors } = getDefaultWallets({
  appName: 'EasyDeployAI',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'c4f79f82112d29d8f22b9e273e09c25b',
  chains,
});

const config = createConfig({
  chains,
  connectors,
  transports: {
    [sepolia.id]: http(),
  },
});

const queryClient = new QueryClient();

export default function MyApp({ Component, pageProps }) {
  // Handle Chrome extension errors globally
  if (typeof window !== 'undefined') {
    window.addEventListener('error', (event) => {
      if (event.error && event.error.message && 
          event.error.message.includes('chrome.runtime.sendMessage')) {
        console.warn('Chrome extension error caught and handled:', event.error);
        event.preventDefault();
        return false;
      }
    });
  }

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider chains={chains}>
          <Component {...pageProps} />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
