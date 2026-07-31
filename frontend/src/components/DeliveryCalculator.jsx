import React, { useState } from 'react';
import { Truck, Info, AlertTriangle, MapPin } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";
const API = `${BACKEND_URL}/api`;

const DIRT_SAND_KEYWORDS = ['topsoil', 'sand', 'soil', 'dirt', 'loam', 'compost'];
const MULCH_KEYWORDS = ['mulch'];
const ROCK_KEYWORDS = ['gravel', 'rock', 'stone', 'road base', 'decorative', 'limestone', 'crushed'];

const SMALL_TRUCK_MAX = 5;
const BIG_TRUCK_DIRT_SAND_MAX = 10;
const BIG_TRUCK_MULCH_MAX = 12;
const BIG_TRUCK_ROCK_MAX = 15;

function calculateTrucksNeeded(items) {
  let dirtSand = 0, mulch = 0, rocks = 0;
  for (const item of items || []) {
    const name = (item.name || '').toLowerCase();
    const qty = item.quantity || 0;
    if (DIRT_SAND_KEYWORDS.some(k => name.includes(k))) dirtSand += qty;
    else if (MULCH_KEYWORDS.some(k => name.includes(k))) mulch += qty;
    else if (ROCK_KEYWORDS.some(k => name.includes(k))) rocks += qty;
    else rocks += qty;
  }
  const total = dirtSand + mulch + rocks;
  if (total <= SMALL_TRUCK_MAX) return 1;
  const dsTrucks = dirtSand > 0 ? Math.ceil(dirtSand / BIG_TRUCK_DIRT_SAND_MAX) : 0;
  const mTrucks = mulch > 0 ? Math.ceil(mulch / BIG_TRUCK_MULCH_MAX) : 0;
  const rTrucks = rocks > 0 ? Math.ceil(rocks / BIG_TRUCK_ROCK_MAX) : 0;
  return Math.max(dsTrucks + mTrucks + rTrucks, 1);
}

function categorizeMaterials(items) {
  let dirtSandYards = 0;
  let mulchYards = 0;
  let rocksYards = 0;
  let palletYards = 0;
  let otherYards = 0;

  for (const item of items || []) {
    const name = (item.name || '').toLowerCase();
    const qty = item.quantity || 0;
    if (DIRT_SAND_KEYWORDS.some(k => name.includes(k))) {
      dirtSandYards += qty;
    } else if (MULCH_KEYWORDS.some(k => name.includes(k))) {
      mulchYards += qty;
    } else if (ROCK_KEYWORDS.some(k => name.includes(k))) {
      rocksYards += qty;
    } else if (name.includes('pallet') || name.includes('bag') || name.includes('block')) {
      palletYards += qty;
    } else {
      otherYards += qty;
    }
  }

  return { dirtSandYards, mulchYards, rocksYards, palletYards, otherYards };
}

const DeliveryCalculator = ({ totalYards = 0, cartItems = [] }) => {
  const [address, setAddress] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const calculate = async () => {
    setError(null);
    setLoading(true);

    if (!address || address.length < 5) {
      setError('Please enter a delivery address');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(`${API}/ecommerce/delivery-fee`, {
        params: { address }
      });

      const data = response.data;
      const distance = data.distance_miles || 15;
      const deliveryFee = data.total_delivery_fee || (70 + (distance * 5));
      const yards = totalYards || 0.5;

      const cats = categorizeMaterials(cartItems);

      let warnings = [];
      let truckType;
      let maxYards;
      let tripsNote = '';

      if (distance > 8 && yards < 2) {
        warnings.push(`After 8 miles a minimum of 2-3 yards is required (you have ${yards} yd).`);
      }

      if (yards < 1) {
        warnings.push('Minimum 1 yard for delivery (1/2 yard for pickup).');
      }

      const numTrucks = calculateTrucksNeeded(cartItems);
      const perTruckFee = 70 + (distance * 5);
      const totalFee = perTruckFee * numTrucks;

      const truckLabel = numTrucks === 1 ? '1 truck' : `${numTrucks} trucks`;

      setResult({
        address,
        distance,
        baseFee: 70,
        perMileRate: 5,
        totalFee,
        numTrucks,
        perTruckFee,
        truckLabel,
        warnings,
        yards,
        materialBreakdown: cats,
      });
    } catch (err) {
      const msg = err.response?.data?.detail || 'Could not calculate delivery fee. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border-2 border-[#6B4F3F]/20 p-4">
      <div className="flex items-center space-x-2 mb-4">
        <Truck size={20} className="text-[#6B7A3A]" />
        <h3 className="font-bold text-[#3B2F2F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          Delivery Fee Calculator
        </h3>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-[#3B2F2F] mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Delivery Address
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Main St, Boerne, TX"
              className="flex-1 px-3 py-2 border-2 border-[#6B4F3F]/20 rounded focus:border-[#D9A441] focus:outline-none text-sm"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            />
            <button
              onClick={calculate}
              disabled={loading}
              className="px-4 py-2 bg-[#D9A441] text-[#3B2F2F] font-semibold rounded hover:bg-[#3B2F2F] hover:text-white transition-colors text-sm disabled:opacity-50"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              {loading ? '...' : 'Calculate'}
            </button>
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-600 flex items-center space-x-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            <AlertTriangle size={12} />
            <span>{error}</span>
          </p>
        )}

        {result && (
          <div className="bg-[#FAF9F6] rounded p-3 space-y-2 text-sm" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            <div className="flex justify-between text-[#6B4F3F]">
              <span>Distance:</span>
              <span className="font-semibold text-[#3B2F2F]">{result.distance} miles</span>
            </div>
            <div className="flex justify-between text-[#6B4F3F]">
              <span>Base Fee:</span>
              <span className="font-semibold text-[#3B2F2F]">${result.baseFee}.00</span>
            </div>
            <div className="flex justify-between text-[#6B4F3F]">
              <span>${result.perMileRate}/mile × {result.distance} miles:</span>
              <span className="font-semibold text-[#3B2F2F]">+${(result.perMileRate * result.distance).toFixed(2)}</span>
            </div>
            <div className="border-t border-[#6B4F3F]/20 pt-2 flex justify-between font-bold text-[#3B2F2F]">
              <span>Total Delivery Fee:</span>
              <span>${result.totalFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[#6B4F3F]">
              <span>Truck:</span>
              <span className="font-semibold text-[#3B2F2F]">{result.truckType} (max {result.maxYards} yd)</span>
            </div>
            {result.warnings.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mt-2">
                {result.warnings.map((w, i) => (
                  <p key={i} className="text-xs text-yellow-800 flex items-start space-x-1">
                    <Info size={12} className="mt-0.5 flex-shrink-0" />
                    <span>{w}</span>
                  </p>
                ))}
              </div>
            )}
            <p className="text-[10px] text-[#6B4F3F] italic pt-1 border-t border-[#6B4F3F]/10">
              Deliveries end at 5 PM. No dividers - separate deliveries have separate fees. 1 yard minimum applies.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveryCalculator;
