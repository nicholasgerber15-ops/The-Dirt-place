import React, { useState } from 'react';
import { ArrowRight, Truck, ShoppingCart, Check, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const MaterialCard = ({ material, index }) => {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(material.minOrder || 1);
  const [showAdded, setShowAdded] = useState(false);

  const handleAddToCart = () => {
    if (!material.in_stock) {
      alert('This material is currently out of stock.');
      return;
    }
    
    if (quantity > material.stock_quantity) {
      alert(`Only ${material.stock_quantity} ${material.unit}s available in stock.`);
      return;
    }
    
    addToCart(material, quantity);
    setShowAdded(true);
    setTimeout(() => setShowAdded(false), 2000);
  };

  const getStockBadge = () => {
    if (!material.in_stock || material.stock_quantity === 0) {
      return (
        <span className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full flex items-center space-x-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          <AlertTriangle size={12} />
          <span>Out of Stock</span>
        </span>
      );
    } else if (material.stock_quantity < 20) {
      return (
        <span className="px-3 py-1 bg-yellow-500 text-white text-xs font-bold rounded-full flex items-center space-x-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          <AlertTriangle size={12} />
          <span>Low Stock ({material.stock_quantity})</span>
        </span>
      );
    }
    return (
      <span className="px-3 py-1 bg-green-600 text-white text-xs font-bold rounded-full flex items-center space-x-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
        <Check size={12} />
        <span>In Stock</span>
      </span>
    );
  };

  return (
    <div
      className="material-card group bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2"
      style={{
        animationDelay: `${index * 100}ms`,
        opacity: !material.in_stock ? 0.7 : 1
      }}
    >
      <div className="relative overflow-hidden h-64">
        <img
          src={material.image}
          alt={material.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1591745287451-268db77122a9';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#3B2F2F] via-transparent to-transparent opacity-60"></div>
        <div className="absolute bottom-4 left-4">
          <span className="px-3 py-1 bg-[#D9A441] text-[#3B2F2F] text-xs font-bold rounded-full" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            {material.category}
          </span>
        </div>
        <div className="absolute top-4 right-4">
          {getStockBadge()}
        </div>
        <div className="absolute top-4 left-4">
          <div className="bg-white/95 px-3 py-2 rounded-lg">
            <p className="text-2xl font-bold text-[#3B2F2F]" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
              ${Number(material.pricePerCubicYard).toFixed(2)}
            </p>
            <p className="text-xs text-[#6B4F3F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              per {material.unit}
            </p>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <h3 className="text-2xl font-bold text-[#3B2F2F] mb-3 group-hover:text-[#6B4F3F] transition-colors duration-300" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
          {material.name}
        </h3>
        <p className="text-[#6B4F3F] text-sm leading-relaxed mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          {material.description}
        </p>
        
        {/* Quantity Selector */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-[#3B2F2F] mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Quantity ({material.unit}):
          </label>
          <input
            type="number"
            min={material.minOrder || 1}
            max={material.stock_quantity || 9999}
            step="0.5"
            value={quantity}
            onChange={(e) => setQuantity(parseFloat(e.target.value) || (material.minOrder || 1))}
            disabled={!material.in_stock}
            className="w-full px-4 py-2 border-2 border-[#6B4F3F]/20 rounded focus:border-[#D9A441] focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          />
          <p className="text-xs text-[#6B4F3F] mt-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Min order: {material.minOrder || 1} {material.unit}{material.minOrder > 1 ? 's' : ''}
            {material.in_stock && ` • Available: ${material.stock_quantity}`}
          </p>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={handleAddToCart}
            disabled={!material.in_stock}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-[#3B2F2F] text-[#FAF9F6] font-semibold rounded hover:bg-[#D9A441] hover:text-[#3B2F2F] transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:hover:bg-gray-400 disabled:hover:text-white"
          >
            {!material.in_stock ? (
              <>
                <AlertTriangle size={18} />
                <span style={{ fontFamily: 'Montserrat, sans-serif' }}>Out of Stock</span>
              </>
            ) : showAdded ? (
              <>
                <Check size={18} />
                <span style={{ fontFamily: 'Montserrat, sans-serif' }}>Added!</span>
              </>
            ) : (
              <>
                <ShoppingCart size={18} />
                <span style={{ fontFamily: 'Montserrat, sans-serif' }}>Add to Cart</span>
              </>
            )}
          </button>
          <Link
            to="/contact"
            className="flex items-center justify-center px-4 py-3 bg-[#6B7A3A] text-white font-semibold rounded hover:bg-[#D9A441] hover:text-[#3B2F2F] transition-all duration-300"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
            title="Contact us about this material"
          >
            <Truck size={18} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MaterialCard;
