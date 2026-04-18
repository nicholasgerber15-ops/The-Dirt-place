import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { DollarSign, LogOut, Save, Edit2, X, Check } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PricingManagementPage = () => {
  const navigate = useNavigate();
  const [materials, setMaterials] = useState([]);
  const [deliveryFees, setDeliveryFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [editingDelivery, setEditingDelivery] = useState(null);
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    fetchAllPricing();
  }, []);

  const fetchAllPricing = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin_token');
      
      const [materialsRes, deliveryRes] = await Promise.all([
        axios.get(`${API}/admin/pricing`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API}/admin/delivery-fees`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setMaterials(materialsRes.data.pricing);
      setDeliveryFees(deliveryRes.data.delivery_fees);
    } catch (error) {
      console.error('Failed to fetch pricing:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('admin_token');
        navigate('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const updateMaterialPricing = async (materialId) => {
    if (!editingMaterial) return;

    try {
      setSavingId(materialId);
      const token = localStorage.getItem('admin_token');
      
      await axios.put(
        `${API}/admin/pricing/${materialId}`,
        {
          material_id: editingMaterial.material_id,
          name: editingMaterial.name,
          price_per_cubic_yard: parseFloat(editingMaterial.price_per_cubic_yard),
          min_order: parseInt(editingMaterial.min_order)
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update local state
      setMaterials(prev =>
        prev.map(m =>
          m.material_id === materialId ? editingMaterial : m
        )
      );
      
      setEditingMaterial(null);
      alert('Pricing updated successfully!');
    } catch (error) {
      console.error('Failed to update pricing:', error);
      alert('Failed to update pricing');
    } finally {
      setSavingId(null);
    }
  };

  const updateDeliveryFee = async (zipCode) => {
    if (!editingDelivery) return;

    try {
      setSavingId(zipCode);
      const token = localStorage.getItem('admin_token');
      
      await axios.put(
        `${API}/admin/delivery-fees/${zipCode}`,
        {
          zip_code: editingDelivery.zip_code,
          fee: parseFloat(editingDelivery.fee),
          area: editingDelivery.area
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update local state
      setDeliveryFees(prev =>
        prev.map(d =>
          d.zip_code === zipCode ? editingDelivery : d
        )
      );
      
      setEditingDelivery(null);
      alert('Delivery fee updated successfully!');
    } catch (error) {
      console.error('Failed to update delivery fee:', error);
      alert('Failed to update delivery fee');
    } finally {
      setSavingId(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    navigate('/admin/login');
  };

  const startEditMaterial = (material) => {
    setEditingMaterial({ ...material });
  };

  const cancelEditMaterial = () => {
    setEditingMaterial(null);
  };

  const startEditDelivery = (delivery) => {
    setEditingDelivery({ ...delivery });
  };

  const cancelEditDelivery = () => {
    setEditingDelivery(null);
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
                Pricing Management
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
              className="px-4 py-4 border-b-2 border-[#D9A441] text-[#D9A441] font-semibold"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Pricing
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
          <div className="space-y-8">
            {/* Material Pricing */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center mb-6">
                <DollarSign size={32} className="text-[#D9A441] mr-3" />
                <h2 className="text-3xl font-bold text-[#3B2F2F]" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                  Material Pricing
                </h2>
              </div>

              <p className="text-[#6B4F3F] mb-6" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Adjust pricing for landscape materials. Changes take effect immediately for new orders.
              </p>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-[#6B4F3F]/20">
                      <th className="text-left py-3 px-4 font-semibold text-[#3B2F2F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>Material</th>
                      <th className="text-left py-3 px-4 font-semibold text-[#3B2F2F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>Price per Cu Yd</th>
                      <th className="text-left py-3 px-4 font-semibold text-[#3B2F2F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>Min Order (Cu Yd)</th>
                      <th className="text-center py-3 px-4 font-semibold text-[#3B2F2F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {materials.map((material) => {
                      const isEditing = editingMaterial?.material_id === material.material_id;
                      const isSaving = savingId === material.material_id;

                      return (
                        <tr key={material.material_id} className="border-b border-[#6B4F3F]/10 hover:bg-[#FAF9F6]">
                          <td className="py-3 px-4 font-semibold text-[#3B2F2F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                            {material.name}
                          </td>
                          <td className="py-3 px-4">
                            {isEditing ? (
                              <div className="flex items-center">
                                <span className="mr-2 text-[#6B4F3F]">$</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={editingMaterial.price_per_cubic_yard}
                                  onChange={(e) => setEditingMaterial({ ...editingMaterial, price_per_cubic_yard: e.target.value })}
                                  className="w-24 px-2 py-1 border-2 border-[#D9A441] rounded focus:outline-none"
                                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                                />
                              </div>
                            ) : (
                              <span className="text-[#3B2F2F] font-semibold" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                                ${material.price_per_cubic_yard.toFixed(2)}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {isEditing ? (
                              <input
                                type="number"
                                min="1"
                                value={editingMaterial.min_order}
                                onChange={(e) => setEditingMaterial({ ...editingMaterial, min_order: e.target.value })}
                                className="w-20 px-2 py-1 border-2 border-[#D9A441] rounded focus:outline-none"
                                style={{ fontFamily: 'Montserrat, sans-serif' }}
                              />
                            ) : (
                              <span className="text-[#6B4F3F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                                {material.min_order}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isEditing ? (
                              <div className="flex items-center justify-center space-x-2">
                                <button
                                  onClick={() => updateMaterialPricing(material.material_id)}
                                  disabled={isSaving}
                                  className="p-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors disabled:opacity-50"
                                  title="Save"
                                >
                                  {isSaving ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                  ) : (
                                    <Check size={16} />
                                  )}
                                </button>
                                <button
                                  onClick={cancelEditMaterial}
                                  disabled={isSaving}
                                  className="p-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors disabled:opacity-50"
                                  title="Cancel"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => startEditMaterial(material)}
                                className="p-2 bg-[#D9A441] text-[#3B2F2F] rounded hover:bg-[#3B2F2F] hover:text-white transition-colors"
                                title="Edit"
                              >
                                <Edit2 size={16} />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Delivery Fees */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center mb-6">
                <DollarSign size={32} className="text-[#6B7A3A] mr-3" />
                <h2 className="text-3xl font-bold text-[#3B2F2F]" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                  Delivery Fees by ZIP Code
                </h2>
              </div>

              <p className="text-[#6B4F3F] mb-6" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Configure delivery charges based on ZIP codes. Changes apply to new orders.
              </p>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-[#6B4F3F]/20">
                      <th className="text-left py-3 px-4 font-semibold text-[#3B2F2F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>ZIP Code</th>
                      <th className="text-left py-3 px-4 font-semibold text-[#3B2F2F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>Area</th>
                      <th className="text-left py-3 px-4 font-semibold text-[#3B2F2F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>Delivery Fee</th>
                      <th className="text-center py-3 px-4 font-semibold text-[#3B2F2F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deliveryFees.map((delivery) => {
                      const isEditing = editingDelivery?.zip_code === delivery.zip_code;
                      const isSaving = savingId === delivery.zip_code;

                      return (
                        <tr key={delivery.zip_code} className="border-b border-[#6B4F3F]/10 hover:bg-[#FAF9F6]">
                          <td className="py-3 px-4 font-semibold text-[#3B2F2F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                            {delivery.zip_code}
                          </td>
                          <td className="py-3 px-4">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editingDelivery.area}
                                onChange={(e) => setEditingDelivery({ ...editingDelivery, area: e.target.value })}
                                className="w-full px-2 py-1 border-2 border-[#D9A441] rounded focus:outline-none"
                                style={{ fontFamily: 'Montserrat, sans-serif' }}
                              />
                            ) : (
                              <span className="text-[#6B4F3F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                                {delivery.area}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {isEditing ? (
                              <div className="flex items-center">
                                <span className="mr-2 text-[#6B4F3F]">$</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={editingDelivery.fee}
                                  onChange={(e) => setEditingDelivery({ ...editingDelivery, fee: e.target.value })}
                                  className="w-24 px-2 py-1 border-2 border-[#D9A441] rounded focus:outline-none"
                                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                                />
                              </div>
                            ) : (
                              <span className="text-[#3B2F2F] font-semibold" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                                ${delivery.fee.toFixed(2)}
                                {delivery.fee === 0 && <span className="ml-2 text-green-600 text-xs">(FREE)</span>}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isEditing ? (
                              <div className="flex items-center justify-center space-x-2">
                                <button
                                  onClick={() => updateDeliveryFee(delivery.zip_code)}
                                  disabled={isSaving}
                                  className="p-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors disabled:opacity-50"
                                  title="Save"
                                >
                                  {isSaving ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                  ) : (
                                    <Check size={16} />
                                  )}
                                </button>
                                <button
                                  onClick={cancelEditDelivery}
                                  disabled={isSaving}
                                  className="p-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors disabled:opacity-50"
                                  title="Cancel"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => startEditDelivery(delivery)}
                                className="p-2 bg-[#D9A441] text-[#3B2F2F] rounded hover:bg-[#3B2F2F] hover:text-white transition-colors"
                                title="Edit"
                              >
                                <Edit2 size={16} />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PricingManagementPage;
