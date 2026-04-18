import React, { useState } from 'react';
import { ArrowRight, Truck, ShoppingCart, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const MaterialCard = ({ material, index }) => {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [showAdded, setShowAdded] = useState(false);

  const handleAddToCart = () => {
    addToCart(material, quantity);
    setShowAdded(true);
    setTimeout(() => setShowAdded(false), 2000);
  };

  return (
    <div
      className="material-card group bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2"
      style={{
        animationDelay: `${index * 100}ms`
      }}
    >
      <div className="relative overflow-hidden h-64">
        <img
          src={material.image}
          alt={material.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#3B2F2F] via-transparent to-transparent opacity-60"></div>
        <div className="absolute bottom-4 left-4">
          <span className="px-3 py-1 bg-[#D9A441] text-[#3B2F2F] text-xs font-bold rounded-full" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            {material.category}
          </span>
        </div>
        <div className="absolute top-4 right-4">
          <span className="px-3 py-1 bg-[#6B7A3A] text-white text-xs font-bold rounded-full flex items-center space-x-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            <Truck size={12} />
            <span>Same-Day Available</span>
          </span>
        </div>
        <div className="absolute top-4 left-4">
          <div className="bg-white/95 px-3 py-2 rounded-lg">
            <p className="text-2xl font-bold text-[#3B2F2F]" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
              ${material.pricePerCubicYard}
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
            Quantity (cu yd):
          </label>
          <input
            type="number"
            min={material.minOrder || 1}
            step="0.5"
            value={quantity}
            onChange={(e) => setQuantity(parseFloat(e.target.value) || 1)}
            className="w-full px-4 py-2 border-2 border-[#6B4F3F]/20 rounded focus:border-[#D9A441] focus:outline-none"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          />
          <p className="text-xs text-[#6B4F3F] mt-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Min order: {material.minOrder || 1} cu yd
          </p>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={handleAddToCart}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-[#3B2F2F] text-[#FAF9F6] font-semibold rounded hover:bg-[#D9A441] hover:text-[#3B2F2F] transition-all duration-300 group/btn"
          >
            {showAdded ? (
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
            to="/delivery"
            className="flex items-center justify-center px-4 py-3 bg-[#6B7A3A] text-white font-semibold rounded hover:bg-[#D9A441] hover:text-[#3B2F2F] transition-all duration-300"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            <Truck size={18} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MaterialCard;
