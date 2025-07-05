import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ShoppingCart, Flame, FileText, BarChart3, Settings } from 'lucide-react';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ElementType;
  description: string;
}

const Navigation: React.FC = () => {
  const location = useLocation();

  const navigationItems: NavigationItem[] = [
    {
      name: 'Dashboard',
      href: '/',
      icon: Home,
      description: 'Portfolio overview and analytics',
    },
    {
      name: 'Marketplace',
      href: '/marketplace',
      icon: ShoppingCart,
      description: 'Buy and sell carbon credits',
    },
    {
      name: 'Retire Credits',
      href: '/retire',
      icon: Flame,
      description: 'Permanently retire credits',
    },
    {
      name: 'ESG Reporting',
      href: '/esg-reporting',
      icon: FileText,
      description: 'Generate impact reports',
    },
    {
      name: 'Analytics',
      href: '/analytics',
      icon: BarChart3,
      description: 'Market insights and trends',
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
      description: 'Account and preferences',
    },
  ];

  return (
    <nav className="bg-white shadow-sm border-r border-gray-200 w-64 min-h-screen">
      <div className="p-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Navigation
        </h2>
        <ul className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            
            return (
              <li key={item.name}>
                <Link
                  to={item.href}
                  className={`group flex items-start space-x-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-green-50 text-green-700'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className={`h-5 w-5 mt-0.5 ${
                    isActive ? 'text-green-600' : 'text-gray-400 group-hover:text-gray-600'
                  }`} />
                  <div className="flex-1">
                    <p className={`font-medium ${
                      isActive ? 'text-green-900' : 'text-gray-900'
                    }`}>
                      {item.name}
                    </p>
                    <p className={`text-xs ${
                      isActive ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {item.description}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="p-4 border-t border-gray-200">
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">
            Need Help?
          </h3>
          <p className="text-xs text-gray-600 mb-3">
            Check our documentation or contact support
          </p>
          <button className="w-full bg-white text-gray-700 px-3 py-1.5 rounded text-sm font-medium hover:bg-gray-50 transition-colors">
            View Docs
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;