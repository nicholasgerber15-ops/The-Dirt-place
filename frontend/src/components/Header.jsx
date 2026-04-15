import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Materials', path: '/materials' },
    { name: 'Contact', path: '/contact' }
  ];

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-[#3B2F2F] shadow-lg py-3' 
          : 'bg-transparent py-5'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className={`transition-all duration-300 ${isScrolled ? 'w-16 h-16' : 'w-20 h-20'}`}>
              <img 
                src="https://customer-assets.emergentagent.com/job_earth-supply-1/artifacts/pl8t7hjh_Final%20logo.png" 
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
              to="/contact"
              className="px-6 py-2 bg-[#D9A441] text-[#3B2F2F] font-bold rounded hover:bg-[#FAF9F6] hover:shadow-lg transform hover:scale-105 transition-all duration-300"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Get Quote
            </Link>
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
            <Link
              to="/contact"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block mt-4 px-6 py-3 bg-[#D9A441] text-[#3B2F2F] font-bold rounded text-center hover:bg-[#FAF9F6] transition-colors duration-300"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Get Quote
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
