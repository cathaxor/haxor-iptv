import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import VideoPlayer from '../components/VideoPlayer';
import toast from 'react-hot-toast';
import { HiOutlineHeart, HiHeart, HiOutlineSignal, HiOutlineFunnel } from 'react-icons/hi2';

export default function LivePage() {
  const [channels, setChannels] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [epgData, setEpgData] = useState([]);
  const [favorites, setFavorites] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadCategories();
    loadFavorites();
  }, []);

  useEffect(() => {
    loadChannels();
  }, [selectedCategory, page]);

  useEffect(() => {
    if (selectedChannel?.epg_id) loadEpg(selectedChannel.epg_id);
  }, [selectedChannel]);

  const loadCategories = async () => {
    try {
      const { data } = await api.get('/categories');
      setCategories(data);
    } catch { /* silent */ }
  };

  const loadChannels = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 100 };
      if (selectedCategory) params.category = selectedCategory;
      const { data } = await api.get('/channels', { params });
      setChannels(data.channels || []);
      setTotalPages(data.pagination?.pages || 1);
      if (!selectedChannel && data.channels?.length > 0) {
        setSelectedChannel(data.channels[0]);
      }
    } catch {
      toast.error('Failed to load channels');
    } finally {
      setLoading(false);
    }
  };

  const loadEpg = async (epgId) => {
    try {
      const { data } = await api.get('/epg/programs', { params: { channel_epg_id: epgId } });
      setEpgData(data);
    } catch {
      setEpgData([]);
    }
  };

  const loadFavorites = async () => {
    try {
      const { data } = await api.get('/favorites');
      setFavorites(new Set(data.map((f) => f.channel_id)));
    } catch { /* silent */ }
  };

  const toggleFavorite = async (channelId) => {
    try {
      if (favorites.has(channelId)) {
        await api.delete(`/favorites/${channelId}`);
        setFavorites((prev) => { const n = new Set(prev); n.delete(channelId); return n; });
        toast.success('Removed from favorites');
      } else {
        await api.post('/favorites', { channel_id: channelId });
        setFavorites((prev) => new Set(prev).add(channelId));
        toast.success('Added to favorites');
      }
    } catch {
      toast.error('Failed to update favorites');
    }
  };

  const handleChannelSelect = useCallback((channel) => {
    setSelectedChannel(channel);
    api.post('/history', { channel_id: channel.id }).catch(() => {});
  }, []);

  const currentProgram = epgData.find((p) => {
    const now = new Date();
    return new Date(p.start_time) <= now && new Date(p.end_time) >= now;
  });

  const getProgress = (program) => {
    if (!program) return 0;
    const now = Date.now();
    const start = new Date(program.start_time).getTime();
    const end = new Date(program.end_time).getTime();
    return Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
  };

  return (
    <div className="h-[calc(100vh-56px)] lg:h-screen flex flex-col lg:flex-row">
      {/* Player Section */}
      <div className="lg:flex-1 flex flex-col">
        {/* Video Player */}
        <div className="relative aspect-video lg:aspect-auto lg:flex-1 bg-black">
          {selectedChannel ? (
            <VideoPlayer
              url={selectedChannel.stream_url}
              poster={selectedChannel.logo_url}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center text-surface-500">
                <HiOutlineSignal className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="font-medium">Select a channel to start watching</p>
              </div>
            </div>
          )}
        </div>

        {/* Channel Info Bar */}
        {selectedChannel && (
          <div className="bg-surface-900/80 border-t border-surface-800/50 px-4 py-3">
            <div className="flex items-center gap-3">
              {selectedChannel.logo_url && (
                <img
                  src={selectedChannel.logo_url}
                  alt=""
                  className="w-10 h-10 rounded-lg object-contain bg-surface-800"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              )}
              <div className="flex-1 min-w-0">
                <h2 className="text-white font-semibold truncate">{selectedChannel.name}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  {selectedChannel.quality && (
                    <span className="badge badge-quality text-[10px]">{selectedChannel.quality}</span>
                  )}
                  {currentProgram && (
                    <p className="text-xs text-surface-400 truncate">{currentProgram.title}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => toggleFavorite(selectedChannel.id)}
                className="p-2 rounded-xl hover:bg-surface-800 transition-colors"
              >
                {favorites.has(selectedChannel.id) ? (
                  <HiHeart className="w-5 h-5 text-red-400" />
                ) : (
                  <HiOutlineHeart className="w-5 h-5 text-surface-400 hover:text-red-400" />
                )}
              </button>
            </div>

            {/* EPG Progress */}
            {currentProgram && (
              <div className="mt-2">
                <div className="h-1 bg-surface-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary-500 to-accent-cyan rounded-full transition-all duration-1000"
                    style={{ width: `${getProgress(currentProgram)}%` }}
                  />
                </div>
              </div>
            )}

            {/* EPG Timeline */}
            {epgData.length > 0 && (
              <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {epgData.slice(0, 8).map((prog, i) => {
                  const isNow = new Date(prog.start_time) <= new Date() && new Date(prog.end_time) >= new Date();
                  return (
                    <div
                      key={i}
                      className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs ${
                        isNow ? 'bg-primary-600/20 text-primary-300 border border-primary-500/20' : 'bg-surface-800/50 text-surface-400'
                      }`}
                    >
                      <p className="font-medium truncate max-w-[140px]">{prog.title}</p>
                      <p className="text-[10px] opacity-70">
                        {new Date(prog.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {' - '}
                        {new Date(prog.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Channel List Sidebar */}
      <div className="lg:w-[380px] flex flex-col bg-surface-900/30 border-l border-surface-800/50 overflow-hidden">
        {/* Category Filter */}
        <div className="p-3 border-b border-surface-800/50">
          <div className="flex items-center gap-2">
            <HiOutlineFunnel className="w-4 h-4 text-surface-500" />
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar flex-1">
              <button
                onClick={() => { setSelectedCategory(''); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  !selectedCategory ? 'bg-primary-600/20 text-primary-300 border border-primary-500/20' : 'text-surface-400 hover:text-white hover:bg-surface-800'
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => { setSelectedCategory(cat.slug); setPage(1); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    selectedCategory === cat.slug ? 'bg-primary-600/20 text-primary-300 border border-primary-500/20' : 'text-surface-400 hover:text-white hover:bg-surface-800'
                  }`}
                >
                  {cat.icon} {cat.name}
                  <span className="ml-1 opacity-50">({cat.channel_count})</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Channel List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl">
                  <div className="w-10 h-10 rounded-lg shimmer-loading" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 rounded shimmer-loading" />
                    <div className="h-3 w-20 rounded shimmer-loading" />
                  </div>
                </div>
              ))}
            </div>
          ) : channels.length === 0 ? (
            <div className="flex items-center justify-center h-full text-surface-500">
              <div className="text-center">
                <HiOutlineSignal className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No channels found</p>
                <p className="text-xs mt-1">Import a playlist from the admin panel</p>
              </div>
            </div>
          ) : (
            <div className="p-2 space-y-0.5">
              {channels.map((channel) => (
                <div
                  key={channel.id}
                  onClick={() => handleChannelSelect(channel)}
                  className={`channel-card ${selectedChannel?.id === channel.id ? 'active' : ''}`}
                >
                  <div className="w-10 h-10 rounded-lg bg-surface-800/80 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {channel.logo_url ? (
                      <img
                        src={channel.logo_url}
                        alt=""
                        className="w-full h-full object-contain"
                        onError={(e) => { e.target.parentNode.innerHTML = `<span class="text-xs font-bold text-surface-500">${channel.name.charAt(0)}</span>`; }}
                      />
                    ) : (
                      <span className="text-xs font-bold text-surface-500">{channel.name.charAt(0)}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{channel.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {channel.category_icon && <span className="text-xs">{channel.category_icon}</span>}
                      <span className="text-[11px] text-surface-500 truncate">{channel.category_name || 'Uncategorized'}</span>
                      {channel.quality && <span className="badge badge-quality text-[9px] ml-auto">{channel.quality}</span>}
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleFavorite(channel.id); }}
                    className="p-1.5 rounded-lg hover:bg-surface-700/50 transition-colors flex-shrink-0"
                  >
                    {favorites.has(channel.id) ? (
                      <HiHeart className="w-4 h-4 text-red-400" />
                    ) : (
                      <HiOutlineHeart className="w-4 h-4 text-surface-600" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-surface-800/50 flex items-center justify-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-xs font-medium text-surface-400 hover:text-white bg-surface-800/50 rounded-lg disabled:opacity-30"
            >
              Prev
            </button>
            <span className="text-xs text-surface-500">{page} / {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-xs font-medium text-surface-400 hover:text-white bg-surface-800/50 rounded-lg disabled:opacity-30"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
