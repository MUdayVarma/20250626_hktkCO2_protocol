import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { ethers } from 'ethers';
import useContract from './useContract';

interface RetirementRecord {
  retirementId: number;
  retiree: string;
  amount: number;
  reason: string;
  beneficiary: string;
  timestamp: number;
  proofHash: string;
  isVerified: boolean;
  creditIds: number[];
  projectId: string;
  oracleVerified: boolean;
  retirementPrice: number;
  retirementType: number;
}

interface RetirementStats {
  totalRetired: number;
  totalRetirements: number;
  verifiedRetirements: number;
  oracleVerifiedRetirements: number;
}

interface RetirementHooks {
  retirements: RetirementRecord[];
  userRetirements: RetirementRecord[];
  stats: RetirementStats;
  loading: boolean;
  error: string | null;
  retireCredits: (params: RetireCreditsParams) => Promise<void>;
  getRetirementProof: (retirementId: number) => Promise<RetirementRecord | null>;
  downloadCertificate: (retirementId: number) => Promise<void>;
  refreshRetirements: () => void;
}

interface RetireCreditsParams {
  amount: number;
  reason: string;
  beneficiary: string;
  creditIds: number[];
  retirementType: 'VOLUNTARY' | 'COMPLIANCE' | 'OFFSETTING' | 'CSR';
}

const useRetirement = (): RetirementHooks => {
  const { address, isConnected } = useAccount();
  const { retirementContract } = useContract();
  const [retirements, setRetirements] = useState<RetirementRecord[]>([]);
  const [stats, setStats] = useState<RetirementStats>({
    totalRetired: 0,
    totalRetirements: 0,
    verifiedRetirements: 0,
    oracleVerifiedRetirements: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Map retirement type strings to enum values
  const retirementTypeMap = {
    'VOLUNTARY': 0,
    'COMPLIANCE': 1,
    'OFFSETTING': 2,
    'CSR': 3,
  };

  // Fetch all retirements
  const fetchRetirements = useCallback(async () => {
    if (!retirementContract) return;

    try {
      setLoading(true);
      setError(null);

      // Get global retirement stats
      const globalStats = await retirementContract.getGlobalRetirementStats();
      
      setStats({
        totalRetired: globalStats.totalAmountRetired.toNumber(),
        totalRetirements: globalStats.totalRetirementsCount.toNumber(),
        verifiedRetirements: globalStats.verifiedRetirements.toNumber(),
        oracleVerifiedRetirements: globalStats.oracleVerifiedRetirements.toNumber(),
      });

      // Fetch individual retirement records
      const retirementsArray: RetirementRecord[] = [];
      const nextRetirementId = await retirementContract.nextRetirementId();

      for (let i = 0; i < Math.min(nextRetirementId.toNumber(), 50); i++) {
        try {
          const retirement = await retirementContract.getRetirementProof(i);
          
          retirementsArray.push({
            retirementId: i,
            retiree: retirement.retiree,
            amount: retirement.amount.toNumber(),
            reason: retirement.reason,
            beneficiary: retirement.beneficiary,
            timestamp: retirement.timestamp.toNumber(),
            proofHash: retirement.proofHash,
            isVerified: retirement.isVerified,
            creditIds: retirement.creditIds.map((id: any) => id.toNumber()),
            projectId: retirement.projectId,
            oracleVerified: retirement.oracleVerified,
            retirementPrice: retirement.retirementPrice.toNumber(),
            retirementType: retirement.retirementType,
          });
        } catch (err) {
          console.error(`Error fetching retirement ${i}:`, err);
        }
      }

      setRetirements(retirementsArray);
    } catch (err: any) {
      console.error('Error fetching retirements:', err);
      setError(err.message || 'Failed to fetch retirements');
    } finally {
      setLoading(false);
    }
  }, [retirementContract]);

  // Retire carbon credits
  const retireCredits = async (params: RetireCreditsParams) => {
    if (!retirementContract || !isConnected) {
      throw new Error('Wallet not connected');
    }

    try {
      setLoading(true);
      setError(null);

      const tx = await retirementContract.retireCredits(
        params.amount,
        params.reason,
        params.beneficiary,
        params.creditIds,
        retirementTypeMap[params.retirementType]
      );

      await tx.wait();
      
      // Refresh retirements after creating new one
      await fetchRetirements();
    } catch (err: any) {
      console.error('Error retiring credits:', err);
      setError(err.message || 'Failed to retire credits');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get specific retirement proof
  const getRetirementProof = async (retirementId: number): Promise<RetirementRecord | null> => {
    if (!retirementContract) return null;

    try {
      const retirement = await retirementContract.getRetirementProof(retirementId);
      
      return {
        retirementId,
        retiree: retirement.retiree,
        amount: retirement.amount.toNumber(),
        reason: retirement.reason,
        beneficiary: retirement.beneficiary,
        timestamp: retirement.timestamp.toNumber(),
        proofHash: retirement.proofHash,
        isVerified: retirement.isVerified,
        creditIds: retirement.creditIds.map((id: any) => id.toNumber()),
        projectId: retirement.projectId,
        oracleVerified: retirement.oracleVerified,
        retirementPrice: retirement.retirementPrice.toNumber(),
        retirementType: retirement.retirementType,
      };
    } catch (err: any) {
      console.error('Error fetching retirement proof:', err);
      return null;
    }
  };

  // Download retirement certificate
  const downloadCertificate = async (retirementId: number) => {
    if (!retirementContract) return;

    try {
      const certificate = await retirementContract.getRetirementCertificate(retirementId);
      
      if (!certificate.isValid) {
        throw new Error('Certificate not available');
      }

      // Create certificate data
      const retirement = retirements.find(r => r.retirementId === retirementId);
      if (!retirement) return;

      const certificateData = {
        retirementId,
        projectId: retirement.projectId,
        amount: retirement.amount,
        beneficiary: retirement.beneficiary,
        reason: retirement.reason,
        date: new Date(retirement.timestamp * 1000).toISOString(),
        certificateHash: certificate.certificateHash,
        issuer: certificate.issuer,
        issuedDate: new Date(certificate.issuedDate.toNumber() * 1000).toISOString(),
      };

      // Download as JSON
      const blob = new Blob([JSON.stringify(certificateData, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `retirement_certificate_${retirementId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Error downloading certificate:', err);
      throw err;
    }
  };

  // Get user's retirements
  const userRetirements = retirements.filter(
    retirement => retirement.retiree.toLowerCase() === address?.toLowerCase()
  );

  // Refresh retirements
  const refreshRetirements = () => {
    fetchRetirements();
  };

  // Fetch retirements on mount and when contract is available
  useEffect(() => {
    if (retirementContract) {
      fetchRetirements();
    }
  }, [retirementContract, fetchRetirements]);

  return {
    retirements,
    userRetirements,
    stats,
    loading,
    error,
    retireCredits,
    getRetirementProof,
    downloadCertificate,
    refreshRetirements,
  };
};

export default useRetirement;