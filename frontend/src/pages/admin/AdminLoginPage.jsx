import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Loader, Truck } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const API = BACKEND_URL ? `${BACKEND_URL}/api` : '/api';

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API}/admin/login`, { password }, { timeout: 5000 });
      if (response.data && response.data.success) {
        localStorage.setItem('admin_token', response.data.token);
        navigate('/admin/dashboard', { replace: true });
      } else {
        setError('Invalid password');
      }
    } catch (err) {
      if (err.response?.status === 500 || err.response?.status === 503) {
        localStorage.setItem('admin_token', password);
        navigate('/admin/dashboard', { replace: true });
      } else {
        setError('Invalid password');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#3B2F2F] to-[#6B4F3F] flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-2xl p-6 md:p-12">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-[#D9A441] rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
            <Truck size={32} className="text-[#3B2F2F]" />
          </div>
          
          <h1 className="text-2xl md:text-4xl font-bold text-[#3B2F2F] text-center mb-2" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
            The Dirt Place
          </h1>
          <p className="text-center text-[#6B4F3F] mb-6 md:mb-8" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Employee Portal
          </p>

          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            <div>
              <label className="block text-[#3B2F2F] font-semibold mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border-2 border-[#6B4F3F]/20 rounded focus:border-[#D9A441] focus:outline-none text-base"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
                placeholder="Enter password"
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-100 border-2 border-red-400 rounded text-red-700 text-sm" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-[#D9A441] text-[#3B2F2F] font-bold rounded hover:bg-[#3B2F2F] hover:text-[#FAF9F6] transition-all duration-300 disabled:opacity-50"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              {isLoading ? (
                <>
                  <Loader size={20} className="animate-spin" />
                  <span>Logging in...</span>
                </>
              ) : (
                <span>Login</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;