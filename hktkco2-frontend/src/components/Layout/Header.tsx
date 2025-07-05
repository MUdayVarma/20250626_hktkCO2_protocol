import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Leaf } from 'lucide-react';

const Header: React.FC = () => {
  const location = useLocation();
  const [userType, setUserType] = useState<'Individual' | 'Corporate'>('Corporate');

  const navigation = [
    { name: 'Dashboard', href: '/', icon: '📊' },
    { name: 'Marketplace', href: '/marketplace', icon: '🛒' },
    { name: 'Retire Credits', href: '/retire', icon: '🔥' },
    { name: 'ESG Reporting', href: '/esg-reporting', icon: '📋' },
  ];

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <Leaf className="h-8 w-8 text-green-500" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">HBCO2</h1>
              <p className="text-xs text-gray-500">Carbon Credit Platform</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-green-100 text-green-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User Type Selector & Connect Button */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setUserType('Individual')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  userType === 'Individual'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Individual
              </button>
              <button
                onClick={() => setUserType('Corporate')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  userType === 'Corporate'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Corporate
              </button>
            </div>
            <ConnectButton />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;