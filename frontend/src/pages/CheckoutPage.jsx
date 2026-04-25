import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Loader, Calendar, Clock, MapPin } from 'lucide-react';
import axios from 'axios';
import SEO from '../components/SEO';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cart, getCartTotal, clearCart } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState(0);
  
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    deliveryAddress: '',
    deliveryZip: '',
    deliveryDate: '',
    deliveryTime: 'Morning (8AM-12PM)',
    notes: ''
  });

  useEffect(() => {
    if (cart.length === 0) {
      navigate('/cart');
    }
  }, [cart, navigate]);

  useEffect(() => {
    if (formData.deliveryZip.length === 5) {
      fetchDeliveryFee(formData.deliveryZip);
    }
  }, [formData.deliveryZip]);

  const fetchDeliveryFee = async (zipCode) => {
    try {
      const response = await axios.get(`${API}/ecommerce/delivery-fee/${zipCode}`);
      setDeliveryFee(response.data.delivery_fee);
    } catch (error) {
      console.error('Failed to fetch delivery fee:', error);
      setDeliveryFee(40); // Default fee
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const cartItems = cart.map(item => ({
        id: item.id.toString(),
        name: item.name,
        quantity: item.quantity,
        price: item.pricePerCubicYard
      }));

      const checkoutData = {
        cart_items: cartItems,
        customer_name: formData.customerName,
        customer_email: formData.customerEmail,
        customer_phone: formData.customerPhone,
        delivery_address: formData.deliveryAddress,
        delivery_zip: formData.deliveryZip,
        delivery_date: formData.deliveryDate,
        delivery_time: formData.deliveryTime,
        notes: formData.notes,
        origin_url: window.location.origin
      };

      const response = await axios.post(`${API}/ecommerce/checkout/create-session`, checkoutData);
      
      // Redirect to Stripe checkout
      window.location.href = response.data.url;
      
    } catch (error) {
      console.error('Checkout failed:', error);
      alert('Checkout failed. Please try again or call us at (830) 555-0198');
      setIsProcessing(false);
    }
  };

  const totalAmount = getCartTotal() + deliveryFee;

  return (
    <div className="min-h-screen bg-[#FAF9F6] pt-32 pb-24">
      <SEO 
        title="Checkout | The Dirt Place"
        description="Complete your order for landscape materials delivery in Boerne, TX"
        url="https://earth-supply-1.preview.emergentagent.com/checkout"
      />
      <div className="container mx-auto px-4">
        <h1 className="text-6xl font-bold text-[#3B2F2F] mb-12" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
          Checkout
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-xl p-8">
              {/* Customer Information */}
              <h2 className="text-3xl font-bold text-[#3B2F2F] mb-6" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                Customer Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="block text-[#3B2F2F] font-semibold mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border-2 border-[#6B4F3F]/20 rounded focus:border-[#D9A441] focus:outline-none"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  />
                </div>
                <div>
                  <label className="block text-[#3B2F2F] font-semibold mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Email *
                  </label>
                  <input
                    type="email"
                    name="customerEmail"
                    value={formData.customerEmail}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border-2 border-[#6B4F3F]/20 rounded focus:border-[#D9A441] focus:outline-none"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[#3B2F2F] font-semibold mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Phone *
                  </label>
                  <input
                    type="tel"
                    name="customerPhone"
                    value={formData.customerPhone}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border-2 border-[#6B4F3F]/20 rounded focus:border-[#D9A441] focus:outline-none"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  />
                </div>
              </div>

              {/* Delivery Information */}
              <h2 className="text-3xl font-bold text-[#3B2F2F] mb-6 flex items-center" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                <MapPin size={28} className="mr-2 text-[#D9A441]" />
                Delivery Information
              </h2>
              
              <div className="space-y-6 mb-8">
                <div>
                  <label className="block text-[#3B2F2F] font-semibold mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Delivery Address *
                  </label>
                  <input
                    type="text"
                    name="deliveryAddress"
                    value={formData.deliveryAddress}
                    onChange={handleChange}
                    required
                    placeholder="123 Main St, Boerne, TX"
                    className="w-full px-4 py-3 border-2 border-[#6B4F3F]/20 rounded focus:border-[#D9A441] focus:outline-none"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  />
                </div>
                <div>
                  <label className="block text-[#3B2F2F] font-semibold mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    ZIP Code *
                  </label>
                  <input
                    type="text"
                    name="deliveryZip"
                    value={formData.deliveryZip}
                    onChange={handleChange}
                    required
                    maxLength="5"
                    pattern="[0-9]{5}"
                    className="w-full px-4 py-3 border-2 border-[#6B4F3F]/20 rounded focus:border-[#D9A441] focus:outline-none"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  />
                  {formData.deliveryZip.length === 5 && (
                    <p className="text-sm text-[#6B7A3A] mt-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      Delivery fee: ${deliveryFee.toFixed(2)}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[#3B2F2F] font-semibold mb-2 flex items-center" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      <Calendar size={18} className="mr-2" />
                      Delivery Date *
                    </label>
                    <input
                      type="date"
                      name="deliveryDate"
                      value={formData.deliveryDate}
                      onChange={handleChange}
                      required
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 border-2 border-[#6B4F3F]/20 rounded focus:border-[#D9A441] focus:outline-none"
                      style={{ fontFamily: 'Montserrat, sans-serif' }}
                    />
                  </div>
                  <div>
                    <label className="block text-[#3B2F2F] font-semibold mb-2 flex items-center" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      <Clock size={18} className="mr-2" />
                      Delivery Time *
                    </label>
                    <select
                      name="deliveryTime"
                      value={formData.deliveryTime}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border-2 border-[#6B4F3F]/20 rounded focus:border-[#D9A441] focus:outline-none"
                      style={{ fontFamily: 'Montserrat, sans-serif' }}
                    >
                      <option value="Morning (8AM-12PM)">Morning (8AM-12PM)</option>
                      <option value="Afternoon (12PM-5PM)">Afternoon (12PM-5PM)</option>
                      <option value="All Day (8AM-5PM)">All Day (8AM-5PM)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[#3B2F2F] font-semibold mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Special Instructions (Optional)
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows="4"
                    placeholder="e.g., Gate code, placement instructions..."
                    className="w-full px-4 py-3 border-2 border-[#6B4F3F]/20 rounded focus:border-[#D9A441] focus:outline-none resize-none"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-[#D9A441] text-[#3B2F2F] text-lg font-bold rounded hover:bg-[#3B2F2F] hover:text-[#FAF9F6] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                {isProcessing ? (
                  <>
                    <Loader size={20} className="animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>Proceed to Payment</span>
                )}
              </button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-xl p-8 sticky top-32">
              <h2 className="text-3xl font-bold text-[#3B2F2F] mb-6" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                Order Summary
              </h2>
              
              <div className="space-y-3 mb-6">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    <span className="text-[#6B4F3F]">{item.name} ({item.quantity} cu yd)</span>
                    <span className="font-semibold text-[#3B2F2F]">${(item.pricePerCubicYard * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t-2 border-[#6B4F3F]/20 pt-4 mb-4 space-y-2">
                <div className="flex justify-between" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  <span className="text-[#6B4F3F]">Materials Subtotal:</span>
                  <span className="font-semibold text-[#3B2F2F]">${getCartTotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  <span className="text-[#6B4F3F]">Delivery Fee:</span>
                  <span className="font-semibold text-[#3B2F2F]">${deliveryFee.toFixed(2)}</span>
                </div>
              </div>

              <div className="bg-[#D9A441] rounded p-4">
                <div className="flex justify-between items-center">
                  <span className="text-[#3B2F2F] font-bold text-lg" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Total:
                  </span>
                  <span className="text-[#3B2F2F] font-bold text-2xl" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                    ${totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              <p className="text-xs text-[#6B4F3F] mt-4 text-center" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Secure payment processed by Stripe
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
