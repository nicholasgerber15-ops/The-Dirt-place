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
import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Trash2, Plus, Minus, ShoppingCart, ArrowRight } from 'lucide-react';
import SEO from '../components/SEO';

const CartPage = () => {
  const { cart, updateQuantity, removeFromCart, getCartTotal } = useCart();

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] pt-32 pb-24">
        <SEO 
          title="Shopping Cart | The Dirt Place"
          description="View your cart and checkout for landscape materials delivery in Boerne, TX"
          url="https://theboernedirtplace.com/cart"
        />
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <ShoppingCart size={64} className="mx-auto mb-6 text-[#6B4F3F]" />
            <h1 className="text-5xl font-bold text-[#3B2F2F] mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
              Your Cart is Empty
            </h1>
            <p className="text-lg text-[#6B4F3F] mb-8" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Add some materials to get started!
            </p>
            <Link
              to="/materials"
              className="inline-flex items-center space-x-2 px-8 py-4 bg-[#D9A441] text-[#3B2F2F] font-bold rounded hover:bg-[#3B2F2F] hover:text-[#FAF9F6] transition-all duration-300"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              <span>Browse Materials</span>
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] pt-32 pb-24">
      <SEO 
        title="Shopping Cart | The Dirt Place"
        description="View your cart and checkout for landscape materials delivery in Boerne, TX"
        url="https://theboernedirtplace.com/cart"
      />
      <div className="container mx-auto px-4">
        <h1 className="text-6xl font-bold text-[#3B2F2F] mb-12" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
          Shopping Cart
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center gap-6">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-24 h-24 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-[#3B2F2F] mb-2" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                      {item.name}
                    </h3>
                    <p className="text-[#6B4F3F] mb-3" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      ${item.pricePerCubicYard} per {item.unit}
                    </p>
                    
                    {/* Quantity Controls */}
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center border-2 border-[#6B4F3F]/20 rounded">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 0.5)}
                          className="px-3 py-2 hover:bg-[#FAF9F6] transition-colors"
                        >
                          <Minus size={16} />
                        </button>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.id, parseFloat(e.target.value) || 0)}
                          className="w-20 text-center border-x-2 border-[#6B4F3F]/20 py-2 focus:outline-none"
                          style={{ fontFamily: 'Montserrat, sans-serif' }}
                          step="0.5"
                          min="0.5"
                        />
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 0.5)}
                          className="px-3 py-2 hover:bg-[#FAF9F6] transition-colors"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                      <button
                        onClick={() => { if (window.confirm(`Remove ${item.name} from your cart?`)) removeFromCart(item.id); }}
                        className="text-red-600 hover:text-red-700 transition-colors"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                  
                  {/* Item Total */}
                  <div className="text-right">
                    <p className="text-sm text-[#6B4F3F] mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      Subtotal
                    </p>
                    <p className="text-2xl font-bold text-[#3B2F2F]" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                      ${(item.pricePerCubicYard * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-xl p-8 sticky top-32">
              <h2 className="text-3xl font-bold text-[#3B2F2F] mb-6" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                Order Summary
              </h2>
              
              <div className="space-y-4 mb-6">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    <span className="text-[#6B4F3F]">{item.name} ({item.quantity} cu yd)</span>
                    <span className="font-semibold text-[#3B2F2F]">${(item.pricePerCubicYard * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t-2 border-[#D9A441] pt-4 mb-6">
                <div className="flex justify-between text-lg mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  <span className="text-[#6B4F3F]">Subtotal:</span>
                  <span className="font-bold text-[#3B2F2F]">${getCartTotal().toFixed(2)}</span>
                </div>
                <p className="text-xs text-[#6B4F3F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  Delivery fee calculated at checkout
                </p>
              </div>

              <Link
                to="/checkout"
                className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-[#D9A441] text-[#3B2F2F] text-lg font-bold rounded hover:bg-[#3B2F2F] hover:text-[#FAF9F6] transition-all duration-300"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                <span>Proceed to Checkout</span>
                <ArrowRight size={20} />
              </Link>

              <Link
                to="/materials"
                className="block text-center mt-4 text-[#6B4F3F] hover:text-[#D9A441] transition-colors"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
