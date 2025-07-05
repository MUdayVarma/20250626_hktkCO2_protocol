import React, { useEffect, useState } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { ethers } from 'ethers';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Leaf, Award, DollarSign } from 'lucide-react';
import useContract from '../../contracts/hooks/useContract';

interface PortfolioStats {
  totalCredits: number;
  totalRetired: number;
  portfolioValue: number;
  carbonOffset: number;
}

const Dashboard: React.FC = () => {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });
  const { carbonToken, carbonRegistry, priceOracle } = useContract();
  const [portfolioStats, setPortfolioStats] = useState<PortfolioStats>({
    totalCredits: 0,
    totalRetired: 0,
    portfolioValue: 0,
    carbonOffset: 0,
  });
  const [loading, setLoading] = useState(true);

  // Mock data for charts
  const priceHistoryData = [
    { date: 'Jan', price: 45 },
    { date: 'Feb', price: 48 },
    { date: 'Mar', price: 52 },
    { date: 'Apr', price: 50 },
    { date: 'May', price: 55 },
    { date: 'Jun', price: 58 },
  ];

  const marketDistribution = [
    { name: 'Renewable Energy', value: 35, color: '#10b981' },
    { name: 'Forest Conservation', value: 25, color: '#3b82f6' },
    { name: 'Energy Efficiency', value: 20, color: '#8b5cf6' },
    { name: 'Carbon Capture', value: 15, color: '#f59e0b' },
    { name: 'Other', value: 5, color: '#6b7280' },
  ];

  useEffect(() => {
    if (isConnected && address && carbonToken) {
      fetchPortfolioData();
    }
  }, [isConnected, address, carbonToken]);

  const fetchPortfolioData = async () => {
    try {
      setLoading(true);
      
      // Fetch user's carbon credit balance
      const balance = await carbonToken.balanceOf(address);
      const formattedBalance = parseFloat(ethers.utils.formatEther(balance));
      
      // Mock data for demonstration - replace with actual contract calls
      setPortfolioStats({
        totalCredits: formattedBalance,
        totalRetired: 123.4, // This would come from RetirementContract
        portfolioValue: formattedBalance * 25, // Assuming $25 per credit
        carbonOffset: formattedBalance + 123.4,
      });
    } catch (error) {
      console.error('Error fetching portfolio data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Leaf className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to HBCO2</h2>
          <p className="text-gray-600 mb-6">
            Connect your wallet to start trading carbon credits
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Portfolio Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Available Credits</h3>
            <Leaf className="h-5 w-5 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? '...' : portfolioStats.totalCredits.toFixed(1)}
          </p>
          <p className="text-sm text-gray-500 mt-1">tCO₂</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Total Retired</h3>
            <Award className="h-5 w-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? '...' : portfolioStats.totalRetired.toFixed(1)}
          </p>
          <p className="text-sm text-gray-500 mt-1">tCO₂</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Portfolio Value</h3>
            <DollarSign className="h-5 w-5 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            ${loading ? '...' : portfolioStats.portfolioValue.toLocaleString()}
          </p>
          <p className="text-sm text-gray-500 mt-1">USD</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Carbon Offset</h3>
            <TrendingUp className="h-5 w-5 text-orange-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? '...' : portfolioStats.carbonOffset.toFixed(1)}
          </p>
          <p className="text-sm text-gray-500 mt-1">tCO₂ total</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Price History Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Carbon Credit Price History
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={priceHistoryData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="price" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Market Distribution Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Market Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={marketDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {marketDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h3>
        <div className="text-center py-8 text-gray-500">
          <p>No transactions yet</p>
          <p className="text-sm mt-1">
            Connect wallet to see transaction history
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;