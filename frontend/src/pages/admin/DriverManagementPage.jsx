import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Calendar, ChevronLeft, ChevronRight, Truck, Clock, MapPin, Phone, AlertTriangle, X, LogOut, Menu, Home, List, Box } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const API = BACKEND_URL ? `${BACKEND_URL}/api` : '';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const DriverManagementPage = () => {
  const navigate = useNavigate();
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(today.toISOString().split('T')[0]);
  const [monthData, setMonthData] = useState([]);
  const [dayDeliveries, setDayDeliveries] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dayLoading, setDayLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      navigate('/admin/login', { replace: true });
      return;
    }
  }, [navigate]);

  const getDaysInMonth = useCallback((month, year) => {
    return new Date(year, month + 1, 0).getDate();
  }, []);

  const getFirstDayOfMonth = useCallback((month, year) => {
    return new Date(year, month, 1).getDay();
  }, []);

  const fetchMonthData = useCallback(async () => {
    setLoading(true);
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth, getDaysInMonth(currentMonth, currentYear));

    const start = firstDay.toISOString().split('T')[0];
    const end = lastDay.toISOString().split('T')[0];

    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API}/admin/driver/deliveries/range`, {
        params: { start, end },
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setMonthData(response.data.days || []);
    } catch (error) {
      console.warn('Using demo month data');
      const demo = [];
      for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        if (d.getDay() === 6) {
          demo.push({ date: dateStr, day: DAYS[d.getDay()], delivery_count: 0, total_yards: 0, closed: true });
        } else {
          const count = Math.floor(Math.random() * 4);
          demo.push({ date: dateStr, day: DAYS[d.getDay()], delivery_count: count, total_yards: count > 0 ? Math.round(Math.random() * 15 * 10) / 10 : 0, closed: false });
        }
      }
      setMonthData(demo);
    } finally {
      setLoading(false);
    }
  }, [currentMonth, currentYear, getDaysInMonth]);

  const fetchDayDeliveries = useCallback(async (date) => {
    setSelectedDate(date);
    setDayLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API}/admin/driver/deliveries`, {
        params: { date },
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setDayDeliveries(response.data);
    } catch (error) {
      console.warn('Using demo day data');
      setDayDeliveries({
        date,
        day: new Date(date).toLocaleDateString('en-US', { weekday: 'long' }),
        closed: new Date(date).getDay() === 6,
        cut_off: '5:00 PM',
        deliveries: new Date(date).getDay() === 6 ? [] : [
          { _id: '1', order_number: 'ORD-2024-2001', customer: { name: 'John Smith', phone: '(830) 555-2001' }, delivery: { address: '123 Main St, Boerne, TX', date, time: '8:00 AM - 12:00 PM' }, cart_items: [{ name: 'Topsoil', quantity: 4 }], notes: 'Gate code: 1234', status: 'in_delivery' },
          { _id: '2', order_number: 'ORD-2024-2002', customer: { name: 'Maria Garcia', phone: '(830) 555-2002' }, delivery: { address: '456 Oak Ave, Fair Oaks Ranch, TX', date, time: '1:00 PM - 4:00 PM' }, cart_items: [{ name: 'Gravel', quantity: 2.5 }], notes: '', status: 'processing' },
        ],
        total_yards: 6.5
      });
    } finally {
      setDayLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMonthData();
  }, [fetchMonthData]);

  useEffect(() => {
    fetchDayDeliveries(selectedDate);
  }, []);

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    navigate('/admin/login');
  };

  const getDayData = (dateStr) => monthData.find(d => d.date === dateStr);

  const getStatusColor = (status) => {
    const colors = {
      pending_payment: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      in_delivery: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayInfo = getDayData(dateStr);
      const isSunday = new Date(currentYear, currentMonth, day).getDay() === 6;
      const isToday = dateStr === today.toISOString().split('T')[0];
      const isSelected = dateStr === selectedDate;

      days.push(
        <button
          key={day}
          onClick={() => !isSunday && fetchDayDeliveries(dateStr)}
          disabled={isSunday}
          className={`relative p-2 min-h-[70px] text-left border rounded-lg transition-all ${
            isSunday
              ? 'bg-red-50 border-red-200 cursor-not-allowed'
              : isSelected
              ? 'bg-[#D9A441]/20 border-[#D9A441]'
              : isToday
              ? 'bg-[#6B7A3A]/10 border-[#6B7A3A]'
              : 'bg-white border-[#6B4F3F]/20 hover:border-[#D9A441]'
          }`}
          style={{ fontFamily: 'Montserrat, sans-serif' }}
        >
          <div className={`text-xs font-semibold ${isSunday ? 'text-red-500' : isSelected ? 'text-[#D9A441]' : 'text-[#3B2F2F]'}`}>
            {day}
          </div>
          {isSunday && (
            <div className="text-[9px] text-red-400 font-medium mt-1">Closed</div>
          )}
          {!isSunday && dayInfo && dayInfo.delivery_count > 0 && (
            <div className={`mt-1 text-[10px] font-semibold rounded px-1 ${
              dayInfo.delivery_count > 2 ? 'bg-[#D9A441] text-[#3B2F2F]' : 'bg-[#6B7A3A]/20 text-[#6B7A3A]'
            }`}>
              {dayInfo.delivery_count} delivery{dayInfo.delivery_count !== 1 ? 'ies' : 'y'}
            </div>
          )}
          {!isSunday && dayInfo && dayInfo.delivery_count > 0 && (
            <div className="text-[9px] text-[#6B4F3F] mt-0.5">
              {dayInfo.total_yards} yd
            </div>
          )}
        </button>
      );
    }

    return days;
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] pb-20 md:pb-0">
      <header className="bg-[#3B2F2F] shadow-lg sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button className="md:hidden text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-white" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                  Driver Schedule
                </h1>
                <p className="text-[#D9A441] text-xs hidden md:block" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  Delivery Calendar
                </p>
              </div>
            </div>
            <button onClick={handleLogout} className="p-2 text-white hover:text-[#D9A441]">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {mobileMenuOpen && (
        <nav className="bg-white shadow-md md:hidden">
          <div className="px-4 py-2 space-y-2">
            <Link to="/admin/dashboard" className="block py-2 text-[#6B4F3F] hover:text-[#D9A441]" onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
            <Link to="/admin/orders" className="block py-2 text-[#6B4F3F] hover:text-[#D9A441]" onClick={() => setMobileMenuOpen(false)}>Orders</Link>
            <Link to="/admin/drivers" className="block py-2 text-[#D9A441] font-semibold" onClick={() => setMobileMenuOpen(false)}>Drivers</Link>
            <Link to="/admin/pricing" className="block py-2 text-[#6B4F3F] hover:text-[#D9A441]" onClick={() => setMobileMenuOpen(false)}>Materials</Link>
            <Link to="/admin/inventory" className="block py-2 text-[#6B4F3F] hover:text-[#D9A441]" onClick={() => setMobileMenuOpen(false)}>Inventory</Link>
          </div>
        </nav>
      )}

      <nav className="hidden md:block bg-white shadow">
        <div className="container mx-auto px-4">
          <div className="flex space-x-8">
            <Link to="/admin/dashboard" className="px-4 py-4 text-[#6B4F3F] hover:text-[#D9A441] font-semibold">Dashboard</Link>
            <Link to="/admin/orders" className="px-4 py-4 text-[#6B4F3F] hover:text-[#D9A441] font-semibold">Orders</Link>
            <Link to="/admin/drivers" className="px-4 py-4 border-b-2 border-[#D9A441] text-[#D9A441] font-semibold">Drivers</Link>
            <Link to="/admin/pricing" className="px-4 py-4 text-[#6B4F3F] hover:text-[#D9A441] font-semibold">Materials</Link>
            <Link to="/admin/inventory" className="px-4 py-4 text-[#6B4F3F] hover:text-[#D9A441] font-semibold">Inventory</Link>
          </div>
        </div>
      </nav>

      <div className="p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <button onClick={prevMonth} className="p-2 hover:bg-[#FAF9F6] rounded transition-colors">
                  <ChevronLeft size={20} className="text-[#6B4F3F]" />
                </button>
                <h2 className="text-2xl font-bold text-[#3B2F2F]" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                  {MONTHS[currentMonth]} {currentYear}
                </h2>
                <button onClick={nextMonth} className="p-2 hover:bg-[#FAF9F6] rounded transition-colors">
                  <ChevronRight size={20} className="text-[#6B4F3F]" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-2">
                {DAYS.map(d => (
                  <div key={d} className="text-center text-xs font-bold text-[#6B4F3F] py-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    {d}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {renderCalendar()}
              </div>

              <div className="flex items-center space-x-4 mt-4 text-xs text-[#6B4F3F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 rounded bg-red-50 border border-red-200" />
                  <span>Sunday (Closed)</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 rounded bg-[#D9A441]/20 border border-[#D9A441]" />
                  <span>Selected</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 rounded bg-[#6B7A3A]/10 border border-[#6B7A3A]" />
                  <span>Today</span>
                </div>
              </div>

              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start space-x-2">
                <Clock size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-800" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  All deliveries must end by <strong>5:00 PM</strong>. No Sunday deliveries. Sundays are blocked off on the calendar.
                </p>
              </div>
            </div>
          </div>

          {/* Day Details */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Calendar size={20} className="text-[#D9A441]" />
                <h2 className="text-xl font-bold text-[#3B2F2F]" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                  {selectedDate ? new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : 'Select a Date'}
                </h2>
              </div>

              {dayLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D9A441]"></div>
                </div>
              ) : dayDeliveries?.closed ? (
                <div className="text-center py-12">
                  <AlertTriangle size={40} className="mx-auto mb-3 text-red-400" />
                  <p className="text-lg font-bold text-red-500" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>Closed</p>
                  <p className="text-sm text-[#6B4F3F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>No deliveries on Sundays</p>
                </div>
              ) : dayDeliveries?.deliveries?.length === 0 ? (
                <div className="text-center py-12">
                  <Truck size={40} className="mx-auto mb-3 text-[#6B4F3F]/30" />
                  <p className="text-lg font-bold text-[#3B2F2F]" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>No Deliveries</p>
                  <p className="text-sm text-[#6B4F3F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>No deliveries scheduled for this date</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    <div className="bg-[#FAF9F6] rounded p-2">
                      <span className="text-[#6B4F3F] text-xs">Yards</span>
                      <p className="font-bold text-[#3B2F2F]">{dayDeliveries?.total_yards || 0} yd</p>
                    </div>
                    <div className="bg-[#FAF9F6] rounded p-2">
                      <span className="text-[#6B4F3F] text-xs">Deliveries</span>
                      <p className="font-bold text-[#3B2F2F]">{dayDeliveries?.deliveries?.length || 0}</p>
                    </div>
                    <div className="bg-[#FAF9F6] rounded p-2">
                      <span className="text-[#6B4F3F] text-xs">Total Time</span>
                      <p className="font-bold text-[#3B2F2F]">{dayDeliveries?.total_time_min ? `${Math.floor(dayDeliveries.total_time_min / 60)}h ${dayDeliveries.total_time_min % 60}m` : '0h'}</p>
                    </div>
                    <div className="bg-[#FAF9F6] rounded p-2">
                      <span className="text-[#6B4F3F] text-xs">Cut-off</span>
                      <p className="font-bold text-[#3B2F2F]">5:00 PM</p>
                    </div>
                  </div>

                  {dayDeliveries?.total_time_min > 0 && (() => {
                    const available = 9 * 60;
                    const over = dayDeliveries.total_time_min - available;
                    if (over > 0) {
                      return (
                        <div className="flex items-center space-x-1.5 bg-red-50 border border-red-200 rounded p-2 text-xs text-red-700" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                          <AlertTriangle size={12} className="flex-shrink-0" />
                          <span>Total time exceeds available hours by ~{Math.floor(over / 60)}h {over % 60}m. Schedule may not fit before 5 PM.</span>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  <div className="border-t border-[#6B4F3F]/20 pt-3" />

                  {dayDeliveries?.deliveries?.map((delivery, idx) => {
                    const te = delivery.time_estimate || {};
                    return (
                    <div key={delivery._id} className="bg-[#FAF9F6] rounded-lg p-3 border border-[#6B4F3F]/10">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-[#3B2F2F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                          #{idx + 1} {delivery.order_number}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${getStatusColor(delivery.status)}`}>
                          {delivery.status.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs text-[#6B4F3F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                        <div className="flex items-start space-x-1.5">
                          <MapPin size={12} className="mt-0.5 flex-shrink-0" />
                          <span>{delivery.delivery?.address}</span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <Phone size={12} className="flex-shrink-0" />
                          <span>{delivery.customer?.phone}</span>
                        </div>
                      </div>

                      {/* Time Estimate Breakdown */}
                      {te.total_min > 0 && (
                        <div className="mt-2 bg-white rounded p-2 border border-[#6B4F3F]/10" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                          <div className="flex items-center space-x-1 mb-1.5">
                            <Clock size={11} className="text-[#D9A441]" />
                            <span className="text-[10px] font-semibold text-[#3B2F2F]">Time Estimate</span>
                          </div>
                          <div className="grid grid-cols-4 gap-1 text-[10px]">
                            <div>
                              <span className="text-[#6B4F3F]">Travel</span>
                              <p className="font-semibold text-[#3B2F2F]">{te.travel_one_way_min || '?'} min</p>
                            </div>
                            <div>
                              <span className="text-[#6B4F3F]">Round Trip</span>
                              <p className="font-semibold text-[#3B2F2F]">{te.round_trip_min || '?'} min</p>
                            </div>
                            <div>
                              <span className="text-[#6B4F3F]">Unload</span>
                              <p className="font-semibold text-[#3B2F2F]">{te.unload_min || 20} min</p>
                            </div>
                            <div>
                              <span className="text-[#6B4F3F]">Fill Up</span>
                              <p className="font-semibold text-[#3B2F2F]">{te.fill_up_min || 15} min</p>
                            </div>
                          </div>
                          <div className="mt-1 pt-1 border-t border-[#6B4F3F]/10 flex justify-between text-[10px]">
                            <span className="text-[#6B4F3F]">Total</span>
                            <span className="font-bold text-[#3B2F2F]">{te.total_min} min ({Math.floor(te.total_min / 60)}h {te.total_min % 60}m)</span>
                          </div>
                          {delivery.completes_by && (
                            <div className="mt-0.5 text-[10px] flex justify-between">
                              <span className="text-[#6B4F3F]">Completes by</span>
                              <span className={`font-semibold ${delivery.cut_off_warning ? 'text-red-600' : 'text-[#6B7A3A]'}`}>{delivery.completes_by}</span>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="mt-2 flex justify-between text-xs" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                        <span className="text-[#3B2F2F] font-semibold">{delivery.customer?.name}</span>
                        <span className="text-[#6B7A3A] font-semibold">{delivery.cart_items?.map(i => `${i.quantity} yd ${i.name}`).join(', ')}</span>
                      </div>

                      {delivery.notes && (
                        <div className="mt-1.5 text-[10px] text-amber-700 bg-amber-50 rounded p-1.5" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                          <span className="font-semibold">Notes:</span> {delivery.notes}
                        </div>
                      )}

                      {delivery.cut_off_warning && (
                        <div className="mt-1.5 text-[10px] text-red-600 flex items-center space-x-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                          <AlertTriangle size={10} />
                          <span>Exceeds 5 PM cut-off — reschedule or adjust route</span>
                        </div>
                      )}
                    </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 md:hidden z-50">
        <div className="flex justify-around py-2">
          <Link to="/admin/dashboard" className="flex flex-col items-center text-[#6B4F3F]">
            <Home size={20} />
            <span className="text-xs">Home</span>
          </Link>
          <Link to="/admin/orders" className="flex flex-col items-center text-[#6B4F3F]">
            <List size={20} />
            <span className="text-xs">Orders</span>
          </Link>
          <Link to="/admin/drivers" className="flex flex-col items-center text-[#D9A441]">
            <Truck size={20} />
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

export default DriverManagementPage;
