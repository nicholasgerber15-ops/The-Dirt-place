import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MapPin, LogOut, Truck, Save, Plus, X, Trash2 } from 'lucide-react';
import { MapContainer, TileLayer, Polygon, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";
const API = `${BACKEND_URL}/api`;

// Default center (Boerne, TX)
const DEFAULT_CENTER = [29.7947, -98.7322];

const DeliveryZoneMap = () => {
  const navigate = useNavigate();
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingZone, setEditingZone] = useState(null);
  const [drawing, setDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const fetchZones = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API}/admin/delivery-zones`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setZones(response.data.zones || []);
    } catch (error) {
      console.error('Failed to fetch zones:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('admin_token');
        navigate('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    fetchZones();
  }, [navigate, fetchZones]);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    navigate('/admin/login');
  };

  const handleMapClick = (e) => {
    if (!drawing) return;
    setCurrentPoints([...currentPoints, [e.latlng.lat, e.latlng.lng]]);
  };

  const MapClickHandler = () => {
    useMapEvents({ click: handleMapClick });
    return null;
  };

  const startDrawing = () => {
    setDrawing(true);
    setCurrentPoints([]);
    setEditingZone(null);
  };

  const cancelDrawing = () => {
    setDrawing(false);
    setCurrentPoints([]);
  };

  const saveZone = async () => {
    if (currentPoints.length < 3) {
      alert('Need at least 3 points to form a zone');
      return;
    }

    const zoneData = {
      name: editingZone?.name || 'New Zone',
      fee_per_mile: editingZone?.fee_per_mile || 2.50,
      base_fee: editingZone?.base_fee || 15.
      base_miles: editingZone?.base_miles || 10,
      polygon: currentPoints,
      color: editingZone?.color || '#D9A441'
    };

    try {
      setSaving(true);
      const token = localStorage.getItem('admin_token');

      if (editingZone?.id) {
        await axios.put(`${API}/admin/delivery-zones/${editingZone.id}`, zoneData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setZones(zones.map(z => z.id === editingZone.id ? { ...z, ...zoneData } : z));
      } else {
        const response = await axios.post(`${API}/admin/delivery-zones`, zoneData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setZones([...zones, response.data.zone || zoneData]);
      }

      setSaveMessage('Zone saved!');
      setTimeout(() => setSaveMessage(''), 2000);
      setDrawing(false);
      setCurrentPoints([]);
      setEditingZone(null);
    } catch (error) {
      console.error('Failed to save zone:', error);
      setSaveMessage('Error saving');
    } finally {
      setSaving(false);
    }
  };

  const deleteZone = async (zoneId) => {
    if (!confirm('Delete this delivery zone?')) return;

    try {
      const token = localStorage.getItem('admin_token');
      await axios.delete(`${API}/admin/delivery-zones/${zoneId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setZones(zones.filter(z => z.id !== zoneId));
    } catch (error) {
      console.error('Failed to delete zone:', error);
    }
  };

  const editZone = (zone) => {
    setEditingZone(zone);
    setCurrentPoints(zone.polygon || []);
    setDrawing(true);
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
                Delivery Zone Map
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
            <Link to="/admin/dashboard" className="px-4 py-4 text-[#6B4F3F] hover:text-[#D9A441] font-semibold transition-colors" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Dashboard
            </Link>
            <Link to="/admin/orders" className="px-4 py-4 text-[#6B4F3F] hover:text-[#D9A441] font-semibold transition-colors" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Orders
            </Link>
            <Link to="/admin/inventory" className="px-4 py-4 text-[#6B4F3F] hover:text-[#D9A441] font-semibold transition-colors" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Materials & Inventory
            </Link>
            <Link to="/admin/delivery-map" className="px-4 py-4 border-b-2 border-[#D9A441] text-[#D9A441] font-semibold" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Delivery Zones
            </Link>
            <Link to="/admin/settings" className="px-4 py-4 text-[#6B4F3F] hover:text-[#D9A441] font-semibold transition-colors" style={{ fontFamily: 'Montserrat, sans-serif' }}>
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Map */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="h-[600px] w-full">
                  <MapContainer
                    center={DEFAULT_CENTER}
                    zoom={10}
                    className="h-full w-full"
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapClickHandler />

                    {/* Existing Zones */}
                    {zones.map(zone => (
                      <Polygon
                        key={zone.id}
                        positions={zone.polygon}
                        pathOptions={{
                          color: zone.color || '#D9A441',
                          fillOpacity: 0.2
                        }}
                      >
                        <Popup>
                          <div className="text-sm">
                            <p className="font-bold">{zone.name}</p>
                            <p>Base Fee: ${zone.base_fee}</p>
                            <p>Per Mile: ${zone.fee_per_mile}</p>
                            <p>Base Miles: {zone.base_miles}</p>
                          </div>
                        </Popup>
                      </Polygon>
                    ))}

                    {/* Drawing Points */}
                    {drawing && currentPoints.map((point, idx) => (
                      <Marker
                        key={idx}
                        position={point}
                        icon={L.divIcon({
                          className: 'custom-marker',
                          html: '<div style="background:#D9A441;width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3)"></div>',
                          iconSize: [12, 12]
                        })}
                      />
                    ))}
                  </MapContainer>
                </div>

                {/* Map Controls */}
                <div className="p-4 border-t flex items-center justify-between">
                  {drawing ? (
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-[#6B4F3F]">
                        Click map to add points ({currentPoints.length} added)
                      </span>
                      <button
                        onClick={cancelDrawing}
                        className="px-4 py-2 bg-gray-200 text-[#3B2F2F] rounded hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={saveZone}
                        disabled={saving || currentPoints.length < 3}
                        className="px-4 py-2 bg-[#D9A441] text-[#3B2F2F] font-bold rounded hover:bg-[#3B2F2F] hover:text-white disabled:opacity-50"
                      >
                        {saving ? 'Saving...' : 'Save Zone'}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={startDrawing}
                      className="flex items-center space-x-2 px-4 py-2 bg-[#6B7A3A] text-white font-bold rounded hover:bg-[#3B2F2F]"
                    >
                      <Plus size={18} />
                      <span>Draw New Zone</span>
                    </button>
                  )}
                  {saveMessage && (
                    <span className={`text-sm ${saveMessage.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
                      {saveMessage}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Zone List */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-bold text-[#3B2F2F] mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                  Delivery Zones
                </h3>

                <div className="space-y-3">
                  {zones.map(zone => (
                    <div key={zone.id} className="p-3 border rounded-lg hover:bg-[#FAF9F6]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-[#3B2F2F]">{zone.name}</span>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => editZone(zone)}
                            className="p-1 text-[#6B4F3F] hover:text-[#D9A441]"
                          >
                            <Truck size={16} />
                          </button>
                          <button
                            onClick={() => deleteZone(zone.id)}
                            className="p-1 text-red-500 hover:text-red-700"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <div className="text-xs text-[#6B4F3F] space-y-1">
                        <p>Base: ${zone.base_fee} (first {zone.base_miles} mi)</p>
                        <p>Per mile: ${zone.fee_per_mile}</p>
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: zone.color || '#D9A441' }}
                          ></div>
                          <span>Color</span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {zones.length === 0 && (
                    <p className="text-sm text-[#6B4F3F] text-center py-4">
                      No delivery zones defined yet.
                    </p>
                  )}
                </div>

                {/* Zone Editor */}
                {editingZone && (
                  <div className="mt-6 p-4 bg-[#FAF9F6] rounded-lg">
                    <h4 className="font-bold text-[#3B2F2F] mb-3">Edit Zone</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-[#6B4F3F]">Name</label>
                        <input
                          type="text"
                          value={editingZone.name}
                          onChange={(e) => setEditingZone({...editingZone, name: e.target.value})}
                          className="w-full px-2 py-1 border rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-[#6B4F3F]">Base Fee ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={editingZone.base_fee}
                          onChange={(e) => setEditingZone({...editingZone, base_fee: parseFloat(e.target.value) || 0})}
                          className="w-full px-2 py-1 border rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-[#6B4F3F]">Fee Per Mile ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={editingZone.fee_per_mile}
                          onChange={(e) => setEditingZone({...editingZone, fee_per_mile: parseFloat(e.target.value) || 0})}
                          className="w-full px-2 py-1 border rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-[#6B4F3F]">Base Miles</label>
                        <input
                          type="number"
                          value={editingZone.base_miles}
                          onChange={(e) => setEditingZone({...editingZone, base_miles: parseInt(e.target.value) || 0})}
                          className="w-full px-2 py-1 border rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-[#6B4F3F]">Color</label>
                        <input
                          type="color"
                          value={editingZone.color || '#D9A441'}
                          onChange={(e) => setEditingZone({...editingZone, color: e.target.value})}
                          className="w-full h-8 rounded cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveryZoneMap;
