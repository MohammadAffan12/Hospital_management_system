import React from 'react';
import { Link, useLocation } from 'react-router-dom';

// Import icons
import { 
  HomeIcon, UserGroupIcon, UserMdIcon, CalendarIcon, 
  BedIcon, FileTextIcon, ChartBarIcon, XMarkIcon
} from '../../icons';

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Patients', href: '/patients', icon: UserGroupIcon },
  { name: 'Doctors', href: '/doctors', icon: UserMdIcon },
  { name: 'Appointments', href: '/appointments', icon: CalendarIcon },
  { name: 'Wards', href: '/wards', icon: BedIcon },
  { name: 'Medical Records', href: '/medical-records', icon: FileTextIcon },
  { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
];

const Sidebar = ({ open, setOpen }) => {
  const location = useLocation();
  
  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <>
      {/* Mobile sidebar */}
      <div className={`lg:hidden fixed inset-0 flex z-40 ${open ? 'visible' : 'invisible'}`}>
        {/* Overlay */}
        <div 
          className={`fixed inset-0 bg-gray-600 transition-opacity ease-linear duration-300 ${open ? 'opacity-75' : 'opacity-0'}`} 
          onClick={() => setOpen(false)}
        />
        
        {/* Sidebar */}
        <div className={`relative flex-1 flex flex-col max-w-xs w-full bg-white transition ease-in-out duration-300 transform ${open ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setOpen(false)}
            >
              <XMarkIcon className="h-6 w-6 text-white" />
            </button>
          </div>
          
          <SidebarContent isActive={isActive} />
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1 border-r border-gray-200 bg-white">
            <SidebarContent isActive={isActive} />
          </div>
        </div>
      </div>
    </>
  );
};

const SidebarContent = ({ isActive }) => {
  return (
    <>
      <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4">
          <h1 className="text-2xl font-bold text-blue-600">HMS</h1>
          <span className="ml-2 text-sm text-gray-500">Hospital Management</span>
        </div>
        <nav className="mt-5 flex-1 px-2 bg-white space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                isActive(item.href)
                  ? 'bg-blue-100 text-blue-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <item.icon
                className={`mr-3 h-5 w-5 ${
                  isActive(item.href) ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                }`}
              />
              {item.name}
            </Link>
          ))}
        </nav>
      </div>
      <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
        <div className="flex-shrink-0 w-full group block">
          <div className="flex items-center">
            <div>
              <p className="text-sm font-medium text-gray-700">
                Hospital Management System v1.0
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
