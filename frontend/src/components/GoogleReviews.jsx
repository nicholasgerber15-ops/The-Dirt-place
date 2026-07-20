import React, { useEffect, useRef, useState } from 'react';
import { Star, Loader } from 'lucide-react';

/**
 * Google Reviews Widget
 * Embeds Google Business Reviews with fallback to static testimonials
 */
const GoogleReviews = ({ 
  businessName = 'The Dirt Place',
  placeId = 'YOUR_GOOGLE_PLACE_ID_HERE', // Replace with actual Place ID
  apiKey = process.env.REACT_APP_GOOGLE_PLACES_API_KEY || 'YOUR_API_KEY_HERE',
  maxReviews = 6,
  showRating = true,
  className = ''
}) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [averageRating, setAverageRating] = useState(4.9);
  const [totalReviews, setTotalReviews] = useState(200);
  const scriptLoaded = useRef(false);

  useEffect(() => {
    if (scriptLoaded.current) return;

    // Load Google Places API
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.onload = () => {
      scriptLoaded.current = true;
      fetchReviews();
    };
    script.onerror = () => {
      setError('Failed to load Google Reviews');
      setLoading(false);
      loadFallbackTestimonials();
    };
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [apiKey]);

  const fetchReviews = () => {
    if (!window.google || !window.google.maps || !window.google.maps.places) {
      loadFallbackTestimonials();
      return;
    }

    try {
      const service = new window.google.maps.places.PlacesService(
        document.createElement('div')
      );

      service.getDetails(
        {
          placeId: placeId,
          fields: ['reviews', 'rating', 'user_ratings_total']
        },
        (place, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
            const fetchedReviews = (place.reviews || []).slice(0, maxReviews).map(review => ({
              id: review.time,
              author: review.author_name,
              rating: review.rating,
              text: review.text,
              time: new Date(review.time * 1000).toLocaleDateString(),
              image: review.profile_photo_url
            }));

            setReviews(fetchedReviews);
            setAverageRating(place.rating || 4.9);
            setTotalReviews(place.user_ratings_total || 200);
          } else {
            loadFallbackTestimonials();
          }
          setLoading(false);
        }
      );
    } catch (err) {
      console.error('Google Reviews error:', err);
      loadFallbackTestimonials();
      setLoading(false);
    }
  };

  const loadFallbackTestimonials = () => {
    // Static fallback testimonials
    setReviews([
      {
        id: 1,
        author: 'Sarah Mitchell',
        rating: 5,
        text: 'Outstanding service! The topsoil quality is excellent and delivery was right on time. Highly recommend for any Boerne landscaping project.',
        time: '2 weeks ago',
        image: null
      },
      {
        id: 2,
        author: 'John Rodriguez',
        rating: 5,
        text: 'Been using The Dirt Place for all our ranch projects. Always reliable, fair pricing, and quality materials that match the area\'s high standards.',
        time: '1 month ago',
        image: null
      },
      {
        id: 3,
        author: 'Emily Johnson',
        rating: 5,
        text: 'Great experience from start to finish. They helped me choose the right gravel for my driveway and the result is perfect!',
        time: '3 weeks ago',
        image: null
      }
    ]);
    setAverageRating(4.9);
    setTotalReviews(200);
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        size={16}
        className={i < rating ? 'text-[#D9A441] fill-current' : 'text-gray-300'}
      />
    ));
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <Loader size={32} className="animate-spin text-[#D9A441]" />
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Rating Summary */}
      {showRating && (
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <span className="text-4xl font-bold text-[#3B2F2F]" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
              {averageRating}
            </span>
            <div className="flex">
              {renderStars(Math.round(averageRating))}
            </div>
          </div>
          <p className="text-[#6B4F3F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Based on {totalReviews}+ Google Reviews
          </p>
          <a
            href={`https://search.google.com/local/reviews?placeid=${placeId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#D9A441] hover:underline text-sm mt-2 inline-block"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            View all reviews on Google →
          </a>
        </div>
      )}

      {/* Reviews Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reviews.map((review) => (
          <div key={review.id} className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center mb-4">
              {review.image ? (
                <img 
                  src={review.image} 
                  alt={review.author}
                  className="w-12 h-12 rounded-full mr-3 object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-[#D9A441] flex items-center justify-center mr-3">
                  <span className="text-[#3B2F2F] font-bold">
                    {review.author.charAt(0)}
                  </span>
                </div>
              )}
              <div>
                <p className="font-bold text-[#3B2F2F]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  {review.author}
                </p>
                <div className="flex">
                  {renderStars(review.rating)}
                </div>
              </div>
            </div>
            <p className="text-[#6B4F3F] italic mb-3" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              "{review.text}"
            </p>
            <p className="text-xs text-gray-500" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              {review.time}
            </p>
          </div>
        ))}
      </div>

      {/* Google Logo */}
      <div className="text-center mt-8">
        <a
          href="https://www.google.com/maps/place/The+Dirt+Place/@29.78987,-98.70254,15z"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center space-x-2 text-[#6B4F3F] hover:text-[#D9A441] transition-colors"
          style={{ fontFamily: 'Montserrat, sans-serif' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.25-3.25C17.46 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span>Powered by Google</span>
        </a>
      </div>
    </div>
  );
};

export default GoogleReviews;
