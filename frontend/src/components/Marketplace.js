// Marketplace Component

// src/components/Marketplace.js
import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const Marketplace = ({ contracts, account }) => {
  const [listings, setListings] = useState([]);
  const [showCreateListing, setShowCreateListing] = useState(false);
  const [newListing, setNewListing] = useState({
    amount: '',
    price: '',
    projectId: '',
    vintage: '2024'
  });

  useEffect(() => {
    if (contracts.marketplace) {
      loadListings();
    }
  }, [contracts]);

  const loadListings = async () => {
    // This is a simplified version - you'd need to implement event filtering
    // or add view functions to get active listings
    const sampleListings = [
      {
        id: 0,
        seller: '0x1234...5678',
        amount: '100',
        price: '0.01',
        projectId: 'Forestry-001',
        vintage: '2024',
        isActive: true
      },
      {
        id: 1,
        seller: '0x8765...4321',
        amount: '50',
        price: '0.015',
        projectId: 'Solar-002',
        vintage: '2024',
        isActive: true
      }
    ];
    setListings(sampleListings);
  };

  const handleCreateListing = async (e) => {
    e.preventDefault();
    try {
      // First approve the marketplace to spend tokens
      const approveAmount = ethers.parseEther(newListing.amount);
      await contracts.token.approve(contracts.marketplace.target, approveAmount);
      
      // Create the listing
      const priceInWei = ethers.parseEther(newListing.price);
      await contracts.marketplace.createListing(
        parseInt(newListing.amount),
        priceInWei,
        newListing.projectId,
        parseInt(newListing.vintage)
      );
      
      setShowCreateListing(false);
      setNewListing({ amount: '', price: '', projectId: '', vintage: '2024' });
      loadListings();
    } catch (error) {
      console.error('Error creating listing:', error);
    }
  };

  const handleBuyListing = async (listingId, amount, price) => {
    try {
      const totalCost = ethers.parseEther((amount * parseFloat(price)).toString());
      await contracts.marketplace.buyListing(listingId, amount, { value: totalCost });
      loadListings();
    } catch (error) {
      console.error('Error buying listing:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">Carbon Credit Marketplace</h2>
        <button
          onClick={() => setShowCreateListing(true)}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg"
        >
          Create Listing
        </button>
      </div>

      {/* Create Listing Modal */}
      {showCreateListing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-xl font-bold mb-4">Create New Listing</h3>
            <form onSubmit={handleCreateListing} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Amount (CCT)</label>
                <input
                  type="number"
                  value={newListing.amount}
                  onChange={(e) => setNewListing({...newListing, amount: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Price per Token (ETH)</label>
                <input
                  type="number"
                  step="0.001"
                  value={newListing.price}
                  onChange={(e) => setNewListing({...newListing, price: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Project ID</label>
                <input
                  type="text"
                  value={newListing.projectId}
                  onChange={(e) => setNewListing({...newListing, projectId: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Vintage Year</label>
                <input
                  type="number"
                  value={newListing.vintage}
                  onChange={(e) => setNewListing({...newListing, vintage: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>
              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg"
                >
                  Create Listing
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateListing(false)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Listings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {listings.map((listing) => (
          <div key={listing.id} className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold">{listing.projectId}</h3>
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                {listing.vintage}
              </span>
            </div>
            
            <div className="space-y-2 mb-4">
              <p className="text-gray-600">Amount: <span className="font-semibold">{listing.amount} CCT</span></p>
              <p className="text-gray-600">Price: <span className="font-semibold">{listing.price} ETH per token</span></p>
              <p className="text-gray-600 text-sm">Seller: {listing.seller}</p>
            </div>
            
            <div className="flex space-x-2">
              <input
                type="number"
                placeholder="Amount to buy"
                max={listing.amount}
                className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
                id={`amount-${listing.id}`}
              />
              <button
                onClick={() => {
                  const amount = document.getElementById(`amount-${listing.id}`).value;
                  if (amount && amount > 0) {
                    handleBuyListing(listing.id, parseInt(amount), listing.price);
                  }
                }}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm"
              >
                Buy
              </button>
            </div>
          </div>
        ))}
      </div>

      {listings.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No active listings found</p>
          <p className="text-gray-400">Be the first to create a listing!</p>
        </div>
      )}
    </div>
  );
};

export default Marketplace;
