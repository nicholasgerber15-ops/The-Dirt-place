import React, { useState, useEffect } from 'react';
import { X, Percent, Truck, Sun } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";
const API = `${BACKEND_URL}/api`;

const SeasonalPopup = ({ page = 'homepage' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [popupData, setPopupData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if popup was dismissed this session
    const dismissed = sessionStorage.getItem('seasonalPopupDismissed');
    if (dismissed) return;

    // Fetch popup settings from backend
    const fetchPopupSettings = async () => {
      try {
        const response = await axios.get(`${API}/admin/popup-public`);
        
        // Check if popup is active
        if (!response.data.popup_active) {
          setLoading(false);
          return;
        }
        
        // Check if popup should show on this page
        const showOnPage = 
          (page === 'homepage' && response.data.show_on_homepage) ||
          (page === 'materials' && response.data.show_on_materials) ||
          (page === 'delivery' && response.data.show_on_delivery) ||
          (page === 'contact' && response.data.show_on_contact);
        
        if (!showOnPage) {
          setLoading(false);
          return;
        }
        
        setPopupData(response.data);
        
        // Show popup based on display timing
        const timing = response.data.display_timing || 'after_3_seconds';
        const delay = timing === 'immediate' ? 0 :
                      timing === 'after_5_seconds' ? 5000 : 3000;
        
        const timer = setTimeout(() => {
          setIsVisible(true);
          setIsAnimating(true);
          document.body.style.overflow = 'hidden';
        }, delay);

        return () => {
          clearTimeout(timer);
          document.body.style.overflow = 'unset';
        };
      } catch (error) {
        console.error('Failed to fetch popup settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPopupSettings();
  }, [page]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsVisible(false);
      document.body.style.overflow = 'unset';
      sessionStorage.setItem('seasonalPopupDismissed', 'true');
    }, 300);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  // Handle Escape key
  useEffect(() => {
    if (!isVisible) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isVisible]);

  if (!isVisible || loading || !popupData) return null;

  // Dynamically choose icon based on popup content or use default
  const getIcon = () => {
    // You can customize icon based on popup title or content
    if (popupData.popup_title?.toLowerCase().includes('sale') || 
        popupData.popup_title?.toLowerCase().includes('special')) {
      return Percent;
    }
    if (popupData.popup_title?.toLowerCase().includes('delivery')) {
      return Truck;
    }
    return Sun; // Default icon
  };

  const IconComponent = getIcon();

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${isAnimating ? 'animate-fade-in' : 'opacity-0'}`}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="Promotional popup"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Popup Content */}
      <div 
        className={`relative max-w-lg w-full bg-[#3B2F2F] rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-300 ${isAnimating ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}
        style={{ fontFamily: 'Montserrat, sans-serif' }}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white"
          aria-label="Close promotion popup"
        >
          <X size={20} className="text-white" />
        </button>

        {/* Popup Image (if provided) */}
        {popupData.popup_image_url && (
          <div className="relative h-48 overflow-hidden">
            <img 
              src={popupData.popup_image_url} 
              alt={popupData.popup_title || "Promotional offer"}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#3B2F2F] to-transparent"></div>
          </div>
        )}

        {/* Header with Icon */}
        <div className={`relative p-8 ${popupData.popup_image_url ? 'pt-6' : 'pb-6'}`}>
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-16 h-16 bg-[#D9A441]/20 rounded-full flex items-center justify-center flex-shrink-0">
              <IconComponent size={32} className="text-[#D9A441]" />
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                {popupData.popup_title || "Special Offer!"}
              </h2>
              <div className="w-16 h-1 bg-[#D9A441]"></div>
            </div>
          </div>
          
          {popupData.popup_message && (
            <p className="text-lg text-white/90 leading-relaxed">
              {popupData.popup_message}
            </p>
          )}
        </div>

        {/* CTA Section */}
        <div className="bg-black/20 p-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex items-center space-x-2 text-[#D9A441]">
            <span className="text-sm font-semibold">Limited Time Offer</span>
          </div>
          
          <a
            href={popupData.popup_cta_link || "/materials"}
            onClick={handleClose}
            className="px-8 py-3 bg-[#D9A441] text-[#3B2F2F] font-bold rounded-lg hover:bg-[#FAF9F6] transform hover:scale-105 transition-all duration-300 text-center"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            {popupData.popup_cta_text || "Learn More"} →
          </a>
        </div>

        {/* Decorative bottom border */}
        <div className="h-1 bg-gradient-to-r from-[#D9A441] via-[#FAF9F6] to-[#D9A441]"></div>
      </div>
    </div>
  );
};

export default SeasonalPopup;
