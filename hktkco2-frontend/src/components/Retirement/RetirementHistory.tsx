import React, { useState, useEffect } from 'react';
import { Download, ExternalLink, Calendar, Award, Filter } from 'lucide-react';
import { useAccount } from 'wagmi';
import useContract from '../../contracts/hooks/useContract';

interface RetirementRecord {
  id: number;
  projectName: string;
  projectId: string;
  amount: number;
  reason: string;
  beneficiary: string;
  date: string;
  txHash: string;
  certificateHash?: string;
  verified: boolean;
}

const RetirementHistory: React.FC = () => {
  const { address, isConnected } = useAccount();
  const { retirementContract } = useContract();
  const [retirements, setRetirements] = useState<RetirementRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'personal' | 'corporate'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');

  // Mock data
  const mockRetirements: RetirementRecord[] = [
    {
      id: 1,
      projectName: 'Amazon Rainforest Conservation',
      projectId: 'VCS-1234',
      amount: 50,
      reason: 'Corporate net-zero commitment',
      beneficiary: 'Tech Corp Inc.',
      date: '2024-06-15',
      txHash: '0x123...abc',
      certificateHash: 'Qm123...xyz',
      verified: true,
    },
    {
      id: 2,
      projectName: 'Solar Farm India',
      projectId: 'CDM-5678',
      amount: 25,
      reason: 'Annual carbon offset',
      beneficiary: 'Green Solutions Ltd.',
      date: '2024-06-10',
      txHash: '0x456...def',
      certificateHash: 'Qm456...uvw',
      verified: true,
    },
    {
      id: 3,
      projectName: 'Wind Power Kenya',
      projectId: 'GS-9012',
      amount: 100,
      reason: 'Personal carbon footprint offset',
      beneficiary: address || '0x...',
      date: '2024-05-28',
      txHash: '0x789...ghi',
      verified: false,
    },
  ];

  useEffect(() => {
    if (isConnected && retirementContract) {
      fetchRetirementHistory();
    } else {
      setRetirements(mockRetirements);
    }
  }, [isConnected, retirementContract]);

  const fetchRetirementHistory = async () => {
    setLoading(true);
    try {
      // TODO: Fetch actual retirement history from contract
      setRetirements(mockRetirements);
    } catch (error) {
      console.error('Error fetching retirement history:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadCertificate = async (retirement: RetirementRecord) => {
    if (!retirement.certificateHash) return;
    
    // TODO: Implement IPFS download
    console.log('Downloading certificate:', retirement.certificateHash);
    
    // Mock certificate download
    const certificateData = {
      retirementId: retirement.id,
      projectName: retirement.projectName,
      amount: retirement.amount,
      beneficiary: retirement.beneficiary,
      date: retirement.date,
      verificationStatus: retirement.verified ? 'Verified' : 'Pending',
    };
    
    const blob = new Blob([JSON.stringify(certificateData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `retirement_certificate_${retirement.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const viewTransaction = (txHash: string) => {
    // Open transaction on block explorer
    const explorerUrl = `https://sepolia.etherscan.io/tx/${txHash}`;
    window.open(explorerUrl, '_blank');
  };

  const filteredRetirements = retirements
    .filter(retirement => {
      if (filterType === 'personal') return retirement.beneficiary.toLowerCase() === address?.toLowerCase();
      if (filterType === 'corporate') return retirement.beneficiary.toLowerCase() !== address?.toLowerCase();
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'date') return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortBy === 'amount') return b.amount - a.amount;
      return 0;
    });

  const totalRetired = filteredRetirements.reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Retirement History</h2>
          <p className="text-sm text-gray-600 mt-1">
            Total retired: <span className="font-semibold">{totalRetired} tCO₂</span>
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
          >
            <option value="all">All Retirements</option>
            <option value="personal">Personal</option>
            <option value="corporate">Corporate</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
          >
            <option value="date">Sort by Date</option>
            <option value="amount">Sort by Amount</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
        </div>
      ) : filteredRetirements.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Award className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p>No retirement records found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRetirements.map((retirement) => (
            <div
              key={retirement.id}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {retirement.projectName}
                    </h3>
                    {retirement.verified ? (
                      <span className="flex items-center space-x-1 text-green-600 bg-green-100 px-2 py-1 rounded-full text-xs">
                        <Award className="h-3 w-3" />
                        <span>Verified</span>
                      </span>
                    ) : (
                      <span className="text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full text-xs">
                        Pending
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Amount Retired</p>
                      <p className="font-semibold text-red-600">{retirement.amount} tCO₂</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Project ID</p>
                      <p className="font-medium">{retirement.projectId}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Date</p>
                      <p className="font-medium flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(retirement.date).toLocaleDateString()}</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Beneficiary</p>
                      <p className="font-medium truncate" title={retirement.beneficiary}>
                        {retirement.beneficiary === address ? 'You' : retirement.beneficiary}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Reason:</span> {retirement.reason}
                    </p>
                  </div>
                </div>
                
                <div className="ml-4 flex flex-col space-y-2">
                  {retirement.certificateHash && (
                    <button
                      onClick={() => downloadCertificate(retirement)}
                      className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      <Download className="h-4 w-4" />
                      <span>Certificate</span>
                    </button>
                  )}
                  <button
                    onClick={() => viewTransaction(retirement.txHash)}
                    className="flex items-center space-x-1 text-gray-600 hover:text-gray-700 text-sm"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>View TX</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-3xl font-bold text-gray-900">{filteredRetirements.length}</p>
            <p className="text-sm text-gray-600">Total Retirements</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-red-600">{totalRetired}</p>
            <p className="text-sm text-gray-600">tCO₂ Retired</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-green-600">
              {filteredRetirements.filter(r => r.verified).length}
            </p>
            <p className="text-sm text-gray-600">Verified</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-blue-600">
              {new Set(filteredRetirements.map(r => r.projectId)).size}
            </p>
            <p className="text-sm text-gray-600">Projects</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RetirementHistory;