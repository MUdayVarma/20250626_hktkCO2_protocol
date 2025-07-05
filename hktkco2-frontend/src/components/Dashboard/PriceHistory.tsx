import React, { useState } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, Calendar, DollarSign } from 'lucide-react';

interface PriceHistoryProps {
  data?: any[];
}

const PriceHistory: React.FC<PriceHistoryProps> = ({ data }) => {
  const [timeRange, setTimeRange] = useState<'1D' | '1W' | '1M' | '3M' | '1Y'>('1M');
  const [chartType, setChartType] = useState<'line' | 'area'>('area');

  // Mock data for different time ranges
  const mockData = {
    '1D': [
      { time: '00:00', price: 24.5, volume: 120 },
      { time: '04:00', price: 24.8, volume: 150 },
      { time: '08:00', price: 25.1, volume: 200 },
      { time: '12:00', price: 25.3, volume: 180 },
      { time: '16:00', price: 25.0, volume: 160 },
      { time: '20:00', price: 25.2, volume: 140 },
    ],
    '1W': [
      { time: 'Mon', price: 24.5, volume: 1200 },
      { time: 'Tue', price: 24.8, volume: 1350 },
      { time: 'Wed', price: 25.2, volume: 1400 },
      { time: 'Thu', price: 24.9, volume: 1300 },
      { time: 'Fri', price: 25.5, volume: 1500 },
      { time: 'Sat', price: 25.3, volume: 1100 },
      { time: 'Sun', price: 25.0, volume: 1000 },
    ],
    '1M': [
      { time: 'Week 1', price: 23.5, volume: 8000 },
      { time: 'Week 2', price: 24.2, volume: 8500 },
      { time: 'Week 3', price: 24.8, volume: 9000 },
      { time: 'Week 4', price: 25.0, volume: 9200 },
    ],
    '3M': [
      { time: 'Jan', price: 22.0, volume: 25000 },
      { time: 'Feb', price: 23.5, volume: 28000 },
      { time: 'Mar', price: 25.0, volume: 30000 },
    ],
    '1Y': [
      { time: 'Q1', price: 20.0, volume: 80000 },
      { time: 'Q2', price: 22.0, volume: 90000 },
      { time: 'Q3', price: 24.0, volume: 95000 },
      { time: 'Q4', price: 25.0, volume: 100000 },
    ],
  };

  const currentData = data || mockData[timeRange];
  const currentPrice = currentData[currentData.length - 1]?.price || 25.0;
  const firstPrice = currentData[0]?.price || 23.0;
  const priceChange = ((currentPrice - firstPrice) / firstPrice) * 100;
  const totalVolume = currentData.reduce((sum, item) => sum + item.volume, 0);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900">{label}</p>
          <p className="text-sm text-green-600">
            Price: ${payload[0].value.toFixed(2)}
          </p>
          {payload[1] && (
            <p className="text-sm text-blue-600">
              Volume: {payload[1].value.toLocaleString()} tCO₂
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Carbon Credit Price History</h2>
          <div className="flex items-center space-x-4 mt-2">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-gray-500" />
              <span className="text-2xl font-bold text-gray-900">${currentPrice.toFixed(2)}</span>
              <span className={`text-sm font-medium ${priceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
              </span>
            </div>
            <div className="text-sm text-gray-500">
              Volume: {totalVolume.toLocaleString()} tCO₂
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setChartType('line')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                chartType === 'line' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
            >
              Line
            </button>
            <button
              onClick={() => setChartType('area')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                chartType === 'area' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
            >
              Area
            </button>
          </div>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="flex items-center space-x-2 mb-6">
        {(['1D', '1W', '1M', '3M', '1Y'] as const).map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              timeRange === range
                ? 'bg-green-100 text-green-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {range}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'area' ? (
            <AreaChart data={currentData}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="time" stroke="#6b7280" />
              <YAxis yAxisId="left" stroke="#6b7280" />
              <YAxis yAxisId="right" orientation="right" stroke="#6b7280" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="price"
                stroke="#10b981"
                fillOpacity={1}
                fill="url(#colorPrice)"
                name="Price (USD)"
              />
              <Area
                yAxisId="right"
                type="monotone"
                dataKey="volume"
                stroke="#3b82f6"
                fillOpacity={1}
                fill="url(#colorVolume)"
                name="Volume (tCO₂)"
              />
            </AreaChart>
          ) : (
            <LineChart data={currentData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="time" stroke="#6b7280" />
              <YAxis yAxisId="left" stroke="#6b7280" />
              <YAxis yAxisId="right" orientation="right" stroke="#6b7280" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="price"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: '#10b981', r: 4 }}
                name="Price (USD)"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="volume"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 4 }}
                name="Volume (tCO₂)"
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100">
        <div>
          <p className="text-sm text-gray-600">24h High</p>
          <p className="text-lg font-semibold text-gray-900">${(currentPrice * 1.02).toFixed(2)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">24h Low</p>
          <p className="text-lg font-semibold text-gray-900">${(currentPrice * 0.98).toFixed(2)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Market Cap</p>
          <p className="text-lg font-semibold text-gray-900">$2.5M</p>
        </div>
      </div>
    </div>
  );
};

export default PriceHistory;