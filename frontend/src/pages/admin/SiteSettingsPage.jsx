import React, { useState, useEffect } from 'react';
import { ArrowLeft, Upload, Image, Loader, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const SiteSettingsPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  
  // Hero Image Settings
  const [heroImageUrl, setHeroImageUrl] = useState('');
  
  // Popup Settings
  const [popupSettings, setPopupSettings] = useState({
    popup_active: false,
    popup_title: '',
    popup_message: '',
    popup_image_url: '',
    popup_cta_text: '',
    popup_cta_link: '',
    show_on_homepage: true,
    show_on_materials: false,
    show_on_delivery: false,
    show_on_contact: false,
    display_timing: 'after_3_seconds',
    start_date: '',
    end_date: '',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/admin/settings`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('admin_token') || 'dirtplace2024'}` }
      });
      if (response.data.hero_image_url) {
        setHeroImageUrl(response.data.hero_image_url);
      }

      // Fetch popup settings
      const popupResponse = await axios.get(`${API}/admin/popup-settings`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('admin_token') || 'dirtplace2024'}` }
      });
      
      if (popupResponse.data) {
        setPopupSettings({
          popup_active: popupResponse.data.popup_active || false,
          popup_title: popupResponse.data.popup_title || '',
          popup_message: popupResponse.data.popup_message || '',
          popup_image_url: popupResponse.data.popup_image_url || '',
          popup_cta_text: popupResponse.data.popup_cta_text || '',
          popup_cta_link: popupResponse.data.popup_cta_link || '',
          show_on_homepage: popupResponse.data.show_on_homepage !== false,
          show_on_materials: popupResponse.data.show_on_materials || false,
          show_on_delivery: popupResponse.data.show_on_delivery || false,
          show_on_contact: popupResponse.data.show_on_contact || false,
          display_timing: popupResponse.data.display_timing || 'after_3_seconds',
          start_date: popupResponse.data.start_date || '',
          end_date: popupResponse.data.end_date || '',
        });
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      setMessage('Failed to load settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleHeroImageUpdate = async () => {
    if (!heroImageUrl) {
      setMessage('Please enter an image URL.');
      return;
    }

    try {
      setSaving(true);
      await axios.put(`${API}/admin/settings/hero-image`, 
        { hero_image_url: heroImageUrl },
        { headers: { Authorization: `Bearer ${localStorage.getItem('admin_token') || 'dirtplace2024'}` } }
      );
      setMessage('Hero image updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Failed to update hero image.');
    } finally {
      setSaving(false);
    }
  };

  const handlePopupSettingChange = (field, value) => {
    setPopupSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePopupSave = async () => {
    try {
      setSaving(true);
      await axios.put(`${API}/admin/popup-settings`,
        popupSettings,
        { headers: { Authorization: `Bearer ${localStorage.getItem('admin_token') || 'dirtplace2024'}` } }
      );
      setMessage('Popup settings updated successfully!');
      // Clear session storage to show popup again with new settings
      sessionStorage.removeItem('seasonalPopupDismissed');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Failed to save popup settings:', error);
      setMessage('Failed to save popup settings.');
    } finally {
      setSaving(false);
    }
  };

  const promotionalTemplates = [
    {
      name: 'Spring Garden Prep Special',
      title: '🌷 Spring Garden Prep Special',
      message: 'Get your garden ready for spring! 10% off all Topsoil and Mulch orders this month. Perfect time to refresh your garden beds!',
      cta_text: 'Shop Garden Materials',
      cta_link: '/materials',
      image: 'https://images.unsplash.com/photo-1416874871171-1d8e3c354c5'
    },
    {
      name: 'Summer Driveway Refresh',
      title: '☀️ Summer Driveway Refresh',
      message: 'Beat the heat with a fresh driveway! 15% off Gravel and Road Base orders over 10 yards. Limited time offer!',
      cta_text: 'Get Driveway Quote',
      cta_link: '/contact',
      image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba'
    },
    {
      name: 'Fall Landscaping Boost',
      title: '🍂 Fall Landscaping Boost',
      message: 'Prep your landscape for winter! Free delivery on orders over 15 yards this fall. Schedule your delivery today!',
      cta_text: 'Schedule Delivery',
      cta_link: '/contact',
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4'
    },
    {
      name: 'Contractor Winter Special',
      title: '🏗️ Contractor Winter Special',
      message: 'Attention contractors! 20% off bulk orders (50+ yards) through February. Stock up for your spring projects now!',
      cta_text: 'Access Contractor Portal',
      cta_link: '/contractor-portal',
      image: 'https://images.unsplash.com/photo-1541889477835-8c03f88e2b1c'
    }
  ];

  const loadTemplate = (template) => {
    handlePopupSettingChange('popup_title', template.title);
    handlePopupSettingChange('popup_message', template.message);
    handlePopupSettingChange('popup_cta_text', template.cta_text);
    handlePopupSettingChange('popup_cta_link', template.cta_link);
    handlePopupSettingChange('popup_image_url', template.image);
    setMessage(`Loaded "${template.name}" template. Click Save to apply.`);
    setTimeout(() => setMessage(''), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] pt-32 pb-24 flex items-center justify-center">
        <div className="text-center">
          <Loader size={64} className="mx-auto mb-4 text-[#D9A441] animate-spin" />
          <p className="text-[#6B4F3F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Loading settings...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] pt-32 pb-24">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-8">
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="inline-flex items-center space-x-2 text-[#3B2F2F] hover:text-[#D9A441] mb-4 transition-colors duration-300"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            <ArrowLeft size={20} />
            <span>Back to Dashboard</span>
          </button>
          <h1 className="text-5xl md:text-6xl font-bold text-[#3B2F2F] mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
            Site Settings
          </h1>
          <div className="w-24 h-1 bg-[#D9A441]"></div>
        </div>

        {message && (
          <div className={"p-4 rounded-lg mb-6 animate-fade-in " + (message.includes('successfully') ? 'bg-[#6B7A3A] text-white' : 'bg-red-100 text-red-700')} style={{ fontFamily: 'Montserrat, sans-serif' }}>
            {message}
          </div>
        )}

        {/* Hero Image Section */}
        <div className="bg-white rounded-lg shadow-xl p-8 mb-8">
          <h2 className="text-3xl font-bold text-[#3B2F2F] mb-6" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
            Hero Image Settings
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-[#3B2F2F] font-semibold mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Hero Image URL
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={heroImageUrl}
                  onChange={(e) => setHeroImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="flex-1 px-4 py-3 border-2 border-[#6B4F3F]/20 rounded focus:border-[#D9A441] focus:outline-none transition-colors duration-300"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                />
                <button
                  onClick={handleHeroImageUpdate}
                  disabled={saving}
                  className="px-6 py-3 bg-[#3B2F2F] text-[#FAF9F6] font-bold rounded hover:bg-[#D9A441] hover:text-[#3B2F2F] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  <Save size={18} />
                  <span>{saving ? 'Saving...' : 'Save'}</span>
                </button>
              </div>
            </div>
            {heroImageUrl && (
              <div className="mt-4">
                <p className="text-sm text-[#6B4F3F] mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  Preview:
                </p>
                <img 
                  src={heroImageUrl} 
                  alt="Hero preview" 
                  className="w-full h-48 object-cover rounded-lg"
                  onError={(e) => e.target.style.display = 'none'}
                />
              </div>
            )}
          </div>
        </div>

        {/* CTA Popup Settings */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h2 className="text-3xl font-bold text-[#3B2F2F] mb-6" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
            CTA Popup Settings
          </h2>
          
          <div className="space-y-6">
            {/* Active Toggle */}
            <div className="flex items-center justify-between p-4 bg-[#FAF9F6] rounded-lg">
              <div>
                <h3 className="font-bold text-[#3B2F2F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  Popup Active
                </h3>
                <p className="text-sm text-[#6B4F3F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  Enable or disable the promotional popup
                </p>
              </div>
              <button
                onClick={() => handlePopupSettingChange('popup_active', !popupSettings.popup_active)}
                className={`w-14 h-8 rounded-full transition-colors duration-300 relative ${
                  popupSettings.popup_active ? 'bg-[#6B7A3A]' : 'bg-gray-300'
                }`}
                aria-label="Toggle popup active"
              >
                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform duration-300 ${
                  popupSettings.popup_active ? 'left-7' : 'left-1'
                }`}></div>
              </button>
            </div>

            {/* Popup Title */}
            <div>
              <label className="block text-[#3B2F2F] font-semibold mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Popup Title
              </label>
              <input
                type="text"
                value={popupSettings.popup_title}
                onChange={(e) => handlePopupSettingChange('popup_title', e.target.value)}
                placeholder="e.g., Winter Special - 10% Off!"
                className="w-full px-4 py-3 border-2 border-[#6B4F3F]/20 rounded focus:border-[#D9A441] focus:outline-none transition-colors duration-300"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              />
            </div>

            {/* Popup Message */}
            <div>
              <label className="block text-[#3B2F2F] font-semibold mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Popup Message
              </label>
              <textarea
                value={popupSettings.popup_message}
                onChange={(e) => handlePopupSettingChange('popup_message', e.target.value)}
                placeholder="Enter your promotional message here..."
                rows="3"
                className="w-full px-4 py-3 border-2 border-[#6B4F3F]/20 rounded focus:border-[#D9A441] focus:outline-none transition-colors duration-300 resize-none"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              />
            </div>

            {/* Popup Image URL */}
            <div>
              <label className="block text-[#3B2F2F] font-semibold mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Popup Image URL (Optional)
              </label>
              <input
                type="text"
                value={popupSettings.popup_image_url}
                onChange={(e) => handlePopupSettingChange('popup_image_url', e.target.value)}
                placeholder="https://example.com/popup-image.jpg"
                className="w-full px-4 py-3 border-2 border-[#6B4F3F]/20 rounded focus:border-[#D9A441] focus:outline-none transition-colors duration-300"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              />
              {popupSettings.popup_image_url && (
                <div className="mt-3">
                  <img 
                    src={popupSettings.popup_image_url} 
                    alt="Popup preview" 
                    className="w-full h-48 object-cover rounded-lg"
                    onError={(e) => e.target.style.display = 'none'}
                  />
                </div>
              )}
            </div>

            {/* CTA Text */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[#3B2F2F] font-semibold mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  CTA Button Text
                </label>
                <input
                  type="text"
                  value={popupSettings.popup_cta_text}
                  onChange={(e) => handlePopupSettingChange('popup_cta_text', e.target.value)}
                  placeholder="e.g., Shop Now, Learn More"
                  className="w-full px-4 py-3 border-2 border-[#6B4F3F]/20 rounded focus:border-[#D9A441] focus:outline-none transition-colors duration-300"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                />
              </div>
              <div>
                <label className="block text-[#3B2F2F] font-semibold mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  CTA Link
                </label>
                <input
                  type="text"
                  value={popupSettings.popup_cta_link}
                  onChange={(e) => handlePopupSettingChange('popup_cta_link', e.target.value)}
                  placeholder="/materials or https://..."
                  className="w-full px-4 py-3 border-2 border-[#6B4F3F]/20 rounded focus:border-[#D9A441] focus:outline-none transition-colors duration-300"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                />
              </div>
            </div>

            {/* Display Timing */}
            <div>
              <label className="block text-[#3B2F2F] font-semibold mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Display Timing
              </label>
              <select
                value={popupSettings.display_timing}
                onChange={(e) => handlePopupSettingChange('display_timing', e.target.value)}
                className="w-full px-4 py-3 border-2 border-[#6B4F3F]/20 rounded focus:border-[#D9A441] focus:outline-none transition-colors duration-300"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                <option value="immediate">Immediate</option>
                <option value="after_3_seconds">After 3 Seconds</option>
                <option value="after_5_seconds">After 5 Seconds</option>
                <option value="on_exit_intent">On Exit Intent</option>
              </select>
            </div>

            {/* Show On Pages */}
            <div>
              <h3 className="font-bold text-[#3B2F2F] mb-3" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Show Popup On:
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { key: 'show_on_homepage', label: 'Homepage' },
                  { key: 'show_on_materials', label: 'Materials' },
                  { key: 'show_on_delivery', label: 'Delivery' },
                  { key: 'show_on_contact', label: 'Contact' }
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center space-x-3 p-3 bg-[#FAF9F6] rounded-lg cursor-pointer hover:bg-[#D9A441]/10 transition-colors duration-200">
                    <input
                      type="checkbox"
                      checked={popupSettings[key]}
                      onChange={(e) => handlePopupSettingChange(key, e.target.checked)}
                      className="w-5 h-5 rounded border-2 border-[#6B4F3F] text-[#D9A441] focus:ring-[#D9A441] focus:ring-2 cursor-pointer"
                    />
                    <span className="text-sm font-medium text-[#3B2F2F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      {label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Active Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[#3B2F2F] font-semibold mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  Start Date (Optional)
                </label>
                <input
                  type="date"
                  value={popupSettings.start_date}
                  onChange={(e) => handlePopupSettingChange('start_date', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-[#6B4F3F]/20 rounded focus:border-[#D9A441] focus:outline-none transition-colors duration-300"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                />
              </div>
              <div>
                <label className="block text-[#3B2F2F] font-semibold mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  End Date (Optional)
                </label>
                <input
                  type="date"
                  value={popupSettings.end_date}
                  onChange={(e) => handlePopupSettingChange('end_date', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-[#6B4F3F]/20 rounded focus:border-[#D9A441] focus:outline-none transition-colors duration-300"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                />
              </div>
            </div>

             {/* Quick Templates */}
             <div className="pt-6 border-t-2 border-[#D9A441]">
               <h3 className="text-xl font-bold text-[#3B2F2F] mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                 Quick Templates - Monthly Specials
               </h3>
               <p className="text-sm text-[#6B4F3F] mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                 Click a template to load it below, then click Save to activate
               </p>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                 {promotionalTemplates.map((template, index) => (
                   <button
                     key={index}
                     onClick={() => loadTemplate(template)}
                     className="p-4 bg-[#FAF9F6] border-2 border-[#6B4F3F]/20 rounded-lg hover:border-[#D9A441] hover:bg-[#D9A441]/10 transition-all duration-300 text-left"
                     style={{ fontFamily: 'Montserrat, sans-serif' }}
                   >
                     <h4 className="font-bold text-[#3B2F2F] mb-1">{template.name}</h4>
                     <p className="text-sm text-[#6B4F3F]">{template.title}</p>
                   </button>
                 ))}
               </div>
             </div>

             {/* Save Button */}
             <div className="pt-6 border-t-2 border-[#D9A441]">
               <button
                 onClick={handlePopupSave}
                 disabled={saving}
                 className="w-full flex items-center justify-center space-x-2 px-8 py-4 bg-[#D9A441] text-[#3B2F2F] text-lg font-bold rounded hover:bg-[#3B2F2F] hover:text-[#FAF9F6] hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                 style={{ fontFamily: 'Montserrat, sans-serif' }}
               >
                 <Save size={20} />
                 <span>{saving ? 'Saving...' : 'Save Popup Settings'}</span>
               </button>
               <p className="text-xs text-[#6B4F3F] mt-3 text-center" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                 Tip: Saving will clear dismissed popups so visitors see the updated version
               </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SiteSettingsPage;
