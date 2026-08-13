import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Search, X } from 'lucide-react';
import MaterialCard from '../components/MaterialCard';
import MaterialCalculator from '../components/MaterialCalculator';
import SEO from '../components/SEO';
import ProductSchema from '../components/ProductSchema';
import { businessInfo } from '../data/mock';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";
const API = `${BACKEND_URL}/api`;

const MaterialsPage = () => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const categories = useMemo(() => {
    const cats = [...new Set(materials.map(m => m.category).filter(Boolean))];
    return cats.sort();
  }, [materials]);

  const filteredMaterials = useMemo(() => {
    return materials.filter(m => {
      if (categoryFilter !== 'all' && m.category !== categoryFilter) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return m.name?.toLowerCase().includes(q) || m.description?.toLowerCase().includes(q) || m.category?.toLowerCase().includes(q);
    });
  }, [materials, searchQuery, categoryFilter]);

  useEffect(() => {
    fetchMaterials();
    
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

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/ecommerce/materials`);
      
      const materials = response.data?.materials || [];
      const transformedMaterials = materials.map(m => ({
        id: m.material_id || m.id,
        name: m.name,
        description: m.description || `Premium ${m.name.toLowerCase()} for your landscaping needs.`,
        image: m.image_url || '/images/IMG_0477.jpg',
        category: m.category || m.name,
        pricePerCubicYard: parseFloat(m.price_per_unit || m.price_per_cubic_yard || m.price || 0),
        unit: m.unit_type || m.unit || 'cubic yard',
        minOrder: m.min_order || 1,
        stock_quantity: m.stock_quantity || 100,
        in_stock: m.in_stock !== undefined ? m.in_stock : ((m.stock_quantity || 100) > 0)
      }));
      
      setMaterials(transformedMaterials);
    } catch (error) {
      console.error('Failed to fetch materials:', error);
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="materials-page">
      <SEO 
        title="Our Materials - Topsoil, Gravel, Sand & More | The Dirt Place"
        description="Browse our selection of premium landscape materials including topsoil, gravel, sand, road base, mulch, and decorative rock. Free material calculator to estimate your needs."
        keywords="topsoil boerne, gravel boerne, sand boerne, road base boerne, mulch boerne, decorative rock boerne, landscape materials calculator"
        url="https://theboernedirtplace.com/materials"
      />
      
      {/* Hero Section with Parallax Background */}
      <section className="relative py-32 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center parallax-bg"
          style={{
             backgroundImage: `url('https://cdn.theboernedirtplace.com/images/IMG_0476.jpg')`,
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
              Our Materials
            </h1>
            <div className="w-32 h-1 bg-[#D9A441] mx-auto mb-8"></div>
            <p 
              className="text-xl text-[#FAF9F6] leading-relaxed animate-slide-up-delay"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              We supply high‑quality dirt, gravel, sand, mulch, and rock for residential, ranch, and commercial projects. Every load meets our quality standards.
            </p>
          </div>
        </div>
      </section>

      {/* Materials Grid */}
      <section className="py-24 bg-[#FAF9F6]">
        <div className="container mx-auto px-4">
          {/* Search & Filter Bar */}
          {!loading && materials.length > 0 && (
            <div className="mb-8 flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B4F3F]" />
                <input
                  type="text"
                  placeholder="Search materials..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 border-2 border-[#6B4F3F]/20 rounded-lg focus:border-[#D9A441] focus:outline-none text-[#3B2F2F] bg-white"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B4F3F] hover:text-[#D9A441]">
                    <X size={18} />
                  </button>
                )}
              </div>
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="px-4 py-3 border-2 border-[#6B4F3F]/20 rounded-lg focus:border-[#D9A441] focus:outline-none text-[#3B2F2F] bg-white min-w-[180px]"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              {filteredMaterials.length < materials.length && (
                <div className="flex items-center text-sm text-[#6B4F3F] whitespace-nowrap" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  {filteredMaterials.length} of {materials.length}
                </div>
              )}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#D9A441]"></div>
            </div>
          ) : filteredMaterials.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-2xl text-[#6B4F3F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                {searchQuery || categoryFilter !== 'all' ? 'No materials match your search.' : 'No materials available at the moment.'}
              </p>
              {(searchQuery || categoryFilter !== 'all') && (
                <button
                  onClick={() => { setSearchQuery(''); setCategoryFilter('all'); }}
                  className="mt-4 px-6 py-2 bg-[#D9A441] text-[#3B2F2F] font-bold rounded hover:bg-[#3B2F2F] hover:text-white transition-colors"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredMaterials.map((material, index) => (
                <div key={material.id} className="scroll-animate">
                  <MaterialCard material={material} index={index} />
                  <ProductSchema key={`schema-${material.id}`} product={material} />
                </div>
              ))}
            </div>
          )}

          {/* Additional Info Section */}
          <div className="mt-24 max-w-4xl mx-auto scroll-animate">
            <MaterialCalculator />
          </div>

          <div className="mt-12 max-w-4xl mx-auto scroll-animate">
            <div className="bg-white p-12 rounded-lg shadow-xl border-l-4 border-[#D9A441]">
              <h2 
                className="text-4xl font-bold text-[#3B2F2F] mb-6"
                style={{ fontFamily: 'Bebas Neue, sans-serif' }}
              >
                Need Help Choosing?
              </h2>
              <p 
                className="text-lg text-[#6B4F3F] mb-6 leading-relaxed"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                Not sure which material is right for your project? Our experienced team can help you select the perfect materials for your specific needs. Whether you're building a driveway, creating a garden bed, or working on a large commercial project, we've got you covered.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/contact"
                  className="px-8 py-4 bg-[#D9A441] text-[#3B2F2F] text-lg font-bold rounded hover:bg-[#3B2F2F] hover:text-[#FAF9F6] hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-center"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  Contact Us
                </Link>
                <a
                  href={`tel:${businessInfo.phone.replace(/[^0-9]/g, '')}`}
                  className="px-8 py-4 bg-transparent border-2 border-[#3B2F2F] text-[#3B2F2F] text-lg font-bold rounded hover:bg-[#3B2F2F] hover:text-[#FAF9F6] hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-center"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  Call Now: {businessInfo.phone}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quality Assurance Section */}
      <section className="py-24 bg-[#3B2F2F] relative overflow-hidden">
        <div 
          className="absolute inset-0 opacity-5 bg-cover bg-center"
           style={{ backgroundImage: `url('https://cdn.theboernedirtplace.com/images/IMG_0480.jpg')` }}
        ></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center scroll-animate">
            <h2 
              className="text-5xl md:text-6xl font-bold text-[#FAF9F6] mb-8"
              style={{ fontFamily: 'Bebas Neue, sans-serif' }}
            >
              Quality You Can Trust
            </h2>
            <div className="w-32 h-1 bg-[#D9A441] mx-auto mb-8"></div>
            <p 
              className="text-lg text-[#FAF9F6] leading-relaxed mb-12"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Every material we deliver is carefully sourced and inspected to ensure it meets our rigorous quality standards. We stand behind every load with our satisfaction guarantee.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="group">
                <div className="text-6xl font-bold text-[#D9A441] mb-2 group-hover:scale-110 transition-transform duration-300" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                  Since 2022
                </div>
                <p className="text-[#FAF9F6]" style={{ fontFamily: 'Montserrat, sans-serif' }}>Serving Boerne & the Hill Country</p>
              </div>
              <div className="group">
                <div className="text-6xl font-bold text-[#D9A441] mb-2 group-hover:scale-110 transition-transform duration-300" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                  1000+
                </div>
                <p className="text-[#FAF9F6]" style={{ fontFamily: 'Montserrat, sans-serif' }}>Happy Customers</p>
              </div>
              <div className="group">
                <div className="text-6xl font-bold text-[#D9A441] mb-2 group-hover:scale-110 transition-transform duration-300" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                  100%
                </div>
                <p className="text-[#FAF9F6]" style={{ fontFamily: 'Montserrat, sans-serif' }}>Quality Guaranteed</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default MaterialsPage;
