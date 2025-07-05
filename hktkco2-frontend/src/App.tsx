import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { RainbowKitProvider, getDefaultWallets, connectorsForWallets } from '@rainbow-me/rainbowkit';
import { configureChains, createConfig, WagmiConfig } from 'wagmi';
import { sepolia, polygonMumbai, mainnet } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@rainbow-me/rainbowkit/styles.css';

import Header from './components/Layout/Header';
import Dashboard from './components/Dashboard/Dashboard';
import Marketplace from './components/Marketplace/Marketplace';
import RetireCredits from './components/Retirement/RetireCredits';
import ESGReport from './components/ESGReporting/ESGReport';

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [sepolia, polygonMumbai, mainnet],
  [publicProvider()]
);

const projectId = 'YOUR_WALLETCONNECT_PROJECT_ID'; // Get from https://cloud.walletconnect.com

const { wallets } = getDefaultWallets({
  appName: 'HBCO2 Carbon Credit Platform',
  projectId,
  chains,
});

const connectors = connectorsForWallets([...wallets]);

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
  webSocketPublicClient,
});

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiConfig config={wagmiConfig}>
        <RainbowKitProvider chains={chains} coolMode>
          <Router>
            <div className="min-h-screen bg-gray-50">
              <Header />
              <main className="container mx-auto px-4 py-8">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/marketplace" element={<Marketplace />} />
                  <Route path="/retire" element={<RetireCredits />} />
                  <Route path="/esg-reporting" element={<ESGReport />} />
                </Routes>
              </main>
            </div>
          </Router>
        </RainbowKitProvider>
      </WagmiConfig>
    </QueryClientProvider>
  );
}

export default App;