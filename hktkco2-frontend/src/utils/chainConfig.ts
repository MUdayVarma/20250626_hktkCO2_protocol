import { Chain } from 'wagmi';

export const chainConfig = {
  ethereum: {
    chainId: 1,
    name: 'Ethereum Mainnet',
    currency: 'ETH',
    explorerUrl: 'https://etherscan.io',
    rpcUrl: process.env.REACT_APP_MAINNET_RPC_URL || 'https://eth-mainnet.g.alchemy.com/v2/demo',
    functionsRouter: '0x65Dcc24F8ff9e51F10DCc7Ed1e4e2A61e6E14bd6',
    donId: '0x66756e2d657468657265756d2d6d61696e6e65742d3100000000000000000000',
    linkToken: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
    ethUsdPriceFeed: '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419',
    btcUsdPriceFeed: '0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c',
  },
  sepolia: {
    chainId: 11155111,
    name: 'Sepolia Testnet',
    currency: 'ETH',
    explorerUrl: 'https://sepolia.etherscan.io',
    rpcUrl: process.env.REACT_APP_SEPOLIA_RPC_URL || 'https://sepolia.infura.io/v3/demo',
    functionsRouter: '0xb83E47C2bC239B3bf370bc41e1459A34b41238D0',
    donId: '0x66756e2d657468657265756d2d7365706f6c69612d3100000000000000000000',
    linkToken: '0x779877A7B0D9E8603169DdbD7836e478b4624789',
    ethUsdPriceFeed: '0x694AA1769357215DE4FAC081bf1f309aDC325306',
    btcUsdPriceFeed: '0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43',
    faucetUrl: 'https://sepoliafaucet.com',
  },
  polygon: {
    chainId: 137,
    name: 'Polygon Mainnet',
    currency: 'MATIC',
    explorerUrl: 'https://polygonscan.com',
    rpcUrl: process.env.REACT_APP_POLYGON_RPC_URL || 'https://polygon-rpc.com',
    functionsRouter: '0xdc2AAF042Aeff2E68B3e8E33F19e4B9fA7C73F10',
    donId: '0x66756e2d706f6c79676f6e2d6d61696e6e65742d310000000000000000000000',
    linkToken: '0xb0897686c545045aFc77CF20eC7A532E3120E0F1',
    ethUsdPriceFeed: '0xF9680D99D6C9589e2a93a78A04A279e509205945',
    btcUsdPriceFeed: '0xc907E116054Ad103354f2D350FD2514433D57F6f',
  },
  mumbai: {
    chainId: 80001,
    name: 'Mumbai Testnet',
    currency: 'MATIC',
    explorerUrl: 'https://mumbai.polygonscan.com',
    rpcUrl: process.env.REACT_APP_MUMBAI_RPC_URL || 'https://rpc-mumbai.maticvigil.com',
    functionsRouter: '0x6E2dc0F9DB014aE19888F539E59285D2Ea04244C',
    donId: '0x66756e2d706f6c79676f6e2d6d756d6261692d31000000000000000000000000',
    linkToken: '0x326C977E6efc84E512bB9C30f76E30c160eD06FB',
    ethUsdPriceFeed: '0x0715A7794a1dc8e42615F059dD6e406A6594651A',
    btcUsdPriceFeed: '0x007A22900a3B98143368Bd5906f8E17e9867581b',
    faucetUrl: 'https://faucet.polygon.technology',
  },
};

export const supportedChains = Object.values(chainConfig).map(config => config.chainId);

export const getChainConfig = (chainId: number) => {
  const config = Object.values(chainConfig).find(c => c.chainId === chainId);
  if (!config) {
    throw new Error(`Chain ${chainId} not supported`);
  }
  return config;
};

export const isTestnet = (chainId: number): boolean => {
  return chainId === chainConfig.sepolia.chainId || chainId === chainConfig.mumbai.chainId;
};

export const getDefaultChain = (): number => {
  const savedChainId = localStorage.getItem('hbco2_preferred_chain');
  if (savedChainId && supportedChains.includes(parseInt(savedChainId))) {
    return parseInt(savedChainId);
  }
  // Default to Sepolia for development
  return process.env.NODE_ENV === 'production' ? chainConfig.ethereum.chainId : chainConfig.sepolia.chainId;
};

export const getFaucetUrl = (chainId: number): string | undefined => {
  const config = getChainConfig(chainId);
  return (config as any).faucetUrl;
};

// Custom chain configurations for wagmi
export const customChains: Chain[] = [
  {
    id: chainConfig.sepolia.chainId,
    name: chainConfig.sepolia.name,
    network: 'sepolia',
    nativeCurrency: {
      decimals: 18,
      name: 'Ethereum',
      symbol: 'ETH',
    },
    rpcUrls: {
      public: { http: [chainConfig.sepolia.rpcUrl] },
      default: { http: [chainConfig.sepolia.rpcUrl] },
    },
    blockExplorers: {
      etherscan: { name: 'Etherscan', url: chainConfig.sepolia.explorerUrl },
      default: { name: 'Etherscan', url: chainConfig.sepolia.explorerUrl },
    },
    testnet: true,
  },
  {
    id: chainConfig.mumbai.chainId,
    name: chainConfig.mumbai.name,
    network: 'mumbai',
    nativeCurrency: {
      decimals: 18,
      name: 'MATIC',
      symbol: 'MATIC',
    },
    rpcUrls: {
      public: { http: [chainConfig.mumbai.rpcUrl] },
      default: { http: [chainConfig.mumbai.rpcUrl] },
    },
    blockExplorers: {
      etherscan: { name: 'PolygonScan', url: chainConfig.mumbai.explorerUrl },
      default: { name: 'PolygonScan', url: chainConfig.mumbai.explorerUrl },
    },
    testnet: true,
  },
];