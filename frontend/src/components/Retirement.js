//Retirement Component
// src/components/Retirement.js
import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const Retirement = ({ contracts, account }) => {
  const [retirements, setRetirements] = useState([]);
  const [showRetireForm, setShowRetireForm] = useState(false);
  const [retireForm, setRetireForm] = useState({
    amount: '',
    reason: '',
    beneficiary: ''
  });
  const [userBalance, setUserBalance] = useState('0');

  useEffect(() => {
    if (contracts.token && contracts.retirement && account) {
      loadUserData();
    }
  }, [contracts, account]);

  const loadUserData = async () => {
    try {
      // Get user balance
      const balance = await contracts.token.balanceOf(account);
      setUserBalance(ethers.formatEther(balance));
      
      // Get user retirements
      const retirementIds = await contracts.retirement.getUserRetirements(account);
      const retirementData = [];
      
      for (let id of retirementIds) {
        const retirement = await contracts.retirement.getRetirementProof(id);
        retirementData.push({
          id: id.toString(),
          amount: retirement.amount.toString(),
          reason: retirement.reason,
          beneficiary: retirement.beneficiary,
          timestamp: new Date(parseInt(retirement.timestamp) * 1000).toLocaleDateString(),
          isVerified: retirement.isVerified,
          proofHash: retirement.proofHash
        });
      }
      
      setRetirements(retirementData);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleRetire = async (e) => {
    e.preventDefault();
    try {
      await contracts.retirement.retireCredits(
        parseInt(retireForm.amount),
        retireForm.reason,
        retireForm.beneficiary
      );
      
      setShowRetireForm(false);
      setRetireForm({ amount: '', reason: '', beneficiary: '' });
      loadUserData();
    } catch (error) {
      console.error('Error retiring credits:', error);
    }
  };

  const generateCertificate = (retirement) => {
    const certificate = {
      retirementId: retirement.id,
      amount: retirement.amount,
      beneficiary: retirement.beneficiary,
      reason: retirement.reason,
      date: retirement.timestamp,
      account: account,
      verified: retirement.isVerified
    };
    
    const blob = new Blob([JSON.stringify(certificate, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `carbon-retirement-certificate-${retirement.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Carbon Credit Retirement</h2>
          <p className="text-gray-600 mt-2">Available Balance: {parseFloat(userBalance).toFixed(2)} CCT</p>
        </div>
        <button
          onClick={() => setShowRetireForm(true)}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
          disabled={parseFloat(userBalance) === 0}
        >
          Retire Credits
        </button>
      </div>

      {/* Retire Credits Modal */}
      {showRetireForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-xl font-bold mb-4">Retire Carbon Credits</h3>
            <form onSubmit={handleRetire} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Amount to Retire (CCT)</label>
                <input
                  type="number"
                  max={Math.floor(parseFloat(userBalance))}
                  value={retireForm.amount}
                  onChange={(e) => setRetireForm({...retireForm, amount: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">Max: {Math.floor(parseFloat(userBalance))} CCT</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Retirement Reason</label>
                <textarea
                  value={retireForm.reason}
                  onChange={(e) => setRetireForm({...retireForm, reason: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={3}
                  placeholder="e.g., Annual carbon neutrality commitment"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Beneficiary</label>
                <input
                  type="text"
                  value={retireForm.beneficiary}
                  onChange={(e) => setRetireForm({...retireForm, beneficiary: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Company or individual name"
                  required
                />
              </div>
              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg"
                >
                  Retire Credits
                </button>
                <button
                  type="button"
                  onClick={() => setShowRetireForm(false)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Retirement History */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="text-xl font-semibold">Retirement History</h3>
        </div>
        
        {retirements.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Beneficiary</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {retirements.map((retirement) => (
                  <tr key={retirement.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      #{retirement.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {retirement.amount} CCT
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {retirement.beneficiary}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {retirement.timestamp}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        retirement.isVerified 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {retirement.isVerified ? 'Verified' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => generateCertificate(retirement)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Download Certificate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <p className="text-gray-500">No retirements found</p>
            <p className="text-gray-400 text-sm">Retire some credits to see them here</p>
          </div>
        )}
      </div>

      {/* Environmental Impact Summary */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg">
        <h3 className="text-xl font-semibold mb-4">Your Environmental Impact</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">
              {retirements.reduce((sum, r) => sum + parseInt(r.amount), 0)}
            </p>
            <p className="text-gray-600">Tons CO₂ Offset</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">{retirements.length}</p>
            <p className="text-gray-600">Retirement Events</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-purple-600">
              {retirements.filter(r => r.isVerified).length}
            </p>
            <p className="text-gray-600">Verified Retirements</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Retirement;