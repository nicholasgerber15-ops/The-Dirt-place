import React, { useState } from 'react';
import { ArrowRight, Truck, ShoppingCart, Check, AlertTriangle, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

// Use-case descriptions for each material type
const useCases = {
  'Topsoil': 'Perfect for garden beds, lawn leveling, and raised planters.',
  'Gravel': 'Ideal for driveways, drainage, and rustic pathways.',
  'Sand': 'Essential for paver bases, playgrounds, and leveling.',
  'Road Base': 'Stable foundation for driveways, patios, and heavy-use areas.',
  'Mulch': 'Excellent for moisture retention, weed control, and curb appeal.',
  'Decorative Rock': 'Enhance landscapes, borders, and water features.',
  'Fill Dirt': 'Great for building up low areas and general filling.',
  'Clay': 'Ideal for pottery, garden beds, and soil amendment.'
};

const MaterialCard = ({ material, index }) => {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(material.minOrder || 1);
  const [showAdded, setShowAdded] = useState(false);

  const handleAddToCart = () => {
    if (!material.in_stock && material.stock_quantity <= 0) {
      alert('This material is currently unavailable. Please call for availability.');
      return;
    }
    
    if (quantity > material.stock_quantity && material.stock_quantity > 0) {
      alert(`Only ${material.stock_quantity} ${material.unit}s available.`);
      return;
    }
    
    addToCart(material, quantity);
    setShowAdded(true);
    setTimeout(() => setShowAdded(false), 2000);
  };

  const getStockBadge = () => {
    if (!material.in_stock || material.stock_quantity === 0) {
      return (
        <span className="px-3 py-1 bg-blue-500 text-white text-xs font-bold rounded-full flex items-center space-x-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          <Phone size={12} />
          <span>Available on Request</span>
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

  // Get use-case for this material
  const useCase = useCases[material.name] || material.description || `Premium ${material.name.toLowerCase()} for your landscaping needs.`;
  
  // Get instructions from backend or fallback
  const materialInstructions = material.instructions || '';
  
  const minOrderText = `${material.minOrder || 1} ${material.unit}${((material.minOrder || 1) > 1) ? 's' : ''}`;

  return (
    <div
      className="material-card group bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2"
      style={{
        animationDelay: `${index * 100}ms`,
        opacity: (!material.in_stock && material.stock_quantity <= 0) ? 0.85 : 1
      }}
    >
      <div className="relative overflow-hidden h-64">
        <picture>
          <source
            srcSet={material.image?.replace(/\.(jpg|jpeg|png)$/, '.webp') || ''}
            type="image/webp"
          />
          <img
            src={material.image}
            alt={material.name}
            loading="lazy"
            decoding="async"
            width="400"
            height="256"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/images/IMG_0477.jpg';
            }}
          />
        </picture>
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
        <h3 className="text-2xl font-bold text-[#3B2F2F] mb-2 group-hover:text-[#6B4F3F] transition-colors duration-300" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
          {material.name}
        </h3>
        
        {/* Use-Case Copy */}
        <p className="text-[#6B4F3F] text-sm leading-relaxed mb-3 italic" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          {useCase}
        </p>

        {/* Instructions from Admin */}
        {materialInstructions && (
          <div className="mb-3 p-3 bg-[#FAF9F6] rounded-lg border-l-4 border-[#D9A441]">
            <p className="text-xs text-[#6B4F3F] font-semibold mb-1">Instructions:</p>
            <p className="text-sm text-[#3B2F2F] leading-relaxed">{materialInstructions}</p>
          </div>
        )}

        {/* Min-Order */}
        <div className="flex items-center gap-2 mb-4">
          <span className="px-2 py-1 bg-[#FAF9F6] text-[#3B2F2F] text-xs rounded-full border border-[#D9A441]/50" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Min {minOrderText}
          </span>
        </div>
        
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
          {(!material.in_stock || material.stock_quantity <= 0) ? (
            <a
              href="tel:(830) 336-3713"
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-[#D9A441] text-[#3B2F2F] font-semibold rounded hover:bg-[#3B2F2F] hover:text-white transition-all duration-300"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              <Phone size={18} />
              <span>Call for Quote</span>
            </a>
          ) : (
            <button 
              onClick={handleAddToCart}
              disabled={!material.in_stock}
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-[#3B2F2F] text-[#FAF9F6] font-semibold rounded hover:bg-[#D9A441] hover:text-[#3B2F2F] transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:hover:bg-gray-400 disabled:hover:text-white"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              {showAdded ? (
                <>
                  <Check size={18} />
                  <span>Added!</span>
                </>
              ) : (
                <>
                  <ShoppingCart size={18} />
                  <span>Add to Cart</span>
                </>
              )}
            </button>
          )}
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
