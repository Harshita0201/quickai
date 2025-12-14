import React from 'react';
import { NavLink } from 'react-router-dom';
import { useUser, useClerk, Protect } from '@clerk/clerk-react';
import {
  House,
  SquarePen,
  Hash,
  Image,
  Eraser,
  Scissors,
  FileText,
  Users,
  LogOut,
} from 'lucide-react';

const navItems = [
  { to: '/ai', label: 'Dashboard', Icon: House },
  { to: '/ai/write-article', label: 'Write Article', Icon: SquarePen },
  { to: '/ai/blog-titles', label: 'Blog Titles', Icon: Hash },
  { to: '/ai/generate-images', label: 'Generate Images', Icon: Image },
  { to: '/ai/remove-background', label: 'Remove Background', Icon: Eraser },
  { to: '/ai/remove-object', label: 'Remove Object', Icon: Scissors },
  { to: '/ai/review-resume', label: 'Review Resume', Icon: FileText },
  { to: '/ai/community', label: 'Community', Icon: Users },
];

const SideBar = ({ sideBar, setSideBar, className = '' }) => {
  const { user } = useUser();
  const { signOut, openUserProfile } = useClerk();

  return (
    <>
      {/* Backdrop for mobile when sidebar is open (only visible on mobile) */}
      {sideBar && (
        <div
          className="sm:hidden fixed inset-0 bg-black/40 z-40"
          onClick={() => setSideBar(false)}
        />
      )}

      <aside
        className={`
          w-60 bg-white border-r border-gray-200 flex flex-col justify-between
          transform transition-transform duration-300 ease-in-out z-50
          fixed sm:static
          top-16 bottom-0 left-0
          ${sideBar ? 'translate-x-0' : '-translate-x-full'}
          sm:translate-x-0
          ${className}
        `}
        aria-hidden={!sideBar}
      >
        <div className="h-full flex flex-col justify-between overflow-hidden">
          <div className="px-4 py-6 overflow-auto">
            <img
              src={user?.imageUrl}
              alt="User Avatar"
              className="w-12 h-12 rounded-full mx-auto object-cover"
            />
            <h1 className="mt-2 text-center text-sm font-medium">{user?.fullName}</h1>

            <nav className="mt-5 text-sm text-gray-700 font-medium space-y-1">
              {navItems.map(({ to, label, Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/ai'}
                  onClick={() => setSideBar(false)}
                  className={({ isActive }) =>
                    `block px-3.5 py-2.5 rounded flex items-center gap-3 ${
                      isActive
                        ? 'bg-gradient-to-r from-[#3C81F6] to-[#9234ea] text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="w-full border-t border-gray-200 p-4 px-6 flex items-center justify-between flex-shrink-0 bg-white">
            <div
              onClick={() => openUserProfile()}
              className="flex gap-3 items-center cursor-pointer"
            >
              <img
                src={user?.imageUrl}
                className="w-8 h-8 rounded-full object-cover"
                alt="profile"
              />
              <div>
                <h1 className="text-sm font-medium">{user?.fullName}</h1>
                <p className="text-xs text-gray-500">
                  <Protect plan="premium" fallback="Free">
                    Premium
                  </Protect>{' '}
                  Plan
                </p>
              </div>
            </div>

            <button
              onClick={() => signOut()}
              className="p-1 rounded hover:bg-gray-100 m-0"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="w-5 h-5 text-gray-400 hover:text-gray-700" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default SideBar;
