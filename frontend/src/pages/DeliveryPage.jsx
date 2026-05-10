import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Truck, Phone } from 'lucide-react';
import SEO from '../components/SEO';

const DeliveryPage = () => {
  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      <SEO
        title="Delivery | The Dirt Place"
        description="We deliver premium landscape materials across the Texas Hill Country"
        url="https://earth-supply-1.preview.emergentagent.com/delivery"
      />

      <section className="relative py-32 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
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
            <h1
              className="text-6xl md:text-7xl lg:text-8xl font-bold text-[#FAF9F6] mb-6"
              style={{ fontFamily: 'Bebas Neue, sans-serif' }}
            >
              We Deliver
            </h1>
            <div className="w-32 h-1 bg-[#D9A441] mx-auto mb-8"></div>
            <p
              className="text-xl text-[#FAF9F6] leading-relaxed"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Premium landscape materials delivered across the Texas Hill Country.
            </p>
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="w-20 h-20 bg-[#D9A441] rounded-full flex items-center justify-center mx-auto mb-8">
              <Truck size={40} className="text-[#3B2F2F]" />
            </div>
            <h2 className="text-4xl font-bold text-[#3B2F2F] mb-6" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
              We Deliver to You
            </h2>
            <p className="text-lg text-[#6B4F3F] mb-8 leading-relaxed" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              We deliver premium landscape materials to Boerne, Fair Oaks Ranch, Comfort, 
              Leon Springs, and across the Texas Hill Country. Add materials to your cart 
              and use the delivery toggle to calculate your delivery fee.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/materials"
                className="px-8 py-4 bg-[#D9A441] text-[#3B2F2F] text-lg font-bold rounded hover:bg-[#3B2F2F] hover:text-[#FAF9F6] transition-all duration-300"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                Browse Materials
              </Link>
              <a
                href="tel:(830) 555-0198"
                className="inline-flex items-center justify-center space-x-2 px-8 py-4 bg-transparent border-2 border-[#3B2F2F] text-[#3B2F2F] text-lg font-bold rounded hover:bg-[#3B2F2F] hover:text-[#FAF9F6] transition-all duration-300"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                <Phone size={20} />
                <span>(830) 555-0198</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DeliveryPage;
