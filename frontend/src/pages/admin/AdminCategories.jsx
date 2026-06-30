import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineTrash, HiOutlinePencilSquare } from 'react-icons/hi2';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📺');

  useEffect(() => { loadCategories(); }, []);

  const loadCategories = async () => {
    try {
      const { data } = await api.get('/categories');
      setCategories(data);
    } catch {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const createCategory = async (e) => {
    e.preventDefault();
    if (!name) return;
    try {
      await api.post('/categories', { name, icon });
      toast.success('Category created');
      setName(''); setIcon('📺');
      loadCategories();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create');
    }
  };

  const deleteCategory = async (id) => {
    if (!window.confirm('Delete category? Channels will be uncategorized.')) return;
    try {
      await api.delete(`/categories/${id}`);
      setCategories(categories.filter(c => c.id !== id));
      toast.success('Category deleted');
    } catch {
      toast.error('Delete failed');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Categories</h1>
        <p className="text-surface-400 text-sm">Organize channels into groups</p>
      </div>

      <div className="glass-card p-6 mb-8">
        <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
          <HiOutlinePlus className="w-5 h-5 text-primary-400" />
          Add Category
        </h3>
        <form onSubmit={createCategory} className="flex gap-4">
          <div className="w-20">
            <input type="text" value={icon} onChange={e => setIcon(e.target.value)} className="input-field text-center py-2" placeholder="Emoji" maxLength={4} />
          </div>
          <div className="flex-1">
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="input-field py-2" placeholder="Category Name" required />
          </div>
          <button type="submit" className="btn-primary py-2 px-6">Add</button>
        </form>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-800/50 text-surface-400">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Slug</th>
              <th className="px-4 py-3 font-medium">Channels</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-800/50">
            {loading ? (
              <tr><td colSpan="4" className="px-4 py-8 text-center text-surface-500">Loading...</td></tr>
            ) : categories.length === 0 ? (
              <tr><td colSpan="4" className="px-4 py-8 text-center text-surface-500">No categories found</td></tr>
            ) : (
              categories.map(c => (
                <tr key={c.id} className="hover:bg-surface-800/30">
                  <td className="px-4 py-3 text-white font-medium flex items-center gap-2">
                    <span>{c.icon}</span> {c.name}
                  </td>
                  <td className="px-4 py-3 text-surface-400">{c.slug}</td>
                  <td className="px-4 py-3 text-surface-300">{c.channel_count}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => deleteCategory(c.id)} className="p-1.5 text-surface-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg">
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
  );
}
