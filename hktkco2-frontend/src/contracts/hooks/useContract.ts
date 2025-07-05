import { useContract as useWagmiContract, useSigner } from 'wagmi';
import { Contract } from 'ethers';
import { CONTRACT_ADDRESSES } from '../addresses';
import CarbonCreditTokenABI from '../abis/CarbonCreditToken.json';
import CarbonMarketplaceABI from '../abis/CarbonMarketplace.json';
import CarbonRegistryABI from '../abis/CarbonRegistry.json';
import RetirementContractABI from '../abis/RetirementContract.json';
import ChainlinkOracleABI from '../abis/ChainlinkOracle.json';
import PriceOracleABI from '../abis/PriceOracle.json';

interface ContractHooks {
  carbonToken: Contract | null;
  carbonMarketplace: Contract | null;
  carbonRegistry: Contract | null;
  retirementContract: Contract | null;
  chainlinkOracle: Contract | null;
  priceOracle: Contract | null;
}

const useContract = (): ContractHooks => {
  const { data: signer } = useSigner();
  const chainId = signer?.provider?.network?.chainId || 11155111; // Default to Sepolia

  const carbonToken = useWagmiContract({
    address: CONTRACT_ADDRESSES[chainId]?.carbonToken,
    abi: CarbonCreditTokenABI,
    signerOrProvider: signer,
  });

  const carbonMarketplace = useWagmiContract({
    address: CONTRACT_ADDRESSES[chainId]?.carbonMarketplace,
    abi: CarbonMarketplaceABI,
    signerOrProvider: signer,
  });

  const carbonRegistry = useWagmiContract({
    address: CONTRACT_ADDRESSES[chainId]?.carbonRegistry,
    abi: CarbonRegistryABI,
    signerOrProvider: signer,
  });

  const retirementContract = useWagmiContract({
    address: CONTRACT_ADDRESSES[chainId]?.retirementContract,
    abi: RetirementContractABI,
    signerOrProvider: signer,
  });

  const chainlinkOracle = useWagmiContract({
    address: CONTRACT_ADDRESSES[chainId]?.chainlinkOracle,
    abi: ChainlinkOracleABI,
    signerOrProvider: signer,
  });

  const priceOracle = useWagmiContract({
    address: CONTRACT_ADDRESSES[chainId]?.priceOracle,
    abi: PriceOracleABI,
    signerOrProvider: signer,
  });

  return {
    carbonToken,
    carbonMarketplace,
    carbonRegistry,
    retirementContract,
    chainlinkOracle,
    priceOracle,
  };
};

export default useContract;