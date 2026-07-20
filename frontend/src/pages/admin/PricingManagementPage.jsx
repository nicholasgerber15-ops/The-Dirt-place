import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { DollarSign, LogOut, Edit2, X, Check, Plus, Package, Upload, Download as DownloadIcon } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const UNIT_TYPES = ['yard', 'half-yard', 'ton', 'bag', 'each', 'pallet', 'basket', 'gallon', 'pound', 'set', 'flat', 'mile', 'day', 'rental', 'percentage'];

const PricingManagementPage = () => {
  const navigate = useNavigate();
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [savingId, setSavingId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [importResult, setImportResult] = useState(null);
  const [importing, setImporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 20;
  const [newMaterial, setNewMaterial] = useState({
    name: '',
    price_per_unit: '',
    unit_type: 'cubic yards',
    min_order: 1,
    stock_quantity: 0,
    image_url: '',
    description: ''
  });

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    fetchAllPricing();
  }, [fetchAllPricing, navigate]);

  const fetchAllPricing = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin_token');
      
      const materialsRes = await axios.get(`${API}/admin/pricing`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMaterials(materialsRes.data.pricing);
    } catch (error) {
      console.error('Failed to fetch pricing:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('admin_token');
        navigate('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddMaterial = async () => {
    try {
      setSavingId('new');
      const token = localStorage.getItem('admin_token');
      
      await axios.post(
        `${API}/admin/materials`,
        newMaterial,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setShowAddModal(false);
      setNewMaterial({
        name: '',
        price_per_unit: '',
        unit_type: 'cubic yards',
        min_order: 1,
        stock_quantity: 0,
        image_url: '',
        description: ''
      });
      
      fetchAllPricing();
      alert('Material added successfully!');
    } catch (error) {
      console.error('Failed to add material:', error);
      alert('Failed to add material');
    } finally {
      setSavingId(null);
    }
  };

  const updateMaterialPricing = async (materialId) => {
    if (!editingMaterial) return;

    try {
      setSavingId(materialId);
      const token = localStorage.getItem('admin_token');
      
      await axios.put(
        `${API}/admin/materials/${materialId}`,
        editingMaterial,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMaterials(prev =>
        prev.map(m =>
          m.material_id === materialId ? editingMaterial : m
        )
      );
      
      setEditingMaterial(null);
      alert('Material updated successfully!');
    } catch (error) {
      console.error('Failed to update material:', error);
      alert('Failed to update material');
    } finally {
      setSavingId(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    navigate('/admin/login');
  };

  const startEditMaterial = (material) => {
    setEditingMaterial({ ...material });
  };

  const cancelEditMaterial = () => {
    setEditingMaterial(null);
  };

  const getStockColor = (stock) => {
    if (stock === 0) return 'text-red-600';
    if (stock < 20) return 'text-yellow-600';
    return 'text-green-600';
  };

  const filtered = materials.filter(m =>
    !searchQuery || m.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.material_id?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / perPage);
  const paged = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      {/* Admin Header */}
      <header className="bg-[#3B2F2F] shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                The Dirt Place Admin
              </h1>
              <p className="text-[#D9A441] text-sm" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Materials & Pricing Management
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 bg-[#D9A441] text-[#3B2F2F] font-semibold rounded hover:bg-white transition-colors"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow">
        <div className="container mx-auto px-4">
          <div className="flex space-x-8">
            <Link
              to="/admin/dashboard"
              className="px-4 py-4 text-[#6B4F3F] hover:text-[#D9A441] font-semibold transition-colors"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Dashboard
            </Link>
            <Link
              to="/admin/orders"
              className="px-4 py-4 text-[#6B4F3F] hover:text-[#D9A441] font-semibold transition-colors"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Orders
            </Link>
            <Link
              to="/admin/pricing"
              className="px-4 py-4 border-b-2 border-[#D9A441] text-[#D9A441] font-semibold"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Materials & Pricing
            </Link>
            <Link
              to="/admin/inventory"
              className="px-4 py-4 text-[#6B4F3F] hover:text-[#D9A441] font-semibold transition-colors"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Inventory
            </Link>
            <Link
              to="/admin/settings"
              className="px-4 py-4 text-[#6B4F3F] hover:text-[#D9A441] font-semibold transition-colors"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Settings
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#D9A441]"></div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Material Pricing */}
            <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <DollarSign size={32} className="text-[#D9A441] mr-3" />
                    <h2 className="text-3xl font-bold text-[#3B2F2F]" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                      Material Pricing & Inventory
                      <span className="ml-3 text-lg text-[#6B4F3F]">({materials.length} materials)</span>
                    </h2>
                  </div>
                  <div className="flex items-center space-x-3">
                    <input
                      type="text"
                      placeholder="Search by name or ID..."
                      value={searchQuery}
                      onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                      className="px-4 py-2 border-2 border-[#6B4F3F]/20 rounded focus:border-[#D9A441] focus:outline-none w-64"
                      style={{ fontFamily: 'Montserrat, sans-serif' }}
                    />
                  <button
                    onClick={() => setShowImportModal(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-[#3B2F2F] text-white font-semibold rounded hover:bg-[#6B7A3A] transition-colors"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    <Upload size={18} />
                    <span>Import CSV</span>
                  </button>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-[#6B7A3A] text-white font-semibold rounded hover:bg-[#3B2F2F] transition-colors"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    <Plus size={18} />
                    <span>Add Material</span>
                  </button>
                </div>
              </div>

              <p className="text-[#6B4F3F] mb-6" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Manage materials, pricing, units, and stock levels. Changes take effect immediately.
              </p>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-[#6B4F3F]/20">
                      <th className="text-left py-3 px-4 font-semibold text-[#3B2F2F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>Material</th>
                      <th className="text-left py-3 px-4 font-semibold text-[#3B2F2F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>Price/Unit</th>
                      <th className="text-left py-3 px-4 font-semibold text-[#3B2F2F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>Unit Type</th>
                      <th className="text-left py-3 px-4 font-semibold text-[#3B2F2F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>Min Order</th>
                      <th className="text-left py-3 px-4 font-semibold text-[#3B2F2F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>Stock</th>
                      <th className="text-center py-3 px-4 font-semibold text-[#3B2F2F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map((material) => {
                      const isEditing = editingMaterial?.material_id === material.material_id;
                      const isSaving = savingId === material.material_id;

                      return (
                        <tr key={material.material_id} className="border-b border-[#6B4F3F]/10 hover:bg-[#FAF9F6]">
                          <td className="py-3 px-4 font-semibold text-[#3B2F2F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                            {material.name}
                          </td>
                          <td className="py-3 px-4">
                            {isEditing ? (
                              <div className="flex items-center">
                                <span className="mr-2 text-[#6B4F3F]">$</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={editingMaterial.price_per_unit}
                                  onChange={(e) => setEditingMaterial({ ...editingMaterial, price_per_unit: e.target.value })}
                                  className="w-24 px-2 py-1 border-2 border-[#D9A441] rounded focus:outline-none"
                                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                                />
                              </div>
                            ) : (
                              <span className="text-[#3B2F2F] font-semibold" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                                ${Number(material.price_per_unit || material.price_per_cubic_yard || 0).toFixed(2)}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {isEditing ? (
                              <select
                                value={editingMaterial.unit_type}
                                onChange={(e) => setEditingMaterial({ ...editingMaterial, unit_type: e.target.value })}
                                className="w-32 px-2 py-1 border-2 border-[#D9A441] rounded focus:outline-none"
                                style={{ fontFamily: 'Montserrat, sans-serif' }}
                              >
                                {UNIT_TYPES.map(unit => (
                                  <option key={unit} value={unit}>{unit}</option>
                                ))}
                              </select>
                            ) : (
                              <span className="text-[#6B4F3F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                                {material.unit_type || 'cubic yards'}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {isEditing ? (
                              <input
                                type="number"
                                min="1"
                                value={editingMaterial.min_order}
                                onChange={(e) => setEditingMaterial({ ...editingMaterial, min_order: e.target.value })}
                                className="w-20 px-2 py-1 border-2 border-[#D9A441] rounded focus:outline-none"
                                style={{ fontFamily: 'Montserrat, sans-serif' }}
                              />
                            ) : (
                              <span className="text-[#6B4F3F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                                {material.min_order}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {isEditing ? (
                              <input
                                type="number"
                                min="0"
                                value={editingMaterial.stock_quantity}
                                onChange={(e) => setEditingMaterial({ ...editingMaterial, stock_quantity: e.target.value })}
                                className="w-20 px-2 py-1 border-2 border-[#D9A441] rounded focus:outline-none"
                                style={{ fontFamily: 'Montserrat, sans-serif' }}
                              />
                            ) : (
                              <span className={`font-semibold ${getStockColor(material.stock_quantity || 0)}`} style={{ fontFamily: 'Montserrat, sans-serif' }}>
                                {material.stock_quantity || 0}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isEditing ? (
                              <div className="flex items-center justify-center space-x-2">
                                <button
                                  onClick={() => updateMaterialPricing(material.material_id)}
                                  disabled={isSaving}
                                  className="p-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors disabled:opacity-50"
                                  title="Save"
                                >
                                  {isSaving ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                  ) : (
                                    <Check size={16} />
                                  )}
                                </button>
                                <button
                                  onClick={cancelEditMaterial}
                                  disabled={isSaving}
                                  className="p-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors disabled:opacity-50"
                                  title="Cancel"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => startEditMaterial(material)}
                                className="p-2 bg-[#D9A441] text-[#3B2F2F] rounded hover:bg-[#3B2F2F] hover:text-white transition-colors"
                                title="Edit"
                              >
                                <Edit2 size={16} />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#6B4F3F]/20" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  <span className="text-sm text-[#6B4F3F]">
                    Showing {(currentPage - 1) * perPage + 1}–{Math.min(currentPage * perPage, filtered.length)} of {filtered.length}
                  </span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 rounded border border-[#6B4F3F]/20 text-sm disabled:opacity-30 hover:bg-[#FAF9F6]"
                    >Prev</button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                      <button
                        key={p}
                        onClick={() => setCurrentPage(p)}
                        className={`px-3 py-1 rounded text-sm ${p === currentPage ? 'bg-[#D9A441] text-[#3B2F2F] font-bold' : 'border border-[#6B4F3F]/20 hover:bg-[#FAF9F6]'}`}
                      >{p}</button>
                    ))}
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 rounded border border-[#6B4F3F]/20 text-sm disabled:opacity-30 hover:bg-[#FAF9F6]"
                    >Next</button>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}
      </div>

      {/* Import CSV Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-[#3B2F2F]" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                  Import Materials from CSV
                </h3>
                <button
                  onClick={() => { setShowImportModal(false); setCsvText(''); setImportResult(null); }}
                  className="text-[#6B4F3F] hover:text-[#3B2F2F]"
                >
                  <X size={24} />
                </button>
              </div>

              <p className="text-[#6B4F3F] mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Paste your CSV data below. Expected columns: <code className="bg-[#FAF9F6] px-1 rounded">name, price_per_unit, unit_type, min_order, stock_quantity, description</code>
              </p>

              <div className="bg-[#FAF9F6] rounded p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-[#6B4F3F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>Example format:</p>
                  <button
                    onClick={() => {
                      const csv = 'name,price_per_unit,unit_type,min_order,stock_quantity,description\nTopsoil,45.00,cubic yards,1,200,Premium garden topsoil\nGravel,55.00,cubic yards,2,150,Driveway gravel\nSand,40.00,cubic yards,1,180,Construction sand';
                      const blob = new Blob([csv], { type: 'text/csv' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'materials_template.csv';
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="flex items-center space-x-1 text-[#D9A441] hover:text-[#3B2F2F] transition-colors text-xs"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    <Download size={14} />
                    <span>Download Template</span>
                  </button>
                </div>
                <pre className="text-xs text-[#3B2F2F] bg-white p-3 rounded border" style={{ fontFamily: 'monospace' }}>
name,price_per_unit,unit_type,min_order,stock_quantity,description
Topsoil,45.00,cubic yards,1,200,Premium garden topsoil
Gravel,55.00,cubic yards,2,150,Driveway gravel
Sand,40.00,cubic yards,1,180,Construction sand
                </pre>
              </div>

              <textarea
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                className="w-full h-48 px-4 py-3 border-2 border-[#6B4F3F]/20 rounded focus:border-[#D9A441] focus:outline-none font-mono text-sm"
                style={{ fontFamily: 'monospace' }}
                placeholder="Paste CSV data here..."
              />

              {importResult && (
                <div className={`mt-4 p-4 rounded ${importResult.errors?.length ? 'bg-yellow-50 border border-yellow-200' : 'bg-green-50 border border-green-200'}`}>
                  <p className="font-semibold text-[#3B2F2F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Imported {importResult.imported} materials
                  </p>
                  {importResult.errors?.length > 0 && (
                    <ul className="mt-2 text-sm text-red-600" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      {importResult.errors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              <div className="flex space-x-4 pt-4">
                <button
                  onClick={async () => {
                    if (!csvText.trim()) return;
                    setImporting(true);
                    setImportResult(null);
                    try {
                      const token = localStorage.getItem('admin_token');
                      const res = await axios.post(
                        `${API}/admin/materials/import-csv`,
                        { csv_text: csvText },
                        { headers: { Authorization: `Bearer ${token}` } }
                      );
                      setImportResult(res.data);
                      setCsvText('');
                      fetchAllPricing();
                    } catch (error) {
                      setImportResult({ imported: 0, errors: [error.response?.data?.detail || 'Import failed'] });
                    } finally {
                      setImporting(false);
                    }
                  }}
                  disabled={!csvText.trim() || importing}
                  className="flex items-center justify-center space-x-2 flex-1 px-6 py-3 bg-[#D9A441] text-[#3B2F2F] font-bold rounded hover:bg-[#3B2F2F] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  {importing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                      <span>Importing...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={18} />
                      <span>Import CSV</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => { setShowImportModal(false); setCsvText(''); setImportResult(null); }}
                  className="flex-1 px-6 py-3 bg-gray-300 text-[#3B2F2F] font-bold rounded hover:bg-gray-400 transition-colors"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Material Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-[#3B2F2F]" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                  Add New Material
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-[#6B4F3F] hover:text-[#3B2F2F]"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[#3B2F2F] font-semibold mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Material Name *
                  </label>
                  <input
                    type="text"
                    value={newMaterial.name}
                    onChange={(e) => setNewMaterial({ ...newMaterial, name: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-[#6B4F3F]/20 rounded focus:border-[#D9A441] focus:outline-none"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                    placeholder="e.g., Premium Topsoil"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[#3B2F2F] font-semibold mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      Price per Unit *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={newMaterial.price_per_unit}
                      onChange={(e) => setNewMaterial({ ...newMaterial, price_per_unit: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-[#6B4F3F]/20 rounded focus:border-[#D9A441] focus:outline-none"
                      style={{ fontFamily: 'Montserrat, sans-serif' }}
                      placeholder="45.00"
                    />
                  </div>

                  <div>
                    <label className="block text-[#3B2F2F] font-semibold mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      Unit Type *
                    </label>
                    <select
                      value={newMaterial.unit_type}
                      onChange={(e) => setNewMaterial({ ...newMaterial, unit_type: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-[#6B4F3F]/20 rounded focus:border-[#D9A441] focus:outline-none"
                      style={{ fontFamily: 'Montserrat, sans-serif' }}
                    >
                      {UNIT_TYPES.map(unit => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[#3B2F2F] font-semibold mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      Minimum Order *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={newMaterial.min_order}
                      onChange={(e) => setNewMaterial({ ...newMaterial, min_order: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border-2 border-[#6B4F3F]/20 rounded focus:border-[#D9A441] focus:outline-none"
                      style={{ fontFamily: 'Montserrat, sans-serif' }}
                    />
                  </div>

                  <div>
                    <label className="block text-[#3B2F2F] font-semibold mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      Initial Stock Quantity *
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={newMaterial.stock_quantity}
                      onChange={(e) => setNewMaterial({ ...newMaterial, stock_quantity: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border-2 border-[#6B4F3F]/20 rounded focus:border-[#D9A441] focus:outline-none"
                      style={{ fontFamily: 'Montserrat, sans-serif' }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[#3B2F2F] font-semibold mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Image URL (optional)
                  </label>
                  <input
                    type="text"
                    value={newMaterial.image_url}
                    onChange={(e) => setNewMaterial({ ...newMaterial, image_url: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-[#6B4F3F]/20 rounded focus:border-[#D9A441] focus:outline-none"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div>
                  <label className="block text-[#3B2F2F] font-semibold mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Description (optional)
                  </label>
                  <textarea
                    value={newMaterial.description}
                    onChange={(e) => setNewMaterial({ ...newMaterial, description: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-[#6B4F3F]/20 rounded focus:border-[#D9A441] focus:outline-none"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                    rows="3"
                    placeholder="Brief description of the material"
                  />
                </div>

                <div className="flex space-x-4 pt-4">
                  <button
                    onClick={handleAddMaterial}
                    disabled={!newMaterial.name || !newMaterial.price_per_unit || savingId === 'new'}
                    className="flex-1 px-6 py-3 bg-[#D9A441] text-[#3B2F2F] font-bold rounded hover:bg-[#3B2F2F] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    {savingId === 'new' ? 'Adding...' : 'Add Material'}
                  </button>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-6 py-3 bg-gray-300 text-[#3B2F2F] font-bold rounded hover:bg-gray-400 transition-colors"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PricingManagementPage;
