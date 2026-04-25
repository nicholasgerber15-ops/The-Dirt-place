import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, Package, Truck, Mail, Phone } from 'lucide-react';
import { useCart } from '../context/CartContext';
import axios from 'axios';
import SEO from '../components/SEO';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const OrderSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { clearCart } = useCart();
  const [orderStatus, setOrderStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionId) {
      checkOrderStatus();
      clearCart();
    }
  }, [sessionId]);

  const checkOrderStatus = async () => {
    try {
      const response = await axios.get(`${API}/ecommerce/checkout/status/${sessionId}`);
      setOrderStatus(response.data);
    } catch (error) {
      console.error('Failed to fetch order status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] pt-32 pb-24 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#D9A441] mx-auto mb-4"></div>
          <p className="text-[#6B4F3F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Confirming your order...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] pt-32 pb-24">
      <SEO 
        title="Order Confirmed | The Dirt Place"
        description="Your order has been confirmed - thank you for choosing The Dirt Place!"
        url="https://earth-supply-1.preview.emergentagent.com/order-success"
      />
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          {/* Success Message */}
          <div className="bg-white rounded-lg shadow-2xl p-8 md:p-12 text-center mb-8">
            <div className="w-24 h-24 bg-[#6B7A3A] rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={64} className="text-white" />
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-[#3B2F2F] mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
              Order Confirmed!
            </h1>
            
            {orderStatus && (
              <p className="text-2xl text-[#6B4F3F] mb-6" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Order #{orderStatus.order_number}
              </p>
            )}
            
            <p className="text-lg text-[#6B4F3F] mb-8" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Thank you for your order! We've received your payment and will begin processing your delivery right away.
            </p>

            <div className="bg-[#D9A441]/10 border-2 border-[#D9A441] rounded-lg p-6 mb-8">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Mail size={20} className="text-[#D9A441]" />
                <p className="font-semibold text-[#3B2F2F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  Confirmation Email Sent
                </p>
              </div>
              <p className="text-sm text-[#6B4F3F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Check your inbox for order details and delivery information
              </p>
            </div>
          </div>

          {/* What's Next */}
          <div className="bg-white rounded-lg shadow-xl p-8 mb-8">
            <h2 className="text-3xl font-bold text-[#3B2F2F] mb-6" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
              What Happens Next?
            </h2>
            
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-[#D9A441] rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-[#3B2F2F] font-bold text-xl" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>1</span>
                </div>
                <div>
                  <h3 className="font-bold text-[#3B2F2F] mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Order Processing
                  </h3>
                  <p className="text-[#6B4F3F] text-sm" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Our team will review your order and prepare your materials for delivery.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-[#D9A441] rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-[#3B2F2F] font-bold text-xl" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>2</span>
                </div>
                <div>
                  <h3 className="font-bold text-[#3B2F2F] mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Delivery Scheduled
                  </h3>
                  <p className="text-[#6B4F3F] text-sm" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    We'll contact you to confirm your delivery date and time window.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-[#D9A441] rounded-full flex items-center justify-center flex-shrink-0">
                  <Truck size={24} className="text-[#3B2F2F]" />
                </div>
                <div>
                  <h3 className="font-bold text-[#3B2F2F] mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Materials Delivered
                  </h3>
                  <p className="text-[#6B4F3F] text-sm" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Your materials will be delivered and placed exactly where you need them.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-[#3B2F2F] rounded-lg shadow-xl p-8 text-center">
            <h2 className="text-3xl font-bold text-[#FAF9F6] mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
              Questions About Your Order?
            </h2>
            <p className="text-[#FAF9F6] mb-6" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Our team is here to help!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="tel:(830) 555-0198"
                className="inline-flex items-center justify-center space-x-2 px-6 py-3 bg-[#D9A441] text-[#3B2F2F] font-bold rounded hover:bg-[#FAF9F6] transition-colors duration-300"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                <Phone size={20} />
                <span>(830) 555-0198</span>
              </a>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center px-6 py-3 bg-transparent border-2 border-[#FAF9F6] text-[#FAF9F6] font-bold rounded hover:bg-[#FAF9F6] hover:text-[#3B2F2F] transition-colors duration-300"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                Contact Us
              </Link>
            </div>
          </div>

          {/* Continue Shopping */}
          <div className="text-center mt-8">
            <Link
              to="/materials"
              className="inline-block px-8 py-3 bg-[#6B4F3F] text-white font-bold rounded hover:bg-[#D9A441] hover:text-[#3B2F2F] transition-colors duration-300"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Browse More Materials
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessPage;
