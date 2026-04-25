import React, { Suspense, lazy } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async';
import { CartProvider } from './context/CartContext';
import Header from "./components/Header";
import Footer from "./components/Footer";

// Lazy load pages for code splitting
const HomePage = lazy(() => import('./pages/HomePage'));
const MaterialsPage = lazy(() => import('./pages/MaterialsPage'));
const DeliveryPage = lazy(() => import('./pages/DeliveryPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const OrderSuccessPage = lazy(() => import('./pages/OrderSuccessPage'));
const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const OrdersManagementPage = lazy(() => import('./pages/admin/OrdersManagementPage'));
const PricingManagementPage = lazy(() => import('./pages/admin/PricingManagementPage'));
const InventoryPage = lazy(() => import('./pages/admin/InventoryPage'));
const SiteSettingsPage = lazy(() => import('./pages/admin/SiteSettingsPage'));

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

  return (
    <>
      {!isAdminRoute && <Header />}
      <Suspense fallback={<PageLoader />}>
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
          <Route path="/admin/pricing" element={<PricingManagementPage />} />
          <Route path="/admin/inventory" element={<InventoryPage />} />
          <Route path="/admin/settings" element={<SiteSettingsPage />} />
        </Routes>
      </Suspense>
      {!isAdminRoute && <Footer />}
    </>
  );
}

function App() {
  return (
    <HelmetProvider>
      <CartProvider>
        <div className="App">
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </div>
      </CartProvider>
    </HelmetProvider>
  );
}

export default App;
