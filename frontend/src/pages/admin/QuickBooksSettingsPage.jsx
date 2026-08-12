import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Plug, RefreshCw, CheckCircle2, XCircle, Link2, Unlink,
  AlertTriangle, ShieldAlert, Clock, DollarSign, ExternalLink,
  Save, Trash2, Search, Map, Ban
} from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";
const API = `${BACKEND_URL}/api`;

const QuickBooksSettingsPage = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('admin_token');
  const [status, setStatus] = useState(null);
  const [mappings, setMappings] = useState({ mappings: [], unmapped: [], duplicates: [] });
  const [qboItems, setQboItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [searchQbo, setSearchQbo] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [selectedQbo, setSelectedQbo] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('each');
  const [showOverride, setShowOverride] = useState(false);
  const [overridePrice, setOverridePrice] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideExpires, setOverrideExpires] = useState('');
  const [auditLog, setAuditLog] = useState([]);

  const authHeaders = { Authorization: `Bearer ${token}` };

  const loadStatus = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/admin/quickbooks/status`, { headers: authHeaders });
      setStatus(res.data);
    } catch (e) {
      console.error('Failed to load QuickBooks status', e);
    }
  }, [authHeaders]);

  const loadMappings = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/admin/quickbooks/mappings`, { headers: authHeaders });
      setMappings(res.data);
    } catch (e) {
      console.error('Failed to load mappings', e);
    }
  }, [authHeaders]);

  const loadQboItems = useCallback(async (q = '') => {
    try {
      const params = {};
      if (q) params.q = q;
      const res = await axios.get(`${API}/admin/quickbooks/items`, { headers: authHeaders, params });
      setQboItems(res.data.items || []);
    } catch (e) {
      console.error('Failed to load QBO items', e);
    }
  }, [authHeaders]);

  const loadAuditLog = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/admin/quickbooks/audit-log`, { headers: authHeaders });
      setAuditLog(res.data.log || []);
    } catch (e) {
      console.error('Failed to load audit log', e);
    }
  }, [authHeaders]);

  useEffect(() => {
    if (!token) {
      navigate('/admin/login');
      return;
    }
    Promise.all([loadStatus(), loadMappings(), loadQboItems(), loadAuditLog()]).finally(() => setLoading(false));
  }, [navigate, token, loadStatus, loadMappings, loadQboItems, loadAuditLog]);

  const handleSync = async () => {
    setSyncing(true);
    setSaveMessage('');
    try {
      const res = await axios.post(`${API}/admin/quickbooks/sync`, {}, { headers: authHeaders });
      setSaveMessage(`Sync complete: ${res.data.summary || 'done'}`);
      loadStatus();
      loadMappings();
      loadAuditLog();
    } catch (e) {
      setSaveMessage('Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const handleSaveMapping = async () => {
    if (!selectedMaterial || !selectedQbo) return;
    setSaveMessage('');
    try {
      await axios.post(
        `${API}/admin/quickbooks/mappings`,
        { material_id: selectedMaterial, quickbooks_item_id: selectedQbo, unit: selectedUnit },
        { headers: authHeaders }
      );
      setSaveMessage('Mapping saved');
      setSelectedMaterial(null);
      setSelectedQbo('');
      loadMappings();
      loadAuditLog();
    } catch (e) {
      setSaveMessage(e.response?.data?.detail || 'Save failed');
    }
  };

  const handleRemoveMapping = async (materialId) => {
    setSaveMessage('');
    try {
      await axios.delete(`${API}/admin/quickbooks/mappings/${materialId}`, { headers: authHeaders });
      setSaveMessage('Mapping removed');
      loadMappings();
      loadAuditLog();
    } catch (e) {
      setSaveMessage('Remove failed');
    }
  };

  const handleSetOverride = async () => {
    if (!selectedMaterial || !overridePrice) return;
    setSaveMessage('');
    try {
      await axios.post(
        `${API}/admin/quickbooks/emergency-override`,
        {
          material_id: selectedMaterial,
          override_price_cents: Math.round(parseFloat(overridePrice) * 100),
          override_reason: overrideReason,
          override_expires_at: overrideExpires || null,
        },
        { headers: authHeaders }
      );
      setSaveMessage('Override applied');
      setShowOverride(false);
      setOverridePrice('');
      setOverrideReason('');
      setOverrideExpires('');
      loadMappings();
      loadAuditLog();
    } catch (e) {
      setSaveMessage(e.response?.data?.detail || 'Override failed');
    }
  };

  const handleClearOverride = async (materialId) => {
    setSaveMessage('');
    try {
      await axios.delete(`${API}/admin/quickbooks/emergency-override/${materialId}`, { headers: authHeaders });
      setSaveMessage('Override cleared');
      loadMappings();
      loadAuditLog();
    } catch (e) {
      setSaveMessage('Clear failed');
    }
  };

  const handleConnect = async () => {
    const code = prompt('Paste the authorization code from QuickBooks:');
    if (!code) return;
    const realmId = prompt('Paste the realm ID from QuickBooks:');
    if (!realmId) return;
    setSaveMessage('');
    try {
      const res = await axios.post(
        `${API}/admin/quickbooks/connect`,
        { code, realm_id: realmId, company_name: status?.company_name || '' },
        { headers: authHeaders }
      );
      setStatus(res.data.connection);
      setSaveMessage('Connected and synced');
      loadMappings();
      loadAuditLog();
    } catch (e) {
      setSaveMessage(e.response?.data?.detail || 'Connection failed');
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Disconnect QuickBooks? This will not remove prices already synced.')) return;
    setSaveMessage('');
    try {
      await axios.post(`${API}/admin/quickbooks/disconnect`, {}, { headers: authHeaders });
      setStatus({ connected: false });
      setSaveMessage('Disconnected');
      loadAuditLog();
    } catch (e) {
      setSaveMessage('Disconnect failed');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#D9A441]"></div>
      </div>
    );
  }

  const effectivePrice = (m) => {
    if (!m) return null;
    const cents = m.pricing?.override_price_cents;
    const expires = m.pricing?.override_expires_at;
    if (cents && expires && new Date(expires) > new Date()) return cents / 100;
    return (m.pricing?.retail_price_cents || 0) / 100;
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      <header className="bg-[#3B2F2F] shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                QuickBooks Integration
              </h1>
              <p className="text-[#D9A441] text-sm" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Authoritative pricing and item mapping
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleSync}
                disabled={syncing || !status?.connected}
                className="flex items-center space-x-2 px-4 py-2 bg-[#D9A441] text-[#3B2F2F] font-semibold rounded hover:bg-white transition-colors disabled:opacity-50"
              >
                <RefreshCw size={18} className={syncing ? 'animate-spin' : ''} />
                <span>{syncing ? 'Syncing...' : 'Sync Now'}</span>
              </button>
              <button
                onClick={() => { localStorage.removeItem('admin_token'); navigate('/admin/login'); }}
                className="px-4 py-2 bg-white/10 text-white font-semibold rounded hover:bg-white/20 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <nav className="bg-white shadow">
        <div className="container mx-auto px-4">
          <div className="flex space-x-8">
            <Link to="/admin/dashboard" className="px-4 py-4 text-[#6B4F3F] hover:text-[#D9A441] font-semibold transition-colors">Dashboard</Link>
            <Link to="/admin/inventory" className="px-4 py-4 text-[#6B4F3F] hover:text-[#D9A441] font-semibold transition-colors">Materials & Inventory</Link>
            <Link to="/admin/quickbooks" className="px-4 py-4 border-b-2 border-[#D9A441] text-[#D9A441] font-semibold">QuickBooks</Link>
            <Link to="/admin/settings" className="px-4 py-4 text-[#6B4F3F] hover:text-[#D9A441] font-semibold transition-colors">Settings</Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 space-y-6">
        {saveMessage && (
          <div className={`px-4 py-3 rounded-lg text-sm font-semibold ${saveMessage.includes('failed') || saveMessage.includes('failed') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
            {saveMessage}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-[#3B2F2F]" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>Connection</h2>
            <div className="flex items-center space-x-3">
              {status?.connected ? (
                <span className="flex items-center space-x-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                  <CheckCircle2 size={16} /> <span>Connected</span>
                </span>
              ) : (
                <span className="flex items-center space-x-2 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold">
                  <XCircle size={16} /> <span>Disconnected</span>
                </span>
              )}
              {status?.connected ? (
                <button onClick={handleDisconnect} className="flex items-center space-x-2 px-4 py-2 border border-red-200 text-red-700 rounded hover:bg-red-50">
                  <Unlink size={18} /> <span>Disconnect</span>
                </button>
              ) : (
                <button onClick={handleConnect} className="flex items-center space-x-2 px-4 py-2 bg-[#D9A441] text-[#3B2F2F] rounded hover:bg-white">
                  <Plug size={18} /> <span>Connect QuickBooks</span>
                </button>
              )}
            </div>
          </div>

          {status?.connected && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                ['Environment', status.environment],
                ['Company', status.company_name],
                ['Last Sync', status.last_sync_at ? new Date(status.last_sync_at).toLocaleString() : 'Never'],
                ['Mapped', `${status.mapped_materials || 0} / ${(status.mapped_materials || 0) + (status.unmapped_materials || 0)}`],
                ['Unmapped', String(status.unmapped_materials || 0)],
                ['Stale Prices', String(status.stale_prices || 0)],
                ['Reauthorization', status.reauthorization_required ? 'Required' : 'Not required'],
              ].map(([label, value]) => (
                <div key={label} className="p-4 bg-[#FAF9F6] rounded border border-[#6B4F3F]/10">
                  <p className="text-xs text-[#6B4F3F] uppercase tracking-wide">{label}</p>
                  <p className="text-lg font-bold text-[#3B2F2F]">{value}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {status?.connected && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-[#3B2F2F] mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>Item Mappings</h2>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <input
                  type="text"
                  placeholder="Search QuickBooks items..."
                  value={searchQbo}
                  onChange={(e) => { setSearchQbo(e.target.value); loadQboItems(e.target.value); }}
                  className="px-4 py-2 border-2 border-[#6B4F3F]/20 rounded focus:border-[#D9A441] focus:outline-none"
                />
              </div>
              <div className="text-sm text-[#6B4F3F]">
                {mappings.duplicates.length > 0 && (
                  <span className="flex items-center space-x-1 text-red-700">
                    <AlertTriangle size={16} /> <span>{mappings.duplicates.length} duplicate mapping(s)</span>
                  </span>
                )}
              </div>
            </div>

            {mappings.duplicates.length > 0 && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded">
                <p className="text-sm font-semibold text-red-800 mb-2">Duplicate QuickBooks mappings detected</p>
                {mappings.duplicates.map((d, i) => (
                  <p key={i} className="text-xs text-red-700">{d.quickbooks_item_id}: {d.names.join(' vs ')}</p>
                ))}
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-[#3B2F2F] text-white">
                    <th className="text-left py-2 px-3">Website Material</th>
                    <th className="text-left py-2 px-3">QuickBooks Item</th>
                    <th className="text-left py-2 px-3">Unit</th>
                    <th className="text-right py-2 px-3">Price</th>
                    <th className="text-center py-2 px-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {[...mappings.mappings, ...mappings.unmapped].map((m) => (
                    <tr key={m.material_id} className="border-b border-[#6B4F3F]/10">
                      <td className="py-2 px-3 font-semibold text-[#3B2F2F]">{m.material_name}</td>
                      <td className="py-2 px-3">{m.qbo_name || m.quickbooks_item_id || '—'}</td>
                      <td className="py-2 px-3">{m.unit || '—'}</td>
                      <td className="py-2 px-3 text-right">{m.retail_price_cents != null ? `$${(m.retail_price_cents / 100).toFixed(2)}` : '—'}</td>
                      <td className="py-2 px-3 text-center space-x-2">
                        {!m.quickbooks_item_id && (
                          <button onClick={() => { setSelectedMaterial(m.material_id); setSelectedQbo(''); }} className="text-[#D9A441] hover:text-[#3B2F2F]">Map</button>
                        )}
                        {m.quickbooks_item_id && (
                          <>
                            <button onClick={() => setSelectedMaterial(m.material_id)} className="text-blue-700 hover:text-blue-900">Replace</button>
                            <button onClick={() => handleRemoveMapping(m.material_id)} className="text-red-700 hover:text-red-900">Remove</button>
                          </>
                        )}
                        <button onClick={() => { setSelectedMaterial(m.material_id); setShowOverride(true); }} className="text-[#6B4F3F] hover:text-[#3B2F2F]">Override</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {selectedMaterial && (
              <div className="mt-4 p-4 bg-[#FAF9F6] rounded border border-[#6B4F3F]/10">
                <p className="text-sm font-semibold text-[#3B2F2F] mb-2">Map material to QuickBooks item</p>
                <div className="flex items-center space-x-3">
                  <select
                    value={selectedQbo}
                    onChange={(e) => setSelectedQbo(e.target.value)}
                    className="flex-1 px-3 py-2 border-2 border-[#6B4F3F]/20 rounded focus:border-[#D9A441] focus:outline-none"
                  >
                    <option value="">Select QuickBooks item...</option>
                    {qboItems.map((item) => (
                      <option key={item.id} value={item.id}>{item.name} (${item.unit_price || 0})</option>
                    ))}
                  </select>
                  <select value={selectedUnit} onChange={(e) => setSelectedUnit(e.target.value)} className="px-3 py-2 border-2 border-[#6B4F3F]/20 rounded">
                    {['each','cubic_yard','ton','pallet','bag','mile','flat'].map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                  <button onClick={handleSaveMapping} className="px-4 py-2 bg-[#6B7A3A] text-white rounded hover:bg-[#3B2F2F]">Save</button>
                  <button onClick={() => { setSelectedMaterial(null); setSelectedQbo(''); }} className="px-4 py-2 border border-[#6B4F3F]/20 rounded">Cancel</button>
                </div>
              </div>
            )}

            {showOverride && selectedMaterial && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
                <div className="flex items-center space-x-2 mb-3">
                  <ShieldAlert className="text-yellow-700" size={20} />
                  <p className="text-sm font-bold text-yellow-800">Emergency Override</p>
                </div>
                <p className="text-xs text-yellow-800 mb-3">Use only for operational continuity. This will override the QuickBooks price temporarily.</p>
                <div className="flex items-center space-x-3">
                  <input type="number" step="0.01" placeholder="Override price" value={overridePrice} onChange={(e) => setOverridePrice(e.target.value)} className="px-3 py-2 border-2 border-yellow-300 rounded w-40" />
                  <input type="text" placeholder="Reason" value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} className="px-3 py-2 border-2 border-yellow-300 rounded flex-1" />
                  <input type="datetime-local" value={overrideExpires} onChange={(e) => setOverrideExpires(e.target.value)} className="px-3 py-2 border-2 border-yellow-300 rounded" />
                  <button onClick={handleSetOverride} className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700">Apply</button>
                  <button onClick={() => { setShowOverride(false); setOverridePrice(''); setOverrideReason(''); setOverrideExpires(''); }} className="px-4 py-2 border border-yellow-300 rounded">Cancel</button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-[#3B2F2F] mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>Recent Activity</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {auditLog.map((entry, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-[#FAF9F6] rounded border border-[#6B4F3F]/10">
                <div>
                  <p className="text-sm font-semibold text-[#3B2F2F]">{entry.event?.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-[#6B4F3F]">{entry.details?.summary || entry.details?.error || ''}</p>
                </div>
                <span className="text-xs text-[#6B4F3F]">{entry.timestamp ? new Date(entry.timestamp).toLocaleString() : ''}</span>
              </div>
            ))}
            {!auditLog.length && <p className="text-sm text-[#6B4F3F]">No recent activity.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickBooksSettingsPage;
