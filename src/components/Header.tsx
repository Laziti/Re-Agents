import React from 'react';
import { Link } from 'react-router-dom';

interface HeaderProps {
  showMenuToggle?: boolean;
  onMenuToggle?: () => void;
  title?: string;
  className?: string;
}

const Header: React.FC<HeaderProps> = ({ 
  showMenuToggle = false,
  onMenuToggle,
  title,
  className = ""
}) => {
  return (
    <header className={`bg-white shadow-sm border-b border-gray-200 ${className}`}>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side */}
          <div className="flex items-center">
            {showMenuToggle && (
              <button
                onClick={onMenuToggle}
                className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}
            
            <Link to="/" className="flex items-center">
              <div className="text-xl font-bold text-gray-900 ml-2">
                {title || "Your App"}
              </div>
            </Link>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* User menu or navigation items will go here */}
            <div className="text-gray-600">
              {/* Placeholder for user menu */}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;