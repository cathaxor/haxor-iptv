import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { HiOutlineClock, HiOutlineTrash, HiPlay } from 'react-icons/hi2';

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const { data } = await api.get('/history');
      setHistory(data);
    } catch {
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = async () => {
    if (!window.confirm('Are you sure you want to clear your watch history?')) return;
    try {
      await api.delete('/history');
      setHistory([]);
      toast.success('History cleared');
    } catch {
      toast.error('Failed to clear history');
    }
  };

  const playChannel = async (channel) => {
    try {
      await api.post('/history', { channel_id: channel.channel_id });
      navigate('/live', { state: { channel } });
    } catch {
      // silent
    }
  };

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) return <div className="p-8 text-center text-surface-400">Loading history...</div>;

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold gradient-text">Watch History</h1>
          <p className="text-surface-400 mt-2">Recently watched channels</p>
        </div>
        {history.length > 0 && (
          <button onClick={clearHistory} className="btn-danger flex items-center gap-2 px-4 py-2 text-sm">
            <HiOutlineTrash className="w-4 h-4" /> Clear History
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <HiOutlineClock className="w-16 h-16 text-surface-600 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-white mb-2">No history</h3>
          <p className="text-surface-400">Channels you watch will appear here</p>
          <button onClick={() => navigate('/live')} className="btn-primary mt-6">
            Browse Channels
          </button>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="divide-y divide-surface-800/30">
            {history.map((item) => (
              <div key={item.id} className="flex flex-col sm:flex-row items-center gap-4 p-4 hover:bg-surface-800/50 transition-colors cursor-pointer group" onClick={() => playChannel(item)}>
                <div className="w-16 h-16 bg-surface-900 rounded-xl flex items-center justify-center p-2 shrink-0 relative overflow-hidden">
                  {item.logo_url ? (
                    <img src={item.logo_url} alt="" className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-2xl">📺</span>
                  )}
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <HiPlay className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0 text-center sm:text-left">
                  <h3 className="text-lg font-medium text-white truncate">{item.name}</h3>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-1">
                    {item.category_name && <span className="text-xs text-surface-400">{item.category_name}</span>}
                    {item.quality && <span className="badge badge-quality">{item.quality}</span>}
                  </div>
                </div>
                <div className="text-surface-500 text-sm whitespace-nowrap">
                  {formatDate(item.watched_at)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
