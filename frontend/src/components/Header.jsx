import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ShoppingCart, Globe } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { getItemCount } = useCart();
  const cartCount = getItemCount();
  const { language, toggle } = useLanguage();

  const navLinks = [
    { name: language === 'es' ? 'Inicio' : 'Home', path: '/' },
    { name: language === 'es' ? 'Materiales' : 'Materials', path: '/materials' },
    { name: language === 'es' ? 'Contacto' : 'Contact', path: '/contact' },
    { name: language === 'es' ? 'Zonas de Servicio' : 'Service Areas', path: '/service-area/boerne' }
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#3B2F2F] shadow-lg py-3">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-16 h-16 transition-all duration-300">
              <img 
                src="/images/dirtplace-logo.png" 
                alt="The Dirt Place Logo"
                className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-[#FAF9F6] text-2xl font-bold tracking-wide" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                THE DIRT PLACE
              </h1>
              <p className="text-[#D9A441] text-xs" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Boerne, Texas
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-lg font-semibold transition-all duration-300 relative group ${
                  location.pathname === link.path
                    ? 'text-[#D9A441]'
                    : 'text-[#FAF9F6] hover:text-[#D9A441]'
                }`}
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                {link.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#D9A441] transition-all duration-300 group-hover:w-full"></span>
              </Link>
            ))}
            <Link
              to="/cart"
              className="relative text-[#FAF9F6] hover:text-[#D9A441] transition-colors duration-300"
            >
              <ShoppingCart size={24} />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-[#D9A441] text-[#3B2F2F] text-xs font-bold rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
            <button
              onClick={toggle}
              className="ml-3 flex items-center gap-2 px-3 py-1.5 bg-[#F4A261]/10 border border-[#F4A261]/30 rounded text-[#F4A261] hover:bg-[#F4A261]/20 transition-colors"
              aria-label={
                language === 'en'
                  ? 'Cambiar a español'
                  : 'Switch to English'
              }
            >
              <Globe size={16} />
              <span className="text-sm font-semibold">{language === 'en' ? 'ES' : 'EN'}</span>
            </button>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-[#FAF9F6] hover:text-[#D9A441] transition-colors duration-300"
          >
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <nav className="md:hidden mt-4 pb-4 border-t border-[#6B4F3F] pt-4 animate-fade-in">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block py-3 text-lg font-semibold transition-colors duration-300 ${
                  location.pathname === link.path
                    ? 'text-[#D9A441]'
                    : 'text-[#FAF9F6] hover:text-[#D9A441]'
                }`}
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                {link.name}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
