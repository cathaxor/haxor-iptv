import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { HiOutlineHeart, HiOutlineTrash, HiPlay } from 'react-icons/hi2';

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const { data } = await api.get('/favorites');
      setFavorites(data);
    } catch {
      toast.error('Failed to load favorites');
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (e, channelId) => {
    e.stopPropagation();
    try {
      await api.delete(`/favorites/${channelId}`);
      setFavorites(favorites.filter(f => f.channel_id !== channelId));
      toast.success('Removed from favorites');
    } catch {
      toast.error('Failed to remove favorite');
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

  if (loading) return <div className="p-8 text-center text-surface-400">Loading favorites...</div>;

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold gradient-text">Favorites</h1>
        <p className="text-surface-400 mt-2">Your saved channels</p>
      </div>

      {favorites.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <HiOutlineHeart className="w-16 h-16 text-surface-600 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-white mb-2">No favorites yet</h3>
          <p className="text-surface-400">Channels you heart will appear here</p>
          <button onClick={() => navigate('/live')} className="btn-primary mt-6">
            Browse Channels
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {favorites.map((fav) => (
            <div key={fav.id} className="glass-card group hover:bg-surface-800/50 cursor-pointer p-4 flex flex-col items-center text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-surface-900 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <button 
                onClick={(e) => removeFavorite(e, fav.channel_id)} 
                className="absolute top-3 right-3 p-2 text-surface-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all z-10"
              >
                <HiOutlineTrash className="w-5 h-5" />
              </button>
              
              <div className="w-20 h-20 mb-4 bg-surface-900 rounded-2xl flex items-center justify-center p-2 z-10">
                {fav.logo_url ? (
                  <img src={fav.logo_url} alt="" className="w-full h-full object-contain" />
                ) : (
                  <span className="text-3xl">📺</span>
                )}
              </div>
              <h3 className="text-lg font-medium text-white mb-1 z-10">{fav.name}</h3>
              <p className="text-xs text-surface-400 mb-4 z-10">{fav.category_name || 'Uncategorized'}</p>
              
              <button onClick={() => playChannel(fav)} className="btn-primary w-full py-2 z-10 flex items-center justify-center gap-2">
                <HiPlay className="w-5 h-5" />
                Watch Now
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
