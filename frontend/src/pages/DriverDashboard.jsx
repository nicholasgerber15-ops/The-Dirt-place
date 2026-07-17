UNIVERSAL NRG-CO HEADER BLOCK
Use this exact banner at the top of source files. License/covenant terms still apply.

################################################################
#                                                              #
#                ⚡  N R G - C O  ⚡                          #
#                                                              #
#    CRITICAL ASSET — CLOSED SOURCE / CONFIDENTIAL              #
#    PROPRIETARY / UNDER DEVELOPMENT / SECRET                   #
#                                                              #
################################################################
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, LogOut, Truck, Phone, Navigation, Clock, Check, Play, AlertTriangle } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const DriverDashboard = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchSlots = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('driver_token');
      const response = await axios.get(`${API}/auth/driver/slots`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSlots(response.data.slots || []);
    } catch (err) {
      console.error('Failed to fetch slots:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('driver_token');
        setIsLoggedIn(false);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('driver_token');
    if (token) {
      setIsLoggedIn(true);
      fetchSlots();
    }
  }, [fetchSlots]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await axios.post(`${API}/auth/driver-login`, credentials);
      localStorage.setItem('driver_token', response.data.access_token);
      setIsLoggedIn(true);
      fetchSlots();
    } catch (err) {
      setError('Invalid username or password');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('driver_token');
    setIsLoggedIn(false);
    setCredentials({ username: '', password: '' });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const updateStatus = async (slotId, newStatus) => {
    try {
      const token = localStorage.getItem('driver_token');
      await axios.patch(
        `${API}/admin/driver/deliveries/${slotId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSlots(prev => prev.map(s => s.id === slotId ? { ...s, status: newStatus } : s));
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <Truck size={48} className="mx-auto text-[#3B2F2F] mb-4" />
            <h1 className="text-3xl font-bold text-[#3B2F2F]" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
              Driver Login
            </h1>
            <p className="text-[#6B4F3F] mt-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              The Dirt Place Delivery
            </p>
          </div>

          <form onSubmit={handleLogin}>
            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-semibold text-[#3B2F2F] mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Username
              </label>
              <input
                type="text"
                value={credentials.username}
                onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                className="w-full px-4 py-3 border-2 border-[#6B4F3F]/20 rounded focus:border-[#D9A441] focus:outline-none"
                placeholder="Enter username"
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-[#3B2F2F] mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Password
              </label>
              <input
                type="password"
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                className="w-full px-4 py-3 border-2 border-[#6B4F3F]/20 rounded focus:border-[#D9A441] focus:outline-none"
                placeholder="Enter password"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#3B2F2F] text-white font-bold rounded hover:bg-[#D9A441] hover:text-[#3B2F2F] transition-colors"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Login
            </button>
          </form>

          <div className="mt-6 p-4 bg-[#FAF9F6] rounded-lg text-sm text-[#6B4F3F]">
            <p className="font-semibold mb-2">Demo Credentials:</p>
            <p>Username: <code className="bg-white px-2 py-1 rounded">driver</code></p>
            <p>Password: <code className="bg-white px-2 py-1 rounded">driver123</code></p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      {/* Header */}
      <header className="bg-[#3B2F2F] shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Truck size={32} className="text-[#D9A441]" />
              <div>
                <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                  Driver Dashboard
                </h1>
                <p className="text-[#D9A441] text-sm" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  Delivery Schedule
                </p>
              </div>
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

      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#D9A441]"></div>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#6B4F3F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>Today's Deliveries</p>
                    <p className="text-3xl font-bold text-[#3B2F2F]" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                      {slots.filter(s => s.date === new Date().toISOString().split('T')[0]).length}
                    </p>
                  </div>
                  <Clock size={32} className="text-[#D9A441]" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#6B4F3F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>Total Pending</p>
                    <p className="text-3xl font-bold text-[#3B2F2F]" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                      {slots.filter(s => s.status === 'scheduled').length}
                    </p>
                  </div>
                  <Truck size={32} className="text-[#6B7A3A]" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#6B4F3F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>Completed</p>
                    <p className="text-3xl font-bold text-[#3B2F2F]" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                      {slots.filter(s => s.status === 'delivered').length}
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <Check size={20} className="text-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Slots */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-[#3B2F2F] mb-6" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                Delivery Schedule
              </h2>

              <div className="space-y-4">
                {slots.map((slot) => (
                  <div key={slot.id} className="border-2 border-[#6B4F3F]/10 rounded-lg p-4 hover:bg-[#FAF9F6] transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(slot.status)}`}>
                            {slot.status}
                          </span>
                          <span className="text-sm text-[#6B4F3F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                            {slot.date} • {slot.time_slot}
                          </span>
                        </div>

                        <h3 className="text-lg font-bold text-[#3B2F2F] mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                          {slot.customer_name}
                        </h3>

                        <div className="flex items-start space-x-2 text-[#6B4F3F] mb-2">
                          <MapPin size={16} className="mt-1 flex-shrink-0" />
                          <p className="text-sm" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                            {slot.address}
                          </p>
                        </div>

                        <div className="flex items-center space-x-4 text-sm">
                          <span className="font-semibold text-[#3B2F2F]">
                            {slot.material} × {slot.quantity}
                          </span>
                          {slot.phone && (
                            <a
                              href={`tel:${slot.phone}`}
                              className="flex items-center space-x-1 text-[#D9A441] hover:underline"
                            >
                              <Phone size={14} />
                              <span>{slot.phone}</span>
                            </a>
                          )}
                        </div>
                      </div>

                      <a
                        href={slot.directions_url || `https://maps.google.com/?q=${slot.address?.replace(/ /g, '+')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 px-4 py-2 bg-[#D9A441] text-[#3B2F2F] font-bold rounded hover:bg-[#3B2F2F] hover:text-white transition-all"
                        style={{ fontFamily: 'Montserrat, sans-serif' }}
                      >
                        <Navigation size={18} />
                        <span>Directions</span>
                      </a>
                    </div>
                    {slot.status !== 'delivered' && (
                      <div className="mt-3 flex space-x-2">
                        {slot.status === 'scheduled' && (
                          <button
                            onClick={() => updateStatus(slot.id, 'in_progress')}
                            className="flex items-center space-x-1 px-4 py-2 bg-yellow-500 text-white text-sm font-bold rounded hover:bg-yellow-600 transition-colors"
                            style={{ fontFamily: 'Montserrat, sans-serif' }}
                          >
                            <Play size={14} />
                            <span>Start Delivery</span>
                          </button>
                        )}
                        {slot.status === 'in_progress' && (
                          <button
                            onClick={() => updateStatus(slot.id, 'delivered')}
                            className="flex items-center space-x-1 px-4 py-2 bg-green-600 text-white text-sm font-bold rounded hover:bg-green-700 transition-colors"
                            style={{ fontFamily: 'Montserrat, sans-serif' }}
                          >
                            <Check size={14} />
                            <span>Mark Delivered</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {slots.length === 0 && (
                  <div className="text-center py-12">
                    <Truck size={48} className="mx-auto text-[#6B4F3F] mb-4 opacity-50" />
                    <p className="text-[#6B4F3F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      No deliveries scheduled
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DriverDashboard;
