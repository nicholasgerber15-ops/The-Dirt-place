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
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Check, Phone, ChevronDown, ChevronUp } from 'lucide-react';

const DeliveryArea = () => {
  const [expandedFaq, setExpandedFaq] = useState(null);

  const deliveryCities = [
    { name: 'Boerne', zone: 'primary' },
    { name: 'Fair Oaks Ranch', zone: 'primary' },
    { name: 'Comfort', zone: 'primary' },
    { name: 'Leon Springs', zone: 'primary' },
    { name: 'Bergheim', zone: 'primary' },
    { name: 'Kendall County', zone: 'primary' },
    { name: 'North San Antonio', zone: 'extended' }
  ];

  const faqItems = [
    {
      question: 'Do you deliver to my area?',
      answer: 'We deliver to all of Boerne, Fair Oaks Ranch, Comfort, Leon Springs, Bergheim, and throughout Kendall County. Extended delivery is available for North San Antonio areas.'
    },
    {
      question: 'What are your delivery fees?',
      answer: 'Delivery fees vary based on distance and order size. Contact us for a personalized quote based on your location and material quantity.'
    },
    {
      question: 'How quickly can you deliver?',
      answer: 'We offer same-day delivery for most local orders placed before noon. Call us to confirm availability for your specific delivery window.'
    },
    {
      question: 'Is there a minimum order for delivery?',
      answer: 'Minimum order requirements vary by material and location. Our team can provide specific minimums when you request a quote.'
    }
  ];

  const toggleFaq = (index) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  return (
    <section className="py-24 bg-gradient-to-b from-[#FAF9F6] to-white">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16 scroll-animate">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#D9A441] rounded-full mb-6">
            <MapPin size={32} className="text-[#3B2F2F]" />
          </div>
          <h2 
            className="text-5xl md:text-6xl font-bold text-[#3B2F2F] mb-6"
            style={{ fontFamily: 'Bebas Neue, sans-serif' }}
          >
            Delivery Area
          </h2>
          <div className="w-24 h-1 bg-[#D9A441] mx-auto mb-6"></div>
          <p 
            className="text-lg text-[#6B4F3F] max-w-3xl mx-auto leading-relaxed"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            We proudly serve Boerne and the greater Texas Hill Country with fast, reliable delivery of premium landscape materials. Our experienced drivers know the area well and ensure your materials arrive on time and placed exactly where you need them.
          </p>
        </div>

        {/* Map and Service Areas Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Google Map */}
          <div className="scroll-animate">
            <div className="bg-white rounded-lg shadow-xl overflow-hidden border-4 border-[#6B4F3F]">
              <iframe
                width="100%"
                height="450"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d110268.89537326374!2d-98.80231677343748!3d29.789870000000003!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x865cbd3d13313573%3A0xd03d92ea77e008aa!2sBoerne%2C%20TX!5e0!3m2!1sen!2sus!4v1234567890123!5m2!1sen!2sus"
                title="The Dirt Place Delivery Area Map"
              ></iframe>
            </div>
          </div>

          {/* Service Areas List */}
          <div className="scroll-animate">
            <div className="bg-white rounded-lg shadow-xl p-8 border-l-4 border-[#D9A441]">
              <h3 
                className="text-3xl font-bold text-[#3B2F2F] mb-6 flex items-center"
                style={{ fontFamily: 'Bebas Neue, sans-serif' }}
              >
                <Check size={28} className="text-[#6B7A3A] mr-3" />
                Service Areas
              </h3>
              
              {/* Primary Service Areas */}
              <div className="mb-8">
                <h4 
                  className="text-lg font-bold text-[#6B4F3F] mb-4"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  Primary Delivery Zone
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {deliveryCities.filter(city => city.zone === 'primary').map((city, index) => (
                    <div 
                      key={index}
                      className="flex items-center space-x-3 p-3 bg-[#FAF9F6] rounded hover:bg-[#6B7A3A]/10 transition-colors duration-300"
                    >
                      <div className="w-2 h-2 bg-[#6B7A3A] rounded-full"></div>
                      <span 
                        className="text-[#3B2F2F] font-medium"
                        style={{ fontFamily: 'Montserrat, sans-serif' }}
                      >
                        {city.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Extended Service Areas */}
              <div className="bg-[#D9A441]/10 p-6 rounded-lg border-l-4 border-[#D9A441]">
                <h4 
                  className="text-lg font-bold text-[#6B4F3F] mb-3 flex items-center"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  <MapPin size={20} className="text-[#D9A441] mr-2" />
                  Extended Delivery Zone
                </h4>
                {deliveryCities.filter(city => city.zone === 'extended').map((city, index) => (
                  <div key={index} className="mb-3">
                    <p 
                      className="text-[#3B2F2F] font-medium mb-2"
                      style={{ fontFamily: 'Montserrat, sans-serif' }}
                    >
                      {city.name}
                    </p>
                    <p 
                      className="text-sm text-[#6B4F3F]"
                      style={{ fontFamily: 'Montserrat, sans-serif' }}
                    >
                      Extended delivery available — call for pricing and availability
                    </p>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <div className="mt-8">
                <Link
                  to="/contact"
                  className="w-full flex items-center justify-center space-x-2 px-8 py-4 bg-[#3B2F2F] text-[#FAF9F6] text-lg font-bold rounded hover:bg-[#D9A441] hover:text-[#3B2F2F] hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  <span>Request Delivery</span>
                  <MapPin size={20} />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Do We Deliver to You? FAQ */}
        <div className="max-w-4xl mx-auto scroll-animate">
          <div className="bg-white rounded-lg shadow-xl p-8 md:p-12 border-t-4 border-[#6B7A3A]">
            <h3 
              className="text-4xl font-bold text-[#3B2F2F] mb-8 text-center"
              style={{ fontFamily: 'Bebas Neue, sans-serif' }}
            >
              Do We Deliver to You?
            </h3>
            
            <div className="space-y-4">
              {faqItems.map((item, index) => (
                <div 
                  key={index}
                  className="border-b-2 border-[#FAF9F6] last:border-b-0"
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full flex items-center justify-between py-4 text-left hover:text-[#D9A441] transition-colors duration-300"
                  >
                    <span 
                      className="text-lg font-semibold text-[#3B2F2F]"
                      style={{ fontFamily: 'Montserrat, sans-serif' }}
                    >
                      {item.question}
                    </span>
                    {expandedFaq === index ? (
                      <ChevronUp size={24} className="text-[#D9A441] flex-shrink-0" />
                    ) : (
                      <ChevronDown size={24} className="text-[#6B4F3F] flex-shrink-0" />
                    )}
                  </button>
                  {expandedFaq === index && (
                    <div 
                      className="pb-4 pr-8 text-[#6B4F3F] leading-relaxed animate-fade-in"
                      style={{ fontFamily: 'Montserrat, sans-serif' }}
                    >
                      {item.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Contact Info */}
            <div className="mt-8 pt-8 border-t-2 border-[#FAF9F6] text-center">
              <p 
                className="text-[#6B4F3F] mb-4"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                Don't see your area listed? Give us a call — we may be able to help!
              </p>
              <a
                href="tel:(830) 336-3713"
                className="inline-flex items-center space-x-2 px-6 py-3 bg-[#6B7A3A] text-white font-bold rounded hover:bg-[#3B2F2F] transition-colors duration-300"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                <Phone size={20} />
                <span>(830) 336-3713</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DeliveryArea;
