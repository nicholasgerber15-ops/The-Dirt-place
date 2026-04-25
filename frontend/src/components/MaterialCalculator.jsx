import React, { useState } from 'react';
import { Calculator, Info, Mail } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const MaterialCalculator = () => {
  const [formData, setFormData] = useState({
    projectType: 'Driveway',
    length: '',
    width: '',
    depth: '',
    material: 'Gravel'
  });

  const [result, setResult] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [isEmailingSending, setIsEmailSending] = useState(false);
  const [emailMessage, setEmailMessage] = useState('');

  const projectTypes = ['Driveway', 'Garden Bed', 'Pathway', 'Patio', 'Landscape Area', 'Other'];
  const materials = ['Topsoil', 'Gravel', 'Sand', 'Road Base', 'Mulch', 'Decorative Rock'];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setResult(null); // Clear previous result
  };

  const handleCalculate = async (e) => {
    e.preventDefault();
    setIsCalculating(true);

    try {
      const response = await axios.post(`${API}/calculator`, {
        project_type: formData.projectType,
        length: parseFloat(formData.length),
        width: parseFloat(formData.width),
        depth: parseFloat(formData.depth),
        material: formData.material
      });

      setResult(response.data);
    } catch (error) {
      console.error('Calculator error:', error);
      alert('Error calculating material. Please check your inputs and try again.');
    } finally {
      setIsCalculating(false);
    }
  };

  const handleEmailResults = async () => {
    if (!userEmail) {
      alert('Please enter your email address');
      return;
    }

    setIsEmailSending(true);
    setEmailMessage('');

    try {
      await axios.post(`${API}/email-calculation`, {
        email: userEmail,
        calculation: result
      });

      setEmailMessage('Calculation results sent to your email!');
      setTimeout(() => setEmailMessage(''), 5000);
    } catch (error) {
      console.error('Email error:', error);
      setEmailMessage('Failed to send email. Please try again.');
    } finally {
      setIsEmailSending(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-2xl p-8 md:p-12 border-t-4 border-[#D9A441]">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-14 h-14 bg-[#D9A441] rounded-full flex items-center justify-center">
          <Calculator size={28} className="text-[#3B2F2F]" />
        </div>
        <div>
          <h2 
            className="text-4xl font-bold text-[#3B2F2F]"
            style={{ fontFamily: 'Bebas Neue, sans-serif' }}
          >
            Material Calculator
          </h2>
          <p className="text-[#6B4F3F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Estimate how much material you need
          </p>
        </div>
      </div>

      <form onSubmit={handleCalculate} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Project Type */}
          <div>
            <label 
              htmlFor="projectType" 
              className="block text-[#3B2F2F] font-semibold mb-2"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Project Type
            </label>
            <select
              id="projectType"
              name="projectType"
              value={formData.projectType}
              onChange={handleChange}
              className="w-full px-4 py-3 border-2 border-[#6B4F3F]/20 rounded focus:border-[#D9A441] focus:outline-none transition-colors duration-300"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              {projectTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Material */}
          <div>
            <label 
              htmlFor="material" 
              className="block text-[#3B2F2F] font-semibold mb-2"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Material
            </label>
            <select
              id="material"
              name="material"
              value={formData.material}
              onChange={handleChange}
              className="w-full px-4 py-3 border-2 border-[#6B4F3F]/20 rounded focus:border-[#D9A441] focus:outline-none transition-colors duration-300"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              {materials.map(mat => (
                <option key={mat} value={mat}>{mat}</option>
              ))}
            </select>
          </div>

          {/* Length */}
          <div>
            <label 
              htmlFor="length" 
              className="block text-[#3B2F2F] font-semibold mb-2"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Length (feet)
            </label>
            <input
              type="number"
              id="length"
              name="length"
              value={formData.length}
              onChange={handleChange}
              required
              min="0"
              step="0.1"
              placeholder="e.g., 20"
              className="w-full px-4 py-3 border-2 border-[#6B4F3F]/20 rounded focus:border-[#D9A441] focus:outline-none transition-colors duration-300"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            />
          </div>

          {/* Width */}
          <div>
            <label 
              htmlFor="width" 
              className="block text-[#3B2F2F] font-semibold mb-2"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Width (feet)
            </label>
            <input
              type="number"
              id="width"
              name="width"
              value={formData.width}
              onChange={handleChange}
              required
              min="0"
              step="0.1"
              placeholder="e.g., 10"
              className="w-full px-4 py-3 border-2 border-[#6B4F3F]/20 rounded focus:border-[#D9A441] focus:outline-none transition-colors duration-300"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            />
          </div>

          {/* Depth */}
          <div className="md:col-span-2">
            <label 
              htmlFor="depth" 
              className="block text-[#3B2F2F] font-semibold mb-2"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Depth (inches)
            </label>
            <input
              type="number"
              id="depth"
              name="depth"
              value={formData.depth}
              onChange={handleChange}
              required
              min="0"
              step="0.1"
              placeholder="e.g., 4"
              className="w-full px-4 py-3 border-2 border-[#6B4F3F]/20 rounded focus:border-[#D9A441] focus:outline-none transition-colors duration-300"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isCalculating}
          className="w-full flex items-center justify-center space-x-2 px-8 py-4 bg-[#D9A441] text-[#3B2F2F] text-lg font-bold rounded hover:bg-[#3B2F2F] hover:text-[#FAF9F6] hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ fontFamily: 'Montserrat, sans-serif' }}
        >
          <Calculator size={20} />
          <span>{isCalculating ? 'Calculating...' : 'Calculate Amount'}</span>
        </button>
      </form>

      {/* Results */}
      {result && (
        <div className="mt-8 p-6 bg-[#6B7A3A]/10 border-l-4 border-[#6B7A3A] rounded animate-fade-in">
          <h3 
            className="text-2xl font-bold text-[#3B2F2F] mb-4 flex items-center space-x-2"
            style={{ fontFamily: 'Bebas Neue, sans-serif' }}
          >
            <Info size={24} className="text-[#6B7A3A]" />
            <span>Calculation Results</span>
          </h3>
          
          <div className="space-y-3" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            <div className="flex justify-between items-center p-3 bg-white rounded">
              <span className="text-[#6B4F3F]">Project:</span>
              <span className="font-bold text-[#3B2F2F]">{result.project_type}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-white rounded">
              <span className="text-[#6B4F3F]">Dimensions:</span>
              <span className="font-bold text-[#3B2F2F]">
                {result.dimensions.length}' × {result.dimensions.width}' × {result.dimensions.depth}"
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-white rounded">
              <span className="text-[#6B4F3F]">Volume:</span>
              <span className="font-bold text-[#3B2F2F]">
                {result.volume_cubic_yards} cubic yards
              </span>
            </div>
            <div className="flex justify-between items-center p-4 bg-[#D9A441] rounded">
              <span className="text-[#3B2F2F] font-bold">Recommended Amount:</span>
              <span className="font-bold text-[#3B2F2F] text-xl">
                {result.recommended_amount} {result.unit}
              </span>
            </div>
            <div className="p-4 bg-white rounded border border-[#6B7A3A]">
              <p className="text-sm text-[#6B4F3F] mb-2">
                <strong>💡 Tip:</strong> {result.recommendation}
              </p>
              <p className="text-xs text-[#6B4F3F] italic">
                {result.note}
              </p>
            </div>
          </div>

          <div className="mt-6 p-6 bg-[#FAF9F6] border-2 border-[#D9A441] rounded">
            <h4 className="text-lg font-bold text-[#3B2F2F] mb-3" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              📧 Email These Results
            </h4>
            <p className="text-sm text-[#6B4F3F] mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Save your calculation for later or share it with your contractor
            </p>
            <div className="flex gap-3">
              <input
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 px-4 py-3 border-2 border-[#6B4F3F]/20 rounded focus:border-[#D9A441] focus:outline-none transition-colors duration-300"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              />
              <button
                onClick={handleEmailResults}
                disabled={isEmailingSending}
                className="px-6 py-3 bg-[#6B7A3A] text-white font-semibold rounded hover:bg-[#3B2F2F] transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                <Mail size={18} />
                <span>{isEmailingSending ? 'Sending...' : 'Email Me'}</span>
              </button>
            </div>
            {emailMessage && (
              <p className={`mt-3 text-sm ${emailMessage.includes('sent') ? 'text-[#6B7A3A]' : 'text-red-600'}`} style={{ fontFamily: 'Montserrat, sans-serif' }}>
                {emailMessage}
              </p>
            )}
          </div>

          <div className="mt-6 text-center">
            <p className="text-[#6B4F3F] mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Ready to order? Contact us for pricing and delivery!
            </p>
            <a
              href="/contact"
              className="inline-block px-8 py-3 bg-[#3B2F2F] text-[#FAF9F6] font-bold rounded hover:bg-[#6B4F3F] transition-colors duration-300"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Request Quote
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaterialCalculator;
