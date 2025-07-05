import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import useContract from '../../contracts/hooks/useContract';

interface ImpactSummary {
  totalEmissions: number;
  totalOffsets: number;
  netImpact: number;
  carbonNeutral: boolean;
}

interface VerificationStatus {
  blockchain: boolean;
  thirdParty: boolean;
  registry: boolean;
  pending: boolean;
}

const ESGReport: React.FC = () => {
  const { address, isConnected } = useAccount();
  const { retirementContract } = useContract();
  const [impactSummary, setImpactSummary] = useState<ImpactSummary>({
    totalEmissions: 1250,
    totalOffsets: 1350,
    netImpact: -100,
    carbonNeutral: true,
  });
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>({
    blockchain: true,
    thirdParty: true,
    registry: true,
    pending: false,
  });
  const [loading, setLoading] = useState(false);

  // Mock data for monthly impact
  const monthlyImpactData = [
    { month: 'Jan', emissions: 100, offsets: 120 },
    { month: 'Feb', emissions: 95, offsets: 110 },
    { month: 'Mar', emissions: 110, offsets: 115 },
    { month: 'Apr', emissions: 105, offsets: 108 },
    { month: 'May', emissions: 98, offsets: 105 },
    { month: 'Jun', emissions: 102, offsets: 112 },
  ];

  const generateReport = async () => {
    setLoading(true);
    try {
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In production, this would generate a PDF or downloadable report
      const reportData = {
        generatedAt: new Date().toISOString(),
        company: address,
        period: '2024',
        summary: impactSummary,
        verificationStatus,
      };
      
      // Download report
      const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ESG_Report_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <FileText className="h-16 w-16 text-purple-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">ESG Reporting</h2>
          <p className="text-gray-600">Connect your wallet to generate reports</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ESG Reporting</h1>
          <p className="text-gray-600 mt-1">Track and report your environmental impact</p>
        </div>
        <button
          onClick={generateReport}
          disabled={loading}
          className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
            loading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-purple-600 text-white hover:bg-purple-700'
          }`}
        >
          <FileText className="h-5 w-5" />
          <span>{loading ? 'Generating...' : 'Generate Report'}</span>
        </button>
      </div>

      {/* Annual Impact Summary */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Annual Impact Summary</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">Total Emissions</p>
            <p className="text-3xl font-bold text-gray-900">{impactSummary.totalEmissions} tCO₂</p>
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">Total Offsets</p>
            <p className="text-3xl font-bold text-green-600">{impactSummary.totalOffsets} tCO₂</p>
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">Net Impact</p>
            <p className={`text-3xl font-bold ${impactSummary.netImpact < 0 ? 'text-green-600' : 'text-red-600'}`}>
              {impactSummary.netImpact > 0 ? '+' : ''}{impactSummary.netImpact} tCO₂
            </p>
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">Carbon Neutral</p>
            <div className="flex items-center space-x-2">
              {impactSummary.carbonNeutral ? (
                <>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <span className="text-green-600 font-bold">Achieved</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-8 w-8 text-red-600" />
                  <span className="text-red-600 font-bold">Not Yet</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Impact Chart */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Impact Comparison</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlyImpactData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="emissions" fill="#ef4444" name="Emissions (tCO₂)" />
            <Bar dataKey="offsets" fill="#10b981" name="Offsets (tCO₂)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Verification Status */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Verification Status</h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              {verificationStatus.blockchain ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <Clock className="h-5 w-5 text-yellow-600" />
              )}
              <span className="font-medium">Blockchain verified</span>
            </div>
            {verificationStatus.blockchain && (
              <span className="text-sm text-green-600">Verified</span>
            )}
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              {verificationStatus.thirdParty ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <Clock className="h-5 w-5 text-yellow-600" />
              )}
              <span className="font-medium">Third-party audited</span>
            </div>
            {verificationStatus.thirdParty && (
              <span className="text-sm text-green-600">Verified</span>
            )}
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              {verificationStatus.registry ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <Clock className="h-5 w-5 text-yellow-600" />
              )}
              <span className="font-medium">Registry compliant</span>
            </div>
            {verificationStatus.registry && (
              <span className="text-sm text-green-600">Verified</span>
            )}
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Clock className="h-5 w-5 text-yellow-600" />
              <span className="font-medium">Pending final review</span>
            </div>
            <span className="text-sm text-yellow-600">In Progress</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ESGReport;