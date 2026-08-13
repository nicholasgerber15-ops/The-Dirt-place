import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

const Gallery = () => {
  const [selectedImage, setSelectedImage] = useState(null);

  const galleryImages = [
    {
      id: 1,
      url: 'https://cdn.theboernedirtplace.com/images/IMG_0483.jpg',
      title: 'Decorative Rock Installation',
      category: 'Landscaping'
    },
    {
      id: 2,
      url: 'https://cdn.theboernedirtplace.com/images/IMG_0477.jpg',
      title: 'Gravel Driveway',
      category: 'Driveways'
    },
    {
      id: 3,
      url: 'https://cdn.theboernedirtplace.com/images/IMG_0476.jpg',
      title: 'Garden Topsoil',
      category: 'Gardens'
    },
    {
      id: 4,
      url: 'https://cdn.theboernedirtplace.com/images/IMG_0482.jpg',
      title: 'Mulch Landscape Bed',
      category: 'Landscaping'
    },
    {
      id: 5,
      url: 'https://cdn.theboernedirtplace.com/images/IMG_0484.jpg',
      title: 'Stone Pathway',
      category: 'Pathways'
    },
    {
      id: 6,
      url: 'https://cdn.theboernedirtplace.com/images/IMG_0489.jpg',
      title: 'Material Delivery',
      category: 'Delivery'
    }
  ];

  const openLightbox = (image) => {
    setSelectedImage(image);
  };

  const closeLightbox = () => {
    setSelectedImage(null);
  };

  const nextImage = () => {
    const currentIndex = galleryImages.findIndex(img => img.id === selectedImage.id);
    const nextIndex = (currentIndex + 1) % galleryImages.length;
    setSelectedImage(galleryImages[nextIndex]);
  };

  const prevImage = () => {
    const currentIndex = galleryImages.findIndex(img => img.id === selectedImage.id);
    const prevIndex = (currentIndex - 1 + galleryImages.length) % galleryImages.length;
    setSelectedImage(galleryImages[prevIndex]);
  };

  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16 scroll-animate">
          <h2 
            className="text-5xl md:text-6xl font-bold text-[#3B2F2F] mb-4"
            style={{ fontFamily: 'Bebas Neue, sans-serif' }}
          >
            Project Gallery
          </h2>
          <div className="w-24 h-1 bg-[#D9A441] mx-auto mb-6"></div>
          <p 
            className="text-lg text-[#6B4F3F] max-w-2xl mx-auto"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            See our premium materials in action across the Texas Hill Country
          </p>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {galleryImages.map((image, index) => (
            <div
              key={image.id}
              className="scroll-animate group relative overflow-hidden rounded-lg shadow-lg cursor-pointer transform hover:scale-105 transition-all duration-500"
              style={{ animationDelay: `${index * 100}ms` }}
              onClick={() => openLightbox(image)}
            >
              <div className="aspect-w-4 aspect-h-3 relative h-80">
                <img
                  src={image.url}
                  alt={image.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#3B2F2F]/80 via-[#3B2F2F]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <span 
                    className="inline-block px-3 py-1 bg-[#D9A441] text-[#3B2F2F] text-xs font-bold rounded-full mb-2"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    {image.category}
                  </span>
                  <h3 
                    className="text-white text-xl font-bold"
                    style={{ fontFamily: 'Bebas Neue, sans-serif' }}
                  >
                    {image.title}
                  </h3>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Lightbox */}
        {selectedImage && (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 animate-fade-in">
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 text-white hover:text-[#D9A441] transition-colors duration-300"
            >
              <X size={32} />
            </button>
            
            <button
              onClick={prevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-[#D9A441] transition-colors duration-300 p-2 bg-[#3B2F2F]/50 rounded-full"
            >
              <ChevronLeft size={32} />
            </button>
            
            <div className="max-w-5xl w-full">
              <img
                src={selectedImage.url}
                alt={selectedImage.title}
                className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
              />
              <div className="text-center mt-6">
                <h3 
                  className="text-3xl font-bold text-white mb-2"
                  style={{ fontFamily: 'Bebas Neue, sans-serif' }}
                >
                  {selectedImage.title}
                </h3>
                <p 
                  className="text-[#D9A441]"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  {selectedImage.category}
                </p>
              </div>
            </div>
            
            <button
              onClick={nextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-[#D9A441] transition-colors duration-300 p-2 bg-[#3B2F2F]/50 rounded-full"
            >
              <ChevronRight size={32} />
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default Gallery;
