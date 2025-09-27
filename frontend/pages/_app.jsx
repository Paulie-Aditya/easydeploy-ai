import '../styles/globals.css';
import { WagmiConfig, createClient, configureChains } from 'wagmi';
import { publicProvider } from 'wagmi/providers/public';
import { sepolia } from 'wagmi/chains';
import { connectorsForWallets, rainbowWallet } from '@rainbow-me/rainbowkit';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';

const chains = [sepolia];
const { provider } = configureChains(chains, [publicProvider()]);
const connectors = connectorsForWallets([{ groupName: 'Recommended', wallets: [rainbowWallet({ chains })] }]);

const client = createClient({ autoConnect: true, connectors, provider });

export default function MyApp({ Component, pageProps }) {
  return (
    <WagmiConfig client={client}>
      <RainbowKitProvider chains={chains}>
        <Component {...pageProps} />
      </RainbowKitProvider>
    </WagmiConfig>
  );
}
