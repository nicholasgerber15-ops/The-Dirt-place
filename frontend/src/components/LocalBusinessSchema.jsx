import React from 'react';
import { Helmet } from 'react-helmet-async';

const LocalBusinessSchema = () => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "The Dirt Place",
    "image": "https://customer-assets.emergentagent.com/job_earth-supply-1/artifacts/pl8t7hjh_Final%20logo.png",
    "description": "Premium landscape materials supplier in Boerne, Texas. Providing dirt, gravel, sand, mulch, and decorative rock for the Texas Hill Country.",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "240 TX-46",
      "addressLocality": "Boerne",
      "addressRegion": "TX",
      "postalCode": "78006",
      "addressCountry": "US"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 29.789870,
      "longitude": -98.702540
    },
    "url": "https://earth-supply-1.preview.emergentagent.com",
    "telephone": "(830) 555-0198",
    "email": "info@thedirtplace.com",
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "opens": "08:00",
        "closes": "17:00"
      },
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": "Saturday",
        "opens": "08:00",
        "closes": "15:00"
      }
    ],
    "priceRange": "$$",
    "areaServed": {
      "@type": "GeoCircle",
      "geoMidpoint": {
        "@type": "GeoCoordinates",
        "latitude": 29.789870,
        "longitude": -98.702540
      },
      "geoRadius": "50000"
    },
    "makesOffer": [
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Product",
          "name": "Topsoil"
        }
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Product",
          "name": "Gravel"
        }
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Product",
          "name": "Sand"
        }
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Product",
          "name": "Road Base"
        }
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Product",
          "name": "Mulch"
        }
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Product",
          "name": "Decorative Rock"
        }
      }
    ]
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
};

export default LocalBusinessSchema;
