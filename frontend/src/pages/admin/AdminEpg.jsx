import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineTrash, HiOutlineArrowPath } from 'react-icons/hi2';

export default function AdminEpg() {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => { loadSources(); }, []);

  const loadSources = async () => {
    try {
      const { data } = await api.get('/epg/sources');
      setSources(data);
    } catch {
      toast.error('Failed to load EPG sources');
    } finally {
      setLoading(false);
    }
  };

  const addSource = async (e) => {
    e.preventDefault();
    if (!name || !url) return toast.error('Name and URL required');
    setAdding(true);
    const toastId = toast.loading('Importing EPG data... This may take a while.');
    try {
      await api.post('/epg/import', { name, url });
      toast.success('EPG Source added successfully', { id: toastId });
      setName(''); setUrl('');
      loadSources();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add source', { id: toastId });
    } finally {
      setAdding(false);
    }
  };

  const deleteSource = async (id) => {
    if (!window.confirm('Delete this EPG source? All related program data will be removed.')) return;
    try {
      await api.delete(`/epg/sources/${id}`);
      setSources(sources.filter(s => s.id !== id));
      toast.success('EPG source deleted');
    } catch {
      toast.error('Failed to delete source');
    }
  };

  const refreshSource = async (id) => {
    const toastId = toast.loading('Refreshing EPG data...');
    try {
      const { data } = await api.post(`/epg/sources/${id}/refresh`);
      toast.success(`Refreshed: ${data.programs} programs updated`, { id: toastId });
      loadSources();
    } catch {
      toast.error('Refresh failed', { id: toastId });
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">EPG Management</h1>
        <p className="text-surface-400 text-sm">Manage Electronic Program Guide sources (XMLTV)</p>
      </div>

      <div className="glass-card p-6 mb-8">
        <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
          <HiOutlinePlus className="w-5 h-5 text-primary-400" />
          Add EPG Source
        </h3>
        <form onSubmit={addSource} className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-2">
            <input type="text" placeholder="Source Name (e.g. US Guide)" value={name} onChange={e => setName(e.target.value)} className="input-field py-2 text-sm" required />
          </div>
          <div className="md:col-span-2">
            <input type="url" placeholder="XMLTV URL (http://...)" value={url} onChange={e => setUrl(e.target.value)} className="input-field py-2 text-sm" required />
          </div>
          <div>
            <button type="submit" disabled={adding} className="btn-primary py-2 w-full text-sm">
              {adding ? 'Importing...' : 'Add Source'}
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
                <th className="px-4 py-3 font-medium">Programs</th>
                <th className="px-4 py-3 font-medium">Last Refresh</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-800/50">
              {loading ? (
                <tr><td colSpan="5" className="px-4 py-8 text-center text-surface-500">Loading...</td></tr>
              ) : sources.length === 0 ? (
                <tr><td colSpan="5" className="px-4 py-8 text-center text-surface-500">No EPG sources found</td></tr>
              ) : (
                sources.map(s => (
                  <tr key={s.id} className="hover:bg-surface-800/30">
                    <td className="px-4 py-3 font-medium text-white">{s.name}</td>
                    <td className="px-4 py-3 text-surface-300">{s.program_count}</td>
                    <td className="px-4 py-3 text-surface-400">{s.last_refreshed ? new Date(s.last_refreshed).toLocaleString() : 'Never'}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${s.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 flex items-center justify-end gap-2">
                      <button onClick={() => refreshSource(s.id)} className="p-1.5 text-surface-400 hover:text-primary-400 hover:bg-primary-500/10 rounded-lg" title="Force Refresh">
                        <HiOutlineArrowPath className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteSource(s.id)} className="p-1.5 text-surface-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg">
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
