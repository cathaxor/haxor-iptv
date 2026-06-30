import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  HiOutlineChartBarSquare, HiOutlineMusicalNote, HiOutlineTv,
  HiOutlineRectangleGroup, HiOutlineUsers, HiOutlineCog6Tooth,
  HiOutlineNewspaper, HiOutlineDocumentText, HiOutlineArrowLeft,
} from 'react-icons/hi2';

const adminNav = [
  { to: '/admin', label: 'Dashboard', icon: HiOutlineChartBarSquare, end: true },
  { to: '/admin/playlists', label: 'Playlists', icon: HiOutlineMusicalNote },
  { to: '/admin/channels', label: 'Channels', icon: HiOutlineTv },
  { to: '/admin/categories', label: 'Categories', icon: HiOutlineRectangleGroup },
  { to: '/admin/epg', label: 'EPG Guide', icon: HiOutlineNewspaper },
  { to: '/admin/users', label: 'Users', icon: HiOutlineUsers },
  { to: '/admin/settings', label: 'Settings', icon: HiOutlineCog6Tooth },
  { to: '/admin/logs', label: 'Logs', icon: HiOutlineDocumentText },
];

export default function AdminLayout() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-surface-950 flex">
      <aside className="hidden lg:flex flex-col w-[260px] bg-surface-900/50 border-r border-surface-800/50 backdrop-blur-xl">
        <div className="p-6 border-b border-surface-800/50">
          <h1 className="text-xl font-display font-bold gradient-text">Admin Panel</h1>
          <p className="text-xs text-surface-500 mt-1">Haxor IPTV Management</p>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {adminNav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-surface-800/50">
          <button
            onClick={() => navigate('/live')}
            className="sidebar-link w-full text-primary-400 hover:bg-primary-500/10"
          >
            <HiOutlineArrowLeft className="w-5 h-5" />
            <span>Back to App</span>
          </button>
        </div>
      </aside>

      {/* Mobile Admin Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 glass border-b border-surface-800/50">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate('/live')} className="p-1 text-surface-400 hover:text-white">
            <HiOutlineArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-display font-bold gradient-text">Admin Panel</h1>
        </div>
        <div className="flex overflow-x-auto no-scrollbar px-2 pb-2 gap-1">
          {adminNav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap text-xs font-medium transition-all ${
                  isActive ? 'bg-primary-600/20 text-primary-400' : 'text-surface-400 hover:text-white'
                }`
              }
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </NavLink>
          ))}
        </div>
      </div>

      <main className="flex-1 mt-24 lg:mt-0 overflow-y-auto">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
