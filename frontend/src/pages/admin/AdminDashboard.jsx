import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Package, DollarSign, TrendingUp, Clock, LogOut, Settings, ShoppingBag } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const API = `${BACKEND_URL}/api`;

const defaultStats = {
  total_orders: 0,
  total_revenue: 0,
  orders_by_status: { pending_payment: 0, processing: 0, in_delivery: 0, delivered: 0 },
  recent_orders: []
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(defaultStats);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token && BACKEND_URL) {
      navigate('/admin/login');
      return;
    }
    if (!BACKEND_URL) {
      setStats(defaultStats);
      setLoading(false);
      return;
    }
    fetchStats();
  }, [navigate]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000
      });
      if (response.data && Object.keys(response.data).length > 0) {
        setStats(response.data);
      }
    } catch (error) {
      console.warn('Using offline mode - backend unavailable');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    navigate('/admin/login');
  };

  const getStatusColor = (status) => {
    const colors = {
      pending_payment: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      in_delivery: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#D9A441]"></div>
      </div>
    );
  }

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
                Management Portal
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
              className="px-4 py-4 border-b-2 border-[#D9A441] text-[#D9A441] font-semibold"
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
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-[#D9A441] rounded-full flex items-center justify-center">
                <Package size={24} className="text-[#3B2F2F]" />
              </div>
              <span className="text-sm text-[#6B4F3F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>Total Orders</span>
            </div>
            <p className="text-4xl font-bold text-[#3B2F2F]" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
              {stats?.total_orders || 0}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-[#6B7A3A] rounded-full flex items-center justify-center">
                <DollarSign size={24} className="text-white" />
              </div>
              <span className="text-sm text-[#6B4F3F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>Total Revenue</span>
            </div>
            <p className="text-4xl font-bold text-[#3B2F2F]" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
              ${Number(stats?.total_revenue || 0).toFixed(2)}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                <Clock size={24} className="text-white" />
              </div>
              <span className="text-sm text-[#6B4F3F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>Processing</span>
            </div>
            <p className="text-4xl font-bold text-[#3B2F2F]" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
              {stats?.orders_by_status?.processing || 0}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <TrendingUp size={24} className="text-white" />
              </div>
              <span className="text-sm text-[#6B4F3F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>Delivered</span>
            </div>
            <p className="text-4xl font-bold text-[#3B2F2F]" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
              {stats?.orders_by_status?.delivered || 0}
            </p>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-3xl font-bold text-[#3B2F2F] mb-6" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
            Recent Orders
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-[#6B4F3F]/20">
                  <th className="text-left py-3 px-4 font-semibold text-[#3B2F2F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>Order #</th>
                  <th className="text-left py-3 px-4 font-semibold text-[#3B2F2F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>Customer</th>
                  <th className="text-left py-3 px-4 font-semibold text-[#3B2F2F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>Amount</th>
                  <th className="text-left py-3 px-4 font-semibold text-[#3B2F2F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-[#3B2F2F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {stats?.recent_orders?.map((order) => (
                  <tr key={order._id} className="border-b border-[#6B4F3F]/10 hover:bg-[#FAF9F6]">
                    <td className="py-3 px-4 font-semibold text-[#3B2F2F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      {order.order_number}
                    </td>
                    <td className="py-3 px-4 text-[#6B4F3F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      {order.customer.name}
                    </td>
                    <td className="py-3 px-4 text-[#3B2F2F] font-semibold" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      ${Number(order.pricing.total).toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`} style={{ fontFamily: 'Montserrat, sans-serif' }}>
                        {order.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#6B4F3F] text-sm" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 text-center">
            <Link
              to="/admin/orders"
              className="inline-block px-6 py-3 bg-[#D9A441] text-[#3B2F2F] font-bold rounded hover:bg-[#3B2F2F] hover:text-white transition-colors"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              View All Orders
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
