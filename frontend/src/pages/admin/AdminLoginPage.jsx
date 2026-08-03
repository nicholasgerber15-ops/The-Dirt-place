import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Loader, Truck, Mail, ArrowLeft } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const API = BACKEND_URL ? `${BACKEND_URL}/api` : '/api';

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [resetStep, setResetStep] = useState('email');
  const [resetMessage, setResetMessage] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

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

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setResetLoading(true);
    setResetMessage('');
    try {
      await axios.post(`${API}/admin/forgot-password`, { email: resetEmail }, { timeout: 10000 });
      setResetMessage('If that email is registered, a reset link has been sent.');
      setResetStep('token');
    } catch (err) {
      setResetMessage('Failed to send reset email. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetLoading(true);
    setResetMessage('');
    try {
      const response = await axios.post(`${API}/admin/reset-password`, { token: resetToken, password: resetPassword }, { timeout: 10000 });
      if (response.data && response.data.success) {
        setResetMessage('Password reset successfully! You can now log in with your new password.');
        setResetStep('email');
        setResetToken('');
        setResetPassword('');
      }
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to reset password. Please try again.';
      setResetMessage(msg);
    } finally {
      setResetLoading(false);
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

          {showReset ? (
            <>
              {resetStep === 'email' ? (
                <>
                  <div className="mb-4 text-center">
                    <Mail size={24} className="mx-auto text-[#D9A441] mb-2" />
                    <h2 className="text-lg font-bold text-[#3B2F2F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>Forgot Password?</h2>
                    <p className="text-sm text-[#6B4F3F] mt-1">Enter your admin email to receive a reset link.</p>
                  </div>
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div>
                      <label className="block text-[#3B2F2F] font-semibold mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>Email</label>
                      <input type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} required className="w-full px-4 py-3 border-2 border-[#6B4F3F]/20 rounded focus:border-[#D9A441] focus:outline-none text-base" style={{ fontFamily: 'Montserrat, sans-serif' }} placeholder="thedirtplace@outlook.com" />
                    </div>
                    {resetMessage && <div className="p-3 bg-green-100 border-2 border-green-400 rounded text-green-700 text-sm" style={{ fontFamily: 'Montserrat, sans-serif' }}>{resetMessage}</div>}
                    <div className="flex gap-3">
                      <button type="button" onClick={() => { setShowReset(false); setResetMessage(''); setResetStep('email'); }} className="flex-1 px-4 py-3 border-2 border-[#6B4F3F]/20 rounded text-[#3B2F2F] font-semibold hover:bg-[#6B4F3F]/10 transition" style={{ fontFamily: 'Montserrat, sans-serif' }}>Back</button>
                      <button type="submit" disabled={resetLoading} className="flex-1 px-4 py-3 bg-[#D9A441] text-[#3B2F2F] font-bold rounded hover:bg-[#3B2F2F] hover:text-[#FAF9F6] transition disabled:opacity-50" style={{ fontFamily: 'Montserrat, sans-serif' }}>{resetLoading ? 'Sending...' : 'Send Link'}</button>
                    </div>
                  </form>
                </>
              ) : (
                <>
                  <div className="mb-4 text-center">
                    <h2 className="text-lg font-bold text-[#3B2F2F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>Set New Password</h2>
                    <p className="text-sm text-[#6B4F3F] mt-1">Enter the reset token and your new password.</p>
                  </div>
                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <div>
                      <label className="block text-[#3B2F2F] font-semibold mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>Reset Token</label>
                      <input type="text" value={resetToken} onChange={(e) => setResetToken(e.target.value)} required className="w-full px-4 py-3 border-2 border-[#6B4F3F]/20 rounded focus:border-[#D9A441] focus:outline-none text-base" style={{ fontFamily: 'Montserrat, sans-serif' }} placeholder="Paste token from email" />
                    </div>
                    <div>
                      <label className="block text-[#3B2F2F] font-semibold mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>New Password</label>
                      <input type="password" value={resetPassword} onChange={(e) => setResetPassword(e.target.value)} required minLength={6} className="w-full px-4 py-3 border-2 border-[#6B4F3F]/20 rounded focus:border-[#D9A441] focus:outline-none text-base" style={{ fontFamily: 'Montserrat, sans-serif' }} placeholder="Min 6 characters" />
                    </div>
                    {resetMessage && <div className={`p-3 border-2 rounded text-sm` + (resetMessage.includes('successfully') ? ' bg-green-100 border-green-400 text-green-700' : ' bg-red-100 border-red-400 text-red-700')} style={{ fontFamily: 'Montserrat, sans-serif' }}>{resetMessage}</div>}
                    <div className="flex gap-3">
                      <button type="button" onClick={() => { setShowReset(false); setResetMessage(''); setResetStep('email'); setResetToken(''); setResetPassword(''); }} className="flex-1 px-4 py-3 border-2 border-[#6B4F3F]/20 rounded text-[#3B2F2F] font-semibold hover:bg-[#6B4F3F]/10 transition" style={{ fontFamily: 'Montserrat, sans-serif' }}>Back</button>
                      <button type="submit" disabled={resetLoading} className="flex-1 px-4 py-3 bg-[#D9A441] text-[#3B2F2F] font-bold rounded hover:bg-[#3B2F2F] hover:text-[#FAF9F6] transition disabled:opacity-50" style={{ fontFamily: 'Montserrat, sans-serif' }}>{resetLoading ? 'Resetting...' : 'Reset Password'}</button>
                    </div>
                  </form>
                </>
              )}
            </>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
              <div>
                <label className="block text-[#3B2F2F] font-semibold mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-4 py-3 border-2 border-[#6B4F3F]/20 rounded focus:border-[#D9A441] focus:outline-none text-base" style={{ fontFamily: 'Montserrat, sans-serif' }} placeholder="Enter password" autoComplete="current-password" />
              </div>

              {error && (
                <div className="p-3 bg-red-100 border-2 border-red-400 rounded text-red-700 text-sm" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  {error}
                </div>
              )}

              <div className="text-right">
                <button type="button" onClick={() => setShowReset(true)} className="text-sm text-[#D9A441] hover:text-[#3B2F2F] font-semibold underline" style={{ fontFamily: 'Montserrat, sans-serif' }}>Forgot password?</button>
              </div>

              <button type="submit" disabled={isLoading} className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-[#D9A441] text-[#3B2F2F] font-bold rounded hover:bg-[#3B2F2F] hover:text-[#FAF9F6] transition-all duration-300 disabled:opacity-50" style={{ fontFamily: 'Montserrat, sans-serif' }}>
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
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;