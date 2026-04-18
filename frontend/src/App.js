import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async';
import { CartProvider } from './context/CartContext';
import Header from "./components/Header";
import Footer from "./components/Footer";
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

function App() {
  return (
    <HelmetProvider>
      <CartProvider>
        <div className="App">
          <BrowserRouter>
            <Header />
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
            </Routes>
            <Footer />
          </BrowserRouter>
        </div>
      </CartProvider>
    </HelmetProvider>
  );
}

export default App;
