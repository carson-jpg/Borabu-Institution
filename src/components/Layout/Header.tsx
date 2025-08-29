import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, User, Bell, Menu, X } from 'lucide-react';

interface HeaderProps {
  isSidebarOpen: boolean;
  onSidebarToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({ isSidebarOpen, onSidebarToggle }) => {
  const { user, logout } = useAuth();

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'teacher': return 'bg-green-100 text-green-800';
      case 'student': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            {/* Mobile menu button */}
            <button
              onClick={onSidebarToggle}
              className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 mr-2"
            >
              {isSidebarOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
            
            <div className="flex-shrink-0 flex items-center">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">B</span>
              </div>
              <div className="ml-3">
                <h1 className="text-lg font-semibold text-gray-900">Borabu Technical Training Institute</h1>
                <p className="text-sm text-gray-500">Student Portal</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button className="p-2 text-gray-400 hover:text-gray-500 relative">
              <Bell className="h-6 w-6" />
              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400"></span>
            </button>
            
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-gray-600" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900">{user?.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getRoleColor(user?.role || '')}`}>
                    {user?.role?.toUpperCase()}
                  </span>
                </div>
              </div>
              
              <button
                onClick={logout}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;