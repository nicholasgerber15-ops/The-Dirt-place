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
import { Link, useNavigate } from 'react-router-dom';
import { User, Package, MapPin, LogOut, Download, ArrowLeft } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AccountPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUserData = useCallback(async () => {
    const token = localStorage.getItem('userToken');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const [userResponse, ordersResponse] = await Promise.all([
        axios.get(`${API}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API}/auth/orders`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setUser(userResponse.data);
      setOrders(ordersResponse.data.orders || []);
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      localStorage.removeItem('userToken');
      navigate('/login');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userData');
    navigate('/');
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
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D9A441]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] py-24">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-8">
          <Link 
            to="/"
            className="inline-flex items-center space-x-2 text-[#3B2F2F] hover:text-[#D9A441] mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back to Home</span>
          </Link>
          <h1 
            className="text-5xl font-bold text-[#3B2F2F]"
            style={{ fontFamily: 'Bebas Neue, sans-serif' }}
          >
            My Account
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-xl p-8">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 bg-[#D9A441] rounded-full flex items-center justify-center">
                  <User size={32} className="text-[#3B2F2F]" />
                </div>
                <div>
                  <h2 
                    className="text-2xl font-bold text-[#3B2F2F]"
                    style={{ fontFamily: 'Bebas Neue, sans-serif' }}
                  >
                    {user?.name || 'User'}
                  </h2>
                  <p className="text-[#6B4F3F]">{user?.email}</p>
                  {user?.is_contractor && (
                    <span className="inline-block px-3 py-1 bg-[#D9A441] text-[#3B2F2F] text-sm font-bold rounded-full mt-2">
                      Contractor Account
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-4 mb-6">
                {user?.phone && (
                  <div className="flex items-center space-x-3">
                    <span className="text-[#6B4F3F]">Phone:</span>
                    <span className="text-[#3B2F2F] font-medium">{user.phone}</span>
                  </div>
                )}
                {user?.business_name && (
                  <div className="flex items-center space-x-3">
                    <span className="text-[#6B4F3F]">Business:</span>
                    <span className="text-[#3B2F2F] font-medium">{user.business_name}</span>
                  </div>
                )}
              </div>

              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>

            {/* Saved Addresses */}
            {user?.addresses && user.addresses.length > 0 && (
              <div className="bg-white rounded-lg shadow-xl p-8 mt-8">
                <h3 
                  className="text-xl font-bold text-[#3B2F2F] mb-4"
                  style={{ fontFamily: 'Bebas Neue, sans-serif' }}
                >
                  Saved Addresses
                </h3>
                {user.addresses.map((addr, i) => (
                  <div key={i} className="flex items-start space-x-3 p-3 bg-[#FAF9F6] rounded-lg mb-3">
                    <MapPin size={18} className="text-[#D9A441] mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-[#3B2F2F]">{addr.name}</p>
                      <p className="text-sm text-[#6B4F3F]">{addr.address}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Order History */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-xl p-8">
              <h3 
                className="text-2xl font-bold text-[#3B2F2F] mb-6"
                style={{ fontFamily: 'Bebas Neue, sans-serif' }}
              >
                Order History
              </h3>

              {orders.length === 0 ? (
                <div className="text-center py-12">
                  <Package size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-xl text-[#6B4F3F] mb-6">No orders yet</p>
                  <Link
                    to="/materials"
                    className="inline-flex items-center space-x-2 px-6 py-3 bg-[#D9A441] text-[#3B2F2F] font-bold rounded hover:bg-[#c48f35] transition-colors"
                  >
                    <span>Browse Materials</span>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order, index) => (
                    <div key={index} className="border-2 border-[#6B4F3F]/20 rounded-lg p-6 hover:border-[#D9A441] transition-colors">
                      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                        <div>
                          <h4 className="text-lg font-bold text-[#3B2F2F]">{order.order_number}</h4>
                          <p className="text-[#6B4F3F]">{order.material} × {order.quantity} yards</p>
                        </div>
                        <div className="flex items-center space-x-4 mt-4 md:mt-0">
                          <span className={`px-3 py-1 rounded-full text-sm font-bold ${getStatusColor(order.status)}`}>
                            {order.status?.replace('_', ' ')}
                          </span>
                          <span className="text-xl font-bold text-[#3B2F2F]">${order.total?.toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-[#6B4F3F]">
                          Ordered: {new Date(order.created_at).toLocaleDateString()}
                        </p>
                        <button
                          onClick={() => {
                            // Reorder functionality
                            alert('Reorder feature coming soon!');
                          }}
                          className="px-4 py-2 bg-[#3B2F2F] text-[#FAF9F6] rounded hover:bg-[#2a2222] transition-colors text-sm"
                        >
                          Reorder
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountPage;
