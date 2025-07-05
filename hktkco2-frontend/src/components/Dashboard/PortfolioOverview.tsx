import React from 'react';
import { TrendingUp, TrendingDown, Wallet, Leaf } from 'lucide-react';

interface PortfolioOverviewProps {
  totalCredits: number;
  totalRetired: number;
  portfolioValue: number;
  carbonOffset: number;
  loading: boolean;
  priceChange24h?: number;
}

const PortfolioOverview: React.FC<PortfolioOverviewProps> = ({
  totalCredits,
  totalRetired,
  portfolioValue,
  carbonOffset,
  loading,
  priceChange24h = 0,
}) => {
  const stats = [
    {
      title: 'Total Carbon Credits',
      value: loading ? '...' : `${totalCredits.toFixed(1)} CCT`,
      subValue: '$0.00',
      icon: Wallet,
      color: 'green',
      change: priceChange24h,
    },
    {
      title: 'USD Value',
      value: loading ? '...' : `$${portfolioValue.toLocaleString()}`,
      subValue: `${totalCredits.toFixed(1)} CCT`,
      icon: TrendingUp,
      color: 'blue',
    },
    {
      title: 'CO2 Offset',
      value: loading ? '...' : `${carbonOffset.toFixed(1)} tonnes`,
      subValue: 'Lifetime impact',
      icon: Leaf,
      color: 'emerald',
    },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Portfolio Overview</h2>
        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          View Details →
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <Icon className={`h-5 w-5 text-${stat.color}-500`} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{stat.subValue}</p>
                {stat.change !== undefined && (
                  <div className={`flex items-center space-x-1 text-sm ${
                    stat.change >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.change >= 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    <span>{Math.abs(stat.change).toFixed(2)}%</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-6 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Real-time pricing via</p>
            <p className="text-sm font-medium text-blue-600">Chainlink Oracles</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Last updated</p>
            <p className="text-sm font-medium text-gray-900">2 minutes ago</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioOverview;