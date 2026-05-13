import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Truck, Clock, Star, ArrowRight, MapPin, Phone } from 'lucide-react';
import { serviceAreas } from '../data/serviceAreas';
import { products } from '../data/mock';
import { businessInfo } from '../data/mock';
import SEO from '../components/SEO';
import MaterialCard from '../components/MaterialCard';

const ServiceAreaPage = () => {
  const { areaSlug } = useParams();
  const [serviceArea, setServiceArea] = useState(null);
  const [popularMats, setPopularMats] = useState([]);

  useEffect(() => {
    const area = serviceAreas.find(a => a.slug === areaSlug);
    if (area) {
      setServiceArea(area);
      const popular = materials.filter(m => area.popularMaterials.includes(m.name));
      setPopularMats(popular);
    }
  }, [areaSlug]);

  if (!serviceArea) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6]">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-[#3B2F2F] mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
            Service Area Not Found
          </h1>
          <Link to="/" className="text-[#D9A441] hover:underline">Return to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="service-area-page">
      <SEO 
        title={`Landscape Materials Delivery in ${serviceArea.name}, TX | The Dirt Place`}
        description={`The Dirt Place delivers premium landscape materials to ${serviceArea.name}, TX. ${serviceArea.deliveryTime}. Call ${businessInfo.phone} for a free quote!`}
        keywords={`landscape materials ${serviceArea.name} TX, dirt delivery ${serviceArea.name}, gravel ${serviceArea.name}, topsoil ${serviceArea.name}, mulch ${serviceArea.name}, sand delivery ${serviceArea.name}`}
        url={`https://theboernedirtplace.com/service-area/${serviceArea.slug}`}
      />

      {/* Hero Section */}
      <section className="relative py-32 bg-[#3B2F2F] overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1632452888109-af6d83269329')] bg-cover bg-center"></div>
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center bg-[#D9A441] text-[#3B2F2F] px-4 py-2 rounded-full font-bold mb-6">
              <MapPin size={18} className="mr-2" />
              <span>Service Area</span>
            </div>
            <h1 
              className="text-5xl md:text-7xl font-bold text-[#FAF9F6] mb-6"
              style={{ fontFamily: 'Bebas Neue, sans-serif' }}
            >
              Landscape Materials in {serviceArea.name}, TX
            </h1>
            <p 
              className="text-xl text-[#FAF9F6] mb-8"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              {serviceArea.description}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/contact"
                className="px-8 py-4 bg-[#D9A441] text-[#3B2F2F] text-lg font-bold rounded hover:bg-[#c48f35] transition-colors flex items-center justify-center space-x-2"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                <span>Get a Quote for {serviceArea.name}</span>
                <ArrowRight size={20} />
              </Link>
              <a
                href={`tel:${businessInfo.phone.replace(/[^0-9]/g, '')}`}
                className="px-8 py-4 bg-transparent border-2 border-[#FAF9F6] text-[#FAF9F6] text-lg font-bold rounded hover:bg-[#FAF9F6] hover:text-[#3B2F2F] transition-colors flex items-center justify-center space-x-2"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                <Phone size={20} />
                <span>{businessInfo.phone}</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Delivery Info */}
      <section className="py-16 bg-[#D9A441]">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto text-center">
            <div className="flex flex-col items-center space-y-3">
              <Truck size={48} className="text-[#3B2F2F]" />
              <h3 className="text-2xl font-bold text-[#3B2F2F]" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                {serviceArea.deliveryTime}
              </h3>
              <p className="text-[#3B2F2F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                {serviceArea.deliveryTimeDetail}
              </p>
            </div>
            <div className="flex flex-col items-center space-y-3">
              <Clock size={48} className="text-[#3B2F2F]" />
              <h3 className="text-2xl font-bold text-[#3B2F2F]" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                15+ Years
              </h3>
              <p className="text-[#3B2F2F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Serving the Hill Country
              </p>
            </div>
            <div className="flex flex-col items-center space-y-3">
              <Star size={48} className="text-[#3B2F2F]" />
              <h3 className="text-2xl font-bold text-[#3B2F2F]" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                4.9/5 Rating
              </h3>
              <p className="text-[#3B2F2F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                From 200+ local projects
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Materials */}
      <section className="py-24 bg-[#FAF9F6]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 
              className="text-5xl font-bold text-[#3B2F2F] mb-4"
              style={{ fontFamily: 'Bebas Neue, sans-serif' }}
            >
              Popular Materials in {serviceArea.name}
            </h2>
            <div className="w-24 h-1 bg-[#D9A441] mx-auto mb-6"></div>
            <p 
              className="text-lg text-[#6B4F3F] max-w-2xl mx-auto"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              These are the most requested materials for projects in {serviceArea.name}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {popularMats.map((material, index) => (
              <MaterialCard key={material.id} material={material} index={index} />
            ))}
          </div>

          <div className="text-center">
            <Link
              to="/materials"
              className="inline-flex items-center space-x-2 px-8 py-4 bg-[#3B2F2F] text-[#FAF9F6] text-lg font-bold rounded hover:bg-[#D9A441] hover:text-[#3B2F2F] transition-colors"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              <span>View All Materials</span>
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* Local Testimonials */}
      <section className="py-24 bg-[#3B2F2F]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 
              className="text-5xl font-bold text-[#FAF9F6] mb-4"
              style={{ fontFamily: 'Bebas Neue, sans-serif' }}
            >
              What {serviceArea.name} Customers Say
            </h2>
            <div className="w-24 h-1 bg-[#D9A441] mx-auto"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {serviceArea.testimonials.map((testimonial, index) => (
              <div key={index} className="bg-[#FAF9F6] p-8 rounded-lg shadow-xl">
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} size={20} className="text-[#D9A441] fill-current" />
                  ))}
                </div>
                <p 
                  className="text-[#3B2F2F] mb-4 italic"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  "{testimonial.text}"
                </p>
                <p 
                  className="text-[#6B4F3F] font-bold"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  - {testimonial.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Neighborhoods */}
      <section className="py-16 bg-[#FAF9F6]">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h3 
              className="text-3xl font-bold text-[#3B2F2F] mb-8"
              style={{ fontFamily: 'Bebas Neue, sans-serif' }}
            >
              We Deliver to These {serviceArea.name} Areas
            </h3>
            <div className="flex flex-wrap justify-center gap-3">
              {serviceArea.neighborhoods.map((neighborhood, index) => (
                <span 
                  key={index}
                  className="px-6 py-3 bg-[#3B2F2F] text-[#FAF9F6] rounded-full font-medium"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  <MapPin size={16} className="inline mr-2" />
                  {neighborhood}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-[#D9A441]">
        <div className="container mx-auto px-4 text-center">
          <h2 
            className="text-5xl font-bold text-[#3B2F2F] mb-6"
            style={{ fontFamily: 'Bebas Neue, sans-serif' }}
          >
            Ready to Start Your Project in {serviceArea.name}?
          </h2>
          <p 
            className="text-xl text-[#3B2F2F] mb-8 max-w-2xl mx-auto"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            Call us today or fill out our contact form for a free quote on your landscape materials.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={`tel:${businessInfo.phone.replace(/[^0-9]/g, '')}`}
              className="px-8 py-4 bg-[#3B2F2F] text-[#FAF9F6] text-lg font-bold rounded hover:bg-[#2a2222] transition-colors flex items-center justify-center space-x-2"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              <Phone size={20} />
              <span>Call {businessInfo.phone}</span>
            </a>
            <Link
              to="/contact"
              className="px-8 py-4 bg-[#3B2F2F] text-[#FAF9F6] text-lg font-bold rounded hover:bg-[#2a2222] transition-colors flex items-center justify-center space-x-2"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              <span>Get a Free Quote</span>
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ServiceAreaPage;
