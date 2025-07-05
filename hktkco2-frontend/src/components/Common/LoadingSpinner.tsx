import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'green' | 'blue' | 'gray' | 'white';
  fullScreen?: boolean;
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'green',
  fullScreen = false,
  message,
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-3',
    xl: 'h-16 w-16 border-4',
  };

  const colorClasses = {
    green: 'border-green-500',
    blue: 'border-blue-500',
    gray: 'border-gray-500',
    white: 'border-white',
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div
        className={`animate-spin rounded-full border-t-transparent ${sizeClasses[size]} ${colorClasses[color]}`}
        style={{ borderTopColor: 'transparent' }}
      />
      {message && (
        <p className={`text-sm font-medium ${color === 'white' ? 'text-white' : 'text-gray-600'}`}>
          {message}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner;