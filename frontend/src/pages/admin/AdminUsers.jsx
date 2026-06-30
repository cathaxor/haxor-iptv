import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  
  // New user form
  const [showAdd, setShowAdd] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', email: '', password: '', role: 'user' });

  useEffect(() => { loadUsers(); }, [page, search]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/users', { params: { page, search: search.length > 2 ? search : '' } });
      setUsers(data.users);
      setTotalPages(data.pagination.pages);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
    if (e.target.value.length === 0 || e.target.value.length > 2) setPage(1);
  };

  const createUser = async (e) => {
    e.preventDefault();
    try {
      await api.post('/users', newUser);
      toast.success('User created');
      setShowAdd(false);
      setNewUser({ username: '', email: '', password: '', role: 'user' });
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Creation failed');
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      await api.delete(`/users/${id}`);
      setUsers(users.filter(u => u.id !== id));
      toast.success('User deleted');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Delete failed');
    }
  };

  const toggleStatus = async (id, isActive) => {
    try {
      await api.put(`/users/${id}`, { is_active: !isActive });
      setUsers(users.map(u => u.id === id ? { ...u, is_active: !isActive } : u));
      toast.success('User status updated');
    } catch {
      toast.error('Update failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Users</h1>
          <p className="text-surface-400 text-sm">Manage access and roles</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="btn-primary py-2 text-sm">
          {showAdd ? 'Cancel' : 'Add User'}
        </button>
      </div>

      {showAdd && (
        <div className="glass-card p-6 mb-6 animate-slide-down">
          <h3 className="text-lg font-medium text-white mb-4">Create New User</h3>
          <form onSubmit={createUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder="Username" required className="input-field py-2 text-sm" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} />
            <input type="email" placeholder="Email" required className="input-field py-2 text-sm" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} />
            <input type="password" placeholder="Password (min 8 chars)" required minLength={8} className="input-field py-2 text-sm" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
            <select className="input-field py-2 text-sm bg-surface-900" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            <div className="md:col-span-2">
              <button type="submit" className="btn-primary py-2 px-8 text-sm">Create Account</button>
            </div>
          </form>
        </div>
      )}

      <div className="glass-card p-4 mb-4">
        <input type="text" placeholder="Search by username or email..." className="input-field py-2 text-sm w-full md:w-96" value={search} onChange={handleSearch} />
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-800/50 text-surface-400">
              <tr>
                <th className="px-4 py-3 font-medium">Username</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Last Login</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-800/50">
              {loading ? (
                <tr><td colSpan="6" className="px-4 py-8 text-center text-surface-500">Loading...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan="6" className="px-4 py-8 text-center text-surface-500">No users found</td></tr>
              ) : (
                users.map(u => (
                  <tr key={u.id} className="hover:bg-surface-800/30">
                    <td className="px-4 py-3 text-white font-medium">{u.username}</td>
                    <td className="px-4 py-3 text-surface-300">{u.email}</td>
                    <td className="px-4 py-3"><span className={`badge ${u.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-surface-700 text-surface-300'}`}>{u.role}</span></td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleStatus(u.id, u.is_active)} className={`badge ${u.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                        {u.is_active ? 'Active' : 'Disabled'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-surface-400">{u.last_login ? new Date(u.last_login).toLocaleDateString() : 'Never'}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => deleteUser(u.id)} className="text-red-400 hover:text-red-300 text-xs px-2 py-1 bg-red-500/10 rounded">Delete</button>
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
