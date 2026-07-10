import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Package, Search, Filter, ChevronLeft, ChevronRight, LogOut, Eye } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API,
  timeout: 8000
});

api.interceptors.response.use(
  response => {
    if (!response.data || (Array.isArray(response.data) && response.data.length === 0)) {
      return { data: { orders: [], total: 0 } };
    }
    return response;
  },
  error => {
    if (!error.response) {
      return { data: { orders: [], total: 0 } };
    }
    throw error;
  }
);

const OrdersManagementPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const limit = 20;

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    fetchOrders();
  }, [filterStatus, page]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin_token');
      const params = new URLSearchParams({
        limit: limit.toString(),
        skip: (page * limit).toString()
      });
      
      if (filterStatus) {
        params.append('status', filterStatus);
      }

      const response = await axios.get(`${API}/admin/orders?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setOrders(response.data.orders);
      setTotal(response.data.total);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('admin_token');
        navigate('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchOrders();
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API}/admin/search?q=${encodeURIComponent(searchQuery)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(response.data.results);
      setTotal(response.data.results.length);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    if (newStatus === 'cancelled' && !window.confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
      return;
    }
    try {
      const token = localStorage.getItem('admin_token');
      await axios.patch(
        `${API}/admin/orders/${orderId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Refresh orders
      fetchOrders();
      
      // Update selected order if viewing
      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (error) {
      console.error('Failed to update order status:', error);
      alert('Failed to update order status');
    }
  };

  const viewOrderDetails = async (orderId) => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API}/admin/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedOrder(response.data);
    } catch (error) {
      console.error('Failed to fetch order details:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    navigate('/admin/login');
  };

  const getStatusColor = (status) => {
    const colors = {
      pending_payment: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      processing: 'bg-blue-100 text-blue-800 border-blue-300',
      in_delivery: 'bg-purple-100 text-purple-800 border-purple-300',
      delivered: 'bg-green-100 text-green-800 border-green-300',
      cancelled: 'bg-red-100 text-red-800 border-red-300'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const totalPages = Math.ceil(total / limit);

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
                Orders Management
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
              className="px-4 py-4 border-b-2 border-[#D9A441] text-[#D9A441] font-semibold"
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Orders List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-[#3B2F2F]" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                  All Orders ({total})
                </h2>
              </div>

              {/* Search and Filter */}
              <div className="mb-6 space-y-4">
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-3 text-[#6B4F3F]" size={20} />
                    <input
                      type="text"
                      placeholder="Search by order #, name, or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      className="w-full pl-10 pr-4 py-3 border-2 border-[#6B4F3F]/20 rounded focus:border-[#D9A441] focus:outline-none"
                      style={{ fontFamily: 'Montserrat, sans-serif' }}
                    />
                  </div>
                  <button
                    onClick={handleSearch}
                    className="px-6 py-3 bg-[#D9A441] text-[#3B2F2F] font-semibold rounded hover:bg-[#3B2F2F] hover:text-white transition-colors"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    Search
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <Filter size={18} className="text-[#6B4F3F]" />
                  <select
                    value={filterStatus}
                    onChange={(e) => {
                      setFilterStatus(e.target.value);
                      setPage(0);
                    }}
                    className="px-4 py-2 border-2 border-[#6B4F3F]/20 rounded focus:border-[#D9A441] focus:outline-none"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    <option value="">All Statuses</option>
                    <option value="pending_payment">Pending Payment</option>
                    <option value="processing">Processing</option>
                    <option value="in_delivery">In Delivery</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Orders Table */}
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#D9A441]"></div>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-12">
                  <Package size={48} className="mx-auto text-[#6B4F3F] mb-4" />
                  <p className="text-[#6B4F3F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    No orders found
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b-2 border-[#6B4F3F]/20">
                          <th className="text-left py-3 px-2 font-semibold text-[#3B2F2F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>Order #</th>
                          <th className="text-left py-3 px-2 font-semibold text-[#3B2F2F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>Customer</th>
                          <th className="text-left py-3 px-2 font-semibold text-[#3B2F2F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>Amount</th>
                          <th className="text-left py-3 px-2 font-semibold text-[#3B2F2F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>Status</th>
                          <th className="text-left py-3 px-2 font-semibold text-[#3B2F2F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>Date</th>
                          <th className="text-center py-3 px-2 font-semibold text-[#3B2F2F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order) => (
                          <tr
                            key={order._id}
                            className="border-b border-[#6B4F3F]/10 hover:bg-[#FAF9F6] cursor-pointer"
                            onClick={() => viewOrderDetails(order._id)}
                          >
                            <td className="py-3 px-2 font-semibold text-[#3B2F2F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                              {order.order_number}
                            </td>
                            <td className="py-3 px-2 text-[#6B4F3F] text-sm" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                              {order.customer.name}
                            </td>
                            <td className="py-3 px-2 text-[#3B2F2F] font-semibold" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                              ${Number(order.pricing.total).toFixed(2)}
                            </td>
                            <td className="py-3 px-2">
                              <span className={`px-2 py-1 rounded text-xs font-semibold border ${getStatusColor(order.status)}`} style={{ fontFamily: 'Montserrat, sans-serif' }}>
                                {order.status.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="py-3 px-2 text-[#6B4F3F] text-sm" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                              {new Date(order.created_at).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-2 text-center">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  viewOrderDetails(order._id);
                                }}
                                className="text-[#D9A441] hover:text-[#3B2F2F] transition-colors"
                                title="View Details"
                              >
                                <Eye size={18} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6">
                      <button
                        onClick={() => setPage(Math.max(0, page - 1))}
                        disabled={page === 0}
                        className="flex items-center space-x-2 px-4 py-2 bg-[#6B4F3F] text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#3B2F2F] transition-colors"
                        style={{ fontFamily: 'Montserrat, sans-serif' }}
                      >
                        <ChevronLeft size={18} />
                        <span>Previous</span>
                      </button>
                      
                      <span className="text-[#6B4F3F] font-semibold" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                        Page {page + 1} of {totalPages}
                      </span>
                      
                      <button
                        onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                        disabled={page >= totalPages - 1}
                        className="flex items-center space-x-2 px-4 py-2 bg-[#6B4F3F] text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#3B2F2F] transition-colors"
                        style={{ fontFamily: 'Montserrat, sans-serif' }}
                      >
                        <span>Next</span>
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Order Details Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-4">
              <h3 className="text-2xl font-bold text-[#3B2F2F] mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                Order Details
              </h3>

              {selectedOrder ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-[#6B4F3F] mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>Order Number</p>
                    <p className="font-bold text-[#3B2F2F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      {selectedOrder.order_number}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-[#6B4F3F] mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>Customer</p>
                    <p className="font-semibold text-[#3B2F2F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      {selectedOrder.customer.name}
                    </p>
                    <p className="text-sm text-[#6B4F3F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      {selectedOrder.customer.email}
                    </p>
                    <p className="text-sm text-[#6B4F3F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      {selectedOrder.customer.phone}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-[#6B4F3F] mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>Delivery</p>
                    <p className="text-sm text-[#3B2F2F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      {selectedOrder.delivery.address}
                    </p>
                    <p className="text-sm text-[#3B2F2F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      ZIP: {selectedOrder.delivery.zip}
                    </p>
                    <p className="text-sm text-[#3B2F2F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      {selectedOrder.delivery.date} at {selectedOrder.delivery.time}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-[#6B4F3F] mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>Items</p>
                    {selectedOrder.items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm mb-1">
                        <span className="text-[#3B2F2F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                          {item.name} x{item.quantity}
                        </span>
                        <span className="font-semibold text-[#3B2F2F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                          ${(Number(item.price) * Number(item.quantity)).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t-2 border-[#6B4F3F]/20 pt-3">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-[#6B4F3F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>Materials Total</span>
                      <span className="text-sm font-semibold" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                        ${Number(selectedOrder.pricing.materials_total).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-[#6B4F3F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>Delivery Fee</span>
                      <span className="text-sm font-semibold" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                        ${Number(selectedOrder.pricing.delivery_fee).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-bold text-[#3B2F2F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>Total</span>
                      <span className="font-bold text-[#3B2F2F] text-lg" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                        ${Number(selectedOrder.pricing.total).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {selectedOrder.notes && (
                    <div>
                      <p className="text-sm text-[#6B4F3F] mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>Notes</p>
                      <p className="text-sm text-[#3B2F2F] italic" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                        {selectedOrder.notes}
                      </p>
                    </div>
                  )}

                  <div>
                    <p className="text-sm text-[#6B4F3F] mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>Update Status</p>
                    <select
                      value={selectedOrder.status}
                      onChange={(e) => updateOrderStatus(selectedOrder._id, e.target.value)}
                      className="w-full px-3 py-2 border-2 border-[#6B4F3F]/20 rounded focus:border-[#D9A441] focus:outline-none"
                      style={{ fontFamily: 'Montserrat, sans-serif' }}
                    >
                      <option value="pending_payment">Pending Payment</option>
                      <option value="processing">Processing</option>
                      <option value="in_delivery">In Delivery</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div className="text-xs text-[#6B4F3F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Created: {new Date(selectedOrder.created_at).toLocaleString()}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package size={48} className="mx-auto text-[#6B4F3F] mb-4 opacity-50" />
                  <p className="text-[#6B4F3F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Select an order to view details
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrdersManagementPage;
