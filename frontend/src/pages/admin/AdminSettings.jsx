import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    site_name: '',
    site_description: '',
    allow_registration: false,
    theme: 'dark'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    try {
      const { data } = await api.get('/settings');
      setSettings(data);
    } catch {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/settings', settings);
      toast.success('Settings saved successfully');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-surface-400">Loading settings...</div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">System Settings</h1>
        <p className="text-surface-400 text-sm">Configure global application parameters</p>
      </div>

      <div className="glass-card p-6">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white border-b border-surface-800/50 pb-2">General</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-1">Site Name</label>
                <input 
                  type="text" 
                  value={settings.site_name || ''} 
                  onChange={e => setSettings({...settings, site_name: e.target.value})} 
                  className="input-field py-2" 
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-surface-300 mb-1">Site Description</label>
                <textarea 
                  value={settings.site_description || ''} 
                  onChange={e => setSettings({...settings, site_description: e.target.value})} 
                  className="input-field py-2 h-20" 
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white border-b border-surface-800/50 pb-2">Security & Access</h3>
            
            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={settings.allow_registration === true} 
                  onChange={e => setSettings({...settings, allow_registration: e.target.checked})} 
                  className="w-5 h-5 rounded border-surface-700 bg-surface-900 text-primary-500 focus:ring-primary-500/20" 
                />
                <span className="text-sm font-medium text-surface-300">Allow New User Registrations</span>
              </label>
              <p className="text-xs text-surface-500 ml-8 mt-1">If disabled, only admins can create new user accounts.</p>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button type="submit" disabled={saving} className="btn-primary px-8">
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
