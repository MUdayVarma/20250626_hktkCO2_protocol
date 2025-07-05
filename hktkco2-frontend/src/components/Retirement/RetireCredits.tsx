import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ethers } from 'ethers';
import { Flame, Download, CheckCircle } from 'lucide-react';
import useContract from '../../contracts/hooks/useContract';

interface RetirementRecord {
  id: number;
  projectName: string;
  amount: number;
  reason: string;
  date: string;
  certificateAvailable: boolean;
}

const RetireCredits: React.FC = () => {
  const { address, isConnected } = useAccount();
  const { carbonToken, retirementContract } = useContract();
  const [balance, setBalance] = useState<number>(0);
  const [retireAmount, setRetireAmount] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [retirementHistory, setRetirementHistory] = useState<RetirementRecord[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);

  // Mock retirement history
  const mockHistory: RetirementRecord[] = [
    {
      id: 1,
      projectName: 'Amazon Rainforest Conservation',
      amount: 50,
      reason: 'Corporate net-zero commitment',
      date: '2024-06-15',
      certificateAvailable: true,
    },
    {
      id: 2,
      projectName: 'Solar Farm India',
      amount: 25,
      reason: 'Annual carbon offset',
      date: '2024-06-10',
      certificateAvailable: true,
    },
  ];

  useEffect(() => {
    if (isConnected && address && carbonToken) {
      fetchBalance();
      fetchRetirementHistory();
    }
  }, [isConnected, address, carbonToken]);

  const fetchBalance = async () => {
    try {
      const userBalance = await carbonToken.balanceOf(address);
      setBalance(parseFloat(ethers.utils.formatEther(userBalance)));
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  const fetchRetirementHistory = async () => {
    try {
      // TODO: Implement actual contract calls
      setRetirementHistory(mockHistory);
    } catch (error) {
      console.error('Error fetching retirement history:', error);
    }
  };

  const handleRetire = async () => {
    if (!retirementContract || !address || !retireAmount || !reason) return;

    try {
      setLoading(true);
      
      // TODO: Implement actual retirement contract call
      // const tx = await retirementContract.retireCredits(
      //   ethers.utils.parseEther(retireAmount),
      //   reason,
      //   address,
      //   [1], // credit IDs
      //   0 // retirement type
      // );
      // await tx.wait();
      
      // Simulate success
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
      
      // Reset form
      setRetireAmount('');
      setReason('');
      
      // Refresh data
      fetchBalance();
      fetchRetirementHistory();
    } catch (error) {
      console.error('Error retiring credits:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadCertificate = (record: RetirementRecord) => {
    // TODO: Implement certificate download
    console.log('Download certificate for:', record.id);
  };

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Flame className="h-16 w-16 text-orange-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Retire Carbon Credits</h2>
          <p className="text-gray-600">Connect your wallet to retire credits</p>
        </div>

        {/* Retirement History */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Retirement History</h3>
          
          {retirementHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No retirements yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {retirementHistory.map((record) => (
                <div
                  key={record.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{record.projectName}</h4>
                      <p className="text-sm text-gray-600 mt-1">{record.reason}</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className="text-2xl font-bold text-red-600">
                          {record.amount} tCO₂
                        </span>
                        <span className="text-sm text-gray-500">{record.date}</span>
                      </div>
                    </div>
                    {record.certificateAvailable && (
                      <button
                        onClick={() => downloadCertificate(record)}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1"
                      >
                        <Download className="h-4 w-4" />
                        <span>Download Certificate</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RetireCredits;
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Success Alert */}
      {showSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <p className="text-green-800">Credits successfully retired!</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Retire Credits Form */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center space-x-3 mb-6">
            <Flame className="h-6 w-6 text-orange-500" />
            <h2 className="text-xl font-bold text-gray-900">Retire Credits</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Available Balance
              </label>
              <p className="text-2xl font-bold text-gray-900">{balance.toFixed(2)} CCT</p>
            </div>

            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                Amount to Retire (CCT)
              </label>
              <input
                id="amount"
                type="number"
                value={retireAmount}
                onChange={(e) => setRetireAmount(e.target.value)}
                placeholder="1"
                min="0"
                max={balance}
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                Retirement Reason
              </label>
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Personal carbon offset"
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <button
              onClick={handleRetire}
              disabled={loading || !retireAmount || !reason || parseFloat(retireAmount) > balance}
              className={`w-full py-3 rounded-lg font-medium transition-colors ${
                loading || !retireAmount || !reason || parseFloat(retireAmount) > balance
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-red-500 text-white hover:bg-red-600'
              }`}
            >
              {loading ? 'Processing...' : 'Retire Credits'}
            </button>

            <p className="text-sm text-gray-500 text-center">
              Permanently retire carbon credits to offset your carbon footprint
            </p>
          </div>
        </div>