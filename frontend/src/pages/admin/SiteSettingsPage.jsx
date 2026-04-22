import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Settings, LogOut, Image as ImageIcon, Save } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const SiteSettingsPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [heroImageUrl, setHeroImageUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin_token');
      
      const response = await axios.get(`${API}/admin/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const url = response.data.hero_image_url || '';
      setHeroImageUrl(url);
      setPreviewUrl(url);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('admin_token');
        navigate('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('admin_token');
      
      await axios.put(
        `${API}/admin/settings/hero-image`,
        { hero_image_url: heroImageUrl },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setPreviewUrl(heroImageUrl);
      alert('Hero image updated successfully!');
    } catch (error) {
      console.error('Failed to update settings:', error);
      alert('Failed to update hero image');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      {/* Admin Header */}
      <header className="bg-[#3B2F2F] shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                The Dirt Place Admin
              </h1>
              <p className="text-[#D9A441] text-sm" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Site Settings
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 bg-[#D9A441] text-[#3B2F2F] font-semibold rounded hover:bg-white transition-colors"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow">
        <div className="container mx-auto px-4">
          <div className="flex space-x-8">
            <Link
              to="/admin/dashboard"
              className="px-4 py-4 text-[#6B4F3F] hover:text-[#D9A441] font-semibold transition-colors"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Dashboard
            </Link>
            <Link
              to="/admin/orders"
              className="px-4 py-4 text-[#6B4F3F] hover:text-[#D9A441] font-semibold transition-colors"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Orders
            </Link>
            <Link
              to="/admin/pricing"
              className="px-4 py-4 text-[#6B4F3F] hover:text-[#D9A441] font-semibold transition-colors"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Materials & Pricing
            </Link>
            <Link
              to="/admin/inventory"
              className="px-4 py-4 text-[#6B4F3F] hover:text-[#D9A441] font-semibold transition-colors"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Inventory
            </Link>
            <Link
              to="/admin/settings"
              className="px-4 py-4 border-b-2 border-[#D9A441] text-[#D9A441] font-semibold"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Settings
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#D9A441]"></div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Hero Image Settings */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center mb-6">
                <ImageIcon size={32} className="text-[#D9A441] mr-3" />
                <h2 className="text-3xl font-bold text-[#3B2F2F]" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                  Homepage Hero Image
                </h2>
              </div>

              <p className="text-[#6B4F3F] mb-6" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Customize the main hero/banner image on your homepage. Paste the URL of your image below.
              </p>

              <div className="space-y-6">
                <div>
                  <label className="block text-[#3B2F2F] font-semibold mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Hero Image URL
                  </label>
                  <input
                    type="text"
                    value={heroImageUrl}
                    onChange={(e) => setHeroImageUrl(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-[#6B4F3F]/20 rounded focus:border-[#D9A441] focus:outline-none"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                    placeholder="https://example.com/hero-image.jpg"
                  />
                  <p className="text-sm text-[#6B4F3F] mt-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Recommended size: 1920x800px or larger. Leave empty to use default image.
                  </p>
                </div>

                {/* Preview */}
                {previewUrl && (
                  <div>
                    <label className="block text-[#3B2F2F] font-semibold mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      Current Hero Image Preview
                    </label>
                    <div className="border-2 border-[#6B4F3F]/20 rounded overflow-hidden">
                      <img
                        src={previewUrl}
                        alt="Hero Preview"
                        className="w-full h-64 object-cover"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/1920x800?text=Image+Not+Found';
                        }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex space-x-4">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center space-x-2 px-6 py-3 bg-[#D9A441] text-[#3B2F2F] font-bold rounded hover:bg-[#3B2F2F] hover:text-white transition-colors disabled:opacity-50"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    <Save size={18} />
                    <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                  </button>

                  <button
                    onClick={fetchSettings}
                    disabled={saving}
                    className="px-6 py-3 bg-gray-300 text-[#3B2F2F] font-bold rounded hover:bg-gray-400 transition-colors disabled:opacity-50"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>

            {/* Info Card */}
            <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-6">
              <h3 className="text-xl font-bold text-blue-900 mb-3" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                💡 How to get image URLs
              </h3>
              <ul className="space-y-2 text-blue-800" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                <li>• Upload images to a service like <strong>Imgur</strong>, <strong>Cloudinary</strong>, or <strong>Google Drive</strong></li>
                <li>• Right-click the image and select "Copy Image Address" or "Copy Link"</li>
                <li>• Paste the URL in the field above</li>
                <li>• Make sure the URL ends with an image extension (.jpg, .png, .webp)</li>
              </ul>
            </div>

            {/* Future Settings Placeholder */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center mb-4">
                <Settings size={32} className="text-[#6B7A3A] mr-3" />
                <h2 className="text-3xl font-bold text-[#3B2F2F]" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                  Additional Settings
                </h2>
              </div>
              <p className="text-[#6B4F3F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                More customization options coming soon (business hours, contact info, social media links, etc.)
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SiteSettingsPage;
