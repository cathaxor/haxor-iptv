import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function AdminLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => { loadLogs(); }, [page]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/dashboard/logs', { params: { page, limit: 100 } });
      setLogs(data.logs);
      setTotalPages(data.pagination.totalPages);
    } catch {
      toast.error('Failed to load system logs');
    } finally {
      setLoading(false);
    }
  };

  const formatDetails = (details) => {
    if (!details) return '-';
    try {
      const parsed = JSON.parse(details);
      return Object.entries(parsed).map(([k, v]) => `${k}: ${v}`).join(', ');
    } catch {
      return details;
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">System Logs</h1>
        <p className="text-surface-400 text-sm">Audit trail of administrative and user actions</p>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-800/50 text-surface-400">
              <tr>
                <th className="px-4 py-3 font-medium">Timestamp</th>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Entity Type</th>
                <th className="px-4 py-3 font-medium">Details</th>
                <th className="px-4 py-3 font-medium text-right">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-800/50">
              {loading ? (
                <tr><td colSpan="6" className="px-4 py-8 text-center text-surface-500">Loading...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan="6" className="px-4 py-8 text-center text-surface-500">No logs found</td></tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id} className="hover:bg-surface-800/30">
                    <td className="px-4 py-3 text-surface-400 whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                    <td className="px-4 py-3 text-white font-medium">{log.username || 'System'}</td>
                    <td className="px-4 py-3 text-primary-400">{log.action.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-3 text-surface-300">{log.entity_type || '-'}</td>
                    <td className="px-4 py-3 text-surface-400 text-xs truncate max-w-xs">{formatDetails(log.details)}</td>
                    <td className="px-4 py-3 text-right text-surface-500 text-xs">{log.ip_address || '-'}</td>
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
