import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Loader, Calendar, Clock, MapPin, CreditCard, CheckCircle, AlertTriangle, ChevronLeft, RefreshCw } from 'lucide-react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import axios from 'axios';
import SEO from '../components/SEO';
import { businessInfo } from '../data/mock';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const stripePublishableKey = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

const CheckoutForm = ({ clientSecret, orderNumber, pricing, onBack }) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setError(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message);
      setProcessing(false);
      return;
    }

    const { error: payError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/order-success?session_id=${clientSecret}&order_number=${orderNumber}`,
      },
      redirect: 'if_required',
    });

    if (payError) {
      setError(payError.message);
      setProcessing(false);
    } else {
      clearCart();
      navigate(`/order-success?session_id=${clientSecret}&order_number=${orderNumber}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-xl p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-[#3B2F2F]" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
          Complete Payment
        </h2>
        <button
          type="button"
          onClick={onBack}
          className="flex items-center text-[#6B4F3F] hover:text-[#D9A441] transition-colors"
          style={{ fontFamily: 'Montserrat, sans-serif' }}
        >
          <ChevronLeft size={20} />
          <span className="text-sm">Back</span>
        </button>
      </div>

      <div className="bg-[#6B7A3A]/10 border-l-4 border-[#6B7A3A] p-4 mb-6 rounded">
        <p className="text-sm text-[#3B2F2F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          Order #{orderNumber}
        </p>
      </div>

      <div className="mb-6">
        <PaymentElement />
      </div>

      <div className="bg-[#FAF9F6] rounded p-4 mb-6 space-y-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
        {pricing && (
          <>
            <div className="flex justify-between text-sm text-[#6B4F3F]">
              <span>Subtotal</span>
              <span>${(pricing.materials_total + pricing.delivery_fee + (pricing.pallet_fee || 0)).toFixed(2)}</span>
            </div>
            {pricing.admin_fee > 0 && (
              <div className="flex justify-between text-sm text-[#6B4F3F]">
                <span>Card Admin Fee (3.5%)</span>
                <span>${pricing.admin_fee.toFixed(2)}</span>
              </div>
            )}
            {pricing.tax > 0 && (
              <div className="flex justify-between text-sm text-[#6B4F3F]">
                <span>Sales Tax</span>
                <span>${pricing.tax.toFixed(2)}</span>
              </div>
            )}
            <div className="border-t border-[#6B4F3F]/20 pt-1 mt-1 flex justify-between font-bold text-[#3B2F2F]">
              <span>Total</span>
              <span>${pricing.total.toFixed(2)}</span>
            </div>
          </>
        )}
      </div>

      {error && (
        <div className="flex items-center space-x-2 bg-red-50 border border-red-200 text-red-700 p-3 rounded mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          <AlertTriangle size={16} />
          <span className="text-sm">{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-[#D9A441] text-[#3B2F2F] text-lg font-bold rounded hover:bg-[#3B2F2F] hover:text-[#FAF9F6] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ fontFamily: 'Montserrat, sans-serif' }}
      >
        {processing ? (
          <>
            <Loader size={20} className="animate-spin" />
            <span>Processing Payment...</span>
          </>
        ) : (
          <>
            <CreditCard size={20} />
            <span>Pay ${pricing?.total?.toFixed(2) || '0.00'}</span>
          </>
        )}
      </button>

      <p className="text-xs text-[#6B4F3F] mt-4 text-center" style={{ fontFamily: 'Montserrat, sans-serif' }}>
        Secure payment processed by Stripe. Your card will be charged immediately.
      </p>
    </form>
  );
};

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cart, getCartTotal, clearCart, needsDelivery, toggleDelivery } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [deliveryFeeLoading, setDeliveryFeeLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState(null);
  const [orderNumber, setOrderNumber] = useState(null);
  const [pricing, setPricing] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    deliveryAddress: '',
    notes: ''
  });

  useEffect(() => {
    if (cart.length === 0 && !clientSecret) {
      navigate('/cart');
    }
  }, [cart, navigate, clientSecret]);

  useEffect(() => {
    if (needsDelivery && formData.deliveryAddress.length > 5) {
      fetchDeliveryFee(formData.deliveryAddress);
    } else if (!needsDelivery) {
      setDeliveryFee(0);
    }
  }, [formData.deliveryAddress, needsDelivery]);

  const fetchDeliveryFee = async (address) => {
    setDeliveryFeeLoading(true);
    try {
      const response = await axios.get(`${API}/ecommerce/delivery-fee`, {
        params: { address }
      });
      if (response.data.total_delivery_fee) {
        setDeliveryFee(response.data.total_delivery_fee);
      } else if (response.data.note) {
        setDeliveryFee(70);
      }
    } catch (error) {
      console.error('Failed to fetch delivery fee:', error);
      setDeliveryFee(70);
    } finally {
      setDeliveryFeeLoading(false);
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
    setSubmitError(null);

    try {
      const cartItems = cart.map(item => ({
        id: item.id.toString(),
        name: item.name,
        quantity: parseFloat(item.quantity),
        price: parseFloat(item.pricePerCubicYard)
      }));

      const checkoutData = {
        cart_items: cartItems,
        customer_name: formData.customerName,
        customer_email: formData.customerEmail,
        customer_phone: formData.customerPhone,
        delivery_address: needsDelivery ? formData.deliveryAddress : '',
        delivery_date: '',
        delivery_time: '',
        needs_delivery: needsDelivery,
        notes: formData.notes,
        origin_url: window.location.origin
      };

      const response = await axios.post(`${API}/ecommerce/create-payment-intent`, checkoutData);

      setClientSecret(response.data.client_secret);
      setOrderNumber(response.data.order_number);
      setPricing(response.data.pricing);

    } catch (error) {
      console.error('Checkout failed:', error);
      const msg = error.response?.data?.detail || `Checkout failed. Please try again or call us at ${businessInfo.phone}`;
      setSubmitError(msg);
      setIsProcessing(false);
    }
  };

  const handleBackToForm = () => {
    setClientSecret(null);
    setOrderNumber(null);
    setPricing(null);
    setIsProcessing(false);
  };

  const totalAmount = getCartTotal() + deliveryFee;

  if (clientSecret && !stripePromise) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] pt-32 pb-24 flex items-center justify-center">
        <div className="text-center max-w-lg mx-auto px-4">
          <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-[#3B2F2F] mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
            Payment Unavailable
          </h1>
          <p className="text-[#6B4F3F] mb-6" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Our payment system is not configured. Please call {businessInfo.phone} to complete your order.
          </p>
          <Link
            to="/contact"
            className="inline-block px-8 py-3 bg-[#D9A441] text-[#3B2F2F] font-bold rounded hover:bg-[#3B2F2F] hover:text-[#FAF9F6] transition-colors"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            Contact Us
          </Link>
        </div>
      </div>
    );
  }

  if (clientSecret && stripePromise) {
    const options = {
      clientSecret,
      appearance: {
        theme: 'stripe',
        variables: {
          colorPrimary: '#D9A441',
          colorBackground: '#FAF9F6',
          colorText: '#3B2F2F',
          colorDanger: '#dc2626',
          fontFamily: 'Montserrat, sans-serif',
          borderRadius: '8px',
        },
      },
    };

    return (
      <div className="min-h-screen bg-[#FAF9F6] pt-32 pb-24">
        <SEO
          title="Complete Payment | The Dirt Place"
          description="Complete your secure payment for landscape materials"
          url="https://theboernedirtplace.com/checkout"
        />
        <div className="container mx-auto px-4">
          <h1 className="text-6xl font-bold text-[#3B2F2F] mb-12" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
            Payment
          </h1>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Elements stripe={stripePromise} options={options}>
                <CheckoutForm
                  clientSecret={clientSecret}
                  orderNumber={orderNumber}
                  pricing={pricing}
                  onBack={handleBackToForm}
                />
              </Elements>
            </div>
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
                    <span className="text-[#6B4F3F]">Delivery:</span>
                    <span className="font-semibold text-[#3B2F2F]">{formData.deliveryAddress}</span>
                  </div>
                  <div className="flex justify-between" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    <span className="text-[#6B4F3F]">Date:</span>
                    <span className="font-semibold text-[#3B2F2F]">{formData.deliveryDate}</span>
                  </div>
                </div>
                <div className="bg-[#D9A441] rounded p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[#3B2F2F] font-bold text-lg" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      Total:
                    </span>
                    <span className="text-[#3B2F2F] font-bold text-2xl" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                      ${pricing?.total?.toFixed(2) || totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] pt-32 pb-24">
      <SEO
        title="Checkout | The Dirt Place"
        description="Complete your order for landscape materials"
      />
      <div className="container mx-auto px-4">
        <h1 className="text-6xl font-bold text-[#3B2F2F] mb-12" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
          Checkout
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-xl p-8">
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

              <div className="flex items-center justify-between p-4 bg-white rounded-lg border-2 border-[#6B4F3F]/20 mb-6">
                <div className="flex items-center space-x-3" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  <Truck size={24} className={needsDelivery ? 'text-[#6B7A3A]' : 'text-[#6B4F3F]'} />
                  <div>
                    <span className="font-semibold text-[#3B2F2F]">Delivery</span>
                    <p className="text-xs text-[#6B4F3F]">We deliver to Boerne and the Texas Hill Country</p>
                  </div>
                </div>
                <div
                  onClick={() => toggleDelivery()}
                  className={`w-14 h-7 rounded-full transition-colors relative cursor-pointer ${needsDelivery ? 'bg-[#6B7A3A]' : 'bg-gray-300'}`}
                >
                  <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${needsDelivery ? 'translate-x-7' : 'translate-x-0.5'}`}></div>
                </div>
              </div>

              {needsDelivery && (
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
                      required={needsDelivery}
                      placeholder="123 Main St, Boerne, TX"
                      className="w-full px-4 py-3 border-2 border-[#6B4F3F]/20 rounded focus:border-[#D9A441] focus:outline-none"
                      style={{ fontFamily: 'Montserrat, sans-serif' }}
                    />
                    {needsDelivery && formData.deliveryAddress.length > 5 && (
                      <p className="text-sm text-[#6B7A3A] mt-2 flex items-center" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                        {deliveryFeeLoading ? (
                          <><Loader size={14} className="animate-spin mr-2" /> Calculating...</>
                        ) : (
                          <>Delivery fee: ${deliveryFee.toFixed(2)}</>
                        )}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-6 mb-8">
                <div>
                  <label className="block text-[#3B2F2F] font-semibold mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Special Instructions (Optional)
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows="3"
                    placeholder="e.g., Gate code, placement instructions..."
                    className="w-full px-4 py-3 border-2 border-[#6B4F3F]/20 rounded focus:border-[#D9A441] focus:outline-none resize-none"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  />
                </div>
              </div>

              {submitError && (
                <div className="flex items-center space-x-2 bg-red-50 border border-red-200 text-red-700 p-3 rounded mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  <AlertTriangle size={16} />
                  <span className="text-sm">{submitError}</span>
                </div>
              )}

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
                    Estimated Total:
                  </span>
                  <span className="text-[#3B2F2F] font-bold text-2xl" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                    ${totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              <p className="text-xs text-[#6B4F3F] mt-4 text-center" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Final total includes 3.5% card admin fee and Texas sales tax.
                Secure payment processed by Stripe.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
