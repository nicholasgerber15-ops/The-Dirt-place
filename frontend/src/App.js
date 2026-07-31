import React, { Suspense, lazy, useState } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async';
import { CartProvider } from './context/CartContext';
import { LanguageProvider } from './context/LanguageContext';
import Header from "./components/Header";
import Footer from "./components/Footer";
import SeasonalPopup from "./components/SeasonalPopup";
import ErrorBoundary from "./components/ErrorBoundary";
import { MessageCircle, X } from 'lucide-react';

// Lazy load pages for code splitting (except critical pages)
const HomePage = lazy(() => import("./pages/HomePage"));
const MaterialsPage = lazy(() => import("./pages/MaterialsPage"));
const DeliveryPage = lazy(() => import("./pages/DeliveryPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const CartPage = lazy(() => import("./pages/CartPage"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));
const OrderSuccessPage = lazy(() => import("./pages/OrderSuccessPage"));
const AccountPage = lazy(() => import("./pages/AccountPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const ContractorPortalPage = lazy(() => import("./pages/ContractorPortalPage"));
const ServiceAreaPage = lazy(() => import("./pages/ServiceAreaPage"));

// Admin pages (lazy loaded)
const AdminLoginPage = lazy(() => import("./pages/admin/AdminLoginPage"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const OrdersManagementPage = lazy(() => import("./pages/admin/OrdersManagementPage"));
const InventoryPage = lazy(() => import("./pages/admin/InventoryPage"));
const LeadsManagementPage = lazy(() => import("./pages/admin/LeadsManagementPage"));
const NotificationTemplatesPage = lazy(() => import("./pages/admin/NotificationTemplatesPage"));
const SiteSettingsPage = lazy(() => import("./pages/admin/SiteSettingsPage"));
const PricingManagementPage = lazy(() => import("./pages/admin/PricingManagementPage"));
const DriverManagementPage = lazy(() => import("./pages/admin/DriverManagementPage"));

// Driver pages
const DriverDashboard = lazy(() => import("./pages/DriverDashboard"));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D9A441]"></div>
    </div>
  );
}

function AppContent() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const [showChatbot, setShowChatbot] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const toggleChatbot = () => {
    setShowChatbot(!showChatbot);
    if (!showChatbot) {
      setChatHistory([{ role: 'assistant', content: 'Hello! How can I help you today?' }]);
    }
  };

  const sendMessage = async () => {
    if (!chatMessage.trim()) return;
    
    const userMessage = chatMessage;
    setChatHistory([...chatHistory, { role: 'user', content: userMessage }]);
    setChatMessage('');
    setIsLoading(true);
    
    try {
      const response = await fetch('https://the-dirt-place-chatbot-237434916216.us-central1.run.app/api-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-app-proxy': 'default-proxy-header' },
        body: JSON.stringify({ query: userMessage })
      });
      const data = await response.json();
      setChatHistory(prev => [...prev, { role: 'assistant', content: data.response || "Thanks for your question! A team member will respond soon." }]);
    } catch (error) {
      setChatHistory(prev => [...prev, { role: 'assistant', content: "Sorry, I'm having trouble connecting. Please call us at (830) 336-3713!" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {!isAdminRoute && <Header />}
      <Suspense fallback={<PageLoader />}>
        <ErrorBoundary fallbackMessage="Something went wrong loading this page. Please try refreshing.">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/materials" element={<MaterialsPage />} />
          <Route path="/delivery" element={<DeliveryPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/order-success" element={<OrderSuccessPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/orders" element={<OrdersManagementPage />} />
          <Route path="/admin/leads" element={<LeadsManagementPage />} />
          <Route path="/admin/notifications" element={<NotificationTemplatesPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/contractor-portal" element={<ContractorPortalPage />} />
          <Route path="/service-area/:areaSlug" element={<ServiceAreaPage />} />
          <Route path="/admin/pricing" element={<Navigate to="/admin/inventory" replace />} />
          <Route path="/admin/inventory" element={<InventoryPage />} />
          <Route path="/admin/drivers" element={<DriverManagementPage />} />
          <Route path="/admin/settings" element={<SiteSettingsPage />} />
          <Route path="/driver" element={<DriverDashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </ErrorBoundary>
      </Suspense>
      {!isAdminRoute && <Footer />}
      {!isAdminRoute && <SeasonalPopup />}
      
      {/* Chatbot Bubble */}
      {!isAdminRoute && (
        <>
          <button
            onClick={toggleChatbot}
            className="fixed bottom-6 right-6 w-14 h-14 bg-[#D9A441] text-[#3B2F2F] rounded-full shadow-lg hover:bg-[#3B2F2F] hover:text-white transition-all z-50 flex items-center justify-center"
            aria-label="Open chat"
          >
            <MessageCircle size={24} />
          </button>

          {/* Chat Window */}
          {showChatbot && (
            <div className="fixed bottom-24 right-6 w-80 md:w-96 bg-white rounded-lg shadow-2xl z-50 overflow-hidden">
              {/* Header */}
              <div className="bg-[#3B2F2F] text-white p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-bold" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                    The Dirt Place Chat
                  </h3>
                  <p className="text-xs text-[#D9A441]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Ask us anything!
                  </p>
                </div>
                <button onClick={() => setShowChatbot(false)} className="text-white hover:text-[#D9A441]">
                  <X size={20} />
                </button>
              </div>

              {/* Messages */}
              <div className="h-64 overflow-y-auto p-4 space-y-3">
                {chatHistory.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-lg ${
                      msg.role === 'user' 
                        ? 'bg-[#D9A441] text-[#3B2F2F]' 
                        : 'bg-[#FAF9F6] text-[#3B2F2F] border border-[#6B4F3F]/20'
                    }`}>
                      <p className="text-sm" style={{ fontFamily: 'Montserrat, sans-serif' }}>{msg.content}</p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-[#FAF9F6] p-3 rounded-lg">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-[#D9A441] rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-[#D9A441] rounded-full animate-bounce delay-100"></div>
                        <div className="w-2 h-2 bg-[#D9A441] rounded-full animate-bounce delay-200"></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="border-t border-[#6B4F3F]/20 p-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type your message..."
                    className="flex-1 px-3 py-2 border border-[#6B4F3F]/20 rounded focus:border-[#D9A441] focus:outline-none text-sm"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!chatMessage.trim()}
                    className="px-4 py-2 bg-[#D9A441] text-[#3B2F2F] rounded hover:bg-[#3B2F2F] hover:text-white transition-colors disabled:opacity-50"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}

function App() {
  return (
    <HelmetProvider>
      <LanguageProvider>
        <CartProvider>
          <div className="App">
            <BrowserRouter>
              <AppContent />
            </BrowserRouter>
          </div>
        </CartProvider>
      </LanguageProvider>
    </HelmetProvider>
  );
}

export default App;
