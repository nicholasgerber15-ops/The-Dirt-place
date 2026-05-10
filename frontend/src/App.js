import React, { Suspense } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async';
import { CartProvider } from './context/CartContext';
import Header from "./components/Header";
import Footer from "./components/Footer";

// Import pages directly (no lazy loading to avoid route issues)
import HomePage from "./pages/HomePage";
import MaterialsPage from "./pages/MaterialsPage";
import DeliveryPage from "./pages/DeliveryPage";
import ContactPage from "./pages/ContactPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrderSuccessPage from "./pages/OrderSuccessPage";
import AdminLoginPage from "./pages/admin/AdminLoginPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import OrdersManagementPage from "./pages/admin/OrdersManagementPage";
import PricingManagementPage from "./pages/admin/PricingManagementPage";
import InventoryPage from "./pages/admin/InventoryPage";
import SiteSettingsPage from "./pages/admin/SiteSettingsPage";
import DriverManagementPage from "./pages/admin/DriverManagementPage";

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
          <Route path="/admin/drivers" element={<DriverManagementPage />} />
          <Route path="/admin/settings" element={<SiteSettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
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
