import React from 'react';
import { CheckCircle, XCircle, TrendingUp, TrendingDown, Target, Award } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface ImpactSummaryProps {
  totalEmissions: number;
  totalOffsets: number;
  netImpact: number;
  carbonNeutral: boolean;
  targetYear?: number;
  targetEmissions?: number;
}

const ImpactSummary: React.FC<ImpactSummaryProps> = ({
  totalEmissions,
  totalOffsets,
  netImpact,
  carbonNeutral,
  targetYear = 2030,
  targetEmissions = 0,
}) => {
  const impactPercentage = totalEmissions > 0 ? (totalOffsets / totalEmissions) * 100 : 0;
  const surplusCredits = Math.abs(Math.min(0, netImpact));
  
  const pieData = [
    { name: 'Emissions', value: totalEmissions, color: '#ef4444' },
    { name: 'Offsets', value: totalOffsets, color: '#10b981' },
  ];

  const progressToTarget = totalEmissions > 0 
    ? ((totalEmissions - targetEmissions) / totalEmissions) * 100 
    : 0;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium">{payload[0].name}</p>
          <p className="text-sm text-gray-600">
            {payload[0].value.toLocaleString()} tCO₂
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Carbon Neutral Status Card */}
      <div className={`rounded-xl p-6 border-2 ${
        carbonNeutral 
          ? 'bg-green-50 border-green-300' 
          : 'bg-red-50 border-red-300'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Carbon Neutral Status
            </h3>
            <div className="flex items-center space-x-3">
              {carbonNeutral ? (
                <>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold text-green-600">Achieved!</p>
                    <p className="text-sm text-green-700">
                      {surplusCredits > 0 && `${surplusCredits} tCO₂ surplus credits`}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="h-8 w-8 text-red-600" />
                  <div>
                    <p className="text-2xl font-bold text-red-600">Not Yet</p>
                    <p className="text-sm text-red-700">
                      {Math.abs(netImpact)} tCO₂ more offsets needed
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
          {carbonNeutral && (
            <Award className="h-16 w-16 text-green-600 opacity-20" />
          )}
        </div>
      </div>

      {/* Impact Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-gray-600">Total Emissions</h4>
            <TrendingUp className="h-5 w-5 text-red-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{totalEmissions.toLocaleString()}</p>
          <p className="text-sm text-gray-500 mt-1">tCO₂ emitted</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-gray-600">Total Offsets</h4>
            <TrendingDown className="h-5 w-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-green-600">{totalOffsets.toLocaleString()}</p>
          <p className="text-sm text-gray-500 mt-1">tCO₂ offset</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-gray-600">Net Impact</h4>
            {netImpact < 0 ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
          </div>
          <p className={`text-3xl font-bold ${netImpact < 0 ? 'text-green-600' : 'text-red-600'}`}>
            {netImpact > 0 ? '+' : ''}{netImpact.toLocaleString()}
          </p>
          <p className="text-sm text-gray-500 mt-1">tCO₂ net</p>
        </div>
      </div>

      {/* Impact Visualization */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            Emissions vs Offsets
          </h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ value, percent }) => `${value} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Progress to Target */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            Progress to {targetYear} Target
          </h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Current Emissions</span>
              <span className="font-semibold">{totalEmissions} tCO₂</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Target Emissions</span>
              <span className="font-semibold">{targetEmissions} tCO₂</span>
            </div>
            
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Reduction Progress</span>
                <span className="text-sm font-medium text-gray-900">
                  {progressToTarget.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full"
                  style={{ width: `${Math.min(100, progressToTarget)}%` }}
                />
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-gray-100">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Target className="h-4 w-4" />
                <span>
                  {totalEmissions - targetEmissions > 0 
                    ? `${(totalEmissions - targetEmissions).toLocaleString()} tCO₂ reduction needed`
                    : 'Target achieved!'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Impact Offset Percentage */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border border-gray-200">
        <div className="text-center">
          <h4 className="text-lg font-semibold text-gray-900 mb-2">
            Impact Offset Coverage
          </h4>
          <p className="text-5xl font-bold text-gray-900 mb-2">
            {impactPercentage.toFixed(1)}%
          </p>
          <p className="text-sm text-gray-600">
            of your emissions have been offset
          </p>
          {impactPercentage >= 100 && (
            <p className="text-sm text-green-600 font-medium mt-2">
              🎉 Congratulations on achieving carbon neutrality!
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImpactSummary;