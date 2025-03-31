'use client'

import '@rainbow-me/rainbowkit/styles.css';

import {
  getDefaultConfig,
  RainbowKitProvider,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import {
  sepolia,
  celoAlfajores,
  polygonMumbai,
  arbitrumSepolia,
  mainnet,
  base,
  baseSepolia,
} from 'wagmi/chains';
import {
  QueryClientProvider,
  QueryClient,
} from "@tanstack/react-query";

const config = getDefaultConfig({
  appName: 'ethglobal',
  projectId: '4b5d5c41d68a989e0efe55cc8955e940',
  chains: [sepolia, celoAlfajores, arbitrumSepolia, polygonMumbai, mainnet, base, baseSepolia],
  ssr: true,
});

const queryClient = new QueryClient();

export default function Provider ({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider initialChain={baseSepolia}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
