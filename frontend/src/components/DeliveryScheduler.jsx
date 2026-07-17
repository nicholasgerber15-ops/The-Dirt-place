UNIVERSAL NRG-CO HEADER BLOCK
Use this exact banner at the top of source files. License/covenant terms still apply.

################################################################
#                                                              #
#                ⚡  N R G - C O  ⚡                          #
#                                                              #
#    CRITICAL ASSET — CLOSED SOURCE / CONFIDENTIAL              #
#    PROPRIETARY / UNDER DEVELOPMENT / SECRET                   #
#                                                              #
################################################################
import React, { useState, useCallback, useEffect } from 'react';
import { Calendar, Clock, MapPin, Truck, AlertCircle, CheckCircle } from 'lucide-react';
import { GoogleMap, useLoadScript, Marker, DirectionsService, DirectionsRenderer } from '@react-google-maps/api';

const libraries = ['places', 'geometry'];
const mapContainerStyle = { width: '100%', height: '300px', borderRadius: '8px' };
const center = { lat: 29.7946, lng: -98.7322 }; // Boerne, TX

const DeliveryScheduler = ({ onSelectSlot, initialAddress = '' }) => {
  const [date, setDate] = useState('');
  const [address, setAddress] = useState(initialAddress);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [travelInfo, setTravelInfo] = useState(null);
  const [directions, setDirections] = useState(null);
  const [mapLoadError, setMapLoadError] = useState(false);

  const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
  const googleMapsApiKey = process.env.REACT_APP_GOOGLE_PLACES_API_KEY || '';

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: googleMapsApiKey,
    libraries,
  });

  useEffect(() => {
    if (loadError) {
      console.warn('Google Maps failed to load (missing or invalid API key)');
    }
  }, [loadError]);

  const fetchSlots = useCallback(async () => {
    if (!date || !address) return;
    
    setLoading(true);
    setError('');
    
    try {
      const resp = await fetch(`${backendUrl}/api/scheduling/available-slots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, delivery_address: address })
      });
      
      if (!resp.ok) throw new Error('Failed to fetch slots');
      
      const data = await resp.json();
      setSlots(data.slots || []);
      setTravelInfo({
        distance: data.total_distance_miles,
        travelMinutes: data.total_travel_minutes
      });
    } catch (err) {
      setError('Unable to load delivery slots. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [date, address, backendUrl]);

  const fetchTravelEstimate = useCallback(async () => {
    if (!address) return;
    
    try {
      const resp = await fetch(`${backendUrl}/api/scheduling/estimate-travel?address=${encodeURIComponent(address)}`);
      if (!resp.ok) return;
      const data = await resp.json();
      setTravelInfo({
        distance: data.distance_miles * 2,
        travelMinutes: data.travel_minutes_round_trip,
        jobTimeMinutes: data.total_job_time_minutes
      });
    } catch (err) {
      console.error('Travel estimate error:', err);
    }
  }, [address, backendUrl]);

  useEffect(() => {
    if (address && address.length > 10) {
      const debounce = setTimeout(() => fetchTravelEstimate(), 1000);
      return () => clearTimeout(debounce);
    }
  }, [address, fetchTravelEstimate]);

  const handleSelectSlot = (slot) => {
    if (!slot.available) return;
    setSelectedSlot(slot);
    if (onSelectSlot) {
      onSelectSlot({
        date,
        time: slot.start_time,
        endTime: slot.end_time,
        travelMinutes: slot.travel_minutes,
        distanceMiles: slot.distance_miles
      });
    }
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const max = new Date();
    max.setDate(max.getDate() + 30); // 30 days out
    return max.toISOString().split('T')[0];
  };

  const directionsCallback = useCallback((result, status) => {
    if (status === 'OK') {
      setDirections(result);
    }
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-[#3B2F2F] mb-6" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
        <Truck className="inline mr-2" size={24} />
        Schedule Delivery
      </h2>

      {/* Address Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-[#3B2F2F] mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          <MapPin size={16} className="inline mr-1" />
          Delivery Address
        </label>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Enter full delivery address..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D9A441] focus:border-transparent"
          style={{ fontFamily: 'Montserrat, sans-serif' }}
        />
        {travelInfo && (
          <div className="mt-2 text-sm text-[#6B4F3F] flex items-center space-x-4">
            <span>📍 Distance: {travelInfo.distance?.toFixed(1)} miles (round trip)</span>
            <span>⏱️ Travel: ~{Math.round(travelInfo.travelMinutes || 0)} min</span>
            {travelInfo.jobTimeMinutes && (
              <span>🚚 Total job time: ~{Math.round(travelInfo.jobTimeMinutes)} min</span>
            )}
          </div>
        )}
      </div>

      {/* Date Picker */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-[#3B2F2F] mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          <Calendar size={16} className="inline mr-1" />
          Delivery Date
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          min={getMinDate()}
          max={getMaxDate()}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D9A441] focus:border-transparent"
          style={{ fontFamily: 'Montserrat, sans-serif' }}
        />
      </div>

      {/* Load Slots Button */}
      <button
        onClick={fetchSlots}
        disabled={!date || !address || loading}
        className="w-full mb-6 px-6 py-3 bg-[#D9A441] text-[#3B2F2F] font-bold rounded-lg hover:bg-[#c4943a] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        style={{ fontFamily: 'Montserrat, sans-serif' }}
      >
        {loading ? 'Loading Available Slots...' : 'Check Available Delivery Times'}
      </button>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
          <AlertCircle size={20} className="text-red-500 flex-shrink-0" />
          <span className="text-red-700" style={{ fontFamily: 'Montserrat, sans-serif' }}>{error}</span>
        </div>
      )}

      {/* Map Preview (if Google Maps loaded) */}
      {isLoaded && address && !mapLoadError && (
        <div className="mb-6">
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            zoom={10}
            center={center}
            onError={() => setMapLoadError(true)}
          >
            <Marker position={center} label="The Dirt Place" />
            {directions && <DirectionsRenderer directions={directions} />}
            <DirectionsService
              options={{
                destination: address,
                origin: '240 TX-46, Boerne, TX 78006',
                travelMode: 'DRIVING',
              }}
              callback={directionsCallback}
            />
          </GoogleMap>
        </div>
      )}

      {/* Time Slots Grid */}
      {slots.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-[#3B2F2F] mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
            <Clock size={20} className="inline mr-2" />
            Available Time Slots for {date}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {slots.map((slot, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectSlot(slot)}
                disabled={!slot.available}
                className={`p-3 rounded-lg border-2 transition-all ${
                  selectedSlot?.start_time === slot.start_time
                    ? 'border-[#D9A441] bg-[#D9A441]/10'
                    : slot.available
                    ? 'border-gray-200 hover:border-[#D9A441] hover:bg-[#FAF9F6]'
                    : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-50'
                }`}
              >
                <div className="font-semibold text-[#3B2F2F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  {slot.start_time} - {slot.end_time}
                </div>
                {!slot.available ? (
                  <div className="text-xs text-red-500 mt-1">Booked</div>
                ) : (
                  <div className="text-xs text-[#6B4F3F] mt-1">
                    {slot.travel_minutes?.toFixed(0)} min travel
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedSlot && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-3">
          <CheckCircle size={24} className="text-green-600 flex-shrink-0" />
          <div>
            <p className="font-bold text-green-800" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Selected: {selectedSlot.start_time} - {selectedSlot.end_time} on {date}
            </p>
            <p className="text-sm text-green-600" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Travel time: ~{Math.round(selectedSlot.travel_minutes || 0)} min each way
            </p>
          </div>
        </div>
      )}

      {slots.length === 0 && date && address && !loading && (
        <div className="text-center py-8 text-[#6B4F3F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          <Truck size={48} className="mx-auto mb-4 text-gray-300" />
          <p>Select a date and address, then click "Check Available Delivery Times"</p>
        </div>
      )}
    </div>
  );
};

export default DeliveryScheduler;
