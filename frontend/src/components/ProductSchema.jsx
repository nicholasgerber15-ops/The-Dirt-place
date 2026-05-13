import React from 'react';

/**
 * Product Schema Markup Component
 * Adds JSON-LD structured data for products to help with SEO and rich snippets
 */
const ProductSchema = ({ product, baseUrl = 'https://theboernedirtplace.com' }) => {
  if (!product) return null;

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.image || `${baseUrl}/images/${product.name.toLowerCase().replace(/\s+/g, '-')}.jpg`,
    sku: `TDP-${product.id}`,
    mpn: `TDP-${product.id}`,
    brand: {
      '@type': 'Brand',
      name: 'The Dirt Place'
    },
    manufacturer: {
      '@type': 'Organization',
      name: 'The Dirt Place',
      address: {
        '@type': 'PostalAddress',
        streetAddress: '240 TX-46',
        addressLocality: 'Boerne',
        addressRegion: 'TX',
        postalCode: '78006',        addressCountry: 'US'
      }
    },
    category: product.category || 'Landscape Materials',
    offers: {
      '@type': 'Offer',
      url: `${baseUrl}/materials`,
      priceCurrency: 'USD',
      price: product.pricePerCubicYard || product.price_per_unit || 0,
      priceValidUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      itemCondition: 'https://schema.org/NewCondition',
      availability: product.in_stock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'The Dirt Place'
      },
      eligibleRegion: {
        '@type': 'GeoCircle',
        geoMidpoint: {
          '@type': 'GeoCoordinates',
          latitude: 29.789870,
          longitude: -98.702540
        },
        geoRadius: '50000' // 50km radius
      }
    }
  };

  // Add aggregateRating if available
  if (product.aggregateRating) {
    productSchema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: product.aggregateRating.ratingValue || '4.9',
      reviewCount: product.aggregateRating.reviewCount || '200'
    };
  }

  // Add review if available
  if (product.review) {
    productSchema.review = {
      '@type': 'Review',
      reviewRating: {
        '@type': 'Rating',
        ratingValue: product.review.ratingValue || '5'
      },
      author: {
        '@type': 'Person',
        name: product.review.author || 'Verified Customer'
      },
      reviewBody: product.review.body || ''
    };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
    />
  );
};

export default ProductSchema;
