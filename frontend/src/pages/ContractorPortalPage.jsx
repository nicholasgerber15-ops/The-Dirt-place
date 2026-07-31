import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, Phone, Mail, MapPin, CheckCircle, X, Save, Plus, Calculator } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";
const API = `${BACKEND_URL}/api`;

const ContractorPortalPage = () => {
  const navigate = useNavigate();
  const [isRegistered, setIsRegistered] = useState(false);
  const [contractor, setContractor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [discountTiers, setDiscountTiers] = useState([]);
  
  const [formData, setFormData] = useState({
    company_name: '',
    contact_name: '',
    email: '',
    phone: '',
    password: '',
    license_number: '',
    tax_id: '',
    address: '',
    city: '',
    state: 'TX',
    zip_code: ''
  });
  const [contractors, setContractors] = useState([]);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [isLoginMode, setIsLoginMode] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [contractorOrders, setContractorOrders] = useState([]);
  
  const checkRegistration = useCallback(() => {
    const contractorId = localStorage.getItem('contractor_id');
    if (contractorId) {
      fetchContractorProfile(contractorId);
    }
  }, []);

  const fetchContractors = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) return;
      
      const response = await axios.get(`${API}/admin/contractors`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000
      });
      setContractors(response.data.contractors || []);
    } catch (error) {
      console.error('Failed to fetch contractors:', error);
    }
  };

  const fetchContractorOrders = useCallback(async () => {
    if (!isRegistered || !contractor) return;
    
    try {
      const token = localStorage.getItem('contractor_token');
      if (!token) return;
      
      const response = await axios.get(
        `${API}/admin/contractors/${contractor.contractor_id}/orders`,
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 5000
        }
      );
      setContractorOrders(response.data.orders || []);
    } catch (error) {
      console.error('Failed to fetch contractor orders:', error);
    }
  }, [isRegistered, contractor]);

  useEffect(() => {
    checkRegistration();
    fetchContractors();
  }, [checkRegistration]);

  useEffect(() => {
    if (isRegistered && contractor) {
      fetchContractorOrders();
    }
  }, [isRegistered, contractor, fetchContractorOrders]);

  useEffect(() => {
    checkRegistration();
  }, [checkRegistration]);

  const handleLogin = async () => {
    try {
      setLoading(true);
      const response = await axios.post(
        `${API}/admin/contractors/login`,
        loginData
      );

      if (response.data.success) {
        localStorage.setItem('contractor_token', response.data.token);
        localStorage.setItem('contractor_id', response.data.contractor.contractor_id);
        setContractor(response.data.contractor);
        setIsRegistered(true);
        setShowRegisterModal(false);
        checkRegistration();
      }
    } catch (error) {
      console.error('Login failed:', error);
      alert(error.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    try {
      setLoading(true);
      const response = await axios.post(
        `${API}/admin/contractors/register`,
        formData
      );

      if (response.data.success) {
        localStorage.setItem('contractor_id', response.data.contractor_id);
        alert('Registration submitted! Waiting for approval.');
        setShowRegisterModal(false);
        checkRegistration();
      }
    } catch (error) {
      console.error('Registration failed:', error);
      alert(error.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const calculateDiscount = () => {
    const yards = parseFloat(calcYards) || 0;
    let discount = 0;
    
    for (const tier of discountTiers) {
      if (yards >= tier.min_yards && tier.discount_percent > discount) {
        discount = tier.discount_percent;
      }
    }
    
    setCalculatedDiscount(discount);
  };

  const handleLogout = () => {
    localStorage.removeItem('contractor_id');
    setIsRegistered(false);
    setContractor(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#D9A441]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      {/* Header */}
      <header className="bg-[#3B2F2F] shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                Contractor Portal
              </h1>
              <p className="text-[#D9A441] text-sm" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                The Dirt Place - Contractor Pricing
              </p>
            </div>
            {isRegistered ? (
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 bg-[#D9A441] text-[#3B2F2F] font-semibold rounded hover:bg-white transition-colors"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                <span>Logout</span>
              </button>
            ) : (
              <button
                onClick={() => setShowRegisterModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-[#D9A441] text-[#3B2F2F] font-semibold rounded hover:bg-white transition-colors"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                <Plus size={18} />
                <span>Register</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {isRegistered ? (
          /* Contractor Dashboard */
          <div>
            {/* Profile Card */}
            <div className="bg-white rounded-lg shadow-xl p-8 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-[#3B2F2F]" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                  Welcome, {contractor?.company_name || 'Contractor'}
                </h2>
                {contractor?.is_approved ? (
                  <span className="px-4 py-2 bg-green-500 text-white rounded-full text-sm font-bold">
                    Approved
                  </span>
                ) : (
                  <span className="px-4 py-2 bg-yellow-500 text-white rounded-full text-sm font-bold">
                    Pending Approval
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-[#6B4F3F] mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>Contact</p>
                  <p className="font-semibold text-[#3B2F2F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    {contractor?.contact_name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-[#6B4F3F] mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>Email</p>
                  <p className="font-semibold text-[#3B2F2F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    {contractor?.email}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-[#6B4F3F] mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>Phone</p>
                  <p className="font-semibold text-[#3B2F2F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    {contractor?.phone}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-[#6B4F3F] mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>Address</p>
                  <p className="font-semibold text-[#3B2F2F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    {contractor?.city}, {contractor?.state} {contractor?.zip_code}
                  </p>
                </div>
              </div>
            </div>

            {/* Discount Calculator */}
            <div className="bg-white rounded-lg shadow-xl p-8 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-[#3B2F2F]" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                  Volume Discount Calculator
                </h3>
                <button
                  onClick={() => setShowCalculator(!showCalculator)}
                  className="flex items-center space-x-2 px-4 py-2 bg-[#3B2F2F] text-white rounded hover:bg-[#D9A441] transition-colors"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  <Calculator size={18} />
                  <span>{showCalculator ? 'Hide' : 'Show'} Calculator</span>
                </button>
              </div>

              {showCalculator && (
                <div className="bg-[#FAF9F6] p-6 rounded-lg">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex-1">
                      <label className="block text-sm font-semibold text-[#3B2F2F] mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                        Project Size (Cubic Yards)
                      </label>
                      <input
                        type="number"
                        value={calcYards}
                        onChange={(e) => setCalcYards(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-[#6B4F3F]/20 rounded focus:border-[#D9A441] focus:outline-none"
                        style={{ fontFamily: 'Montserrat, sans-serif' }}
                      />
                    </div>
                    <button
                      onClick={calculateDiscount}
                      className="px-6 py-3 bg-[#D9A441] text-[#3B2F2F] font-bold rounded hover:bg-[#3B2F2F] hover:text-white transition-all"
                      style={{ fontFamily: 'Montserrat, sans-serif' }}
                    >
                      Calculate
                    </button>
                  </div>

                  {calculatedDiscount > 0 && (
                    <div className="bg-green-100 border-l-4 border-green-500 p-4 rounded">
                      <p className="text-lg font-bold text-green-800" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                        You qualify for {calculatedDiscount}% volume discount!
                      </p>
                      <p className="text-sm text-green-700" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                        Based on {calcYards} cubic yards
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Discount Tiers */}
            <div className="bg-white rounded-lg shadow-xl p-8">
              <h3 className="text-2xl font-bold text-[#3B2F2F] mb-6" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                Volume Discount Tiers
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {discountTiers.map((tier, index) => (
                  <div key={tier._id || index} className="bg-[#FAF9F6] p-6 rounded-lg text-center border-2 border-[#D9A441]">
                    <div className="text-4xl font-bold text-[#D9A441] mb-2" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                      {tier.discount_percent}%
                    </div>
                    <p className="text-lg font-semibold text-[#3B2F2F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      {tier.min_yards}+ Cubic Yards
                    </p>
                    <p className="text-sm text-[#6B4F3F] mt-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      Per order discount
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Order History */}
            <div className="bg-white rounded-lg shadow-xl p-8 mt-8">
              <h3 className="text-2xl font-bold text-[#3B2F2F] mb-6" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                Order History
              </h3>
              {contractorOrders.length > 0 ? (
                <div className="space-y-4">
                  {contractorOrders.map((order) => (
                    <div key={order.order_number || order._id} className="p-4 bg-[#FAF9F6] rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-[#3B2F2F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                          Order #{order.order_number}
                        </h4>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                          order.status === 'in_delivery' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                      <p className="text-sm text-[#6B4F3F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                        {order.material} • {order.quantity} yards • ${order.pricing?.total || order.total || 0}
                      </p>
                      <p className="text-xs text-[#6B4F3F] mt-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[#6B4F3F] text-center py-8" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  No orders yet. Place your first order today!
                </p>
              )}
            </div>
          </div>
        ) : (
          /* Not Registered - Show Benefits */
          <div>
            <div className="text-center mb-12">
              <h2 className="text-5xl font-bold text-[#3B2F2F] mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                Contractor Benefits
              </h2>
              <p className="text-xl text-[#6B4F3F] max-w-3xl mx-auto" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Register today to access B2B pricing and priority service.
              </p>
            </div>
  
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              {[
                { title: 'B2B Pricing', desc: 'Exclusive account-based pricing', icon: Calculator },
                { title: 'Priority Delivery', desc: 'Same-day service for contractors', icon: Truck },
                { title: 'Dedicated Support', desc: 'Direct line to our team', icon: Phone }
              ].map((benefit, index) => (
                <div key={index} className="bg-white p-8 rounded-lg shadow-lg text-center">
                  <div className="w-16 h-16 bg-[#D9A441]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <benefit.icon size={32} className="text-[#D9A441]" />
                  </div>
                  <h3 className="text-2xl font-bold text-[#3B2F2F] mb-2" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                    {benefit.title}
                  </h3>
                  <p className="text-[#6B4F3F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    {benefit.desc}
                  </p>
                </div>
              ))}
            </div>

            {/* Contractor Directory (Admin Preview) */}
            {contractors.length > 0 && (
              <div className="mt-12 bg-white rounded-lg shadow-xl p-8">
                <h3 className="text-2xl font-bold text-[#3B2F2F] mb-6" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                  <Truck className="inline mr-2" size={24} />
                  Registered Contractors ({contractors.length})
                </h3>
                <div className="space-y-4">
                  {contractors.slice(0, 10).map((c) => (
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
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="text-center">
              <button
                onClick={() => setShowRegisterModal(true)}
                className="px-8 py-4 bg-[#3B2F2F] text-[#FAF9F6] text-lg font-bold rounded hover:bg-[#D9A441] hover:text-[#3B2F2F] transition-all duration-300"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                Register as a Contractor
              </button>
            </div>
          </div>
        )}

        {/* Registration Modal */}
        {showRegisterModal && !isLoginMode && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-[#3B2F2F]" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                  Contractor Registration
                </h3>
                <button
                  onClick={() => setShowRegisterModal(false)}
                  className="text-[#6B4F3F] hover:text-[#3B2F2F]"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-[#3B2F2F] mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      Company Name *
                    </label>
                    <input
                      type="text"
                      value={formData.company_name}
                      onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-[#6B4F3F]/20 rounded focus:border-[#D9A441] focus:outline-none"
                      style={{ fontFamily: 'Montserrat, sans-serif' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#3B2F2F] mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      Contact Name *
                    </label>
                    <input
                      type="text"
                      value={formData.contact_name}
                      onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-[#6B4F3F]/20 rounded focus:border-[#D9A441] focus:outline-none"
                      style={{ fontFamily: 'Montserrat, sans-serif' }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-[#3B2F2F] mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      Email *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-[#6B4F3F]/20 rounded focus:border-[#D9A441] focus:outline-none"
                      style={{ fontFamily: 'Montserrat, sans-serif' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#3B2F2F] mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      Password *
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-[#6B4F3F]/20 rounded focus:border-[#D9A441] focus:outline-none"
                      style={{ fontFamily: 'Montserrat, sans-serif' }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-[#3B2F2F] mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      Phone *
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-[#6B4F3F]/20 rounded focus:border-[#D9A441] focus:outline-none"
                      style={{ fontFamily: 'Montserrat, sans-serif' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#3B2F2F] mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      License Number
                    </label>
                    <input
                      type="text"
                      value={formData.license_number}
                      onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-[#6B4F3F]/20 rounded focus:border-[#D9A441] focus:outline-none"
                      style={{ fontFamily: 'Montserrat, sans-serif' }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#3B2F2F] mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Address *
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-[#6B4F3F]/20 rounded focus:border-[#D9A441] focus:outline-none"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-[#3B2F2F] mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      City *
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-[#6B4F3F]/20 rounded focus:border-[#D9A441] focus:outline-none"
                      style={{ fontFamily: 'Montserrat, sans-serif' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#3B2F2F] mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      State
                    </label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-[#6B4F3F]/20 rounded focus:border-[#D9A441] focus:outline-none"
                      style={{ fontFamily: 'Montserrat, sans-serif' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#3B2F2F] mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      ZIP Code *
                    </label>
                    <input
                      type="text"
                      value={formData.zip_code}
                      onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-[#6B4F3F]/20 rounded focus:border-[#D9A441] focus:outline-none"
                      style={{ fontFamily: 'Montserrat, sans-serif' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#3B2F2F] mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      Tax ID
                    </label>
                    <input
                      type="text"
                      value={formData.tax_id}
                      onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-[#6B4F3F]/20 rounded focus:border-[#D9A441] focus:outline-none"
                      style={{ fontFamily: 'Montserrat, sans-serif' }}
                    />
                  </div>
                </div>

                {/* Document Upload Section */}
                <div className="border-t pt-4">
                  <h4 className="text-lg font-bold text-[#3B2F2F] mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                    Required Documents
                  </h4>
                  <p className="text-sm text-[#6B4F3F] mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Upload I9, Tax Exempt Certificate, or other required documents (PDF, JPG, PNG)
                  </p>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setDocuments(Array.from(e.target.files))}
                    className="w-full px-4 py-3 border-2 border-[#6B4F3F]/20 rounded focus:border-[#D9A441] focus:outline-none"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  />
                  {documents.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-semibold text-[#3B2F2F]">Selected files:</p>
                      {documents.map((doc, idx) => (
                        <p key={idx} className="text-sm text-[#6B4F3F]">{doc.name}</p>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowRegisterModal(false)}
                    className="flex-1 px-4 py-3 bg-gray-200 text-[#3B2F2F] font-semibold rounded hover:bg-gray-300 transition-colors"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRegister}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-[#D9A441] text-[#3B2F2F] font-semibold rounded hover:bg-[#3B2F2F] hover:text-white transition-all disabled:opacity-50"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#3B2F2F]"></div>
                    ) : (
                      <span>Submit Registration</span>
                    )}
                  </button>
                </div>
                
                <div className="text-center mt-4">
                  <button
                    onClick={() => { setIsLoginMode(true); setShowRegisterModal(false); }}
                    className="text-[#D9A441] hover:text-[#3B2F2F] font-semibold"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    Already registered? Login here
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Login Modal */}
        {isLoginMode && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-[#3B2F2F]" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                  Contractor Login
                </h3>
                <button
                  onClick={() => setIsLoginMode(false)}
                  className="text-[#6B4F3F] hover:text-[#3B2F2F]"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-[#3B2F2F] mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Email *
                  </label>
                  <input
                    type="email"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-[#6B4F3F]/20 rounded focus:border-[#D9A441] focus:outline-none"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#3B2F2F] mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Password *
                  </label>
                  <input
                    type="password"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-[#6B4F3F]/20 rounded focus:border-[#D9A441] focus:outline-none"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  />
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setIsLoginMode(false)}
                    className="flex-1 px-4 py-3 bg-gray-200 text-[#3B2F2F] font-semibold rounded hover:bg-gray-300 transition-colors"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleLogin}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-[#D9A441] text-[#3B2F2F] font-semibold rounded hover:bg-[#3B2F2F] hover:text-white transition-all disabled:opacity-50"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#3B2F2F]"></div>
                    ) : (
                      <span>Login</span>
                    )}
                  </button>
                </div>
                
                <div className="text-center mt-4">
                  <button
                    onClick={() => { setIsLoginMode(false); setShowRegisterModal(true); }}
                    className="text-[#D9A441] hover:text-[#3B2F2F] font-semibold"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    Need to register? Sign up here
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContractorPortalPage;
