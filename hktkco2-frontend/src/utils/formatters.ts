import { ethers } from 'ethers';

// Format address to show first and last characters
export const formatAddress = (address: string, chars = 4): string => {
  if (!address) return '';
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
};

// Format large numbers with commas
export const formatNumber = (num: number | string, decimals = 2): string => {
  const number = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(number)) return '0';
  
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(number);
};

// Format currency values
export const formatCurrency = (value: number | string, currency = 'USD'): string => {
  const number = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(number)) return '$0.00';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(number);
};

// Format token amounts from wei
export const formatTokenAmount = (
  amount: ethers.BigNumber | string,
  decimals = 18,
  displayDecimals = 2
): string => {
  try {
    const formatted = ethers.utils.formatUnits(amount, decimals);
    const number = parseFloat(formatted);
    return formatNumber(number, displayDecimals);
  } catch {
    return '0';
  }
};

// Parse token amount to wei
export const parseTokenAmount = (amount: string, decimals = 18): ethers.BigNumber => {
  try {
    return ethers.utils.parseUnits(amount, decimals);
  } catch {
    return ethers.BigNumber.from(0);
  }
};

// Format date from timestamp
export const formatDate = (timestamp: number | string, format: 'short' | 'long' | 'full' = 'short'): string => {
  const date = new Date(typeof timestamp === 'string' ? parseInt(timestamp) * 1000 : timestamp * 1000);
  
  switch (format) {
    case 'short':
      return date.toLocaleDateString();
    case 'long':
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    case 'full':
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    default:
      return date.toLocaleDateString();
  }
};

// Format time ago
export const formatTimeAgo = (timestamp: number): string => {
  const seconds = Math.floor((Date.now() / 1000) - timestamp);
  
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(months / 12);
  return `${years}y ago`;
};

// Format percentage
export const formatPercentage = (value: number, decimals = 2): string => {
  return `${formatNumber(value, decimals)}%`;
};

// Format transaction hash
export const formatTxHash = (hash: string, chars = 6): string => {
  if (!hash) return '';
  return `${hash.slice(0, chars + 2)}...${hash.slice(-chars)}`;
};

// Format project ID
export const formatProjectId = (id: string): string => {
  if (!id) return '';
  if (id.length <= 12) return id;
  return `${id.slice(0, 8)}...`;
};

// Format file size
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Format CO2 amount
export const formatCO2Amount = (amount: number, includeUnit = true): string => {
  const formatted = formatNumber(amount, 2);
  return includeUnit ? `${formatted} tCO₂` : formatted;
};

// Format price per tCO2
export const formatPricePerTon = (price: number): string => {
  return `${formatCurrency(price)}/tCO₂`;
};

// Get explorer link
export const getExplorerLink = (
  hash: string,
  type: 'tx' | 'address' | 'block',
  chainId: number
): string => {
  const baseUrls: { [key: number]: string } = {
    1: 'https://etherscan.io',
    11155111: 'https://sepolia.etherscan.io',
    137: 'https://polygonscan.com',
    80001: 'https://mumbai.polygonscan.com',
  };
  
  const baseUrl = baseUrls[chainId] || baseUrls[1];
  const path = type === 'tx' ? 'tx' : type === 'address' ? 'address' : 'block';
  return `${baseUrl}/${path}/${hash}`;
};

// Truncate text
export const truncateText = (text: string, maxLength: number): string => {
  if (!text || text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
};

// Format error message
export const formatErrorMessage = (error: any): string => {
  if (typeof error === 'string') return error;
  if (error?.message) {
    // Extract revert reason from error message
    const match = error.message.match(/reason="([^"]+)"/);
    if (match) return match[1];
    return error.message;
  }
  if (error?.error?.message) return error.error.message;
  return 'An unknown error occurred';
};