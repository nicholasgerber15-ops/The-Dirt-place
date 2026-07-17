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
import { Phone, Mail, MapPin, Clock, Facebook, Instagram } from 'lucide-react';
import { businessInfo } from '../data/mock';
import RecommendedPros from './RecommendedPros';

const Footer = () => {
  return (
    <footer className="bg-[#3B2F2F] text-[#FAF9F6] pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          {/* Logo and About */}
          <div>
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-16 h-16">
                <img 
                  src="https://customer-assets.emergentagent.com/job_earth-supply-1/artifacts/pl8t7hjh_Final%20logo.png"
                  alt="The Dirt Place Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h3 className="text-xl font-bold" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                  THE DIRT PLACE
                </h3>
                <p className="text-[#D9A441] text-sm" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  Boerne, Texas
                </p>
              </div>
            </div>
            <p className="text-sm leading-relaxed mb-6" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Premium landscape materials for the Texas Hill Country. Serving homeowners, ranchers, and contractors with quality and reliability.
            </p>
            <div className="flex space-x-4">
              <a
                href="https://www.facebook.com/profile.php?id=61566256235599"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-[#6B4F3F] flex items-center justify-center hover:bg-[#D9A441] hover:scale-110 transition-all duration-300"
              >
                <Facebook size={20} />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-[#6B4F3F] flex items-center justify-center hover:bg-[#D9A441] hover:scale-110 transition-all duration-300"
              >
                <Instagram size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xl font-bold mb-6" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
              Quick Links
            </h4>
            <ul className="space-y-3" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              <li>
                <Link to="/" className="hover:text-[#D9A441] transition-colors duration-300 flex items-center group">
                  <span className="w-0 h-0.5 bg-[#D9A441] transition-all duration-300 group-hover:w-4 mr-0 group-hover:mr-2"></span>
                  Home
                </Link>
              </li>
              <li>
                <Link to="/materials" className="hover:text-[#D9A441] transition-colors duration-300 flex items-center group">
                  <span className="w-0 h-0.5 bg-[#D9A441] transition-all duration-300 group-hover:w-4 mr-0 group-hover:mr-2"></span>
                  Materials
                </Link>
              </li>
              <li>
                <Link to="/delivery" className="hover:text-[#D9A441] transition-colors duration-300 flex items-center group">
                  <span className="w-0 h-0.5 bg-[#D9A441] transition-all duration-300 group-hover:w-4 mr-0 group-hover:mr-2"></span>
                  Delivery
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-[#D9A441] transition-colors duration-300 flex items-center group">
                  <span className="w-0 h-0.5 bg-[#D9A441] transition-all duration-300 group-hover:w-4 mr-0 group-hover:mr-2"></span>
                  Contact
                </Link>
              </li>
            </ul>
            
            {/* Contractor CTA in Footer */}
            <Link
              to="/contact?type=contractor"
              className="mt-6 inline-block px-6 py-3 bg-transparent border-2 border-[#D9A441] text-[#D9A441] text-sm font-bold rounded hover:bg-[#D9A441] hover:text-[#3B2F2F] transition-all duration-300"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Contractor? Get Business Pricing
            </Link>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-xl font-bold mb-6" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
              Contact Us
            </h4>
            <ul className="space-y-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              <li className="flex items-start space-x-3 group">
                <MapPin size={20} className="text-[#D9A441] mt-1 group-hover:scale-110 transition-transform duration-300" />
                <span className="text-sm">{businessInfo.address}</span>
              </li>
              <li className="flex items-start space-x-3 group">
                <Phone size={20} className="text-[#D9A441] mt-1 group-hover:scale-110 transition-transform duration-300" />
                <a href={`tel:${businessInfo.phone}`} className="text-sm hover:text-[#D9A441] transition-colors duration-300">
                  {businessInfo.phone}
                </a>
              </li>
              <li className="flex items-start space-x-3 group">
                <Mail size={20} className="text-[#D9A441] mt-1 group-hover:scale-110 transition-transform duration-300" />
                <a href={`mailto:${businessInfo.email}`} className="text-sm hover:text-[#D9A441] transition-colors duration-300">
                  {businessInfo.email}
                </a>
              </li>
              <li className="flex items-start space-x-3 group">
                <Clock size={20} className="text-[#D9A441] mt-1 group-hover:scale-110 transition-transform duration-300" />
                <div className="text-sm">
                  <p>{businessInfo.hours.weekday}</p>
                  <p>{businessInfo.hours.saturday}</p>
                  <p>{businessInfo.hours.sunday}</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Recommended Pros Banner */}
        <RecommendedPros variant="banner" className="mb-8" />

        {/* Bottom Bar */}
        <div className="border-t border-[#6B4F3F] pt-8 text-center">
          <p className="text-sm mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            © {new Date().getFullYear()} The Dirt Place. All rights reserved. | Serving the Texas Hill Country
          </p>
          <p className="text-xs text-[#6B4F3F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Designed by <span className="text-[#D9A441] font-semibold">Nfinnite</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
