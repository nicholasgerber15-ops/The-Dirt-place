import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Package, LogOut, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const InventoryPage = () => {
  const navigate = useNavigate();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin_token');
      
      const response = await axios.get(`${API}/admin/inventory`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setInventory(response.data.inventory);
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('admin_token');
        navigate('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    navigate('/admin/login');
  };

  const getStockStatusBadge = (status, stock) => {
    const badges = {
      out_of_stock: {
        bg: 'bg-red-100',
        text: 'text-red-800',
        border: 'border-red-300',
        label: 'Out of Stock',
        icon: <AlertTriangle size={16} />
      },
      low_stock: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        border: 'border-yellow-300',
        label: 'Low Stock',
        icon: <TrendingDown size={16} />
      },
      in_stock: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        border: 'border-green-300',
        label: 'In Stock',
        icon: <TrendingUp size={16} />
      }
    };

    const badge = badges[status] || badges.in_stock;

    return (
      <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border ${badge.bg} ${badge.text} ${badge.border}`}>
        {badge.icon}
        <span className="font-semibold text-sm">{badge.label}</span>
      </div>
    );
  };

  const filteredInventory = inventory.filter(item => {
    if (filter === 'all') return true;
    return item.stock_status === filter;
  });

  const stats = {
    total: inventory.length,
    in_stock: inventory.filter(i => i.stock_status === 'in_stock').length,
    low_stock: inventory.filter(i => i.stock_status === 'low_stock').length,
    out_of_stock: inventory.filter(i => i.stock_status === 'out_of_stock').length,
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
                Inventory Management
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
              className="px-4 py-4 text-[#6B4F3F] hover:text-[#D9A441] font-semibold transition-colors"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Materials & Pricing
            </Link>
            <Link
              to="/admin/inventory"
              className="px-4 py-4 border-b-2 border-[#D9A441] text-[#D9A441] font-semibold"
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
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-[#D9A441] rounded-full flex items-center justify-center">
                    <Package size={24} className="text-[#3B2F2F]" />
                  </div>
                  <span className="text-sm text-[#6B4F3F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>Total Materials</span>
                </div>
                <p className="text-4xl font-bold text-[#3B2F2F]" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                  {stats.total}
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                    <TrendingUp size={24} className="text-white" />
                  </div>
                  <span className="text-sm text-[#6B4F3F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>In Stock</span>
                </div>
                <p className="text-4xl font-bold text-green-600" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                  {stats.in_stock}
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
                    <AlertTriangle size={24} className="text-white" />
                  </div>
                  <span className="text-sm text-[#6B4F3F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>Low Stock</span>
                </div>
                <p className="text-4xl font-bold text-yellow-600" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                  {stats.low_stock}
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                    <TrendingDown size={24} className="text-white" />
                  </div>
                  <span className="text-sm text-[#6B4F3F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>Out of Stock</span>
                </div>
                <p className="text-4xl font-bold text-red-600" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                  {stats.out_of_stock}
                </p>
              </div>
            </div>

            {/* Inventory Table */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-[#3B2F2F]" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                  Inventory Status
                </h2>
                
                <div className="flex items-center space-x-2">
                  <label className="text-[#6B4F3F] font-semibold" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Filter:
                  </label>
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="px-4 py-2 border-2 border-[#6B4F3F]/20 rounded focus:border-[#D9A441] focus:outline-none"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    <option value="all">All Materials</option>
                    <option value="in_stock">In Stock</option>
                    <option value="low_stock">Low Stock</option>
                    <option value="out_of_stock">Out of Stock</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-[#6B4F3F]/20">
                      <th className="text-left py-3 px-4 font-semibold text-[#3B2F2F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>Material</th>
                      <th className="text-left py-3 px-4 font-semibold text-[#3B2F2F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>Unit Type</th>
                      <th className="text-left py-3 px-4 font-semibold text-[#3B2F2F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>Stock Quantity</th>
                      <th className="text-left py-3 px-4 font-semibold text-[#3B2F2F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>Price per Unit</th>
                      <th className="text-left py-3 px-4 font-semibold text-[#3B2F2F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInventory.map((item) => (
                      <tr key={item.material_id} className="border-b border-[#6B4F3F]/10 hover:bg-[#FAF9F6]">
                        <td className="py-3 px-4 font-semibold text-[#3B2F2F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                          {item.name}
                        </td>
                        <td className="py-3 px-4 text-[#6B4F3F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                          {item.unit_type || 'cubic yards'}
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-2xl font-bold text-[#3B2F2F]" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                            {item.stock_quantity || 0}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[#6B4F3F] font-semibold" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                          ${Number(item.price_per_unit || item.price_per_cubic_yard || 0).toFixed(2)}
                        </td>
                        <td className="py-3 px-4">
                          {getStockStatusBadge(item.stock_status, item.stock_quantity)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredInventory.length === 0 && (
                <div className="text-center py-12">
                  <Package size={48} className="mx-auto text-[#6B4F3F] mb-4 opacity-50" />
                  <p className="text-[#6B4F3F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    No materials found with this filter
                  </p>
                </div>
              )}

              <div className="mt-6 p-4 bg-yellow-50 border-2 border-yellow-300 rounded">
                <p className="text-sm text-yellow-800" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  <strong>Note:</strong> Stock quantities automatically decrease when orders are paid. Low stock threshold is 20 units. 
                  Update stock levels in the <Link to="/admin/pricing" className="underline font-semibold">Materials & Pricing</Link> page.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default InventoryPage;
