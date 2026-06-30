import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user, login } = useAuth(); // We can re-fetch or use context to update user data
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!email && !newPassword) return toast.error('No changes to save');
    if (newPassword && !currentPassword) return toast.error('Current password is required to set a new password');
    
    setLoading(true);
    try {
      await api.put('/auth/profile', {
        email: email !== user?.email ? email : undefined,
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined
      });
      toast.success('Profile updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      // Force token refresh or user reload if needed
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold gradient-text">Settings</h1>
        <p className="text-surface-400 mt-2">Manage your account preferences</p>
      </div>

      <div className="glass-card p-6 lg:p-8">
        <h2 className="text-xl font-medium text-white mb-6">Profile Settings</h2>
        
        <form onSubmit={handleUpdateProfile} className="space-y-6 max-w-xl">
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-2">Username</label>
            <input
              type="text"
              value={user?.username || ''}
              disabled
              className="input-field bg-surface-800/50 text-surface-500 cursor-not-allowed"
            />
            <p className="text-xs text-surface-500 mt-1">Username cannot be changed</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-300 mb-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="your@email.com"
            />
          </div>

          <div className="pt-4 border-t border-surface-800/50">
            <h3 className="text-md font-medium text-white mb-4">Change Password</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-2">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="input-field"
                  placeholder="Enter current password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-300 mb-2">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input-field"
                  placeholder="Enter new password (min 8 chars)"
                  minLength={8}
                />
              </div>
            </div>
          </div>

          <div className="pt-6">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full sm:w-auto"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
