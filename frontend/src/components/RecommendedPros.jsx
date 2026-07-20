// CRITICAL ASSET — CLOSED SOURCE / CONFIDENTIAL
// PROPRIETARY / UNDER DEVELOPMENT / SECRET
import React from 'react';
import { Truck, Trees, Phone, Star, CheckCircle, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

const RecommendedPros = ({ variant = 'full', className = '' }) => {
  const phoneNumber = '(830) 336-3713';

  if (variant === 'compact') {
    return (
      <div className={`bg-[#3B2F2F] rounded-lg p-4 text-[#FAF9F6] ${className}`}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <span className="font-bold" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
              Installation Help?
            </span>
            <p className="text-sm text-[#D9A441]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Need a hand? We can connect you with trusted local experts.
            </p>
          </div>
          <div className="flex gap-2">
            <a
              href={`tel:${phoneNumber.replace(/\D/g, '')}`}
              className="inline-flex items-center space-x-1 px-4 py-2 bg-[#D9A441] text-[#3B2F2F] font-bold rounded hover:bg-[#FAF9F6] transition-colors text-sm"
            >
              <Phone size={16} />
              <span>Get Estimate from Local Experts</span>
            </a>
            <a
              href="/contact"
              className="inline-flex items-center space-x-1 px-4 py-2 bg-transparent border-2 border-[#FAF9F6] text-[#FAF9F6] font-bold rounded hover:bg-[#FAF9F6] hover:text-[#3B2F2F] transition-colors text-sm"
            >
              <span>Get Estimate</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'banner') {
    return (
      <div className={`bg-gradient-to-r from-[#3B2F2F] to-[#6B4F3F] text-[#FAF9F6] py-3 px-6 ${className}`}>
        <div className="container mx-auto flex items-center justify-center space-x-4 flex-wrap">
          <span className="font-semibold" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Need a local pro? We can refer trusted experts.
          </span>
          <a
          href="/contact"
          className="inline-flex items-center space-x-1 px-4 py-1 bg-[#D9A441] text-[#3B2F2F] font-bold rounded hover:bg-[#FAF9F6] transition-colors text-sm"
          >
          <span>Get Estimate from Local Experts</span>
          </a>
        </div>
      </div>
    );
  }

  // Full variant (default)
  return (
    <section className={`py-16 bg-[#FAF9F6] ${className}`}>
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 
              className="text-4xl font-bold text-[#3B2F2F] mb-4"
              style={{ fontFamily: 'Bebas Neue, sans-serif' }}
            >
              Need Installation Help? We've Got You Covered.
            </h2>
            <div className="w-24 h-1 bg-[#D9A441] mx-auto mb-4"></div>
            <p 
              className="text-lg text-[#6B4F3F]"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Order materials from The Dirt Place, then we know the right pros for the job. 
              From delivery to finished landscape — one call does it all.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-xl p-8 border-2 border-[#D9A441]/30">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-[#D9A441] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Truck size={32} className="text-[#3B2F2F]" />
                </div>
                <h3 className="text-xl font-bold text-[#3B2F2F] mb-2" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                  1. Order Materials
                </h3>
                <p className="text-[#6B4F3F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  We deliver dirt, gravel, mulch & more across Boerne
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-[#D9A441] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trees size={32} className="text-[#3B2F2F]" />
                </div>
                <h3 className="text-xl font-bold text-[#3B2F2F] mb-2" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                  2. Connect With Local Experts
                </h3>
                <p className="text-[#6B4F3F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  We refer trusted local experts who handle install and cleanup
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-[#D9A441] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star size={32} className="text-[#3B2F2F]" />
                </div>
                <h3 className="text-xl font-bold text-[#3B2F2F] mb-2" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                  3. Enjoy Your New Landscape
                </h3>
                <p className="text-[#6B4F3F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  Step back and enjoy your transformed outdoor space
                </p>
              </div>
            </div>

            <div className="bg-[#3B2F2F] p-6 rounded-lg text-[#FAF9F6] mb-6">
              <div className="flex items-center justify-between flex-col md:flex-row gap-4">
                <div>
                  <h3 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                    Trusted Installation Partners
                  </h3>
                  <p className="text-[#D9A441] mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Serving Boerne & Texas Hill Country
                  </p>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="flex items-center">
                      <MapPin size={14} className="mr-1" />
                      Licensed & Insured
                    </span>
                    <span className="flex items-center">
                      <Star size={14} className="mr-1 text-[#D9A441]" />
                      5-Star Rated
                    </span>
                    <span className="flex items-center">
                      <CheckCircle size={14} className="mr-1 text-green-400" />
                      Free Estimates
                    </span>
                  </div>
                </div>
                <div className="text-center md:text-right">
                  <div className="text-3xl font-bold text-[#D9A441]" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                    {phoneNumber}
                  </div>
                  <p className="text-sm text-[#FAF9F6]/80">Get matched with a local expert</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href={`tel:${phoneNumber.replace(/\D/g, '')}`}
                className="inline-flex items-center justify-center space-x-2 px-8 py-4 bg-[#D9A441] text-[#3B2F2F] text-lg font-bold rounded hover:bg-[#c4943a] transition-colors"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                <Phone size={20} />
                <span>Call for Referral: {phoneNumber}</span>
              </a>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center space-x-2 px-8 py-4 bg-transparent border-2 border-[#3B2F2F] text-[#3B2F2F] text-lg font-bold rounded hover:bg-[#3B2F2F] hover:text-[#FAF9F6] transition-colors"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                <span>Request Local Expert Referral</span>
              </Link>
            </div>

            <p className="text-center text-sm text-[#6B4F3F] mt-6" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              🤝 Partnership: The Dirt Place + Trusted Local Experts
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RecommendedPros;
