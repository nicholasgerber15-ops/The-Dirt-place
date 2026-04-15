import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Phone, Mail, Clock, Send } from 'lucide-react';
import { businessInfo } from '../data/mock';

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

  useEffect(() => {
    // Scroll animations
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
    handleScroll(); // Check on mount
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Mock form submission (will be replaced with backend integration)
    setTimeout(() => {
      setSubmitMessage("Thank you - we'll contact you shortly.");
      setIsSubmitting(false);
      setFormData({
        name: '',
        phone: '',
        email: '',
        material: '',
        message: ''
      });
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSubmitMessage('');
      }, 5000);
    }, 1000);
  };

  return (
    <div className="contact-page">
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
                      className="block text-[#3B2F2F] font-semibold mb-2"
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
                      style={{ fontFamily: 'Montserrat, sans-serif' }}
                    />
                  </div>

                  <div>
                    <label 
                      htmlFor="phone" 
                      className="block text-[#3B2F2F] font-semibold mb-2"
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
                      style={{ fontFamily: 'Montserrat, sans-serif' }}
                    />
                  </div>

                  <div>
                    <label 
                      htmlFor="email" 
                      className="block text-[#3B2F2F] font-semibold mb-2"
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
                      style={{ fontFamily: 'Montserrat, sans-serif' }}
                    />
                  </div>

                  <div>
                    <label 
                      htmlFor="material" 
                      className="block text-[#3B2F2F] font-semibold mb-2"
                      style={{ fontFamily: 'Montserrat, sans-serif' }}
                    >
                      Material Requested
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
                      <option value="Topsoil">Topsoil</option>
                      <option value="Gravel">Gravel</option>
                      <option value="Sand">Sand</option>
                      <option value="Road Base">Road Base</option>
                      <option value="Mulch">Mulch</option>
                      <option value="Decorative Rock">Decorative Rock</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label 
                      htmlFor="message" 
                      className="block text-[#3B2F2F] font-semibold mb-2"
                      style={{ fontFamily: 'Montserrat, sans-serif' }}
                    >
                      Message *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows="5"
                      className="w-full px-4 py-3 border-2 border-[#6B4F3F]/20 rounded focus:border-[#D9A441] focus:outline-none transition-colors duration-300 resize-none"
                      style={{ fontFamily: 'Montserrat, sans-serif' }}
                      placeholder="Tell us about your project..."
                    ></textarea>
                  </div>

                  {submitMessage && (
                    <div className="p-4 bg-[#6B7A3A] text-white rounded animate-fade-in" style={{ fontFamily: 'Montserrat, sans-serif' }}>
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

            {/* Business Info */}
            <div className="scroll-animate">
              <div className="space-y-8">
                {/* Contact Details */}
                <div className="bg-white p-8 rounded-lg shadow-xl">
                  <h3 
                    className="text-3xl font-bold text-[#3B2F2F] mb-6"
                    style={{ fontFamily: 'Bebas Neue, sans-serif' }}
                  >
                    Contact Information
                  </h3>
                  <div className="space-y-6">
                    <div className="flex items-start space-x-4 group">
                      <div className="w-12 h-12 bg-[#D9A441] rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                        <MapPin size={24} className="text-[#3B2F2F]" />
                      </div>
                      <div>
                        <h4 className="font-bold text-[#3B2F2F] mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>Address</h4>
                        <p className="text-[#6B4F3F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>{businessInfo.address}</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4 group">
                      <div className="w-12 h-12 bg-[#D9A441] rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                        <Phone size={24} className="text-[#3B2F2F]" />
                      </div>
                      <div>
                        <h4 className="font-bold text-[#3B2F2F] mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>Phone</h4>
                        <a href={`tel:${businessInfo.phone}`} className="text-[#6B4F3F] hover:text-[#D9A441] transition-colors duration-300" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                          {businessInfo.phone}
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4 group">
                      <div className="w-12 h-12 bg-[#D9A441] rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                        <Mail size={24} className="text-[#3B2F2F]" />
                      </div>
                      <div>
                        <h4 className="font-bold text-[#3B2F2F] mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>Email</h4>
                        <a href={`mailto:${businessInfo.email}`} className="text-[#6B4F3F] hover:text-[#D9A441] transition-colors duration-300" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                          {businessInfo.email}
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4 group">
                      <div className="w-12 h-12 bg-[#D9A441] rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                        <Clock size={24} className="text-[#3B2F2F]" />
                      </div>
                      <div>
                        <h4 className="font-bold text-[#3B2F2F] mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>Hours</h4>
                        <div className="text-[#6B4F3F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                          <p>{businessInfo.hours.weekday}</p>
                          <p>{businessInfo.hours.saturday}</p>
                          <p className="text-[#D9A441] font-semibold">{businessInfo.hours.sunday}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Map */}
                <div className="bg-white p-4 rounded-lg shadow-xl overflow-hidden">
                  <iframe
                    src={`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3445.5!2d${businessInfo.mapCoordinates.lng}!3d${businessInfo.mapCoordinates.lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjnCsDQ3JzIzLjUiTiA5OMKwNDInMDkuMSJX!5e0!3m2!1sen!2sus!4v1234567890`}
                    width="100%"
                    height="350"
                    style={{ border: 0 }}
                    allowFullScreen=""
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="The Dirt Place Location"
                    className="rounded"
                  ></iframe>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;
