import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/common/Sidebar';
import Header from '../components/common/Header';

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Mock user data since we're removing authentication
  const currentUser = {
    name: 'Hospital Staff',
    email: 'staff@hospital.com'
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      
      <div className="lg:pl-64 flex flex-col flex-1">
        <Header openSidebar={() => setSidebarOpen(true)} user={currentUser} />
        
        <main className="flex-1 pb-8">
          <div className="mt-8 px-4 sm:px-6 lg:px-8">
            {/* Main content rendered by nested routes */}
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
