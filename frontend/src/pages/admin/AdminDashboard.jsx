import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { HiOutlineUsers, HiOutlineTv, HiOutlineMusicalNote, HiOutlineRectangleGroup, HiOutlineArrowTrendingUp } from 'react-icons/hi2';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const { data } = await api.get('/dashboard/stats');
        setStats(data);
        setRecentLogs(data.recentActivity || []);
      } catch (err) {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return <div className="text-surface-400">Loading dashboard...</div>;

  const statCards = [
    { label: 'Total Channels', value: stats?.channels?.total || 0, active: stats?.channels?.active || 0, icon: HiOutlineTv, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    { label: 'Active Playlists', value: stats?.playlists?.total || 0, active: stats?.playlists?.active || 0, icon: HiOutlineMusicalNote, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Categories', value: stats?.categories?.total || 0, icon: HiOutlineRectangleGroup, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Registered Users', value: stats?.users?.total || 0, active: stats?.users?.active || 0, icon: HiOutlineUsers, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  ];

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Dashboard Overview</h1>
        <p className="text-surface-400 text-sm">System statistics and recent activity</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <div key={i} className="glass-card p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-surface-400 text-sm font-medium">{stat.label}</p>
                <h3 className="text-3xl font-bold text-white mt-1">{stat.value}</h3>
                {stat.active !== undefined && (
                  <p className="text-xs text-surface-500 mt-1">
                    <span className="text-emerald-400">{stat.active}</span> active
                  </p>
                )}
              </div>
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <HiOutlineArrowTrendingUp className="w-5 h-5 text-primary-400" />
            Top Categories
          </h3>
          <div className="space-y-3">
            {stats?.topCategories?.map((cat, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-surface-900/50">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{cat.icon}</span>
                  <span className="text-white font-medium">{cat.name}</span>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-surface-800 text-xs text-surface-300 font-medium">
                  {cat.channel_count} channels
                </span>
              </div>
            ))}
            {!stats?.topCategories?.length && <p className="text-surface-500 text-sm">No category data</p>}
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {recentLogs.map((log) => (
              <div key={log.id} className="flex gap-4">
                <div className="w-2 h-2 mt-2 rounded-full bg-primary-500 shrink-0" />
                <div>
                  <p className="text-sm text-white">
                    <span className="font-medium">{log.username || 'System'}</span> {log.action.replace(/_/g, ' ')}
                  </p>
                  <p className="text-xs text-surface-500 mt-0.5">
                    {new Date(log.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
            {!recentLogs.length && <p className="text-surface-500 text-sm">No recent activity</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
