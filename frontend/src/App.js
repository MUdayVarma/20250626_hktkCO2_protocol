//Main App Component
// src/App.js
import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import Dashboard from './components/Dashboard';
import Marketplace from './components/Marketplace';
import Retirement from './components/Retirement';

const CONTRACT_ADDRESSES = {
  token: "0x...",
  registry: "0x...",
  marketplace: "0x...",
  retirement: "0x..."
};

function App() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [contracts, setContracts] = useState({});
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    initializeWeb3();
  }, []);

  const initializeWeb3 = async () => {
    if (window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const account = await signer.getAddress();
      
      setProvider(provider);
      setSigner(signer);
      setAccount(account);
      
      // Initialize contracts
      const tokenContract = new ethers.Contract(
        CONTRACT_ADDRESSES.token,
        TOKEN_ABI,
        signer
      );
      
      setContracts({
        token: tokenContract,
        // ... other contracts
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-2xl font-bold text-green-600">HBCO2</h1>
            <div className="flex space-x-4">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-4 py-2 rounded ${activeTab === 'dashboard' ? 'bg-green-500 text-white' : 'text-gray-600'}`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('marketplace')}
                className={`px-4 py-2 rounded ${activeTab === 'marketplace' ? 'bg-green-500 text-white' : 'text-gray-600'}`}
              >
                Marketplace
              </button>
              <button
                onClick={() => setActiveTab('retirement')}
                className={`px-4 py-2 rounded ${activeTab === 'retirement' ? 'bg-green-500 text-white' : 'text-gray-600'}`}
              >
                Retirement
              </button>
            </div>
            <div className="text-sm text-gray-600">
              {account ? `Connected: ${account.slice(0, 6)}...${account.slice(-4)}` : 'Not Connected'}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-8 px-4">
        {activeTab === 'dashboard' && <Dashboard contracts={contracts} account={account} />}
        {activeTab === 'marketplace' && <Marketplace contracts={contracts} account={account} />}
        {activeTab === 'retirement' && <Retirement contracts={contracts} account={account} />}
      </main>
    </div>
  );
}

export default App;