import React from 'react';
import { Helmet } from 'react-helmet-async';

const LocalBusinessSchema = () => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "The Dirt Place",
    "image": "https://theboernedirtplace.com/images/dirtplace-logo.png",
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
    "url": "https://theboernedirtplace.com",
    "telephone": "(830) 336-3713",
    "email": "info@theboernedirtplace.com",
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
    }
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
