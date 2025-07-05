import React from 'react';
import { CheckCircle, Calendar, Zap } from 'lucide-react';

interface ListingProps {
  listing: {
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
  };
  onBuyNow: (listing: any) => void;
  onMakeOffer: (listing: any) => void;
  isConnected: boolean;
}

const ListingCard: React.FC<ListingProps> = ({ listing, onBuyNow, onMakeOffer, isConnected }) => {
  const totalPrice = listing.amount * listing.pricePerToken;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{listing.projectName}</h3>
            <p className="text-sm text-gray-500 mt-1">
              {listing.methodology} • Vintage: {listing.vintage}
            </p>
          </div>
          {listing.verified && (
            <div className="flex items-center space-x-1 bg-green-100 text-green-700 px-3 py-1 rounded-full">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Verified</span>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-gray-600">
              <Zap className="h-4 w-4" />
              <span className="text-sm">Available</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">{listing.amount} tCO₂</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-gray-600">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">Price per tCO₂</span>
            </div>
            <span className="text-xl font-bold text-green-600">${listing.pricePerToken}</span>
          </div>

          <div className="pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-600">Total Cost</span>
              <span className="text-2xl font-bold text-gray-900">
                ${totalPrice.toLocaleString()}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => onBuyNow(listing)}
                disabled={!isConnected}
                className={`py-2 px-4 rounded-lg font-medium transition-colors ${
                  isConnected
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Buy Now
              </button>
              <button
                onClick={() => onMakeOffer(listing)}
                disabled={!isConnected}
                className={`py-2 px-4 rounded-lg font-medium transition-colors border ${
                  isConnected
                    ? 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    : 'border-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                Make Offer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingCard;