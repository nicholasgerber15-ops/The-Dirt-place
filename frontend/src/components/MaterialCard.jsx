import React from 'react';
import { ArrowRight } from 'lucide-react';

const MaterialCard = ({ material, index }) => {
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
      </div>
      
      <div className="p-6">
        <h3 className="text-2xl font-bold text-[#3B2F2F] mb-3 group-hover:text-[#6B4F3F] transition-colors duration-300" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
          {material.name}
        </h3>
        <p className="text-[#6B4F3F] text-sm leading-relaxed mb-6" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          {material.description}
        </p>
        <button className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-[#3B2F2F] text-[#FAF9F6] font-semibold rounded hover:bg-[#D9A441] hover:text-[#3B2F2F] transition-all duration-300 group/btn">
          <span style={{ fontFamily: 'Montserrat, sans-serif' }}>Request Pricing</span>
          <ArrowRight size={18} className="transition-transform duration-300 group-hover/btn:translate-x-1" />
        </button>
      </div>
    </div>
  );
};

export default MaterialCard;
