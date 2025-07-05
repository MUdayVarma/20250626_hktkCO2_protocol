import { useState, useEffect, useCallback } from 'react';
import { useAccount, useContractRead, useContractWrite, usePrepareContractWrite } from 'wagmi';
import { ethers } from 'ethers';
import useContract from './useContract';

interface Listing {
  listingId: number;
  seller: string;
  amount: number;
  pricePerToken: number;
  projectId: string;
  vintage: number;
  isActive: boolean;
  requiresOracleVerification: boolean;
  creditIds: number[];
  isPriorityListing: boolean;
}

interface MarketplaceHooks {
  listings: Listing[];
  loading: boolean;
  error: string | null;
  createListing: (params: CreateListingParams) => Promise<void>;
  buyListing: (listingId: number, amount: number) => Promise<void>;
  cancelListing: (listingId: number) => Promise<void>;
  getUserListings: () => Listing[];
  refreshListings: () => void;
}

interface CreateListingParams {
  amount: number;
  pricePerToken: string;
  projectId: string;
  vintage: number;
  creditIds: number[];
}

const useMarketplace = (): MarketplaceHooks => {
  const { address, isConnected } = useAccount();
  const { carbonMarketplace } = useContract();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all active listings
  const fetchListings = useCallback(async () => {
    if (!carbonMarketplace) return;

    try {
      setLoading(true);
      setError(null);

      // Get next listing ID to determine total listings
      const nextListingId = await carbonMarketplace.nextListingId();
      const listingsArray: Listing[] = [];

      // Fetch each listing
      for (let i = 0; i < nextListingId.toNumber(); i++) {
        const listing = await carbonMarketplace.listings(i);
        
        if (listing.isActive) {
          listingsArray.push({
            listingId: i,
            seller: listing.seller,
            amount: listing.amount.toNumber(),
            pricePerToken: parseFloat(ethers.utils.formatEther(listing.pricePerToken)),
            projectId: listing.projectId,
            vintage: listing.vintage.toNumber(),
            isActive: listing.isActive,
            requiresOracleVerification: listing.requiresOracleVerification,
            creditIds: listing.creditIds.map((id: any) => id.toNumber()),
            isPriorityListing: listing.isPriorityListing,
          });
        }
      }

      setListings(listingsArray);
    } catch (err: any) {
      console.error('Error fetching listings:', err);
      setError(err.message || 'Failed to fetch listings');
    } finally {
      setLoading(false);
    }
  }, [carbonMarketplace]);

  // Create a new listing
  const createListing = async (params: CreateListingParams) => {
    if (!carbonMarketplace || !isConnected) {
      throw new Error('Wallet not connected');
    }

    try {
      setLoading(true);
      setError(null);

      const tx = await carbonMarketplace.createListing(
        params.amount,
        ethers.utils.parseEther(params.pricePerToken),
        params.projectId,
        params.vintage,
        params.creditIds
      );

      await tx.wait();
      
      // Refresh listings after creation
      await fetchListings();
    } catch (err: any) {
      console.error('Error creating listing:', err);
      setError(err.message || 'Failed to create listing');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Buy from a listing
  const buyListing = async (listingId: number, amount: number) => {
    if (!carbonMarketplace || !isConnected) {
      throw new Error('Wallet not connected');
    }

    try {
      setLoading(true);
      setError(null);

      const listing = listings.find(l => l.listingId === listingId);
      if (!listing) throw new Error('Listing not found');

      const totalCost = ethers.utils.parseEther((listing.pricePerToken * amount).toString());

      const tx = await carbonMarketplace.buyListing(listingId, amount, {
        value: totalCost,
      });

      await tx.wait();
      
      // Refresh listings after purchase
      await fetchListings();
    } catch (err: any) {
      console.error('Error buying listing:', err);
      setError(err.message || 'Failed to buy listing');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Cancel a listing
  const cancelListing = async (listingId: number) => {
    if (!carbonMarketplace || !isConnected) {
      throw new Error('Wallet not connected');
    }

    try {
      setLoading(true);
      setError(null);

      const tx = await carbonMarketplace.cancelListing(listingId);
      await tx.wait();
      
      // Refresh listings after cancellation
      await fetchListings();
    } catch (err: any) {
      console.error('Error canceling listing:', err);
      setError(err.message || 'Failed to cancel listing');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get user's listings
  const getUserListings = useCallback(() => {
    if (!address) return [];
    return listings.filter(listing => 
      listing.seller.toLowerCase() === address.toLowerCase()
    );
  }, [listings, address]);

  // Refresh listings
  const refreshListings = () => {
    fetchListings();
  };

  // Fetch listings on mount and when contract is available
  useEffect(() => {
    if (carbonMarketplace) {
      fetchListings();
    }
  }, [carbonMarketplace, fetchListings]);

  return {
    listings,
    loading,
    error,
    createListing,
    buyListing,
    cancelListing,
    getUserListings,
    refreshListings,
  };
};

export default useMarketplace;