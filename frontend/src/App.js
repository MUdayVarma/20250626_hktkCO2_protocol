//Main App Component
// src/App.js
import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer 
} from 'recharts';
import { 
  Leaf, TrendingUp, Shield, Users, Globe, 
  ShoppingCart, Award, FileText, Settings 
} from 'lucide-react';

// Mock data for demonstration
const mockData = {
  userProfile: {
    address: '0x742d35Cc6635C0532925a3b8D23f6c86C3A86e4d',
    balance: 245.7,
    totalRetired: 123.4,
    totalPurchased: 369.1
  },
  marketData: [
    { name: 'Forestry', value: 35, color: '#10B981' },
    { name: 'Renewable Energy', value: 28, color: '#3B82F6' },
    { name: 'Methane Capture', value: 22, color: '#8B5CF6' },
    { name: 'Direct Air Capture', value: 15, color: '#F59E0B' }
  ],
  priceHistory: [
    { month: 'Jan', price: 45 },
    { month: 'Feb', price: 48 },
    { month: 'Mar', price: 52 },
    { month: 'Apr', price: 49 },
    { month: 'May', price: 55 },
    { month: 'Jun', price: 58 }
  ],
  listings: [
    {
      id: 1,
      project: 'Amazon Rainforest Conservation',
      price: 58.5,
      amount: 1000,
      methodology: 'REDD+',
      vintage: 2024,
      seller: '0x123...abc'
    },
    {
      id: 2,
      project: 'Solar Farm India',
      price: 52.0,
      amount: 500,
      methodology: 'CDM',
      vintage: 2024,
      seller: '0x456...def'
    },
    {
      id: 3,
      project: 'Landfill Gas Capture',
      price: 45.5,
      amount: 750,
      methodology: 'VCS',
      vintage: 2023,
      seller: '0x789...ghi'
    }
  ],
  retirements: [
    {
      id: 1,
      amount: 50,
      project: 'Amazon Rainforest Conservation',
      date: '2024-06-15',
      reason: 'Corporate net-zero commitment'
    },
    {
      id: 2,
      amount: 25,
      project: 'Solar Farm India',
      date: '2024-06-10',
      reason: 'Annual carbon offset'
    }
  ]
};

const HBCO2App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [connected, setConnected] = useState(false);
  const [userType, setUserType] = useState('individual'); // 'individual' or 'corporate'

  // Mock wallet connection
  const connectWallet = () => {
    setConnected(true);
  };

  const disconnectWallet = () => {
    setConnected(false);
    setActiveTab('dashboard');
  };

  const TabButton = ({ id, label, icon: Icon, active, onClick }) => (
    <button
      onClick={onClick}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
        active 
          ? 'bg-green-600 text-white shadow-lg' 
          : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      <Icon size={20} />
      <span>{label}</span>
    </button>
  );

  const StatCard = ({ title, value, unit, icon: Icon, color = 'green' }) => (
    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className={`text-2xl font-bold mt-2 text-${color}-600`}>
            {value} <span className="text-sm text-gray-500">{unit}</span>
          </p>
        </div>
        <div className={`p-3 rounded-full bg-${color}-100`}>
          <Icon className={`text-${color}-600`} size={24} />
        </div>
      </div>
    </div>
  );

  const Dashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Available Credits"
          value={mockData.userProfile.balance}
          unit="tCO₂"
          icon={Leaf}
          color="green"
        />
        <StatCard
          title="Total Retired"
          value={mockData.userProfile.totalRetired}
          unit="tCO₂"
          icon={Award}
          color="blue"
        />
        <StatCard
          title="Portfolio Value"
          value="$14,285"
          unit="USD"
          icon={TrendingUp}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Market Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={mockData.marketData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
              >
                {mockData.marketData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Price Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={mockData.priceHistory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="price" 
                stroke="#10B981" 
                strokeWidth={3}
                dot={{ fill: '#10B981' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const Marketplace = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Carbon Credit Marketplace</h2>
        <button className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors">
          List Credits
        </button>
      </div>

      <div className="grid gap-4">
        {mockData.listings.map((listing) => (
          <div key={listing.id} className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
              <div>
                <h3 className="font-semibold text-lg">{listing.project}</h3>
                <p className="text-gray-600 text-sm">Methodology: {listing.methodology}</p>
                <p className="text-gray-600 text-sm">Vintage: {listing.vintage}</p>
              </div>
              
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">${listing.price}</p>
                <p className="text-gray-600 text-sm">per tCO₂</p>
              </div>
              
              <div className="text-center">
                <p className="text-xl font-semibold">{listing.amount}</p>
                <p className="text-gray-600 text-sm">tCO₂ available</p>
              </div>
              
              <div className="flex space-x-2">
                <button className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  Buy Now
                </button>
                <button className="flex-1 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                  Make Offer
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const Retirement = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Retire Credits</h2>
        <button className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors">
          Retire Credits
        </button>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold mb-4">Retirement History</h3>
        <div className="space-y-4">
          {mockData.retirements.map((retirement) => (
            <div key={retirement.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold">{retirement.project}</h4>
                  <p className="text-gray-600 text-sm">{retirement.reason}</p>
                  <p className="text-gray-500 text-xs mt-1">{retirement.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-red-600">{retirement.amount} tCO₂</p>
                  <button className="text-blue-600 text-sm hover:underline mt-1">
                    Download Certificate
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const ESGReporting = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">ESG Reporting</h2>
        <button className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors">
          Generate Report
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Annual Impact Summary</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-600">Total Emissions</span>
              <span className="font-semibold">1,250 tCO₂</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-600">Total Offsets</span>
              <span className="font-semibold text-green-600">1,350 tCO₂</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-600">Net Impact</span>
              <span className="font-semibold text-green-600">+100 tCO₂</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600">Carbon Neutral</span>
              <span className="font-semibold text-green-600">✓ Achieved</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Verification Status</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Blockchain verified</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Third-party audited</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Registry compliant</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span>Pending final review</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'marketplace':
        return <Marketplace />;
      case 'retirement':
        return <Retirement />;
      case 'reporting':
        return <ESGReporting />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <Leaf className="text-white" size={20} />
              </div>
              <h1 className="text-xl font-bold text-gray-900">HBCO2</h1>
              <span className="text-sm text-gray-500">Carbon Credit Platform</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <select 
                value={userType} 
                onChange={(e) => setUserType(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="individual">Individual</option>
                <option value="corporate">Corporate</option>
              </select>
              
              {connected ? (
                <div className="flex items-center space-x-3">
                  <div className="text-sm">
                    <p className="font-medium">Connected</p>
                    <p className="text-gray-500">0x742d...86e4d</p>
                  </div>
                  <button
                    onClick={disconnectWallet}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  onClick={connectWallet}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Connect Wallet
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {connected ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Navigation */}
          <nav className="flex space-x-4 mb-8 overflow-x-auto">
            <TabButton
              id="dashboard"
              label="Dashboard"
              icon={BarChart}
              active={activeTab === 'dashboard'}
              onClick={() => setActiveTab('dashboard')}
            />
            <TabButton
              id="marketplace"
              label="Marketplace"
              icon={ShoppingCart}
              active={activeTab === 'marketplace'}
              onClick={() => setActiveTab('marketplace')}
            />
            <TabButton
              id="retirement"
              label="Retire Credits"
              icon={Award}
              active={activeTab === 'retirement'}
              onClick={() => setActiveTab('retirement')}
            />
            <TabButton
              id="reporting"
              label="ESG Reporting"
              icon={FileText}
              active={activeTab === 'reporting'}
              onClick={() => setActiveTab('reporting')}
            />
          </nav>

          {/* Main Content */}
          <main>
            {renderContent()}
          </main>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <Globe className="mx-auto text-green-600 mb-6" size={64} />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Welcome to HBCO2
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              The transparent, blockchain-based carbon credit marketplace
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <div className="text-center">
                <Shield className="mx-auto text-blue-600 mb-4" size={48} />
                <h3 className="text-lg font-semibold mb-2">Transparent</h3>
                <p className="text-gray-600">Every transaction is recorded on-chain for complete transparency</p>
              </div>
              <div className="text-center">
                <Users className="mx-auto text-purple-600 mb-4" size={48} />
                <h3 className="text-lg font-semibold mb-2">Accessible</h3>
                <p className="text-gray-600">Fractional ownership makes carbon credits accessible to everyone</p>
              </div>
              <div className="text-center">
                <TrendingUp className="mx-auto text-green-600 mb-4" size={48} />
                <h3 className="text-lg font-semibold mb-2">Efficient</h3>
                <p className="text-gray-600">Smart contracts automate trading and retirement processes</p>
              </div>
            </div>
            
            <button
              onClick={connectWallet}
              className="bg-green-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-green-700 transition-colors"
            >
              Connect Wallet to Get Started
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HBCO2App;