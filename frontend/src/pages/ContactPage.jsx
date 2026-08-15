import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Phone, Mail, Clock, Send } from 'lucide-react';
import { businessInfo } from '../data/mock';
import SEO from '../components/SEO';
import { trackContactFormSubmit, trackPhoneClick } from '../utils/analytics';
import RecommendedPros from '../components/RecommendedPros';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";
const API = `${BACKEND_URL}/api`;

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    material: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const elements = document.querySelectorAll('.scroll-animate');
      elements.forEach(el => {
        const rect = el.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight * 0.8;
        if (isVisible) {
          el.classList.add('animate-in');
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      const response = await axios.post(`${API}/contact`, {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        material: formData.material,
        message: formData.message
      });

      setSubmitMessage(response.data.message);
      setSubmitSuccess(true);

      trackContactFormSubmit({
        type: 'homeowner',
        material: formData.material
      });

      setFormData({
        name: '',
        phone: '',
        email: '',
        material: '',
        message: ''
      });

      setTimeout(() => setSubmitMessage(''), 5000);
    } catch (error) {
      console.error('Form submission error:', error);
      setSubmitSuccess(false);
      setSubmitMessage(error.response?.data?.detail || 'Failed to send message. Please try again or call us directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="contact-page">
      <SEO 
        title="Contact Us - Get a Quote | The Dirt Place Boerne, TX"
        description="Contact The Dirt Place for landscape materials delivery in Boerne, TX. Call (830) 336-3713 or fill out our contact form for a free quote. Serving the Texas Hill Country."
        keywords="contact the dirt place, landscape materials quote boerne, dirt delivery quote, material delivery boerne tx"
        url="https://theboernedirtplace.com/contact"
      />

      {/* Hero Section */}
      <section className="relative py-32 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center parallax-bg"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1632452888109-af6d83269329')`,
          }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#3B2F2F]/80 via-[#3B2F2F]/70 to-[#FAF9F6]"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <Link 
              to="/"
              className="inline-flex items-center space-x-2 text-[#FAF9F6] hover:text-[#D9A441] mb-8 transition-colors duration-300"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              <ArrowLeft size={20} />
              <span>Back to Home</span>
            </Link>
            <h1 
              className="text-6xl md:text-7xl lg:text-8xl font-bold text-[#FAF9F6] mb-6 animate-slide-up"
              style={{ fontFamily: 'Bebas Neue, sans-serif' }}
            >
              Get In Touch
            </h1>
            <div className="w-32 h-1 bg-[#D9A441] mx-auto mb-8"></div>
            <p 
              className="text-xl text-[#FAF9F6] leading-relaxed animate-slide-up-delay"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Ready to start your project? Contact us for a quote or to schedule delivery.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Form and Info Section */}
      <section className="py-24 bg-[#FAF9F6]">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className="scroll-animate">
              <div className="bg-white p-8 md:p-12 rounded-lg shadow-xl">
                <h2 
                  className="text-4xl font-bold text-[#3B2F2F] mb-6"
                  style={{ fontFamily: 'Bebas Neue, sans-serif' }}
                >
                  Send Us a Message
                </h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label 
                      htmlFor="name" 
                      className="block text-[#3B2F2F] font-bold mb-2"
                      style={{ fontFamily: 'Montserrat, sans-serif' }}
                    >
                      Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border-2 border-[#6B4F3F]/20 rounded focus:border-[#D9A441] focus:outline-none transition-colors duration-300"
                      placeholder="John Smith"
                      style={{ fontFamily: 'Montserrat, sans-serif' }}
                    />
                  </div>

                  <div>
                    <label 
                      htmlFor="phone" 
                      className="block text-[#3B2F2F] font-bold mb-2"
                      style={{ fontFamily: 'Montserrat, sans-serif' }}
                    >
                      Phone *
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border-2 border-[#6B4F3F]/20 rounded focus:border-[#D9A441] focus:outline-none transition-colors duration-300"
                      placeholder="(830) 336-3713"
                      style={{ fontFamily: 'Montserrat, sans-serif' }}
                    />
                  </div>

                  <div>
                    <label 
                      htmlFor="email" 
                      className="block text-[#3B2F2F] font-bold mb-2"
                      style={{ fontFamily: 'Montserrat, sans-serif' }}
                    >
                      Email *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border-2 border-[#6B4F3F]/20 rounded focus:border-[#D9A441] focus:outline-none transition-colors duration-300"
                      placeholder="john@email.com"
                      style={{ fontFamily: 'Montserrat, sans-serif' }}
                    />
                  </div>

                  <div>
                    <label 
                      htmlFor="material"
                      className="block text-[#3B2F2F] font-bold mb-2"
                      style={{ fontFamily: 'Montserrat, sans-serif' }}
                    >
                      What material do you need?
                    </label>
                    <select
                      id="material"
                      name="material"
                      value={formData.material}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-[#6B4F3F]/20 rounded focus:border-[#D9A441] focus:outline-none transition-colors duration-300"
                      style={{ fontFamily: 'Montserrat, sans-serif' }}
                    >
                      <option value="">Select a material...</option>
                      <option value="Topsoil">Topsoil (for gardens & lawns)</option>
                      <option value="Gravel">Gravel (for driveways)</option>
                      <option value="Sand">Sand (for pavers & play)</option>
                      <option value="Road Base">Road Base (for foundations)</option>
                      <option value="Mulch">Mulch (for flower beds)</option>
                      <option value="Decorative Rock">Decorative Rock (for landscaping)</option>
                      <option value="Other">Not sure / Other</option>
                    </select>
                  </div>

                  <div>
                    <label 
                      htmlFor="message"
                      className="block text-[#3B2F2F] font-bold mb-2"
                      style={{ fontFamily: 'Montserrat, sans-serif' }}
                    >
                      Tell us about your project *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows="4"
                      className="w-full px-4 py-3 border-2 border-[#6B4F3F]/20 rounded focus:border-[#D9A441] focus:outline-none transition-colors duration-300 resize-none"
                      placeholder="Describe your project... (e.g., I need topsoil for my garden, about 10 yards)"
                      style={{ fontFamily: 'Montserrat, sans-serif' }}
                    ></textarea>
                  </div>

                  {submitMessage && (
                    <div className={`p-4 rounded-lg animate-fade-in ${
                      submitSuccess ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                    >
                      {submitMessage}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center space-x-2 px-8 py-4 bg-[#D9A441] text-[#3B2F2F] text-lg font-bold rounded hover:bg-[#3B2F2F] hover:text-[#FAF9F6] hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    <span>{isSubmitting ? 'Sending...' : 'Send Message'}</span>
                    <Send size={20} />
                  </button>
                </form>
              </div>
            </div>

            {/* Contact Information */}
            <div className="scroll-animate">
              <div className="bg-[#3B2F2F] p-8 md:p-12 rounded-lg text-[#FAF9F6] h-full">
                <h2 
                  className="text-4xl font-bold mb-8"
                  style={{ fontFamily: 'Bebas Neue, sans-serif' }}
                >
                  Contact Information
                </h2>

                <div className="space-y-8">
                  <div className="flex items-start space-x-4 group">
                    <div className="w-12 h-12 bg-[#D9A441] rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                      <MapPin size={24} className="text-[#3B2F2F]" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[#FAF9F6] mb-1" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>Visit Us</h4>
                      <p className="text-[#FAF9F6]/90" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                        {businessInfo.address}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4 group">
                    <div className="w-12 h-12 bg-[#D9A441] rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                      <Phone size={24} className="text-[#3B2F2F]" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[#FAF9F6] mb-1" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>Call Us</h4>
                      <a 
                        href={`tel:${businessInfo.phone}`} 
                        onClick={() => trackPhoneClick('contact_page')}
                        className="text-[#FAF9F6]/90 hover:text-[#D9A441] transition-colors duration-300"
                        style={{ fontFamily: 'Montserrat, sans-serif' }}
                      >
                        {businessInfo.phone}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4 group">
                    <div className="w-12 h-12 bg-[#D9A441] rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                      <Mail size={24} className="text-[#3B2F2F]" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[#FAF9F6] mb-1" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>Email Us</h4>
                      <a 
                        href={`mailto:${businessInfo.email}`}
                        className="text-[#FAF9F6]/90 hover:text-[#D9A441] transition-colors duration-300"
                        style={{ fontFamily: 'Montserrat, sans-serif' }}
                      >
                        {businessInfo.email}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4 group">
                    <div className="w-12 h-12 bg-[#D9A441] rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                      <Clock size={24} className="text-[#3B2F2F]" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[#FAF9F6] mb-1" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>Hours</h4>
                      <p className="text-[#FAF9F6]/90" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                        {businessInfo.hours.weekday}<br />
                        {businessInfo.hours.saturday}<br />
                        {businessInfo.hours.sunday}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Contractor Link */}
                <div className="mt-12 pt-8 border-t border-[#FAF9F6]/20">
                  <p className="text-[#FAF9F6]/70 mb-3" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Are you a contractor?
                  </p>
                  <Link
                    to="/contractor-portal"
                    className="inline-flex items-center space-x-2 px-6 py-3 bg-[#D9A441] text-[#3B2F2F] font-bold rounded hover:bg-[#FAF9F6] hover:text-[#3B2F2F] transition-colors duration-300"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    <span>Access Contractor Portal</span>
                    <ArrowLeft size={16} className="rotate-180" />
                  </Link>
                </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Recommended Pros Section */}
        <RecommendedPros />
      </div>
    );
  };

export default ContactPage;
