import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, ChevronLeft, ChevronRight, Truck, CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const API = BACKEND_URL ? `${BACKEND_URL}/api` : '/api';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const DeliveryCalendarPage = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [view, setView] = useState('week'); // 'week' or 'day'
  const [statusFilter, setStatusFilter] = useState('all');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;

  useEffect(() => {
    if (!token) {
      navigate('/admin/login', { replace: true });
      return;
    }
    fetchDeliveries();
  }, [selectedDate, statusFilter, navigate, token]);

  const fetchDeliveries = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = { delivery_date: selectedDate };
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      const response = await axios.get(`${API}/admin/orders`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
        timeout: 10000
      });
      setDeliveries(response.data.orders || []);
    } catch (error) {
      console.error('Failed to fetch deliveries:', error);
      setDeliveries([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDeliveries();
    setRefreshing(false);
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    setUpdatingStatus(true);
    try {
      await axios.patch(
        `${API}/admin/orders/${orderId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` }, timeout: 10000 }
      );
      await fetchDeliveries();
      if (selectedDelivery && selectedDelivery._id === orderId) {
        setSelectedDelivery({ ...selectedDelivery, status: newStatus });
      }
    } catch (error) {
      console.error('Failed to update order status:', error);
      alert(error.response?.data?.detail || 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getWeekDates = () => {
    const date = new Date(selectedDate);
    const day = date.getDay();
    const start = new Date(date);
    start.setDate(date.getDate() - day);
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      dates.push(d);
    }
    return dates;
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

  const getStatusIcon = (status) => {
    if (status === 'delivered') return <CheckCircle size={16} className="text-green-600" />;
    if (status === 'in_delivery') return <Truck size={16} className="text-purple-600" />;
    if (status === 'processing') return <RefreshCw size={16} className="text-blue-600" />;
    return <AlertTriangle size={16} className="text-yellow-600" />;
  };

  const formatDate = (date) => {
    return new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const isToday = (date) => {
    const today = new Date().toISOString().split('T')[0];
    return date.toISOString().split('T')[0] === today;
  };

  const weekDates = getWeekDates();
  const selectedDeliveries = deliveries.filter(d => d.delivery?.date === selectedDate);

  const stats = {
    total: deliveries.length,
    processing: deliveries.filter(d => d.status === 'processing').length,
    in_delivery: deliveries.filter(d => d.status === 'in_delivery').length,
    delivered: deliveries.filter(d => d.status === 'delivered').length,
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      {/* Header */}
      <div className="bg-[#3B2F2F] shadow-lg">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/admin/dashboard')}
                className="text-white hover:text-[#D9A441] transition-colors"
              >
                <ChevronLeft size={24} />
              </button>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                  Delivery Calendar
                </h1>
                <p className="text-[#D9A441] text-xs md:text-sm" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  Manage and track delivery schedules
                </p>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 text-white hover:text-[#D9A441] transition-colors"
            >
              <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-xs text-[#6B4F3F] uppercase tracking-wide" style={{ fontFamily: 'Montserrat, sans-serif' }}>Total</p>
            <p className="text-2xl font-bold text-[#3B2F2F]" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-xs text-[#6B4F3F] uppercase tracking-wide" style={{ fontFamily: 'Montserrat, sans-serif' }}>Processing</p>
            <p className="text-2xl font-bold text-blue-600" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>{stats.processing}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-xs text-[#6B4F3F] uppercase tracking-wide" style={{ fontFamily: 'Montserrat, sans-serif' }}>In Delivery</p>
            <p className="text-2xl font-bold text-purple-600" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>{stats.in_delivery}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-xs text-[#6B4F3F] uppercase tracking-wide" style={{ fontFamily: 'Montserrat, sans-serif' }}>Delivered</p>
            <p className="text-2xl font-bold text-green-600" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>{stats.delivered}</p>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  const date = new Date(currentDate);
                  date.setDate(date.getDate() - (view === 'week' ? 7 : 1));
                  setCurrentDate(date);
                  setSelectedDate(date.toISOString().split('T')[0]);
                }}
                className="p-2 hover:bg-[#FAF9F6] rounded transition-colors"
              >
                <ChevronLeft size={20} className="text-[#3B2F2F]" />
              </button>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setCurrentDate(new Date(e.target.value));
                }}
                className="px-4 py-2 border-2 border-[#6B4F3F]/20 rounded focus:border-[#D9A441] focus:outline-none"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              />
              <button
                onClick={() => {
                  const date = new Date(currentDate);
                  date.setDate(date.getDate() + (view === 'week' ? 7 : 1));
                  setCurrentDate(date);
                  setSelectedDate(date.toISOString().split('T')[0]);
                }}
                className="p-2 hover:bg-[#FAF9F6] rounded transition-colors"
              >
                <ChevronRight size={20} className="text-[#3B2F2F]" />
              </button>
              <button
                onClick={() => {
                  const today = new Date().toISOString().split('T')[0];
                  setSelectedDate(today);
                  setCurrentDate(new Date(today));
                }}
                className="px-3 py-2 bg-[#D9A441] text-white rounded text-sm font-semibold hover:bg-[#3B2F2F] transition-colors"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                Today
              </button>
            </div>

            <div className="flex items-center space-x-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border-2 border-[#6B4F3F]/20 rounded focus:border-[#D9A441] focus:outline-none"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                <option value="all">All Statuses</option>
                <option value="processing">Processing</option>
                <option value="in_delivery">In Delivery</option>
                <option value="delivered">Delivered</option>
                <option value="pending_payment">Pending Payment</option>
              </select>
              <div className="flex rounded-lg overflow-hidden border-2 border-[#6B4F3F]/20">
                <button
                  onClick={() => setView('week')}
                  className={`px-4 py-2 text-sm font-semibold ${view === 'week' ? 'bg-[#D9A441] text-white' : 'bg-white text-[#3B2F2F] hover:bg-[#FAF9F6]'}`}
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  Week
                </button>
                <button
                  onClick={() => setView('day')}
                  className={`px-4 py-2 text-sm font-semibold ${view === 'day' ? 'bg-[#D9A441] text-white' : 'bg-white text-[#3B2F2F] hover:bg-[#FAF9F6]'}`}
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  Day
                </button>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D9A441]"></div>
          </div>
        ) : (
          <>
            {/* Week View */}
            {view === 'week' && (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <div className="grid grid-cols-8 min-w-[900px]">
                    {/* Header */}
                    <div className="bg-[#3B2F2F] text-white p-3 font-bold text-sm" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      Time
                    </div>
                    {weekDates.map((date, idx) => {
                      const dateStr = date.toISOString().split('T')[0];
                      const dayDeliveries = deliveries.filter(d => d.delivery?.date === dateStr);
                      return (
                        <div
                          key={idx}
                          className={`p-3 text-center border-l border-[#6B4F3F]/10 ${isToday(dateStr) ? 'bg-[#D9A441]/10' : ''}`}
                        >
                          <div className="font-bold text-[#3B2F2F] text-sm" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                            {DAYS[idx]}
                          </div>
                          <div className={`text-2xl font-bold ${isToday(dateStr) ? 'text-[#D9A441]' : 'text-[#3B2F2F]'}`} style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                            {date.getDate()}
                          </div>
                          <div className="text-xs text-[#6B4F3F]">
                            {dayDeliveries.length} {dayDeliveries.length === 1 ? 'delivery' : 'deliveries'}
                          </div>
                        </div>
                      );
                    })}

                    {/* Time Slots */}
                    {['07:00', '09:00', '11:00', '13:00', '15:00', '17:00'].map((time) => (
                      <React.Fragment key={time}>
                        <div className="p-2 text-sm text-[#6B4F3F] font-semibold border-t border-[#6B4F3F]/10">
                          {time}
                        </div>
                        {weekDates.map((date, idx) => {
                          const dateStr = date.toISOString().split('T')[0];
                          const slotDeliveries = deliveries.filter(d => {
                            if (d.delivery?.date !== dateStr) return false;
                            const deliveryTime = d.delivery?.time || '';
                            const [delHour, delMin] = deliveryTime.split(':').map(Number);
                            const [slotHour] = time.split(':').map(Number);
                            return delHour >= slotHour && delHour < slotHour + 2;
                          });
                          return (
                            <div
                              key={`${time}-${idx}`}
                              className={`min-h-[100px] border-t border-l border-[#6B4F3F]/10 p-1 ${isToday(dateStr) ? 'bg-[#FAF9F6]' : ''}`}
                            >
                              {slotDeliveries.map((delivery) => (
                                <div
                                  key={delivery._id}
                                  onClick={() => {
                                    setSelectedDelivery(delivery);
                                    setShowDetailModal(true);
                                  }}
                                  className={`text-xs p-2 mb-1 rounded cursor-pointer transition-all hover:shadow-md ${getStatusColor(delivery.status)}`}
                                >
                                  <div className="flex items-center space-x-1 mb-1">
                                    {getStatusIcon(delivery.status)}
                                    <span className="font-bold truncate">{delivery.customer?.name}</span>
                                  </div>
                                  <div className="flex items-center text-[#6B4F3F]">
                                    <MapPin size={10} className="mr-1 flex-shrink-0" />
                                    <span className="truncate">{delivery.delivery?.address || 'N/A'}</span>
                                  </div>
                                  <div className="flex items-center text-[#6B4F3F] mt-1">
                                    <Clock size={10} className="mr-1 flex-shrink-0" />
                                    <span>{delivery.delivery?.time || 'TBD'}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        })}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Day View */}
            {view === 'day' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-xl font-bold text-[#3B2F2F] mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                  {formatDate(selectedDate)}
                </h3>
                {selectedDeliveries.length === 0 ? (
                  <div className="text-center py-16">
                    <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-[#6B4F3F] text-lg" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      No deliveries scheduled for this day
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedDeliveries
                      .sort((a, b) => (a.delivery?.time || '').localeCompare(b.delivery?.time || ''))
                      .map((delivery) => (
                        <div
                          key={delivery._id}
                          onClick={() => {
                            setSelectedDelivery(delivery);
                            setShowDetailModal(true);
                          }}
                          className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-lg ${getStatusColor(delivery.status)}`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3">
                              <div className="mt-1">{getStatusIcon(delivery.status)}</div>
                              <div>
                                <h4 className="font-bold text-[#3B2F2F] text-lg" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                                  {delivery.customer?.name}
                                </h4>
                                <p className="text-sm text-[#6B4F3F]">Order #{delivery.order_number}</p>
                                <div className="flex items-center mt-2 text-sm text-[#6B4F3F]">
                                  <Clock size={14} className="mr-1" />
                                  {delivery.delivery?.time || 'TBD'}
                                </div>
                                <div className="flex items-center mt-1 text-sm text-[#6B4F3F]">
                                  <MapPin size={14} className="mr-1" />
                                  {delivery.delivery?.address || 'N/A'}
                                </div>
                              </div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(delivery.status)}`}>
                              {delivery.status?.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedDelivery && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-[#3B2F2F]" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                  Delivery Details
                </h3>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedDelivery(null);
                  }}
                  className="text-[#6B4F3F] hover:text-[#3B2F2F]"
                >
                  <XCircle size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-[#FAF9F6] p-4 rounded-lg">
                  <h4 className="font-bold text-[#3B2F2F] mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Customer Information
                  </h4>
                  <p className="text-sm text-[#6B4F3F]"><strong>Name:</strong> {selectedDelivery.customer?.name}</p>
                  <p className="text-sm text-[#6B4F3F]"><strong>Email:</strong> {selectedDelivery.customer?.email}</p>
                  <p className="text-sm text-[#6B4F3F]"><strong>Phone:</strong> {selectedDelivery.customer?.phone}</p>
                </div>

                <div className="bg-[#FAF9F6] p-4 rounded-lg">
                  <h4 className="font-bold text-[#3B2F2F] mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Delivery Information
                  </h4>
                  <p className="text-sm text-[#6B4F3F]"><strong>Address:</strong> {selectedDelivery.delivery?.address || 'N/A'}</p>
                  <p className="text-sm text-[#6B4F3F]"><strong>Date:</strong> {selectedDelivery.delivery?.date || 'TBD'}</p>
                  <p className="text-sm text-[#6B4F3F]"><strong>Time:</strong> {selectedDelivery.delivery?.time || 'TBD'}</p>
                </div>

                <div className="bg-[#FAF9F6] p-4 rounded-lg">
                  <h4 className="font-bold text-[#3B2F2F] mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Order Summary
                  </h4>
                  <div className="space-y-2">
                    {selectedDelivery.cart_items?.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-[#6B4F3F]">{item.name} ({item.quantity} {item.unit})</span>
                        <span className="font-semibold text-[#3B2F2F]">${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="border-t border-[#6B4F3F]/20 pt-2 mt-2 flex justify-between font-bold">
                      <span>Total</span>
                      <span>${selectedDelivery.pricing?.total?.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-[#3B2F2F] mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Update Status
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {['processing', 'in_delivery', 'delivered', 'cancelled'].map((status) => (
                      <button
                        key={status}
                        onClick={() => updateOrderStatus(selectedDelivery._id, status)}
                        disabled={updatingStatus || selectedDelivery.status === status}
                        className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                          selectedDelivery.status === status
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-[#D9A441] text-white hover:bg-[#3B2F2F]'
                        }`}
                        style={{ fontFamily: 'Montserrat, sans-serif' }}
                      >
                        {status.replace('_', ' ').toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryCalendarPage;
