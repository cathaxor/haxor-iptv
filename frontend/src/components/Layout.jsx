import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HiOutlineTv, HiOutlineHeart, HiOutlineClock, HiOutlineMagnifyingGlass, HiOutlineCog6Tooth, HiOutlineShieldCheck, HiOutlineArrowRightOnRectangle } from 'react-icons/hi2';
import { useState } from 'react';
import { HiBars3, HiXMark } from 'react-icons/hi2';

const navItems = [
  { to: '/live', label: 'Live TV', icon: HiOutlineTv },
  { to: '/favorites', label: 'Favorites', icon: HiOutlineHeart },
  { to: '/history', label: 'History', icon: HiOutlineClock },
  { to: '/search', label: 'Search', icon: HiOutlineMagnifyingGlass },
  { to: '/settings', label: 'Settings', icon: HiOutlineCog6Tooth },
];

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface-950 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-[260px] bg-surface-900/50 border-r border-surface-800/50 backdrop-blur-xl">
        <div className="p-6 border-b border-surface-800/50">
          <h1 className="text-2xl font-display font-bold gradient-text">Haxor IPTV</h1>
          <p className="text-xs text-surface-500 mt-1">Premium Streaming</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{label}</span>
            </NavLink>
          ))}

          {isAdmin && (
            <>
              <div className="my-4 border-t border-surface-800/50" />
              <NavLink to="/admin" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <HiOutlineShieldCheck className="w-5 h-5" />
                <span className="font-medium">Admin Panel</span>
              </NavLink>
            </>
          )}
        </nav>

        <div className="p-4 border-t border-surface-800/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-cyan flex items-center justify-center text-white font-bold text-sm">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.username}</p>
              <p className="text-xs text-surface-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-surface-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all duration-300"
          >
            <HiOutlineArrowRightOnRectangle className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 glass border-b border-surface-800/50">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-lg font-display font-bold gradient-text">Haxor IPTV</h1>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 text-surface-400 hover:text-white">
            {mobileOpen ? <HiXMark className="w-6 h-6" /> : <HiBars3 className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="absolute top-14 left-0 right-0 glass border-b border-surface-800/50 p-4 animate-slide-down">
            <nav className="space-y-1">
              {navItems.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{label}</span>
                </NavLink>
              ))}
              {isAdmin && (
                <NavLink to="/admin" onClick={() => setMobileOpen(false)} className="sidebar-link">
                  <HiOutlineShieldCheck className="w-5 h-5" />
                  <span>Admin Panel</span>
                </NavLink>
              )}
              <button onClick={() => { logout(); setMobileOpen(false); }}
                className="sidebar-link w-full text-red-400 hover:bg-red-500/10">
                <HiOutlineArrowRightOnRectangle className="w-5 h-5" />
                <span>Sign Out</span>
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 lg:ml-0 mt-14 lg:mt-0 overflow-y-auto">
        <Outlet />
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 glass border-t border-surface-800/50 z-30">
        <div className="flex items-center justify-around py-2">
          {navItems.slice(0, 4).map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-300 ${
                  isActive ? 'text-primary-400' : 'text-surface-500'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
