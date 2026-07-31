import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Package, DollarSign, Truck, LogOut, Menu, X, Home, List, Box, Settings, BarChart3, Mail, Calendar, Plus, FileText, Users, AlertTriangle } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const API = BACKEND_URL ? `${BACKEND_URL}/api` : '/api';

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
  const [activeTab, setActiveTab] = useState('overview');
  const [calendarDate, setCalendarDate] = useState(new Date().toISOString().split('T')[0]);
  const [slots, setSlots] = useState([]);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [scheduledOrders, setScheduledOrders] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [showCreateOrder, setShowCreateOrder] = useState(false);
  const [newOrder, setNewOrder] = useState({
    contractor_id: '',
    material: '',
    quantity: 1,
    delivery_address: '',
    zip_code: '',
    status: 'processing'
  });
  const [configStatus, setConfigStatus] = useState(null);
  const [showConfigModal, setShowConfigModal] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      navigate('/admin/login', { replace: true });
      return;
    }

    fetchStats();
    fetchConfigStatus();
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
      } else {
        setStats(defaultStats);
      }
    } catch (error) {
      console.warn('Using demo data');
      setStats(defaultStats);
    } finally {
      setLoading(false);
    }
  };

  const fetchConfigStatus = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API}/admin/config-status`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000
      });
      setConfigStatus(response.data);
      if (!response.data.all_set && response.data.missing?.length) {
        setShowConfigModal(true);
      }
    } catch (error) {
      console.warn('Config status check failed');
    }
  };
  
  const fetchContractors = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API}/admin/contractors`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000
      });
      setContractors(response.data.contractors || []);
    } catch (error) {
      console.error('Failed to fetch contractors:', error);
    }
  };

  const fetchMaterials = async () => {
    try {
      const response = await axios.get(`${API}/ecommerce/materials`, {
        timeout: 5000
      });
      setMaterials(response.data.materials || []);
    } catch (error) {
      console.error('Failed to fetch materials:', error);
    }
  };
  
  const createOrder = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      if (!newOrder.contractor_id || !newOrder.material) {
        alert('Please select contractor and material');
        return;
      }
      
      const contractor = contractors.find(c => c.contractor_id === newOrder.contractor_id);
      if (!contractor) {
        alert('Contractor not found');
        return;
      }
      
      const response = await axios.post(
        `${API}/admin/contractors/${newOrder.contractor_id}/orders`,
        {
          material: newOrder.material,
          quantity: newOrder.quantity,
          delivery_address: newOrder.delivery_address || contractor.address,
          zip_code: newOrder.zip_code || contractor.zip_code,
          status: newOrder.status
        },
        { headers: { Authorization: `Bearer ${token}` }, timeout: 5000 }
      );
      
      if (response.data.success) {
        alert(`Order ${response.data.order_number} created successfully!`);
        setShowCreateOrder(false);
        setNewOrder({ contractor_id: '', material: '', quantity: 1, delivery_address: '', zip_code: '', status: 'processing' });
        fetchStats(); // Refresh stats
      }
    } catch (error) {
      console.error('Failed to create order:', error);
      alert(error.response?.data?.detail || 'Failed to create order');
    }
  };
  
  const fetchCalendarSlots = useCallback(async () => {
    try {
      setCalendarLoading(true);
      const token = localStorage.getItem('admin_token');
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch available slots
      const slotsResponse = await axios.get(`${API}/scheduling/available-slots`, {
        params: { date: calendarDate, address: '411 SA-Evans Rd, Boerne, TX' },
        headers,
        timeout: 5000
      });
      setSlots(slotsResponse.data.slots || []);

      // Fetch scheduled orders for this date
      const ordersResponse = await axios.get(`${API}/admin/orders`, {
        params: { delivery_date: calendarDate, status: 'in_delivery,processing' },
        headers,
        timeout: 5000
      });
      setScheduledOrders(ordersResponse.data.orders || []);

    } catch (error) {
      console.error('Failed to fetch calendar data:', error);
      // Demo data fallback
      setScheduledOrders([
        { _id: '1', customer: { name: 'John Smith' }, order_number: 'ORD-001', delivery_address: '123 Main St, Boerne', delivery_time: '9:00 AM', status: 'in_delivery' },
        { _id: '2', customer: { name: 'Maria Garcia' }, order_number: 'ORD-002', delivery_address: '456 Oak Ave, Fair Oaks', delivery_time: '1:00 PM', status: 'processing' },
      ]);
    } finally {
      setCalendarLoading(false);
    }
  }, [calendarDate]);

  useEffect(() => {
    if (activeTab === 'calendar') {
      fetchCalendarSlots();
    }
  }, [activeTab, calendarDate, fetchCalendarSlots]);

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

  if (showConfigModal && configStatus?.missing?.length) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="text-yellow-600" size={28} />
            <h2 className="text-2xl font-bold text-[#3B2F2F]" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
              Setup Required
            </h2>
          </div>
          <p className="text-[#6B4F3F] mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            The following API keys and tokens are not configured. Add them in your deployment environment variables to enable full functionality.
          </p>
          <ul className="list-disc pl-5 mb-6 space-y-2">
            {configStatus.missing.map((item) => (
              <li key={item.key} className="text-sm text-[#3B2F2F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                <span className="font-semibold">{item.label}</span>
                <br />
                <code className="text-xs bg-gray-100 px-2 py-1 rounded">{item.key}</code>
              </li>
            ))}
          </ul>
          <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-6">
            <p className="text-xs text-yellow-800" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              These values must be added to your hosting environment (for example Render, Railway, or Cloudflare Worker secrets). They are never displayed after being saved.
            </p>
          </div>
          <button
            onClick={() => setShowConfigModal(false)}
            className="w-full bg-[#D9A441] text-white py-3 rounded font-semibold hover:bg-[#B08D33] transition-colors"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            I understand, continue to dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] pb-20 md:pb-0">
      {/* Header */}
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
                  Admin Portal
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-white hover:text-[#D9A441] transition-colors"
              aria-label="Logout"
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
            <button
              onClick={() => { setActiveTab('overview'); setMobileMenuOpen(false); }}
              className={`w-full text-left py-2 px-4 rounded-lg font-semibold ${
                activeTab === 'overview' ? 'bg-[#D9A441] text-[#3B2F2F]' : 'text-[#6B4F3F] hover:bg-[#FAF9F6]'
              }`}
            >
              <Home size={16} className="inline mr-2" /> Dashboard
            </button>
            <Link to="/admin/orders" className="block py-2 px-4 rounded-lg text-[#6B4F3F] hover:bg-[#FAF9F6] font-semibold" onClick={() => setMobileMenuOpen(false)}>
              <List size={16} className="inline mr-2" /> Orders
            </Link>
            <Link to="/admin/inventory" className="block py-2 px-4 rounded-lg text-[#6B4F3F] hover:bg-[#FAF9F6] font-semibold" onClick={() => setMobileMenuOpen(false)}>
              <Package size={16} className="inline mr-2" /> Materials & Inventory
            </Link>
             <Link to="/admin/leads" className="block py-2 px-4 rounded-lg text-[#6B4F3F] hover:bg-[#FAF9F6] font-semibold" onClick={() => setMobileMenuOpen(false)}>
               <Users size={16} className="inline mr-2" /> Leads
             </Link>
             <Link to="/admin/settings" className="block py-2 px-4 rounded-lg text-[#6B4F3F] hover:bg-[#FAF9F6] font-semibold" onClick={() => setMobileMenuOpen(false)}>
               <Settings size={16} className="inline mr-2" /> Settings
             </Link>
              <Link to="/admin/notifications" className="block py-2 px-4 rounded-lg text-[#6B4F3F] hover:bg-[#FAF9F6] font-semibold" onClick={() => setMobileMenuOpen(false)}>
                <Mail size={16} className="inline mr-2" /> Notifications
              </Link>
              <button
                onClick={() => { setActiveTab('contractors'); setMobileMenuOpen(false); }}
                className={`w-full text-left py-2 px-4 rounded-lg font-semibold ${
                  activeTab === 'contractors' ? 'bg-[#D9A441] text-[#3B2F2F]' : 'text-[#6B4F3F] hover:bg-[#FAF9F6]'
                }`}
              >
                <Truck size={16} className="inline mr-2" /> Contractors
              </button>
            </div>
          </nav>
        )}

      {/* Desktop Sidebar + Main Content */}
      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden md:block w-64 bg-white shadow-lg min-h-[calc(100vh-73px)] sticky top-[73px]">
          <nav className="p-4">
            <div className="space-y-2">
              <button
                onClick={() => setActiveTab('overview')}
                className={`w-full flex items-center space-x-3 py-3 px-4 rounded-lg transition-colors ${
                  activeTab === 'overview' ? 'bg-[#D9A441] text-[#3B2F2F] font-bold' : 'text-[#6B4F3F] hover:bg-[#FAF9F6]'
                }`}
              >
                <Home size={20} />
                <span style={{ fontFamily: 'Montserrat, sans-serif' }}>Dashboard</span>
              </button>
              <Link to="/admin/orders" className="flex items-center space-x-3 py-3 px-4 rounded-lg text-[#6B4F3F] hover:bg-[#FAF9F6] transition-colors" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                <List size={20} />
                <span>Orders</span>
              </Link>
              <Link to="/admin/inventory" className="flex items-center space-x-3 py-3 px-4 rounded-lg text-[#6B4F3F] hover:bg-[#FAF9F6] transition-colors" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                <Package size={20} />
                <span>Materials & Inventory</span>
              </Link>
              <Link to="/admin/settings" className="flex items-center space-x-3 py-3 px-4 rounded-lg text-[#6B4F3F] hover:bg-[#FAF9F6] transition-colors" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                <Settings size={20} />
                <span>Settings</span>
              </Link>
              <button
                onClick={() => setActiveTab('calendar')}
                className={`w-full flex items-center space-x-3 py-3 px-4 rounded-lg transition-colors ${
                  activeTab === 'calendar' ? 'bg-[#D9A441] text-[#3B2F2F] font-bold' : 'text-[#6B4F3F] hover:bg-[#FAF9F6]'
                }`}
              >
                <Calendar size={20} />
                <span>Delivery Calendar</span>
              </button>
            </div>
          </nav>
        </aside>
        )}

          {/* Overview Section */}
          {activeTab === 'overview' && (
            <div className="flex-1 p-4 md:p-8">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-[#3B2F2F] mb-2" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                  Dashboard Overview
                </h2>
                <p className="text-[#6B4F3F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  Welcome to The Dirt Place Admin Portal
                </p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-[#3B2F2F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      Total Orders
                    </h3>
                    <Package className="text-[#D9A441]" size={24} />
                  </div>
                  <p className="text-4xl font-bold text-[#3B2F2F]" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                    {stats.total_orders}
                  </p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-[#3B2F2F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      Total Revenue
                    </h3>
                    <DollarSign className="text-[#D9A441]" size={24} />
                  </div>
                  <p className="text-4xl font-bold text-[#3B2F2F]" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                    ${stats.total_revenue?.toFixed(2)}
                  </p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-[#3B2F2F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      In Delivery
                    </h3>
                    <Truck className="text-[#D9A441]" size={24} />
                  </div>
                  <p className="text-4xl font-bold text-[#3B2F2F]" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                    {stats.orders_by_status?.in_delivery || 0}
                  </p>
                </div>
              </div>

              {/* Recent Orders */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-[#3B2F2F] mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                  Recent Orders
                </h3>
                <div className="space-y-4">
                  {stats.recent_orders?.map((order) => (
                    <div key={order._id} className="flex items-center justify-between p-4 bg-[#FAF9F6] rounded-lg">
                      <div>
                        <p className="font-bold text-[#3B2F2F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                          {order.order_number}
                        </p>
                        <p className="text-sm text-[#6B4F3F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                          {order.customer?.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-[#3B2F2F]">${order.pricing?.total?.toFixed(2)}</p>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(order.status)}`}>
                          {order.status?.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-[#3B2F2F] mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                  Quick Actions
                </h3>
                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={() => setShowCreateOrder(true)}
                    className="flex items-center space-x-2 px-6 py-3 bg-[#D9A441] text-[#3B2F2F] font-bold rounded-lg hover:bg-[#c4943a] transition-colors"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    <Plus size={20} />
                    <span>Create Order</span>
                  </button>
                  <Link
                    to="/admin/orders"
                    className="flex items-center space-x-2 px-6 py-3 bg-[#3B2F2F] text-white font-bold rounded-lg hover:bg-[#2a2222] transition-colors"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    <List size={20} />
                    <span>View All Orders</span>
                  </Link>
                  <button
                    onClick={() => setActiveTab('contractors')}
                    className="flex items-center space-x-2 px-6 py-3 bg-[#6B4F3F] text-white font-bold rounded-lg hover:bg-[#3B2F2F] transition-colors"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    <Truck size={20} />
                    <span>Manage Contractors</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Delivery Calendar - Planner Style */}
          {activeTab === 'calendar' && (
            <div className="mt-6 md:mt-8">
              <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl md:text-2xl font-bold text-[#3B2F2F]" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                    <Calendar className="inline mr-2" size={24} />
                    Weekly Delivery Planner
                  </h3>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        const date = new Date(calendarDate);
                        date.setDate(date.getDate() - 7);
                        setCalendarDate(date.toISOString().split('T')[0]);
                      }}
                      className="px-3 py-2 bg-[#FAF9F6] rounded hover:bg-[#D9A441]/20 transition-colors"
                    >
                      ← Prev Week
                    </button>
                    <input
                      type="date"
                      value={calendarDate}
                      onChange={(e) => setCalendarDate(e.target.value)}
                      className="px-4 py-2 border-2 border-[#6B4F3F]/20 rounded focus:border-[#D9A441] focus:outline-none"
                    />
                    <button
                      onClick={() => {
                        const date = new Date(calendarDate);
                        date.setDate(date.getDate() + 7);
                        setCalendarDate(date.toISOString().split('T')[0]);
                      }}
                      className="px-3 py-2 bg-[#FAF9F6] rounded hover:bg-[#D9A441]/20 transition-colors"
                    >
                      Next Week →
                    </button>
                  </div>
                </div>

                {calendarLoading ? (
                  <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D9A441]"></div>
                  </div>
                ) : (
                  <div>
                    {/* Weekly Planner Grid */}
                    <div className="overflow-x-auto">
                      <div className="grid grid-cols-8 gap-2 min-w-[800px]">
                        {/* Header Row */}
                        <div className="font-bold text-[#3B2F2F] p-2">Time</div>
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => {
                          const date = new Date(calendarDate);
                          date.setDate(date.getDate() + idx);
                          return (
                            <div key={day} className="font-bold text-[#3B2F2F] p-2 text-center">
                              <div>{day}</div>
                              <div className="text-xs text-[#6B4F3F]">{date.getDate()}</div>
                            </div>
                          );
                        })}

                        {/* Time Slots */}
                        {['07:00', '09:00', '11:00', '13:00', '15:00'].map((time) => (
                          <>
                            <div key={time} className="text-sm text-[#6B4F3F] p-2 font-semibold">
                              {time}
                            </div>
                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => {
                              const date = new Date(calendarDate);
                              date.setDate(date.getDate() + idx);
                              const dateStr = date.toISOString().split('T')[0];
                              const dayOrders = scheduledOrders.filter(o => o.delivery_date === dateStr);
                              return (
                                <div key={`${time}-${day}`} className="min-h-[80px] border-2 border-[#6B4F3F]/10 rounded p-1 hover:bg-[#FAF9F6] transition-colors">
                                  {dayOrders.map((order) => (
                                    <div key={order._id} className="text-xs p-1 mb-1 bg-[#D9A441]/20 rounded truncate" title={`${order.customer?.name} - ${order.delivery_address}`}>
                                      <span className="font-bold">{order.customer?.name}</span>
                                      <div className={`w-2 h-2 rounded-full inline-block mr-1 ${getStatusColor(order.status).includes('yellow') ? 'bg-yellow-500' : getStatusColor(order.status).includes('green') ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                                    </div>
                                  ))}
                                </div>
                              );
                            })}
                          </>
                        ))}
                      </div>
                    </div>

                    {/* Legend */}
                    <div className="flex items-center space-x-4 mt-6 pt-4 border-t border-gray-200">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <span className="text-sm text-[#6B4F3F]">Processing</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span className="text-sm text-[#6B4F3F]">In Delivery</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="text-sm text-[#6B4F3F]">Delivered</span>
                      </div>
                    </div>

                    {scheduledOrders.length === 0 && (
                      <p className="text-center text-[#6B4F3F] py-10">No deliveries scheduled for this week</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Create Order Modal */}
          {showCreateOrder && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-[#3B2F2F]" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                    Create New Order
                  </h3>
                  <button
                    onClick={() => setShowCreateOrder(false)}
                    className="text-[#6B4F3F] hover:text-[#3B2F2F]"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-[#3B2F2F] mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      Contractor *
                    </label>
                    <select
                      value={newOrder.contractor_id}
                      onChange={(e) => setNewOrder({ ...newOrder, contractor_id: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-[#6B4F3F]/20 rounded focus:border-[#D9A441] focus:outline-none"
                      style={{ fontFamily: 'Montserrat, sans-serif' }}
                    >
                      <option value="">Select a contractor</option>
                      {contractors.filter(c => c.is_approved).map(c => (
                        <option key={c.contractor_id} value={c.contractor_id}>
                          {c.company_name} ({c.contact_name})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-[#3B2F2F] mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                        Material *
                      </label>
                      <select
                        value={newOrder.material}
                        onChange={(e) => setNewOrder({ ...newOrder, material: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-[#6B4F3F]/20 rounded focus:border-[#D9A441] focus:outline-none"
                        style={{ fontFamily: 'Montserrat, sans-serif' }}
                      >
                        <option value="">Select material</option>
                        {materials.map(m => (
                          <option key={m.id || m._id} value={m.name}>
                            {m.name} (${m.price || m.pricePerUnit}/yard)
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[#3B2F2F] mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                        Quantity (cubic yards) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={newOrder.quantity}
                        onChange={(e) => setNewOrder({ ...newOrder, quantity: parseInt(e.target.value) || 1 })}
                        className="w-full px-4 py-3 border-2 border-[#6B4F3F]/20 rounded focus:border-[#D9A441] focus:outline-none"
                        style={{ fontFamily: 'Montserrat, sans-serif' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#3B2F2F] mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      Delivery Address
                    </label>
                    <input
                      type="text"
                      value={newOrder.delivery_address}
                      onChange={(e) => setNewOrder({ ...newOrder, delivery_address: e.target.value })}
                      placeholder="Leave blank to use contractor address"
                      className="w-full px-4 py-3 border-2 border-[#6B4F3F]/20 rounded focus:border-[#D9A441] focus:outline-none"
                      style={{ fontFamily: 'Montserrat, sans-serif' }}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-[#3B2F2F] mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                        ZIP Code
                      </label>
                      <input
                        type="text"
                        value={newOrder.zip_code}
                        onChange={(e) => setNewOrder({ ...newOrder, zip_code: e.target.value })}
                        placeholder="Leave blank to use contractor ZIP"
                        className="w-full px-4 py-3 border-2 border-[#6B4F3F]/20 rounded focus:border-[#D9A441] focus:outline-none"
                        style={{ fontFamily: 'Montserrat, sans-serif' }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[#3B2F2F] mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                        Status
                      </label>
                      <select
                        value={newOrder.status}
                        onChange={(e) => setNewOrder({ ...newOrder, status: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-[#6B4F3F]/20 rounded focus:border-[#D9A441] focus:outline-none"
                        style={{ fontFamily: 'Montserrat, sans-serif' }}
                      >
                        <option value="processing">Processing</option>
                        <option value="in_delivery">In Delivery</option>
                        <option value="delivered">Delivered</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => setShowCreateOrder(false)}
                      className="flex-1 px-4 py-3 bg-gray-200 text-[#3B2F2F] font-semibold rounded hover:bg-gray-300 transition-colors"
                      style={{ fontFamily: 'Montserrat, sans-serif' }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={createOrder}
                      className="flex-1 px-4 py-3 bg-[#D9A441] text-[#3B2F2F] font-semibold rounded hover:bg-[#3B2F2F] hover:text-white transition-all"
                      style={{ fontFamily: 'Montserrat, sans-serif' }}
                    >
                      Create Order
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Contractors Tab Content */}
          {activeTab === 'contractors' && (
            <div className="mt-6 md:mt-8">
              <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl md:text-2xl font-bold text-[#3B2F2F]" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                    <Truck className="inline mr-2" size={24} />
                    Contractor Management
                  </h3>
                  <span className="text-sm text-[#6B4F3F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    {contractors.filter(c => c.is_approved).length} Approved / {contractors.length} Total
                  </span>
                </div>

                <div className="space-y-4">
                  {contractors.map((c) => (
                    <div key={c.contractor_id} className="p-4 bg-[#FAF9F6] rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-[#3B2F2F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                          {c.company_name}
                        </h4>
                        {c.is_approved ? (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">
                            Approved
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800">
                            Pending
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-[#6B4F3F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                        {c.contact_name} • {c.email}
                      </p>
                      <p className="text-xs text-[#6B4F3F] mt-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                        {c.city}, {c.state} {c.zip_code}
                      </p>
                      
                      {/* Document Links */}
                      {c.document_urls && c.document_urls.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-xs font-bold text-[#3B2F2F] mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                            Uploaded Documents:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {c.document_urls.map((doc, idx) => (
                              <a
                                key={idx}
                                href={doc.url || doc}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-3 py-1 bg-[#D9A441]/20 text-[#3B2F2F] rounded-full text-xs hover:bg-[#D9A441]/30 transition-colors"
                                style={{ fontFamily: 'Montserrat, sans-serif' }}
                              >
                                <FileText size={12} className="mr-1" />
                                {doc.filename || `Document ${idx + 1}`}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
      </div>
    </div>
  );
};

export default AdminDashboard;
