import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { HiOutlineMagnifyingGlass, HiOutlineTrash, HiOutlinePencilSquare } from 'react-icons/hi2';
import useDebounce from '../../hooks/useDebounce';

export default function AdminChannels() {
  const [channels, setChannels] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const debouncedSearch = useDebounce(search, 500);

  // Edit State
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    api.get('/categories').then(({ data }) => setCategories(data)).catch(() => {});
  }, []);

  const loadChannels = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 50 };
      if (debouncedSearch) params.search = debouncedSearch;
      if (categoryFilter) params.category = categoryFilter;
      
      const { data } = await api.get('/channels', { params });
      setChannels(data.channels);
      setTotalPages(data.pagination.pages);
    } catch {
      toast.error('Failed to load channels');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, categoryFilter]);

  useEffect(() => {
    loadChannels();
  }, [loadChannels]);

  useEffect(() => { setPage(1); }, [debouncedSearch, categoryFilter]);

  const toggleStatus = async (id, currentStatus) => {
    try {
      await api.put(`/channels/${id}`, { is_active: currentStatus ? 0 : 1 });
      setChannels(channels.map(c => c.id === id ? { ...c, is_active: currentStatus ? 0 : 1 } : c));
      toast.success(currentStatus ? 'Channel disabled' : 'Channel activated');
    } catch {
      toast.error('Update failed');
    }
  };

  const deleteChannel = async (id) => {
    if (!window.confirm('Delete this channel?')) return;
    try {
      await api.delete(`/channels/${id}`);
      setChannels(channels.filter(c => c.id !== id));
      toast.success('Channel deleted');
    } catch {
      toast.error('Delete failed');
    }
  };

  const startEdit = (ch) => {
    setEditingId(ch.id);
    setEditForm({ name: ch.name, stream_url: ch.stream_url, category_id: ch.category_id || '', quality: ch.quality || '' });
  };

  const saveEdit = async (id) => {
    try {
      await api.put(`/channels/${id}`, editForm);
      toast.success('Channel updated');
      setEditingId(null);
      loadChannels();
    } catch {
      toast.error('Update failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Channels</h1>
        <p className="text-surface-400 text-sm">Manage individual channels and streams</p>
      </div>

      <div className="glass-card p-4 mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search channels..."
            className="input-field py-2 pl-10 text-sm"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="input-field py-2 text-sm md:w-64 bg-surface-900"
        >
          <option value="">All Categories</option>
          {categories.map(c => (
            <option key={c.id} value={c.slug}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-800/50 text-surface-400">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Quality</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-800/50">
              {loading ? (
                <tr><td colSpan="5" className="px-4 py-8 text-center text-surface-500">Loading...</td></tr>
              ) : channels.length === 0 ? (
                <tr><td colSpan="5" className="px-4 py-8 text-center text-surface-500">No channels found</td></tr>
              ) : (
                channels.map(ch => (
                  <tr key={ch.id} className="hover:bg-surface-800/30">
                    <td className="px-4 py-3">
                      {editingId === ch.id ? (
                        <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="input-field py-1 text-xs" />
                      ) : (
                        <div className="flex items-center gap-3">
                          {ch.logo_url ? <img src={ch.logo_url} className="w-8 h-8 object-contain rounded bg-surface-800" alt="" /> : <div className="w-8 h-8 rounded bg-surface-800 flex items-center justify-center">📺</div>}
                          <span className="font-medium text-white truncate max-w-[200px]">{ch.name}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {editingId === ch.id ? (
                        <select value={editForm.category_id} onChange={e => setEditForm({...editForm, category_id: e.target.value})} className="input-field py-1 text-xs bg-surface-900">
                          <option value="">None</option>
                          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      ) : (
                        <span className="text-surface-300">{ch.category_name || '-'}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {editingId === ch.id ? (
                        <input type="text" value={editForm.quality} onChange={e => setEditForm({...editForm, quality: e.target.value})} className="input-field py-1 text-xs w-20" placeholder="e.g. HD" />
                      ) : (
                        <span className="text-surface-400">{ch.quality || '-'}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleStatus(ch.id, ch.is_active)} className={`badge ${ch.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-surface-700 text-surface-400'}`}>
                        {ch.is_active ? 'Active' : 'Hidden'}
                      </button>
                    </td>
                    <td className="px-4 py-3 flex items-center justify-end gap-2">
                      {editingId === ch.id ? (
                        <>
                          <button onClick={() => saveEdit(ch.id)} className="text-emerald-400 hover:text-emerald-300 text-xs font-medium px-2 py-1 bg-emerald-500/10 rounded">Save</button>
                          <button onClick={() => setEditingId(null)} className="text-surface-400 hover:text-white text-xs font-medium px-2 py-1 bg-surface-800 rounded">Cancel</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEdit(ch)} className="p-1.5 text-surface-400 hover:text-primary-400 hover:bg-primary-500/10 rounded-lg">
                            <HiOutlinePencilSquare className="w-4 h-4" />
                          </button>
                          <button onClick={() => deleteChannel(ch.id)} className="p-1.5 text-surface-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg">
                            <HiOutlineTrash className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="p-4 border-t border-surface-800/50 flex justify-between items-center bg-surface-900/30">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-xs py-1.5 px-3">Prev</button>
            <span className="text-surface-400 text-xs">Page {page} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary text-xs py-1.5 px-3">Next</button>
          </div>
        )}
      </div>
    </div>
  );
}
