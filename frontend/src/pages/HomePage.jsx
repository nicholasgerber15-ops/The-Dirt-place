import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Truck, Shield, Clock, Award, Star } from 'lucide-react';
import MaterialCard from '../components/MaterialCard';
import Gallery from '../components/Gallery';
import SEO from '../components/SEO';
import LocalBusinessSchema from '../components/LocalBusinessSchema';
import { materials, deliveryInfo, aboutText, testimonials } from '../data/mock';

const HomePage = () => {
  const parallaxRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY;
      if (parallaxRef.current) {
        parallaxRef.current.style.transform = `translateY(${scrolled * 0.5}px)`;
      }

      // Animate elements on scroll
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
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="homepage">
      <SEO 
        title="Landscape Materials in Boerne, TX | The Dirt Place"
        description="The Dirt Place provides dirt, gravel, sand, and landscape materials in Boerne, Texas. Fast delivery across the Texas Hill Country. Premium quality guaranteed."
        keywords="dirt delivery boerne, gravel boerne tx, landscape materials boerne, topsoil boerne, mulch boerne, texas hill country materials, sand delivery boerne, road base boerne"
        url="https://earth-supply-1.preview.emergentagent.com"
      />
      <LocalBusinessSchema />
      
      {/* Hero Section with Parallax */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div
          ref={parallaxRef}
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1632452888109-af6d83269329')`,
            transform: 'scale(1.2)'
          }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#3B2F2F]/70 via-[#3B2F2F]/50 to-[#3B2F2F]/90"></div>
        
        {/* Dust particles animation overlay */}
        <div className="absolute inset-0 opacity-20">
          <div className="dust-particles"></div>
        </div>

        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto hero-content">
          <h1 
            className="text-5xl md:text-7xl lg:text-8xl font-bold text-[#FAF9F6] mb-6 leading-tight animate-slide-up"
            style={{ fontFamily: 'Bebas Neue, sans-serif' }}
          >
            Premium Dirt, Gravel & Landscape Materials in Boerne, Texas
          </h1>
          <p 
            className="text-xl md:text-2xl text-[#FAF9F6] mb-12 animate-slide-up-delay"
            style={{ fontFamily: 'Montserrat, sans-serif', animationDelay: '200ms' }}
          >
            Reliable service, honest pricing, and fast delivery across the Texas Hill Country.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center animate-slide-up-delay" style={{ animationDelay: '400ms' }}>
            <Link
              to="/materials"
              className="px-8 py-4 bg-[#D9A441] text-[#3B2F2F] text-lg font-bold rounded hover:bg-[#FAF9F6] hover:shadow-2xl transform hover:scale-105 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center space-x-2"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              <span>View Materials</span>
              <ArrowRight size={20} />
            </Link>
            <Link
              to="/contact"
              className="px-8 py-4 bg-transparent border-2 border-[#FAF9F6] text-[#FAF9F6] text-lg font-bold rounded hover:bg-[#FAF9F6] hover:text-[#3B2F2F] hover:shadow-2xl transform hover:scale-105 hover:-translate-y-1 transition-all duration-300"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Request Delivery
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-[#FAF9F6] rounded-full flex justify-center">
            <div className="w-1 h-3 bg-[#FAF9F6] rounded-full mt-2 animate-scroll"></div>
          </div>
        </div>
      </section>

      {/* Materials Preview Grid */}
      <section className="py-24 bg-[#FAF9F6]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 scroll-animate">
            <h2 
              className="text-5xl md:text-6xl font-bold text-[#3B2F2F] mb-4"
              style={{ fontFamily: 'Bebas Neue, sans-serif' }}
            >
              What We Offer
            </h2>
            <div className="w-24 h-1 bg-[#D9A441] mx-auto mb-6"></div>
            <p 
              className="text-lg text-[#6B4F3F] max-w-2xl mx-auto"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              High-quality landscape materials for every project
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {materials.map((material, index) => (
              <MaterialCard key={material.id} material={material} index={index} />
            ))}
          </div>

          <div className="text-center mt-12 scroll-animate">
            <Link
              to="/materials"
              className="inline-flex items-center space-x-2 px-8 py-4 bg-[#3B2F2F] text-[#FAF9F6] text-lg font-bold rounded hover:bg-[#D9A441] hover:text-[#3B2F2F] hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              <span>View All Materials</span>
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* Delivery Information Section */}
      <section className="py-24 bg-[#3B2F2F] relative overflow-hidden">
        <div 
          className="absolute inset-0 opacity-10 bg-cover bg-center"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1519806390608-acf7ef9c8d1b')` }}
        ></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="scroll-animate">
              <div className="relative">
                <img
                  src={deliveryInfo.image}
                  alt="Delivery Service"
                  className="rounded-lg shadow-2xl"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-[#3B2F2F]/60 to-transparent rounded-lg"></div>
              </div>
            </div>
            
            <div className="scroll-animate">
              <h2 
                className="text-5xl md:text-6xl font-bold text-[#FAF9F6] mb-6"
                style={{ fontFamily: 'Bebas Neue, sans-serif' }}
              >
                {deliveryInfo.title}
              </h2>
              <p 
                className="text-lg text-[#FAF9F6] mb-8 leading-relaxed"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                {deliveryInfo.description}
              </p>
              <ul className="space-y-4 mb-8">
                {deliveryInfo.features.map((feature, index) => (
                  <li 
                    key={index}
                    className="flex items-center space-x-3 text-[#FAF9F6] group"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    <div className="w-2 h-2 bg-[#D9A441] rounded-full group-hover:scale-150 transition-transform duration-300"></div>
                    <span className="group-hover:text-[#D9A441] transition-colors duration-300">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/contact"
                className="inline-flex items-center space-x-2 px-8 py-4 bg-[#D9A441] text-[#3B2F2F] text-lg font-bold rounded hover:bg-[#FAF9F6] hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                <span>Schedule Delivery</span>
                <Truck size={20} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-24 bg-[#FAF9F6]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 scroll-animate">
            <h2 
              className="text-5xl md:text-6xl font-bold text-[#3B2F2F] mb-4"
              style={{ fontFamily: 'Bebas Neue, sans-serif' }}
            >
              Why Choose Us
            </h2>
            <div className="w-24 h-1 bg-[#D9A441] mx-auto"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Shield, title: 'Quality Guaranteed', description: 'Every load meets our high standards' },
              { icon: Clock, title: 'Fast Delivery', description: 'Same-day service available' },
              { icon: Award, title: '15+ Years Experience', description: 'Trusted by the community' },
              { icon: Truck, title: 'Professional Service', description: 'Expert drivers and equipment' }
            ].map((item, index) => (
              <div 
                key={index}
                className="text-center p-8 bg-white rounded-lg shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 scroll-animate group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-20 h-20 bg-[#D9A441] rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                  <item.icon size={36} className="text-[#3B2F2F]" />
                </div>
                <h3 
                  className="text-2xl font-bold text-[#3B2F2F] mb-3"
                  style={{ fontFamily: 'Bebas Neue, sans-serif' }}
                >
                  {item.title}
                </h3>
                <p 
                  className="text-[#6B4F3F]"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-24 bg-[#6B4F3F] relative overflow-hidden">
        <div 
          className="absolute inset-0 opacity-5 bg-cover bg-center"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1526139248783-bcae57f38be2')` }}
        ></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center scroll-animate">
            <h2 
              className="text-5xl md:text-6xl font-bold text-[#FAF9F6] mb-8"
              style={{ fontFamily: 'Bebas Neue, sans-serif' }}
            >
              About The Dirt Place
            </h2>
            <div className="w-32 h-1 bg-[#D9A441] mx-auto mb-8"></div>
            <p 
              className="text-lg text-[#FAF9F6] leading-relaxed"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              {aboutText}
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-[#FAF9F6]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 scroll-animate">
            <h2 
              className="text-5xl md:text-6xl font-bold text-[#3B2F2F] mb-4"
              style={{ fontFamily: 'Bebas Neue, sans-serif' }}
            >
              What Our Customers Say
            </h2>
            <div className="w-24 h-1 bg-[#D9A441] mx-auto"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div 
                key={testimonial.id}
                className="bg-white p-8 rounded-lg shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 scroll-animate"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} size={20} className="text-[#D9A441] fill-current" />
                  ))}
                </div>
                <p 
                  className="text-[#6B4F3F] mb-6 italic leading-relaxed"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  "{testimonial.text}"
                </p>
                <div className="border-t border-[#D9A441] pt-4">
                  <p 
                    className="font-bold text-[#3B2F2F]"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    {testimonial.name}
                  </p>
                  <p 
                    className="text-sm text-[#6B4F3F]"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    {testimonial.location}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <Gallery />
    </div>
  );
};

export default HomePage;
