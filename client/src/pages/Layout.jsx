import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { assets } from '../assets/assets';
import { Menu, X } from 'lucide-react';
import SideBar from '../components/SideBar';
import { SignIn, useUser } from '@clerk/clerk-react';

const Layout = () => {
  const navigate = useNavigate();
  const [sidebar, setSidebar] = React.useState(false);
  const { user } = useUser();

  return user ? (
    <div className="flex flex-col h-screen">
      {/* Header (fixed height) */}
      <nav className="w-full h-16 flex items-center justify-between px-8 border-b border-gray-200 flex-shrink-0">
        <img
          className="cursor-pointer w-32 sm:w-44"
          src={assets.logo}
          alt="logo"
          onClick={() => navigate('/')}
        />

        {/* Hamburger / close for mobile */}
        <div className="sm:hidden">
          {sidebar ? (
            <X
              onClick={() => setSidebar(false)}
              className="w-6 h-6 text-gray-600 cursor-pointer"
            />
          ) : (
            <Menu
              onClick={() => setSidebar(true)}
              className="w-6 h-6 text-gray-600 cursor-pointer"
            />
          )}
        </div>
      </nav>

      {/* Central area: desktop sidebar (in-flow) + main (only main scrolls) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop sidebar (part of the layout flow) */}
        <div className="hidden sm:block h-full">
          {/* pass sideBar true for desktop so it stays visible */}
          <SideBar sideBar={true} setSideBar={() => {}} className="h-full" />
        </div>

        {/* Main content — ONLY this scrolls */}
        <main className="flex-1 min-h-0 overflow-auto bg-[#F4F7FB]">
          <Outlet />
        </main>
      </div>

      {/* Mobile sidebar rendered outside the central flex so it doesn't reserve space */}
      <div className="sm:hidden">
        <SideBar sideBar={sidebar} setSideBar={setSidebar} />
      </div>
    </div>
  ) : (
    <div className="flex items-center justify-center h-screen">
      <SignIn />
    </div>
  );
};

export default Layout;


