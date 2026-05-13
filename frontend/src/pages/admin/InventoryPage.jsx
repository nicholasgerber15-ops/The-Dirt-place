import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Package, LogOut, AlertTriangle, TrendingUp, TrendingDown, Check, Image, FileText, Plus, X, DollarSign, Upload, Download, Tag, FileSpreadsheet } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const UNIT_TYPES = ['1/2 yard', 'cubic yards', 'tons', 'bags', 'pallets', 'square feet', 'half yard'];
const CATEGORIES = ['Aggregate', 'Soil', 'Mulch', 'Decorative Stone', 'Sand', 'Gravel', 'Concrete', 'Other'];

const InventoryPage = () => {
  const navigate = useNavigate();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [showAddRow, setShowAddRow] = useState(false);
  const [newRow, setNewRow] = useState({
    name: '',
    image_url: '',
    product_details: '',
    category: 'Aggregate',
    tags: '',
    unit_type: 'cubic yards',
    stock_quantity: 0,
    price_per_unit: '',
    min_order: 1,
    is_visible: true
  });
  const [uploadingImage, setUploadingImage] = useState(null);

  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin_token');

      const response = await axios.get(`${API}/admin/pricing`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setInventory(response.data.pricing || []);
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('admin_token');
        navigate('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    fetchInventory();
  }, [navigate, fetchInventory]);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    navigate('/admin/login');
  };

  const handleCellClick = (material_id, field, currentValue) => {
    setEditingCell({ material_id, field });
    setEditValue(String(currentValue || ''));
  };

  const handleImageUpload = async (material_id, event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploadingImage(material_id);
    try {
      const token = localStorage.getItem('admin_token');
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(`${API}/admin/upload-image`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        await axios.put(`${API}/admin/materials/${material_id}`, {
          image_url: response.data.url
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });

        setInventory(inventory.map(item => {
          if (item.material_id === material_id) {
            return { ...item, image_url: response.data.url };
          }
          return item;
        }));

        setSaveMessage('Image uploaded!');
        setTimeout(() => setSaveMessage(''), 2000);
      }
    } catch (error) {
      console.error('Failed to upload image:', error);
      setSaveMessage('Upload failed');
    } finally {
      setUploadingImage(null);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingCell) return;

    setSaving(true);
    setSaveMessage('');

    try {
      const token = localStorage.getItem('admin_token');
      const { material_id, field } = editingCell;

      const updateData = {};
      if (field === 'stock_quantity') {
        updateData.stock_quantity = editValue === '' ? null : (parseInt(editValue) || 0);
      } else if (field === 'price_per_unit') {
        updateData.price_per_unit = editValue === '' ? null : (parseFloat(editValue) || 0);
      } else if (field === 'min_order') {
        updateData.min_order = editValue === '' ? null : (parseInt(editValue) || 1);
      } else if (field === 'unit_type') {
        updateData.unit_type = editValue;
      } else if (field === 'name') {
        updateData.name = editValue;
      } else if (field === 'image_url') {
        updateData.image_url = editValue;
      } else if (field === 'product_details') {
        updateData.product_details = editValue;
      } else if (field === 'category') {
        updateData.category = editValue;
      } else if (field === 'tags') {
        updateData.tags = editValue;
      }

      await axios.put(`${API}/admin/materials/${material_id}`, updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setInventory(inventory.map(item => {
        if (item.material_id === material_id) {
          return { ...item, ...updateData };
        }
        return item;
      }));

      setSaveMessage('Saved!');
      setTimeout(() => setSaveMessage(''), 2000);
    } catch (error) {
      console.error('Failed to save:', error);
      setSaveMessage('Error saving');
    } finally {
      setSaving(false);
      setEditingCell(null);
    }
  };

  const handleToggleShowOnFrontend = async (material_id, currentStatus) => {
    try {
      const token = localStorage.getItem('admin_token');
      const newStatus = !currentStatus;

      await axios.put(`${API}/admin/materials/${material_id}`, {
        is_visible: newStatus
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setInventory(inventory.map(item => {
        if (item.material_id === material_id) {
          return { ...item, is_visible: newStatus };
        }
        return item;
      }));
    } catch (error) {
      console.error('Failed to toggle visibility:', error);
    }
  };

  const handleAddNewRow = async () => {
    if (!newRow.name || !newRow.price_per_unit) {
      alert('Name and price are required');
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('admin_token');

      const materialData = {
        ...newRow,
        price_per_unit: parseFloat(newRow.price_per_unit) || 0,
        min_order: parseInt(newRow.min_order) || 1,
        stock_quantity: parseInt(newRow.stock_quantity) || 0
      };

      const response = await axios.post(
        `${API}/admin/materials`,
        materialData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setInventory([...inventory, response.data.material || materialData]);
      setNewRow({
        name: '',
        image_url: '',
        product_details: '',
        category: 'Aggregate',
        tags: '',
        unit_type: 'cubic yards',
        stock_quantity: 0,
        price_per_unit: '',
        min_order: 1,
        is_visible: true
      });
      setShowAddRow(false);
      setSaveMessage('Material added!');
      setTimeout(() => setSaveMessage(''), 2000);
    } catch (error) {
      console.error('Failed to add material:', error);
      setSaveMessage('Error adding');
    } finally {
      setSaving(false);
    }
  };

  const exportCSV = () => {
    const headers = ['name', 'category', 'tags', 'unit_type', 'stock_quantity', 'price_per_unit', 'min_order', 'image_url', 'product_details', 'is_visible'];
    const csvRows = [
      headers.join(','),
      ...filteredInventory.map(item =>
        headers.map(h => {
          let val = item[h] || '';
          if (typeof val === 'boolean') val = val ? 'true' : 'false';
          if (typeof val === 'string' && val.includes(',')) val = `"${val}"`;
          return val;
        }).join(',')
      )
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    setSaveMessage('CSV exported!');
    setTimeout(() => setSaveMessage(''), 2000);
  };

  const importCSV = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target.result;
        const lines = text.split('\n').filter(l => l.trim());
        const headers = lines[0].split(',').map(h => h.trim());

        const token = localStorage.getItem('admin_token');
        let added = 0;

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',');
          const row = {};
          headers.forEach((h, idx) => {
            row[h] = values[idx]?.trim() || '';
          });

          if (!row.name || !row.price_per_unit) continue;

          await axios.post(
            `${API}/admin/materials`,
            {
              name: row.name,
              category: row.category || 'Other',
              tags: row.tags || '',
              unit_type: row.unit_type || 'cubic yards',
              stock_quantity: parseInt(row.stock_quantity) || 0,
              price_per_unit: parseFloat(row.price_per_unit) || 0,
              min_order: parseInt(row.min_order) || 1,
              image_url: row.image_url || '',
              product_details: row.product_details || '',
              is_visible: row.is_visible === 'true'
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          added++;
        }

        setSaveMessage(`Imported ${added} materials!`);
        setTimeout(() => setSaveMessage(''), 3000);
        fetchInventory();
      } catch (error) {
        console.error('Import failed:', error);
        setSaveMessage('Import failed');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const getStockStatusBadge = (item) => {
    const stock = item.stock_quantity || 0;
    if (stock === 0) {
      return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Out</span>;
    } else if (stock < 20) {
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">Low</span>;
    }
    return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">In</span>;
  };

  const filteredInventory = inventory.filter(item => {
    if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
    if (filter === 'all') return true;
    if (filter === 'out_of_stock') return (item.stock_quantity || 0) === 0;
    if (filter === 'low_stock') return (item.stock_quantity || 0) > 0 && (item.stock_quantity || 0) < 20;
    if (filter === 'in_stock') return (item.stock_quantity || 0) >= 20;
    return true;
  });

  const renderCell = (item, field) => {
    const isEditing = editingCell?.material_id === item.material_id && editingCell?.field === field;

    if (isEditing) {
      if (field === 'unit_type' || field === 'category') {
        const options = field === 'category' ? CATEGORIES : UNIT_TYPES;
        return (
          <select
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSaveEdit}
            onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
            className="w-full px-1 py-0 border-2 border-[#D9A441] rounded text-sm"
            autoFocus
          >
            {options.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        );
      }
      return (
        <input
          type={field === 'stock_quantity' || field === 'min_order' || field === 'price_per_unit' ? 'number' : 'text'}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSaveEdit}
          onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
          className="w-full px-1 py-0 border-2 border-[#D9A441] rounded text-sm"
          step={field === 'price_per_unit' ? '0.01' : '1'}
          autoFocus
        />
      );
    }

    switch (field) {
      case 'name':
        return (
          <span
            className="cursor-pointer hover:text-[#D9A441]"
            onClick={() => handleCellClick(item.material_id, 'name', item.name)}
          >
            {item.name}
          </span>
        );
      case 'category':
        return (
          <span
            className="cursor-pointer hover:text-[#D9A441] text-sm"
            onClick={() => handleCellClick(item.material_id, 'category', item.category || 'Other')}
          >
            {item.category || 'Other'}
          </span>
        );
      case 'tags':
        return (
          <span
            className="cursor-pointer hover:text-[#D9A441] text-xs"
            onClick={() => handleCellClick(item.material_id, 'tags', item.tags || '')}
          >
            {item.tags ? (
              <div className="flex flex-wrap gap-1">
                {item.tags.split(',').map((tag, idx) => (
                  <span key={idx} className="px-1 bg-[#D9A441]/20 text-[#3B2F2F] rounded text-xs">{tag.trim()}</span>
                ))}
              </div>
            ) : (
              <span className="text-gray-400 italic">Add tags...</span>
            )}
          </span>
        );
      case 'image_url':
        return (
          <div className="flex items-center space-x-1">
            <div
              className="cursor-pointer"
              onClick={() => handleCellClick(item.material_id, 'image_url', item.image_url || '')}
            >
              {item.image_url ? (
                <img src={item.image_url} alt="" className="w-10 h-10 object-cover rounded border" />
              ) : (
                <div className="w-10 h-10 bg-gray-200 rounded border flex items-center justify-center">
                  <Image size={16} className="text-gray-400" />
                </div>
              )}
            </div>
            <label className="cursor-pointer">
              <Upload size={14} className="text-[#6B4F3F] hover:text-[#D9A441]" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImageUpload(item.material_id, e)}
                disabled={uploadingImage === item.material_id}
              />
            </label>
            {uploadingImage === item.material_id && (
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-[#D9A441]"></div>
            )}
          </div>
        );
      case 'product_details':
        return (
          <div
            className="cursor-pointer max-w-xs"
            onClick={() => handleCellClick(item.material_id, 'product_details', item.product_details || '')}
          >
            {item.product_details ? (
              <p className="text-xs text-[#6B4F3F] truncate">{item.product_details}</p>
            ) : (
              <span className="text-xs text-gray-400 italic">Add...</span>
            )}
          </div>
        );
      case 'unit_type':
        return (
          <span
            className="cursor-pointer hover:text-[#D9A441] text-sm"
            onClick={() => handleCellClick(item.material_id, 'unit_type', item.unit_type || 'cubic yards')}
          >
            {item.unit_type || 'cubic yards'}
          </span>
        );
      case 'stock_quantity':
        return (
          <span
            className="cursor-pointer hover:text-[#D9A441] font-bold"
            onClick={() => handleCellClick(item.material_id, 'stock_quantity', item.stock_quantity || 0)}
          >
            {item.stock_quantity || 0}
          </span>
        );
      case 'price_per_unit':
        return (
          <span
            className="cursor-pointer hover:text-[#D9A441] font-bold"
            onClick={() => handleCellClick(item.material_id, 'price_per_unit', item.price_per_unit || 0)}
          >
            ${Number(item.price_per_unit || 0).toFixed(2)}
          </span>
        );
      case 'min_order':
        return (
          <span
            className="cursor-pointer hover:text-[#D9A441]"
            onClick={() => handleCellClick(item.material_id, 'min_order', item.min_order || 1)}
          >
            {item.min_order || 1}
          </span>
        );
      default:
        return null;
    }
  };

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
                Materials & Inventory
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
            <Link to="/admin/dashboard" className="px-4 py-4 text-[#6B4F3F] hover:text-[#D9A441] font-semibold transition-colors" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Dashboard
            </Link>
            <Link to="/admin/orders" className="px-4 py-4 text-[#6B4F3F] hover:text-[#D9A441] font-semibold transition-colors" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Orders
            </Link>
            <Link to="/admin/inventory" className="px-4 py-4 border-b-2 border-[#D9A441] text-[#D9A441] font-semibold" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Materials & Inventory
            </Link>
            <Link to="/admin/settings" className="px-4 py-4 text-[#6B4F3F] hover:text-[#D9A441] font-semibold transition-colors" style={{ fontFamily: 'Montserrat, sans-serif' }}>
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
          <>
            {/* Header Row */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-[#3B2F2F]" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                Materials & Inventory
              </h2>
              <div className="flex items-center space-x-4">
                {saveMessage && (
                  <span className={`text-sm font-semibold ${saveMessage.includes('Error') || saveMessage.includes('failed') ? 'text-red-600' : 'text-green-600'}`}>
                    {saveMessage}
                  </span>
                )}
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-4 py-2 border-2 border-[#6B4F3F]/20 rounded focus:border-[#D9A441] focus:outline-none"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  <option value="all">All Categories</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="px-4 py-2 border-2 border-[#6B4F3F]/20 rounded focus:border-[#D9A441] focus:outline-none"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  <option value="all">All Stock</option>
                  <option value="in_stock">In Stock</option>
                  <option value="low_stock">Low Stock</option>
                  <option value="out_of_stock">Out of Stock</option>
                </select>
                <button
                  onClick={exportCSV}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-200 text-[#3B2F2F] font-bold rounded hover:bg-gray-300 transition-colors"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                  title="Export to CSV"
                >
                  <Download size={18} />
                  <span>Export CSV</span>
                </button>
                <label className="flex items-center space-x-2 px-4 py-2 bg-gray-200 text-[#3B2F2F] font-bold rounded hover:bg-gray-300 transition-colors cursor-pointer" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  <FileSpreadsheet size={18} />
                  <span>Import CSV</span>
                  <input type="file" accept=".csv" className="hidden" onChange={importCSV} />
                </label>
                <button
                  onClick={() => setShowAddRow(!showAddRow)}
                  className="flex items-center space-x-2 px-4 py-2 bg-[#6B7A3A] text-white font-bold rounded hover:bg-[#3B2F2F] transition-colors"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  {showAddRow ? <X size={18} /> : <Plus size={18} />}
                  <span>{showAddRow ? 'Cancel' : 'Add Material'}</span>
                </button>
              </div>
            </div>

            {/* Spreadsheet Table */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-[#3B2F2F] text-white">
                      <th className="text-left py-3 px-3 font-semibold">Material</th>
                      <th className="text-left py-3 px-3 font-semibold">Category</th>
                      <th className="text-left py-3 px-3 font-semibold">Tags</th>
                      <th className="text-left py-3 px-3 font-semibold">Image</th>
                      <th className="text-left py-3 px-3 font-semibold">Instructions</th>
                      <th className="text-left py-3 px-3 font-semibold">Unit Type</th>
                      <th className="text-right py-3 px-3 font-semibold">Stock</th>
                      <th className="text-right py-3 px-3 font-semibold">Price/Unit</th>
                      <th className="text-right py-3 px-3 font-semibold">Min Order</th>
                      <th className="text-center py-3 px-3 font-semibold">Visible</th>
                      <th className="text-center py-3 px-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInventory.map((item) => (
                      <tr key={item.material_id} className="border-b border-[#6B4F3F]/10 hover:bg-[#FAF9F6]">
                        <td className="py-2 px-3 font-semibold text-[#3B2F2F]">{renderCell(item, 'name')}</td>
                        <td className="py-2 px-3">{renderCell(item, 'category')}</td>
                        <td className="py-2 px-3 max-w-[120px]">{renderCell(item, 'tags')}</td>
                        <td className="py-2 px-3">{renderCell(item, 'image_url')}</td>
                        <td className="py-2 px-3 max-w-[150px]">{renderCell(item, 'product_details')}</td>
                        <td className="py-2 px-3">{renderCell(item, 'unit_type')}</td>
                        <td className="py-2 px-3 text-right">{renderCell(item, 'stock_quantity')}</td>
                        <td className="py-2 px-3 text-right">{renderCell(item, 'price_per_unit')}</td>
                        <td className="py-2 px-3 text-right">{renderCell(item, 'min_order')}</td>
                        <td className="py-2 px-3 text-center">
                          <button
                            onClick={() => handleToggleShowOnFrontend(item.material_id, item.is_visible)}
                            className={`relative inline-flex items-center h-5 w-9 rounded-full transition-colors ${item.is_visible ? 'bg-[#D9A441]' : 'bg-gray-300'}`}
                          >
                            <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${item.is_visible ? 'translate-x-5' : 'translate-x-1'}`} />
                          </button>
                        </td>
                        <td className="py-2 px-3 text-center">{getStockStatusBadge(item)}</td>
                      </tr>
                    ))}

                    {/* Add New Row */}
                    {showAddRow && (
                      <tr className="bg-[#FAF9F6] border-b-2 border-[#D9A441]">
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            placeholder="Material name"
                            value={newRow.name}
                            onChange={(e) => setNewRow({...newRow, name: e.target.value})}
                            className="w-full px-2 py-1 border rounded text-sm"
                            autoFocus
                          />
                        </td>
                        <td className="py-2 px-3">
                          <select
                            value={newRow.category}
                            onChange={(e) => setNewRow({...newRow, category: e.target.value})}
                            className="w-full px-2 py-1 border rounded text-sm"
                          >
                            {CATEGORIES.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            placeholder="tag1, tag2"
                            value={newRow.tags}
                            onChange={(e) => setNewRow({...newRow, tags: e.target.value})}
                            className="w-full px-2 py-1 border rounded text-sm"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <div className="flex items-center space-x-1">
                            <input
                              type="text"
                              placeholder="Image URL"
                              value={newRow.image_url}
                              onChange={(e) => setNewRow({...newRow, image_url: e.target.value})}
                              className="flex-1 px-2 py-1 border rounded text-sm"
                            />
                            <label className="cursor-pointer">
                              <Upload size={14} className="text-[#6B4F3F] hover:text-[#D9A441]" />
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files[0];
                                  if (!file) return;
                                  const token = localStorage.getItem('admin_token');
                                  const formData = new FormData();
                                  formData.append('file', file);
                                  try {
                                    const res = await axios.post(`${API}/admin/upload-image`, formData, {
                                      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
                                    });
                                    if (res.data.success) {
                                      setNewRow({...newRow, image_url: res.data.url});
                                    }
                                  } catch (err) {
                                    console.error('Upload failed', err);
                                  }
                                }}
                              />
                            </label>
                          </div>
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            placeholder="Instructions"
                            value={newRow.product_details}
                            onChange={(e) => setNewRow({...newRow, product_details: e.target.value})}
                            className="w-full px-2 py-1 border rounded text-sm"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <select
                            value={newRow.unit_type}
                            onChange={(e) => setNewRow({...newRow, unit_type: e.target.value})}
                            className="w-full px-2 py-1 border rounded text-sm"
                          >
                            {UNIT_TYPES.map(unit => (
                              <option key={unit} value={unit}>{unit}</option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            placeholder="0"
                            value={newRow.stock_quantity}
                            onChange={(e) => setNewRow({...newRow, stock_quantity: e.target.value})}
                            className="w-full px-2 py-1 border rounded text-sm text-right"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={newRow.price_per_unit}
                            onChange={(e) => setNewRow({...newRow, price_per_unit: e.target.value})}
                            className="w-full px-2 py-1 border rounded text-sm text-right"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            placeholder="1"
                            value={newRow.min_order}
                            onChange={(e) => setNewRow({...newRow, min_order: e.target.value})}
                            className="w-full px-2 py-1 border rounded text-sm text-right"
                          />
                        </td>
                        <td className="py-2 px-3 text-center">
                          <button
                            onClick={handleAddNewRow}
                            disabled={saving}
                            className="px-3 py-1 bg-[#D9A441] text-[#3B2F2F] text-xs font-bold rounded hover:bg-[#3B2F2F] hover:text-white transition-colors disabled:opacity-50"
                          >
                            {saving ? '...' : 'Add'}
                          </button>
                        </td>
                        <td className="py-2 px-3"></td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {filteredInventory.length === 0 && !showAddRow && (
                <div className="text-center py-12">
                  <Package size={48} className="mx-auto text-[#6B4F3F] mb-4 opacity-50" />
                  <p className="text-[#6B4F3F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    No materials found with this filter
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default InventoryPage;
