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
import React, { useState } from 'react';
import { MapPin, Check, X } from 'lucide-react';

const ZipCodeChecker = () => {
  const [zipCode, setZipCode] = useState('');
  const [result, setResult] = useState(null);

  const handleCheck = (e) => {
    e.preventDefault();
    
    // Placeholder logic - in real implementation, this would check against a database
    const serviceZips = ['78006', '78015', '78070', '78163', '78255'];
    const isServiced = serviceZips.includes(zipCode);
    
    setResult({
      serviced: isServiced,
      message: isServiced 
        ? 'Great news! We deliver to your area.' 
        : 'We may still be able to help! Call us at (830) 336-3713 for extended delivery options.'
    });
  };

  return (
    <div className="bg-gradient-to-br from-[#6B7A3A] to-[#3B2F2F] rounded-lg shadow-2xl p-8 md:p-10">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-12 h-12 bg-[#D9A441] rounded-full flex items-center justify-center">
          <MapPin size={24} className="text-[#3B2F2F]" />
        </div>
        <h3 
          className="text-3xl font-bold text-white"
          style={{ fontFamily: 'Bebas Neue, sans-serif' }}
        >
          Do We Deliver to You?
        </h3>
      </div>
      
      <p 
        className="text-white/90 mb-6"
        style={{ fontFamily: 'Montserrat, sans-serif' }}
      >
        Enter your ZIP code to check if we service your area
      </p>

      <form onSubmit={handleCheck} className="space-y-4">
        <div className="flex gap-3">
          <input
            type="text"
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value)}
            placeholder="Enter ZIP code"
            maxLength="5"
            pattern="[0-9]{5}"
            required
            className="flex-1 px-4 py-3 rounded border-2 border-white/20 bg-white/10 text-white placeholder-white/50 focus:border-[#D9A441] focus:outline-none transition-colors duration-300"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          />
          <button
            type="submit"
            className="px-8 py-3 bg-[#D9A441] text-[#3B2F2F] font-bold rounded hover:bg-white transition-colors duration-300"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            Check
          </button>
        </div>

        {result && (
          <div 
            className={`p-4 rounded flex items-start space-x-3 animate-fade-in ${
              result.serviced 
                ? 'bg-[#6B7A3A] border-2 border-white/20' 
                : 'bg-[#D9A441]/20 border-2 border-[#D9A441]'
            }`}
          >
            {result.serviced ? (
              <Check size={24} className="text-white flex-shrink-0" />
            ) : (
              <X size={24} className="text-[#D9A441] flex-shrink-0" />
            )}
            <p 
              className="text-white"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              {result.message}
            </p>
          </div>
        )}
      </form>

      <div className="mt-6 pt-6 border-t border-white/20">
        <p 
          className="text-sm text-white/70 text-center"
          style={{ fontFamily: 'Montserrat, sans-serif' }}
        >
          Primary service areas: Boerne, Fair Oaks Ranch, Comfort, Leon Springs, Bergheim, Kendall County
        </p>
      </div>
    </div>
  );
};

export default ZipCodeChecker;
