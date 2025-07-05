import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ethers } from 'ethers';
import { ShoppingCart, Plus, Filter } from 'lucide-react';
import useContract from '../../contracts/hooks/useContract';
import CreateListingModal from './CreateListingModal';
import ListingCard from './ListingCard';

interface Listing {
  id: number;
  seller: string;
  projectName: string;
  projectId: string;
  methodology: string;
  vintage: number;
  amount: number;
  pricePerToken: number;
  isActive: boolean;
  verified: boolean;
}

const Marketplace: React.FC = () => {
  const { address, isConnected } = useAccount();
  const { carbonMarketplace, carbonToken } = useContract();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState('all');

  // Mock listings data - replace with actual contract calls
  const mockListings: Listing[] = [
    {
      id: 1,
      seller: '0x742d35Cc6634C0532925a3b844Bc9e7595f5b123',
      projectName: 'Amazon Rainforest Conservation',
      projectId: 'VCS-1234',
      methodology: 'REDD+',
      vintage: 2024,
      amount: 1000,
      pricePerToken: 58.5,
      isActive: true,
      verified: true,
    },
    {
      id: 2,
      seller: '0x123d35Cc6634C0532925a3b844Bc9e7595f5b456',
      projectName: 'Solar Farm India',
      projectId: 'CDM-5678',
      methodology: 'CDM',
      vintage: 2024,
      amount: 500,
      pricePerToken: 52,
      isActive: true,
      verified: true,
    },
  ];

  useEffect(() => {
    if (isConnected && carbonMarketplace) {
      fetchListings();
    } else {
      // Use mock data when not connected
      setListings(mockListings);
      setLoading(false);
    }
  }, [isConnected, carbonMarketplace]);

  const fetchListings = async () => {
    try {
      setLoading(true);
      // TODO: Implement actual contract calls to fetch listings
      // For now, using mock data
      setListings(mockListings);
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBuyNow = async (listing: Listing) => {
    if (!carbonMarketplace || !address) return;

    try {
      const totalCost = ethers.utils.parseEther((listing.pricePerToken * listing.amount).toString());
      const tx = await carbonMarketplace.buyListing(listing.id, listing.amount, {
        value: totalCost,
      });
      await tx.wait();
      
      // Refresh listings
      fetchListings();
    } catch (error) {
      console.error('Error buying listing:', error);
    }
  };

  const handleMakeOffer = (listing: Listing) => {
    // TODO: Implement offer functionality
    console.log('Make offer for listing:', listing.id);
  };

  const filteredListings = listings.filter(listing => {
    if (filter === 'all') return true;
    if (filter === 'verified') return listing.verified;
    if (filter === 'mylistings') return listing.seller.toLowerCase() === address?.toLowerCase();
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Carbon Credit Marketplace</h1>
          <p className="text-gray-600 mt-1">Buy and sell verified carbon credits</p>
        </div>
        {isConnected && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>List Credits</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
        <div className="flex items-center space-x-4">
          <Filter className="h-5 w-5 text-gray-500" />
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-green-100 text-green-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            All Listings
          </button>
          <button
            onClick={() => setFilter('verified')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'verified'
                ? 'bg-green-100 text-green-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Verified Only
          </button>
          {isConnected && (
            <button
              onClick={() => setFilter('mylistings')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'mylistings'
                  ? 'bg-green-100 text-green-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              My Listings
            </button>
          )}
        </div>
      </div>

      {/* Listings Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
      ) : filteredListings.length === 0 ? (
        <div className="text-center py-12">
          <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No listings found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredListings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              onBuyNow={handleBuyNow}
              onMakeOffer={handleMakeOffer}
              isConnected={isConnected}
            />
          ))}
        </div>
      )}

      {/* Create Listing Modal */}
      {showCreateModal && (
        <CreateListingModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchListings();
          }}
        />
      )}
    </div>
  );
};

export default Marketplace;