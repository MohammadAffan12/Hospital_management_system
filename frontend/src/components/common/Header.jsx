import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MenuIcon, BellIcon, SearchIcon, UserGroupIcon, CalendarIcon } from '../../icons';

const Header = ({ openSidebar, user = {} }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  // Mock notifications data
  const notifications = [
    { id: 1, type: 'appointment', message: 'New appointment scheduled', time: '10 minutes ago' },
    { id: 2, type: 'patient', message: 'Patient John Doe checked in', time: '25 minutes ago' },
    { id: 3, type: 'system', message: 'System maintenance scheduled', time: '1 hour ago' },
  ];

  // Function to toggle notifications panel
  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    if (showUserMenu) setShowUserMenu(false);
  };

  // Function to toggle user menu
  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
    if (showNotifications) setShowNotifications(false);
  };

  return (
    <header className="sticky top-0 z-30 flex-shrink-0 flex h-16 bg-white shadow-sm border-b border-gray-200">
      <button
        type="button"
        className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 lg:hidden"
        onClick={openSidebar}
      >
        <span className="sr-only">Open sidebar</span>
        <MenuIcon className="h-6 w-6" />
      </button>
      
      <div className="flex-1 px-4 flex justify-between">
        <div className="flex-1 flex items-center">
          {/* Mobile logo */}
          <div className="lg:hidden">
            <h1 className="text-xl font-bold text-blue-600">HMS</h1>
          </div>
          
          {/* Search bar */}
          <div className="max-w-lg w-full lg:max-w-xs ml-auto lg:ml-0">
            <label htmlFor="search" className="sr-only">Search</label>
            <div className="relative text-gray-400 focus-within:text-gray-600">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon className="h-5 w-5" aria-hidden="true" />
              </div>
              <input
                id="search"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Search patients, doctors..."
                type="search"
              />
            </div>
          </div>
        </div>
        
        <div className="ml-4 flex items-center md:ml-6">
          {/* Quick action buttons */}
          <div className="hidden md:flex space-x-2 mr-3">
            <Link
              to="/patients/add"
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <UserGroupIcon className="h-4 w-4 mr-1.5 text-gray-500" />
              Add Patient
            </Link>
            <Link
              to="/appointments/add"
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <CalendarIcon className="h-4 w-4 mr-1.5 text-gray-500" />
              New Appointment
            </Link>
          </div>

          {/* Notification dropdown */}
          <div className="relative">
            <button
              type="button"
              className="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={toggleNotifications}
            >
              <span className="sr-only">View notifications</span>
              <div className="relative">
                <BellIcon className="h-6 w-6" />
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full ring-2 ring-white bg-red-500"></span>
              </div>
            </button>
            
            {/* Notifications panel */}
            {showNotifications && (
              <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none divide-y divide-gray-100">
                <div className="px-4 py-3">
                  <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.map((notification) => (
                    <div key={notification.id} className="px-4 py-3 hover:bg-gray-50">
                      <div className="flex items-start">
                        <div className="ml-3 w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900">{notification.message}</p>
                          <p className="mt-1 text-xs text-gray-500">{notification.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-3 text-center">
                  <button className="text-sm font-medium text-blue-600 hover:text-blue-500">
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Profile dropdown */}
          <div className="ml-3 relative">
            <div>
              <button
                type="button"
                className="max-w-xs flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={toggleUserMenu}
              >
                <span className="sr-only">Open user menu</span>
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold uppercase">
                  {user?.name?.charAt(0) || 'A'}
                </div>
                <div className="hidden md:block ml-2">
                  <div className="text-sm font-medium text-gray-700">
                    {user?.name || 'Admin User'}
                  </div>
                  <div className="text-xs font-medium text-gray-500">
                    {user?.role || 'Administrator'}
                  </div>
                </div>
              </button>
            </div>
            
            {/* User menu dropdown */}
            {showUserMenu && (
              <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none divide-y divide-gray-100">
                <div className="px-4 py-3">
                  <p className="text-sm">Signed in as</p>
                  <p className="text-sm font-medium text-gray-900 truncate">{user?.email || 'admin@hospital.com'}</p>
                </div>
                <div className="py-1">
                  <a href="#profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Your Profile</a>
                  <a href="#settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Settings</a>
                </div>
                <div className="py-1">
                  <a href="#logout" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Sign out</a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
