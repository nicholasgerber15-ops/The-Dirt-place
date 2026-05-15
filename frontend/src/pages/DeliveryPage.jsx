import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Check, Phone, ChevronDown, ChevronUp, ArrowLeft, Truck, Clock, DollarSign } from 'lucide-react';
import SEO from '../components/SEO';
import ZipCodeChecker from '../components/ZipCodeChecker';

const DeliveryPage = () => {
  const [expandedFaq, setExpandedFaq] = useState(null);

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
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    },
    {
      question: 'Can you place materials in a specific location?',
      answer: 'Yes! Our experienced drivers will work with you to place materials exactly where you need them on your property, ensuring easy access for your project.'
    },
    {
      question: 'Do you deliver on weekends?',
      answer: 'Saturday delivery is available for an additional fee. Sunday delivery is not available. Contact us to schedule your preferred delivery time.'
    }
  ];

  const deliveryFeatures = [
    {
      icon: Truck,
      title: 'Professional Equipment',
      description: 'Modern fleet of delivery trucks equipped to handle all material types safely'
    },
    {
      icon: Clock,
      title: 'Same-Day Service',
      description: 'Order before noon for same-day delivery on most materials in our primary zone'
    },
    {
      icon: DollarSign,
      title: 'Transparent Pricing',
      description: 'No hidden fees — get a clear quote upfront based on your location and order'
    }
  ];

  const toggleFaq = (index) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  return (
    <div className="delivery-page">
      <SEO 
        title="Delivery Areas & Service - The Dirt Place Boerne, TX"
        description="The Dirt Place delivers premium landscape materials throughout Boerne, Fair Oaks Ranch, Comfort, Leon Springs, Bergheim, and Kendall County. Same-day delivery available. View our service map."
        keywords="landscape materials delivery boerne, dirt delivery boerne tx, gravel delivery fair oaks ranch, mulch delivery kendall county, same day delivery boerne"
        url="https://theboernedirtplace.com/delivery"
      />

      {/* Hero Section */}
      <section className="relative py-32 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center parallax-bg"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1519806390608-acf7ef9c8d1b')`,
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
            
            <div className="inline-flex items-center justify-center w-20 h-20 bg-[#D9A441] rounded-full mb-6">
              <MapPin size={40} className="text-[#3B2F2F]" />
            </div>
            
            <h1 
              className="text-6xl md:text-7xl lg:text-8xl font-bold text-[#FAF9F6] mb-6 animate-slide-up"
              style={{ fontFamily: 'Bebas Neue, sans-serif' }}
            >
              Delivery Areas
            </h1>
            <div className="w-32 h-1 bg-[#D9A441] mx-auto mb-8"></div>
            <p 
              className="text-xl text-[#FAF9F6] leading-relaxed animate-slide-up-delay"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Fast, reliable delivery throughout Boerne and the Texas Hill Country. Our experienced drivers ensure your materials arrive on time and placed exactly where you need them.
            </p>
          </div>
        </div>
      </section>

      {/* Delivery Features */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {deliveryFeatures.map((feature, index) => (
              <div 
                key={index}
                className="text-center p-8 bg-[#FAF9F6] rounded-lg hover:shadow-xl transition-shadow duration-300 scroll-animate"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-16 h-16 bg-[#D9A441] rounded-full flex items-center justify-center mx-auto mb-4">
                  <feature.icon size={32} className="text-[#3B2F2F]" />
                </div>
                <h3 
                  className="text-2xl font-bold text-[#3B2F2F] mb-3"
                  style={{ fontFamily: 'Bebas Neue, sans-serif' }}
                >
                  {feature.title}
                </h3>
                <p 
                  className="text-[#6B4F3F]"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Map and Service Areas */}
      <section className="py-24 bg-gradient-to-b from-white to-[#FAF9F6]">
        <div className="container mx-auto px-4">
          {/* ZIP Code Checker */}
          <div className="max-w-2xl mx-auto mb-16 scroll-animate">
            <ZipCodeChecker />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Google Map */}
            <div className="scroll-animate">
              <h3 
                className="text-4xl font-bold text-[#3B2F2F] mb-6"
                style={{ fontFamily: 'Bebas Neue, sans-serif' }}
              >
                Our Service Area
              </h3>
              <div className="bg-white rounded-lg shadow-2xl overflow-hidden border-4 border-[#6B4F3F]">
                <iframe
                  width="100%"
                  height="500"
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
              <div className="bg-white rounded-lg shadow-2xl p-8 md:p-10 border-l-4 border-[#D9A441]">
                <h3 
                  className="text-4xl font-bold text-[#3B2F2F] mb-6 flex items-center"
                  style={{ fontFamily: 'Bebas Neue, sans-serif' }}
                >
                  <Check size={32} className="text-[#6B7A3A] mr-3" />
                  We Deliver To
                </h3>
                
                {/* Primary Service Areas */}
                <div className="mb-8">
                  <h4 
                    className="text-xl font-bold text-[#6B4F3F] mb-5"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    Primary Delivery Zone
                  </h4>
                  <p 
                    className="text-sm text-[#6B4F3F] mb-4"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    Standard delivery fees apply
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {deliveryCities.filter(city => city.zone === 'primary').map((city, index) => (
                      <div 
                        key={index}
                        className="flex items-center space-x-3 p-4 bg-[#FAF9F6] rounded-lg hover:bg-[#6B7A3A]/10 transition-all duration-300 group"
                      >
                        <div className="w-2 h-2 bg-[#6B7A3A] rounded-full group-hover:scale-150 transition-transform duration-300"></div>
                        <span 
                          className="text-[#3B2F2F] font-semibold"
                          style={{ fontFamily: 'Montserrat, sans-serif' }}
                        >
                          {city.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Extended Service Areas */}
                <div className="bg-gradient-to-r from-[#D9A441]/10 to-[#D9A441]/5 p-6 rounded-lg border-l-4 border-[#D9A441]">
                  <h4 
                    className="text-xl font-bold text-[#6B4F3F] mb-3 flex items-center"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    <MapPin size={24} className="text-[#D9A441] mr-2" />
                    Extended Delivery Zone
                  </h4>
                  {deliveryCities.filter(city => city.zone === 'extended').map((city, index) => (
                    <div key={index} className="mb-3">
                      <p 
                        className="text-[#3B2F2F] font-bold text-lg mb-2"
                        style={{ fontFamily: 'Montserrat, sans-serif' }}
                      >
                        {city.name}
                      </p>
                      <p 
                        className="text-sm text-[#6B4F3F] leading-relaxed"
                        style={{ fontFamily: 'Montserrat, sans-serif' }}
                      >
                        Extended delivery available — call for pricing and availability. Additional fees may apply based on distance.
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
                    <span>Request Delivery Quote</span>
                    <MapPin size={20} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-[#FAF9F6]">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto scroll-animate">
            <div className="bg-white rounded-lg shadow-2xl p-8 md:p-12 border-t-4 border-[#6B7A3A]">
              <h3 
                className="text-5xl font-bold text-[#3B2F2F] mb-4 text-center"
                style={{ fontFamily: 'Bebas Neue, sans-serif' }}
              >
                Delivery FAQ
              </h3>
              <p 
                className="text-center text-[#6B4F3F] mb-10"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                Common questions about our delivery service
              </p>
              
              <div className="space-y-4">
                {faqItems.map((item, index) => (
                  <div 
                    key={index}
                    className="border-b-2 border-[#FAF9F6] last:border-b-0"
                  >
                    <button
                      onClick={() => toggleFaq(index)}
                      className="w-full flex items-center justify-between py-5 text-left hover:text-[#D9A441] transition-colors duration-300 group"
                    >
                      <span 
                        className="text-lg font-bold text-[#3B2F2F] pr-4 group-hover:text-[#D9A441]"
                        style={{ fontFamily: 'Montserrat, sans-serif' }}
                      >
                        {item.question}
                      </span>
                      {expandedFaq === index ? (
                        <ChevronUp size={24} className="text-[#D9A441] flex-shrink-0" />
                      ) : (
                        <ChevronDown size={24} className="text-[#6B4F3F] flex-shrink-0 group-hover:text-[#D9A441]" />
                      )}
                    </button>
                    {expandedFaq === index && (
                      <div 
                        className="pb-5 pr-8 text-[#6B4F3F] leading-relaxed animate-fade-in"
                        style={{ fontFamily: 'Montserrat, sans-serif' }}
                      >
                        {item.answer}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Contact Info */}
              <div className="mt-10 pt-10 border-t-2 border-[#FAF9F6] text-center">
                <p 
                  className="text-lg text-[#6B4F3F] mb-6"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  Still have questions? Our team is ready to help!
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a
                    href="tel:(830) 336-3713"
                    className="inline-flex items-center justify-center space-x-2 px-8 py-4 bg-[#6B7A3A] text-white font-bold rounded hover:bg-[#3B2F2F] transition-colors duration-300"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    <Phone size={20} />
                    <span>(830) 336-3713</span>
                  </a>
                  <Link
                    to="/contact"
                    className="inline-flex items-center justify-center space-x-2 px-8 py-4 bg-[#D9A441] text-[#3B2F2F] font-bold rounded hover:bg-[#3B2F2F] hover:text-[#FAF9F6] transition-colors duration-300"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    <span>Contact Us</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DeliveryPage;
