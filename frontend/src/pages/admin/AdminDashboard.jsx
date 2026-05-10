import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Package, DollarSign, Truck, LogOut, Menu, X, Home, List, Box, Calendar } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const API = BACKEND_URL ? `${BACKEND_URL}/api` : '';

const defaultStats = {
  total_orders: 5,
  total_revenue: 1250.00,
  orders_by_status: { pending_payment: 1, processing: 1, in_delivery: 1, delivered: 2 },
  recent_orders: [
    { _id: "1", order_number: "ORD-2024-1000", customer: { name: "John Smith" }, pricing: { total: 250 }, status: "pending_payment", created_at: new Date().toISOString() },
    { _id: "2", order_number: "ORD-2024-1001", customer: { name: "Maria Garcia" }, pricing: { total: 175 }, status: "processing", created_at: new Date().toISOString() },
    { _id: "3", order_number: "ORD-2024-1002", customer: { name: "Tom Johnson" }, pricing: { total: 400 }, status: "in_delivery", created_at: new Date().toISOString() },
  ]
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(defaultStats);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      navigate('/admin/login', { replace: true });
      return;
    }
    
    if (!BACKEND_URL) {
      setStats(defaultStats);
      setLoading(false);
      return;
    }
    
    fetchStats();
  }, []);

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
      console.warn('Using demo data');
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D9A441]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] pb-20 md:pb-0">
      {/* Header - Mobile Friendly */}
      <header className="bg-[#3B2F2F] shadow-lg sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button 
                className="md:hidden text-white"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-white" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                  The Dirt Place
                </h1>
                <p className="text-[#D9A441] text-xs hidden md:block" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  Employee Portal
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-white hover:text-[#D9A441]"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <nav className="bg-white shadow-md md:hidden">
          <div className="px-4 py-2 space-y-2">
            <Link to="/admin/dashboard" className="block py-2 text-[#D9A441] font-semibold" onClick={() => setMobileMenuOpen(false)}>
              Dashboard
            </Link>
            <Link to="/admin/orders" className="block py-2 text-[#6B4F3F] hover:text-[#D9A441]" onClick={() => setMobileMenuOpen(false)}>
              Orders
            </Link>
            <Link to="/admin/pricing" className="block py-2 text-[#6B4F3F] hover:text-[#D9A441]" onClick={() => setMobileMenuOpen(false)}>
              Materials
            </Link>
            <Link to="/admin/drivers" className="block py-2 text-[#6B4F3F] hover:text-[#D9A441]" onClick={() => setMobileMenuOpen(false)}>
              Drivers
            </Link>
            <Link to="/admin/inventory" className="block py-2 text-[#6B4F3F] hover:text-[#D9A441]" onClick={() => setMobileMenuOpen(false)}>
              Inventory
            </Link>
          </div>
        </nav>
      )}

      {/* Desktop Navigation */}
      <nav className="hidden md:block bg-white shadow">
        <div className="container mx-auto px-4">
          <div className="flex space-x-8">
            <Link to="/admin/dashboard" className="px-4 py-4 border-b-2 border-[#D9A441] text-[#D9A441] font-semibold">
              Dashboard
            </Link>
            <Link to="/admin/orders" className="px-4 py-4 text-[#6B4F3F] hover:text-[#D9A441] font-semibold">
              Orders
            </Link>
            <Link to="/admin/pricing" className="px-4 py-4 text-[#6B4F3F] hover:text-[#D9A441] font-semibold">
              Materials
            </Link>
            <Link to="/admin/drivers" className="px-4 py-4 text-[#6B4F3F] hover:text-[#D9A441] font-semibold">
              Drivers
            </Link>
            <Link to="/admin/inventory" className="px-4 py-4 text-[#6B4F3F] hover:text-[#D9A441] font-semibold">
              Inventory
            </Link>
          </div>
        </div>
      </nav>

      <div className="p-4 md:p-8">
        {/* Mobile Stats - Single Column */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-4 md:p-6">
            <div className="flex items-center justify-between mb-2 md:mb-4">
              <div className="w-10 md:w-12 h-10 md:h-12 bg-[#D9A441] rounded-full flex items-center justify-center">
                <Package size={20} className="text-[#3B2F2F]" />
              </div>
            </div>
            <p className="text-xl md:text-4xl font-bold text-[#3B2F2F]" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
              {stats?.total_orders || 0}
            </p>
            <p className="text-xs md:text-sm text-[#6B4F3F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>Orders</p>
          </div>

          <div className="bg-white rounded-lg shadow p-4 md:p-6">
            <div className="flex items-center justify-between mb-2 md:mb-4">
              <div className="w-10 md:w-12 h-10 md:h-12 bg-[#6B7A3A] rounded-full flex items-center justify-center">
                <DollarSign size={20} className="text-white" />
              </div>
            </div>
            <p className="text-xl md:text-4xl font-bold text-[#3B2F2F]" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
              ${Number(stats?.total_revenue || 0).toFixed(0)}
            </p>
            <p className="text-xs md:text-sm text-[#6B4F3F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>Revenue</p>
          </div>

          <div className="bg-white rounded-lg shadow p-4 md:p-6">
            <div className="flex items-center justify-between mb-2 md:mb-4">
              <div className="w-10 md:w-12 h-10 md:h-12 bg-blue-500 rounded-full flex items-center justify-center">
                <Truck size={20} className="text-white" />
              </div>
            </div>
            <p className="text-xl md:text-4xl font-bold text-[#3B2F2F]" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
              {stats?.orders_by_status?.processing || 0}
            </p>
            <p className="text-xs md:text-sm text-[#6B4F3F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>Processing</p>
          </div>

          <div className="bg-white rounded-lg shadow p-4 md:p-6">
            <div className="flex items-center justify-between mb-2 md:mb-4">
              <div className="w-10 md:w-12 h-10 md:h-12 bg-green-500 rounded-full flex items-center justify-center">
                <Box size={20} className="text-white" />
              </div>
            </div>
            <p className="text-xl md:text-4xl font-bold text-[#3B2F2F]" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
              {stats?.orders_by_status?.delivered || 0}
            </p>
            <p className="text-xs md:text-sm text-[#6B4F3F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>Delivered</p>
          </div>
        </div>

        {/* Recent Orders - Mobile Card View */}
        <h2 className="text-xl md:text-2xl font-bold text-[#3B2F2F] mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
          Recent Orders
        </h2>
        
        <div className="space-y-3 md:hidden">
          {stats?.recent_orders?.map((order) => (
            <div key={order._id} className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-start mb-2">
                <span className="font-bold text-[#3B2F2F]">{order.order_number}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                  {order.status.replace('_', ' ')}
                </span>
              </div>
              <p className="text-sm text-[#6B4F3F]">{order.customer?.name}</p>
              <p className="text-lg font-bold text-[#3B2F2F]">${order.pricing?.total}</p>
            </div>
          ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block bg-white rounded-lg shadow-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#FAF9F6] border-b-2 border-[#6B4F3F]/20">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-[#3B2F2F]">Order #</th>
                <th className="text-left py-3 px-4 font-semibold text-[#3B2F2F]">Customer</th>
                <th className="text-left py-3 px-4 font-semibold text-[#3B2F2F]">Amount</th>
                <th className="text-left py-3 px-4 font-semibold text-[#3B2F2F]">Status</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recent_orders?.map((order) => (
                <tr key={order._id} className="border-b border-[#6B4F3F]/10 hover:bg-[#FAF9F6]">
                  <td className="py-3 px-4 font-semibold text-[#3B2F2F]">{order.order_number}</td>
                  <td className="py-3 px-4 text-[#6B4F3F]">{order.customer?.name}</td>
                  <td className="py-3 px-4 text-[#3B2F2F] font-semibold">${order.pricing?.total}</td>
                  <td className="py-3 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                      {order.status.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 text-center hidden md:block">
          <Link to="/admin/orders" className="inline-block px-6 py-3 bg-[#D9A441] text-[#3B2F2F] font-bold rounded hover:bg-[#3B2F2F] hover:text-white transition-colors">
            View All Orders
          </Link>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 md:hidden z-50">
        <div className="flex justify-around py-2">
          <Link to="/admin/dashboard" className="flex flex-col items-center text-[#D9A441]">
            <Home size={20} />
            <span className="text-xs">Home</span>
          </Link>
          <Link to="/admin/orders" className="flex flex-col items-center text-[#6B4F3F]">
            <List size={20} />
            <span className="text-xs">Orders</span>
          </Link>
          <Link to="/admin/drivers" className="flex flex-col items-center text-[#6B4F3F]">
            <Calendar size={20} />
            <span className="text-xs">Drivers</span>
          </Link>
          <Link to="/admin/inventory" className="flex flex-col items-center text-[#6B4F3F]">
            <Box size={20} />
            <span className="text-xs">Inventory</span>
          </Link>
        </div>
      </nav>
    </div>
  );
};

export default AdminDashboard;
