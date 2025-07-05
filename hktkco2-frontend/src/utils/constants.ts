// Application Constants

export const APP_NAME = 'HBCO2';
export const APP_DESCRIPTION = 'Simplifying Transparency and Traceability of Carbon Credit Usage';

// Token Constants
export const TOKEN_SYMBOL = 'CCT';
export const TOKEN_NAME = 'Carbon Credit Token';
export const TOKEN_DECIMALS = 18;

// Time Constants
export const VERIFICATION_VALIDITY_PERIOD = 365 * 24 * 60 * 60; // 1 year in seconds
export const VERIFICATION_GRACE_PERIOD = 7 * 24 * 60 * 60; // 7 days in seconds

// Marketplace Constants
export const MARKETPLACE_FEE_BASIS_POINTS = 250; // 2.5%
export const BASIS_POINTS = 10000;
export const VERIFICATION_DISCOUNT_RATE = 10; // 10% discount for verified projects

// Registry Constants
export const MIN_CREDITS_PER_PROJECT = 1;
export const MAX_CREDITS_PER_PROJECT = 1000000;

// Retirement Types
export const RETIREMENT_TYPES = {
  VOLUNTARY: 0,
  COMPLIANCE: 1,
  OFFSETTING: 2,
  CSR: 3,
} as const;

export const RETIREMENT_TYPE_LABELS = {
  [RETIREMENT_TYPES.VOLUNTARY]: 'Voluntary',
  [RETIREMENT_TYPES.COMPLIANCE]: 'Compliance',
  [RETIREMENT_TYPES.OFFSETTING]: 'Offsetting',
  [RETIREMENT_TYPES.CSR]: 'Corporate Social Responsibility',
};

// Project Status
export const PROJECT_STATUS = {
  REGISTERED: 0,
  UNDER_REVIEW: 1,
  VERIFIED: 2,
  ACTIVE: 3,
  SUSPENDED: 4,
  RETIRED: 5,
} as const;

export const PROJECT_STATUS_LABELS = {
  [PROJECT_STATUS.REGISTERED]: 'Registered',
  [PROJECT_STATUS.UNDER_REVIEW]: 'Under Review',
  [PROJECT_STATUS.VERIFIED]: 'Verified',
  [PROJECT_STATUS.ACTIVE]: 'Active',
  [PROJECT_STATUS.SUSPENDED]: 'Suspended',
  [PROJECT_STATUS.RETIRED]: 'Retired',
};

// Verification Types
export const VERIFICATION_TYPES = {
  MANUAL: 0,
  ORACLE: 1,
  HYBRID: 2,
} as const;

export const VERIFICATION_TYPE_LABELS = {
  [VERIFICATION_TYPES.MANUAL]: 'Manual',
  [VERIFICATION_TYPES.ORACLE]: 'Oracle',
  [VERIFICATION_TYPES.HYBRID]: 'Hybrid',
};

// Methodologies
export const METHODOLOGIES = [
  'REDD+',
  'CDM',
  'VCS',
  'Gold Standard',
  'Climate Action Reserve',
  'American Carbon Registry',
];

// Registries
export const REGISTRIES = [
  'Verra',
  'Gold Standard',
  'Climate Action Reserve',
  'American Carbon Registry',
  'Plan Vivo',
];

// Network Configuration
export const SUPPORTED_CHAINS = {
  ETHEREUM_MAINNET: 1,
  SEPOLIA: 11155111,
  POLYGON_MAINNET: 137,
  POLYGON_MUMBAI: 80001,
} as const;

export const CHAIN_NAMES = {
  [SUPPORTED_CHAINS.ETHEREUM_MAINNET]: 'Ethereum',
  [SUPPORTED_CHAINS.SEPOLIA]: 'Sepolia',
  [SUPPORTED_CHAINS.POLYGON_MAINNET]: 'Polygon',
  [SUPPORTED_CHAINS.POLYGON_MUMBAI]: 'Mumbai',
};

// Block Explorers
export const BLOCK_EXPLORERS = {
  [SUPPORTED_CHAINS.ETHEREUM_MAINNET]: 'https://etherscan.io',
  [SUPPORTED_CHAINS.SEPOLIA]: 'https://sepolia.etherscan.io',
  [SUPPORTED_CHAINS.POLYGON_MAINNET]: 'https://polygonscan.com',
  [SUPPORTED_CHAINS.POLYGON_MUMBAI]: 'https://mumbai.polygonscan.com',
};

// API Endpoints
export const API_ENDPOINTS = {
  VERRA: 'https://registry.verra.org/uiapi/resource',
  GOLD_STANDARD: 'https://registry.goldstandard.org/api',
  IPFS_GATEWAY: 'https://ipfs.io/ipfs',
};

// Transaction Messages
export const TX_MESSAGES = {
  CREATING_LISTING: 'Creating listing...',
  BUYING_CREDITS: 'Purchasing carbon credits...',
  RETIRING_CREDITS: 'Retiring carbon credits...',
  REGISTERING_PROJECT: 'Registering project...',
  ISSUING_CREDITS: 'Issuing carbon credits...',
  VERIFYING_PROJECT: 'Verifying project...',
};

// Error Messages
export const ERROR_MESSAGES = {
  WALLET_NOT_CONNECTED: 'Please connect your wallet',
  WRONG_NETWORK: 'Please switch to a supported network',
  INSUFFICIENT_BALANCE: 'Insufficient balance',
  TRANSACTION_FAILED: 'Transaction failed',
  INVALID_INPUT: 'Invalid input',
  PROJECT_NOT_FOUND: 'Project not found',
  LISTING_NOT_FOUND: 'Listing not found',
  VERIFICATION_REQUIRED: 'Verification required',
  ORACLE_ERROR: 'Oracle verification failed',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  LISTING_CREATED: 'Listing created successfully',
  CREDITS_PURCHASED: 'Carbon credits purchased successfully',
  CREDITS_RETIRED: 'Carbon credits retired successfully',
  PROJECT_REGISTERED: 'Project registered successfully',
  CREDITS_ISSUED: 'Carbon credits issued successfully',
  PROJECT_VERIFIED: 'Project verified successfully',
};

// Local Storage Keys
export const STORAGE_KEYS = {
  USER_PREFERENCES: 'hbco2_user_preferences',
  RECENT_TRANSACTIONS: 'hbco2_recent_transactions',
  SAVED_PROJECTS: 'hbco2_saved_projects',
};

// Default Values
export const DEFAULTS = {
  GAS_LIMIT: '500000',
  SLIPPAGE_TOLERANCE: 0.5, // 0.5%
  DEADLINE_MINUTES: 20,
  ITEMS_PER_PAGE: 10,
  CHART_DAYS: 30,
};