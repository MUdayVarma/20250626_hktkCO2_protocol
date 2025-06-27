//Dashboard Component

// src/components/Dashboard.js
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = ({ contracts, account }) => {
  const [stats, setStats] = useState({
    totalBalance: 0,
    totalRetired: 0,
    activeListings: 0,
    carbonOffset: 0
  });
  
  const [transactions, setTransactions] = useState([]);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    if (contracts.token && account) {
      loadDashboardData();
    }
  }, [contracts, account]);

  const loadDashboardData = async () => {
    try {
      // Get user balance
      const balance = await contracts.token.balanceOf(account);
      const formattedBalance = ethers.formatEther(balance);
      
      // Get user retirements
      const userRetirements = await contracts.retirement.getUserRetirements(account);
      
      // Get total retired by user
      let totalRetired = 0;
      for (let retirementId of userRetirements) {
        const retirement = await contracts.retirement.getRetirementProof(retirementId);
        totalRetired += parseInt(retirement.amount);
      }
      
      setStats({
        totalBalance: parseFloat(formattedBalance),
        totalRetired,
        activeListings: 0, // TODO: Implement
        carbonOffset: totalRetired
      });
      
      // Generate sample chart data
      const monthlyData = [
        { month: 'Jan', credits: 10, retired: 5 },
        { month: 'Feb', credits: 15, retired: 8 },
        { month: 'Mar', credits: 20, retired: 12 },
        { month: 'Apr', credits: 25, retired: 15 },
        { month: 'May', credits: 30, retired: 20 },
        { month: 'Jun', credits: 35, retired: 25 }
      ];
      setChartData(monthlyData);
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900">Carbon Credit Dashboard</h2>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700">Total Balance</h3>
          <p className="text-3xl font-bold text-green-600">{stats.totalBalance.toFixed(2)}</p>
          <p className="text-sm text-gray-500">CCT Tokens</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700">Credits Retired</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.totalRetired}</p>
          <p className="text-sm text-gray-500">Tons CO₂</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700">Active Listings</h3>
          <p className="text-3xl font-bold text-purple-600">{stats.activeListings}</p>
          <p className="text-sm text-gray-500">On Marketplace</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700">Carbon Offset</h3>
          <p className="text-3xl font-bold text-red-600">{stats.carbonOffset}</p>
          <p className="text-sm text-gray-500">Tons CO₂ Offset</p>
        </div>
      </div>
      
      {/* Chart */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4">Monthly Activity</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="credits" fill="#10B981" name="Credits Acquired" />
            <Bar dataKey="retired" fill="#EF4444" name="Credits Retired" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Recent Transactions */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4">Recent Transactions</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* Sample data - replace with actual transaction data */}
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Purchase</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">10 CCT</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Forestry-001</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">2024-01-15</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    Completed
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;