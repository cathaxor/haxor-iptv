import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { HiOutlineMagnifyingGlass, HiPlay, HiOutlineFunnel } from 'react-icons/hi2';
import useDebounce from '../hooks/useDebounce';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 500);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q');
    if (q) setQuery(q);
  }, [location]);

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setResults([]);
      return;
    }

    const search = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/channels/search?q=${encodeURIComponent(debouncedQuery)}`);
        setResults(data.channels || []);
      } catch {
        toast.error('Search failed');
      } finally {
        setLoading(false);
      }
    };
    search();
  }, [debouncedQuery]);

  const handleSearchChange = (e) => {
    setQuery(e.target.value);
    navigate(`?q=${encodeURIComponent(e.target.value)}`, { replace: true });
  };

  const playChannel = async (channel) => {
    try {
      await api.post('/history', { channel_id: channel.id });
      navigate('/live', { state: { channel } });
    } catch {
      // silent
    }
  };

  return (
    <div className="p-6 lg:p-8 h-full flex flex-col">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold gradient-text">Search</h1>
        <p className="text-surface-400 mt-2">Find your favorite channels</p>
      </div>

      <div className="relative mb-8">
        <HiOutlineMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-surface-500" />
        <input
          type="text"
          value={query}
          onChange={handleSearchChange}
          placeholder="Type at least 2 characters to search..."
          className="w-full bg-surface-900/50 border border-surface-700/50 rounded-2xl py-4 pl-14 pr-4 text-white placeholder-surface-500 focus:outline-none focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 text-lg shadow-lg"
          autoFocus
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="text-center py-12 text-surface-400">Searching...</div>
        ) : debouncedQuery.length > 0 && debouncedQuery.length < 2 ? (
          <div className="text-center py-12 text-surface-400">Please enter at least 2 characters</div>
        ) : results.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {results.map((ch) => (
              <div
                key={ch.id}
                onClick={() => playChannel(ch)}
                className="glass-card flex items-center gap-4 p-4 cursor-pointer group hover:bg-surface-800/50 transition-all"
              >
                <div className="w-14 h-14 bg-surface-900 rounded-xl p-2 shrink-0 flex items-center justify-center">
                  {ch.logo_url ? (
                    <img src={ch.logo_url} alt="" className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-xl">📺</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-medium truncate group-hover:text-primary-400 transition-colors">{ch.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {ch.category_name && <span className="text-xs text-surface-500 truncate">{ch.category_name}</span>}
                    {ch.quality && <span className="badge badge-quality">{ch.quality}</span>}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-primary-500/10 flex items-center justify-center text-primary-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  <HiPlay className="w-5 h-5 ml-1" />
                </div>
              </div>
            ))}
          </div>
        ) : debouncedQuery.length >= 2 ? (
          <div className="text-center py-12 glass-card">
            <HiOutlineMagnifyingGlass className="w-12 h-12 text-surface-600 mx-auto mb-3" />
            <p className="text-surface-400 text-lg">No channels found for "{debouncedQuery}"</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
