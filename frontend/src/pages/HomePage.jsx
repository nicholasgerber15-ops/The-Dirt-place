import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Truck, Shield, Clock, Award, Star, Settings, Phone } from 'lucide-react';
import MaterialCard from '../components/MaterialCard';
import Gallery from '../components/Gallery';
import SEO from '../components/SEO';
import LocalBusinessSchema from '../components/LocalBusinessSchema';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";
const API = `${BACKEND_URL}/api`;
const DEFAULT_HERO_IMAGE = '/images/IMG_0483.jpg';

// Static content (can be moved to API later if needed)

const aboutText = "The Dirt Place has been serving Boerne and the Texas Hill Country since 2022. We're your trusted source for premium landscape materials with honest pricing and reliable service. Whether you're a homeowner, rancher, or contractor, we have the materials and expertise to support your project from start to finish.";

const testimonials = [
  {
    id: 1,
    name: "Sarah Mitchell",
    location: "Boerne, TX",
    text: "Outstanding service! The topsoil quality is excellent and they delivered right on time. Highly recommend.",
    rating: 5
  },
  {
    id: 2,
    name: "John Rodriguez",
    location: "Fair Oaks Ranch",
    text: "Been using The Dirt Place for all our ranch projects. Always reliable, fair pricing, and quality materials.",
    rating: 5
  },
  {
    id: 3,
    name: "Emily Johnson",
    location: "Comfort, TX",
    text: "Great experience from start to finish. They helped me choose the right gravel for my driveway and the result is perfect!",
    rating: 5
  }
];

const HomePage = () => {
  const parallaxRef = useRef(null);
  const [heroImage, setHeroImage] = useState(DEFAULT_HERO_IMAGE);
  const [materials, setMaterials] = useState([]);
  const [loadingMaterials, setLoadingMaterials] = useState(true);
  const { language, t } = useLanguage();

  useEffect(() => {
    fetchHeroImage();
    fetchMaterials();
    
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

  const fetchHeroImage = async () => {
    try {
      const response = await axios.get(`${API}/admin/settings`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('admin_token') || 'dirtplace2024'}` }
      });
      if (response.data.hero_image_url) {
        setHeroImage(response.data.hero_image_url);
      }
    } catch (error) {
      console.log('Using default hero image');
    }
  };

  const fetchMaterials = async () => {
    try {
      setLoadingMaterials(true);
      const response = await axios.get(`${API}/ecommerce/materials`);
      
      const transformedMaterials = response.data.materials.map(m => ({
        id: m.material_id || m.id,
        name: m.name,
        description: m.description || `Premium ${m.name.toLowerCase()} for your landscaping needs.`,
        image: m.image_url || '/images/IMG_0476.jpg',
        category: m.name,
        pricePerCubicYard: m.price_per_unit || m.price_per_cubic_yard || 0,
        unit: m.unit_type || 'cubic yard',
        minOrder: m.min_order || 1,
        stock_quantity: m.stock_quantity || 0,
        in_stock: (m.stock_quantity || 0) > 0
      })).slice(0, 6); // Show first 6 on homepage
      
      setMaterials(transformedMaterials);
    } catch (error) {
      console.error('Failed to fetch materials:', error);
      setMaterials([]);
    } finally {
      setLoadingMaterials(false);
    }
  };

  return (
    <div className="homepage">
      <SEO 
        title="Landscape Materials in Boerne, TX | The Dirt Place"
        description="The Dirt Place provides dirt, gravel, sand, and landscape materials in Boerne, Texas. We deliver across the Texas Hill Country. Premium quality guaranteed."
        keywords="dirt boerne, gravel boerne tx, landscape materials boerne, topsoil boerne, mulch boerne, texas hill country materials, sand boerne, road base boerne"
        url="https://theboernedirtplace.com"
      />
      <LocalBusinessSchema />
      
      {/* Hero Section with Parallax */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div
          ref={parallaxRef}
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('${heroImage}')`,
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
            Reliable service and honest pricing. We deliver across the Texas Hill Country.
          </p>
          <div className="flex justify-center animate-slide-up-delay" style={{ animationDelay: '400ms' }}>
            <Link
              to="/materials"
              className="px-8 py-4 bg-[#D9A441] text-[#3B2F2F] text-lg font-bold rounded hover:bg-[#FAF9F6] hover:shadow-2xl transform hover:scale-105 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center space-x-2"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              <span>View Materials</span>
              <ArrowRight size={20} />
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
              {t('home.whatWeOffer')}
            </h2>
            <div className="w-24 h-1 bg-[#D9A441] mx-auto mb-6"></div>
            <p
              className="text-lg text-[#6B4F3F] max-w-2xl mx-auto"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              {t('home.whatWeOfferSub')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                title: language === 'es' ? 'Bloques para Paisajismo' : 'Landscaping Blocks',
                image: '/images/IMG_0480.jpg',
                link: '/materials'
              },
              {
                title: language === 'es' ? 'Agregados y Gravas' : 'Aggregates and Gravels',
                image: '/images/IMG_0477.jpg',
                link: '/materials'
              },
              {
                title: language === 'es' ? 'Tierra, Mantillo y Suelos' : 'Dirt Mulch and Soils',
                image: '/images/IMG_0476.jpg',
                link: '/materials'
              },
              {
                title: language === 'es' ? 'Piedras Decorativas' : 'Decorative Stones',
                image: '/images/IMG_0482.jpg',
                link: '/materials'
              }
            ].map((category, index) => (
              <Link
                key={index}
                to={category.link}
                className="group relative overflow-hidden rounded-lg shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 scroll-animate"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="aspect-[4/3] bg-cover bg-center" style={{ backgroundImage: `url('${category.image}')` }}></div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#3B2F2F]/80 via-[#3B2F2F]/20 to-transparent"></div>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6 text-center">
                  <h3
                    className="text-2xl md:text-3xl font-bold text-[#FAF9F6] mb-2"
                    style={{ fontFamily: 'Bebas Neue, sans-serif' }}
                  >
                    {category.title}
                  </h3>
                  <div className="w-12 h-0.5 bg-[#D9A441] mx-auto group-hover:w-24 transition-all duration-300"></div>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-12 scroll-animate">
            <Link
              to="/materials"
              className="inline-flex items-center space-x-2 px-8 py-4 bg-[#3B2F2F] text-[#FAF9F6] text-lg font-bold rounded hover:bg-[#D9A441] hover:text-[#3B2F2F] hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              <span>{t('home.viewAll')}</span>
              <ArrowRight size={20} />
            </Link>
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
              { icon: Clock, title: 'Fast Turnaround', description: 'Quick service when you need it' },
              { icon: Award, title: 'Since 2022', description: 'Trusted by the community' },
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
          style={{ backgroundImage: `url('/images/IMG_0478.jpg')` }}
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

      {/* Need Installation? - Revenue Pipeline Section */}
      <section className="py-24 bg-[#FAF9F6]">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center scroll-animate">
            <h2
              className="text-5xl font-bold text-[#3B2F2F] mb-4"
              style={{ fontFamily: 'Bebas Neue, sans-serif' }}
            >
              Need Installation Too?
            </h2>
            <div className="w-24 h-1 bg-[#D9A441] mx-auto mb-6"></div>
            <p
              className="text-xl text-[#6B4F3F] mb-8"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              We deliver the materials — and can connect you with trusted local installers.
              From dirt delivery to finished landscape, we've got you covered.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <div className="w-16 h-16 bg-[#D9A441] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Truck size={32} className="text-[#3B2F2F]" />
                </div>
                <h3 className="text-xl font-bold text-[#3B2F2F] mb-2" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                  1. Order Materials
                </h3>
                <p className="text-[#6B4F3F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  Order from The Dirt Place — fast delivery across Boerne
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <div className="w-16 h-16 bg-[#D9A441] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Settings size={32} className="text-[#3B2F2F]" />
                </div>
                <h3 className="text-xl font-bold text-[#3B2F2F] mb-2" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                  2. Professional Installation
                </h3>
                <p className="text-[#6B4F3F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  Our vetted partners handle design, installation, and cleanup
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <div className="w-16 h-16 bg-[#D9A441] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star size={32} className="text-[#3B2F2F]" />
                </div>
                <h3 className="text-xl font-bold text-[#3B2F2F] mb-2" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                  3. Enjoy Your New Landscape
                </h3>
                <p className="text-[#6B4F3F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  Step back and enjoy your transformed outdoor space
                </p>
              </div>
            </div>

            <div className="bg-[#3B2F2F] p-8 rounded-lg text-[#FAF9F6] mb-8">
              <h3 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                Trusted Installation Partners
              </h3>
              <p className="text-lg mb-6" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Full-service landscaping, tree care, lawn maintenance, and outdoor living spaces.
                Serving Boerne and the Texas Hill Country.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="tel:8303363713"
                  aria-label="Call The Dirt Place for installation referrals at (830) 336-3713"
                  className="inline-flex items-center space-x-2 px-8 py-3 bg-[#D9A441] text-[#3B2F2F] font-bold rounded hover:bg-[#FAF9F6] transition-colors"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  <Phone size={20} aria-hidden="true" />
                  <span>Call for Install Referral: (830) 336-3713</span>
                </a>
                <a
                  href="/contact"
                  aria-label="Request installation referral from The Dirt Place"
                  className="inline-flex items-center space-x-2 px-8 py-3 bg-transparent border-2 border-[#FAF9F6] text-[#FAF9F6] font-bold rounded hover:bg-[#FAF9F6] hover:text-[#3B2F2F] transition-colors"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  <span>Request Referral</span>
                  <ArrowRight size={20} aria-hidden="true" />
                </a>
              </div>
            </div>

            <p className="text-[#6B4F3F] text-sm" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              🤝 Partnership: The Dirt Place + Trusted Local Installers
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
