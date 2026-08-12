import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Lock, Loader, CheckCircle, AlertTriangle, ArrowLeft } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const API = BACKEND_URL ? `${BACKEND_URL}/api` : '/api';

const AdminResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(null);

  useEffect(() => {
    if (!token) {
      setMessage('Invalid or missing reset token.');
      setTokenValid(false);
      return;
    }

    const verifyToken = async () => {
      try {
        const response = await axios.post(`${API}/admin/reset-password/verify-token`, { token });
        setTokenValid(true);
      } catch (err) {
        setTokenValid(false);
        setMessage('This reset link is invalid or has expired.');
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    if (password.length < 6) {
      setMessage('Password must be at least 6 characters.');
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setMessage('Passwords do not match.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${API}/admin/reset-password`, { token, password });
      if (response.data && response.data.success) {
        setIsSuccess(true);
        setMessage(response.data.message || 'Password reset successfully!');
      } else {
        setMessage('Failed to reset password. Please try again.');
      }
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to reset password. Please try again.';
      setMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#3B2F2F] to-[#6B4F3F] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-2xl p-6 md:p-12 text-center">
          <AlertTriangle size={48} className="mx-auto text-red-500 mb-4" />
          <h1 className="text-2xl md:text-4xl font-bold text-[#3B2F2F] mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
            Invalid Link
          </h1>
          <p className="text-[#6B4F3F] mb-6" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            This password reset link is missing or invalid.
          </p>
          <Link to="/admin/login" className="inline-block px-6 py-3 bg-[#D9A441] text-[#3B2F2F] font-bold rounded hover:bg-[#3B2F2F] hover:text-[#FAF9F6] transition" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  if (tokenValid === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#3B2F2F] to-[#6B4F3F] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-2xl p-6 md:p-12 text-center">
          <AlertTriangle size={48} className="mx-auto text-red-500 mb-4" />
          <h1 className="text-2xl md:text-4xl font-bold text-[#3B2F2F] mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
            Link Expired
          </h1>
          <p className="text-[#6B4F3F] mb-6" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            This password reset link has expired or is invalid. Please request a new one.
          </p>
          <Link to="/admin/login" className="inline-block px-6 py-3 bg-[#D9A441] text-[#3B2F2F] font-bold rounded hover:bg-[#3B2F2F] hover:text-[#FAF9F6] transition" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#3B2F2F] to-[#6B4F3F] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-2xl p-6 md:p-12 text-center">
          <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
          <h1 className="text-2xl md:text-4xl font-bold text-[#3B2F2F] mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
            Password Reset
          </h1>
          <p className="text-[#6B4F3F] mb-6" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            {message}
          </p>
          <Link to="/admin/login" className="inline-block px-6 py-3 bg-[#D9A441] text-[#3B2F2F] font-bold rounded hover:bg-[#3B2F2F] hover:text-[#FAF9F6] transition" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#3B2F2F] to-[#6B4F3F] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-2xl p-6 md:p-12">
        <div className="w-16 h-16 md:w-20 md:h-20 bg-[#D9A441] rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
          <Lock size={32} className="text-[#3B2F2F]" />
        </div>

        <h1 className="text-2xl md:text-4xl font-bold text-[#3B2F2F] text-center mb-2" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
          Reset Password
        </h1>
        <p className="text-center text-[#6B4F3F] mb-6 md:mb-8" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          Enter your new admin password below.
        </p>

        {tokenValid === null ? (
          <div className="text-center py-8">
            <Loader size={32} className="animate-spin mx-auto text-[#D9A441]" />
            <p className="text-[#6B4F3F] mt-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>Verifying reset link...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            <div>
              <label className="block text-[#3B2F2F] font-semibold mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                New Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 border-2 border-[#6B4F3F]/20 rounded focus:border-[#D9A441] focus:outline-none text-base"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
                placeholder="Min 6 characters"
                autoComplete="new-password"
              />
            </div>

            <div>
              <label className="block text-[#3B2F2F] font-semibold mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 border-2 border-[#6B4F3F]/20 rounded focus:border-[#D9A441] focus:outline-none text-base"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
                placeholder="Repeat new password"
                autoComplete="new-password"
              />
            </div>

            {message && (
              <div className={`p-3 border-2 rounded text-sm ${message.includes('successfully') || message.includes('success') ? 'bg-green-100 border-green-400 text-green-700' : 'bg-red-100 border-red-400 text-red-700'}`} style={{ fontFamily: 'Montserrat, sans-serif' }}>
                {message}
              </div>
            )}

            <button type="submit" disabled={isLoading} className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-[#D9A441] text-[#3B2F2F] font-bold rounded hover:bg-[#3B2F2F] hover:text-[#FAF9F6] transition-all duration-300 disabled:opacity-50" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              {isLoading ? (
                <>
                  <Loader size={20} className="animate-spin" />
                  <span>Resetting...</span>
                </>
              ) : (
                <span>Reset Password</span>
              )}
            </button>

            <div className="text-center">
              <Link to="/admin/login" className="text-sm text-[#D9A441] hover:text-[#3B2F2F] font-semibold inline-flex items-center" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                <ArrowLeft size={16} className="mr-1" />
                Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AdminResetPasswordPage;
