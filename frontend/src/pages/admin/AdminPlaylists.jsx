import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineTrash, HiOutlineArrowPath } from 'react-icons/hi2';

export default function AdminPlaylists() {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [type, setType] = useState('url'); // 'url' or 'file'
  const [url, setUrl] = useState('');
  const [file, setFile] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState('86400'); // 24h

  useEffect(() => {
    loadPlaylists();
  }, []);

  const loadPlaylists = async () => {
    try {
      const { data } = await api.get('/playlists');
      setPlaylists(data);
    } catch {
      toast.error('Failed to load playlists');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name) return toast.error('Name is required');
    
    setUploading(true);
    const toastId = toast.loading('Adding playlist...');
    
    try {
      if (type === 'url') {
        if (!url) throw new Error('URL is required');
        await api.post('/playlists/import-url', {
          name, url, auto_refresh: autoRefresh, refresh_interval: refreshInterval
        });
      } else {
        if (!file) throw new Error('File is required');
        const formData = new FormData();
        formData.append('file', file);
        formData.append('name', name);
        formData.append('auto_refresh', autoRefresh);
        formData.append('refresh_interval', refreshInterval);
        await api.post('/playlists/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      
      toast.success('Playlist added successfully', { id: toastId });
      // Reset form
      setName(''); setUrl(''); setFile(null);
      loadPlaylists();
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Failed to add playlist', { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  const deletePlaylist = async (id) => {
    if (!window.confirm('Delete playlist? This will remove all associated channels.')) return;
    try {
      await api.delete(`/playlists/${id}`);
      setPlaylists(playlists.filter(p => p.id !== id));
      toast.success('Playlist deleted');
    } catch {
      toast.error('Failed to delete playlist');
    }
  };

  const refreshPlaylist = async (id) => {
    const toastId = toast.loading('Refreshing playlist...');
    try {
      const { data } = await api.post(`/playlists/${id}/refresh`);
      toast.success(`Refreshed: ${data.channels} channels imported`, { id: toastId });
      loadPlaylists();
    } catch {
      toast.error('Failed to refresh playlist', { id: toastId });
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Playlists</h1>
        <p className="text-surface-400 text-sm">Manage M3U playlists and channels</p>
      </div>

      <div className="glass-card p-6 mb-8">
        <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
          <HiOutlinePlus className="w-5 h-5 text-primary-400" />
          Add New Playlist
        </h3>
        
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-surface-400 mb-1">Playlist Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="input-field py-2 text-sm"
              placeholder="e.g. Premium Sports"
              required
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-surface-400 mb-1">Source Type</label>
            <select
              value={type}
              onChange={e => setType(e.target.value)}
              className="input-field py-2 text-sm bg-surface-900"
            >
              <option value="url">Remote URL</option>
              <option value="file">Local File Upload</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-surface-400 mb-1">
              {type === 'url' ? 'Playlist URL (.m3u, .m3u8)' : 'Playlist File (.m3u)'}
            </label>
            {type === 'url' ? (
              <input
                type="url"
                value={url}
                onChange={e => setUrl(e.target.value)}
                className="input-field py-2 text-sm"
                placeholder="http://example.com/playlist.m3u"
                required={type === 'url'}
              />
            ) : (
              <input
                type="file"
                accept=".m3u,.m3u8,text/plain"
                onChange={e => setFile(e.target.files[0])}
                className="input-field py-2 text-sm file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-surface-800 file:text-white"
                required={type === 'file'}
              />
            )}
          </div>

          {type === 'url' && (
            <>
              <div>
                <label className="flex items-center gap-2 mt-7 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={e => setAutoRefresh(e.target.checked)}
                    className="rounded border-surface-700 bg-surface-900 text-primary-500 focus:ring-primary-500/20"
                  />
                  <span className="text-sm text-surface-300">Enable Auto-Refresh</span>
                </label>
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-400 mb-1">Refresh Interval</label>
                <select
                  value={refreshInterval}
                  onChange={e => setRefreshInterval(e.target.value)}
                  disabled={!autoRefresh}
                  className="input-field py-2 text-sm bg-surface-900 disabled:opacity-50"
                >
                  <option value="3600">Every Hour</option>
                  <option value="21600">Every 6 Hours</option>
                  <option value="43200">Every 12 Hours</option>
                  <option value="86400">Every 24 Hours</option>
                </select>
              </div>
            </>
          )}

          <div className="md:col-span-2 mt-2">
            <button type="submit" disabled={uploading} className="btn-primary py-2 text-sm">
              {uploading ? 'Processing...' : 'Add Playlist'}
            </button>
          </div>
        </form>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-800/50 text-surface-400">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Channels</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-800/50">
              {loading ? (
                <tr><td colSpan="5" className="px-4 py-8 text-center text-surface-500">Loading...</td></tr>
              ) : playlists.length === 0 ? (
                <tr><td colSpan="5" className="px-4 py-8 text-center text-surface-500">No playlists found</td></tr>
              ) : (
                playlists.map(p => (
                  <tr key={p.id} className="hover:bg-surface-800/30">
                    <td className="px-4 py-3 font-medium text-white">{p.name}</td>
                    <td className="px-4 py-3 text-surface-300">{p.channel_count}</td>
                    <td className="px-4 py-3 text-surface-400 uppercase text-xs">{p.source_type}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${p.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 flex items-center justify-end gap-2">
                      {p.source_type === 'url' && (
                        <button onClick={() => refreshPlaylist(p.id)} className="p-1.5 text-surface-400 hover:text-primary-400 hover:bg-primary-500/10 rounded-lg">
                          <HiOutlineArrowPath className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => deletePlaylist(p.id)} className="p-1.5 text-surface-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg">
                        <HiOutlineTrash className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
