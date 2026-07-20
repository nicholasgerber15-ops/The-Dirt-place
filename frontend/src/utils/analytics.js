// Google Analytics 4 & Facebook Pixel Event Tracking Utility
export const GA_MEASUREMENT_ID = 'G-5K89G39NX7';
export const FB_PIXEL_ID = process.env.REACT_APP_FB_PIXEL_ID || 'YOUR_PIXEL_ID_HERE'; // Set REACT_APP_FB_PIXEL_ID in Render

// Track events to both GA4 and Facebook Pixel
export const trackEvent = (eventName, parameters = {}) => {
  // Google Analytics 4
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, parameters);
  }
  
  // Facebook Pixel
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', eventName, parameters);
  }
};

// Facebook Pixel specific events (for standard events)
export const trackFBPixel = (eventName, parameters = {}) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', eventName, parameters);
  }
};

// Predefined event trackers
export const trackContactFormSubmit = (formData) => {
  // GA4 event
  trackEvent('contact_form_submit', {
    form_type: formData.type || 'general',
    has_business_name: !!formData.business_name,
    has_estimated_volume: !!formData.estimated_volume,
    has_project_timeline: !!formData.project_timeline,
    material_interest: formData.material || 'none'
  });
  
  // Facebook Pixel standard event - Lead
  trackFBPixel('Lead', {
    content_name: 'Contact Form Submission',
    content_category: formData.type || 'general'
  });
};

export const trackCalculatorUse = (calculationData) => {
  // GA4 event
  trackEvent('calculator_use', {
    project_type: calculationData.project_type,
    material: calculationData.material,
    volume_cubic_yards: calculationData.volume_cubic_yards,
    recommended_amount: calculationData.recommended_amount
  });
  
  // Facebook Pixel custom event
  trackFBPixel('CalculatorUse', {
    project_type: calculationData.project_type,
    material: calculationData.material
  });
};

export const trackCalculatorEmailCapture = (email, projectType) => {
  trackEvent('calculator_email_capture', {
    project_type: projectType,
    user_email_domain: email.split('@')[1] || 'unknown'
  });
};

export const trackPhoneClick = (source = 'unknown') => {
  // GA4 event
  trackEvent('phone_click', {
    source: source,
    phone_number: '830-336-3713'
  });
  
  // Facebook Pixel standard event - Contact
  trackFBPixel('Contact', {
    content_name: 'Phone Call Click',
    content_category: source
  });
};

export const trackMaterialView = (materialName, materialId) => {
  trackEvent('view_item', {
    items: [{
      item_id: materialId,
      item_name: materialName,
      item_category: 'Landscape Material'
    }]
  });
};

export const trackBundleClick = (bundleName, bundleId) => {
  trackEvent('select_bundle', {
    bundle_name: bundleName,
    bundle_id: bundleId
  });
};

export const trackOrderStart = (orderData) => {
  // GA4 event
  trackEvent('begin_checkout', {
    currency: 'USD',
    value: orderData.total,
    items: [{
      item_id: orderData.material_id,
      item_name: orderData.material,
      quantity: orderData.quantity,
      price: orderData.price_per_unit
    }]
  });
  
  // Facebook Pixel standard event - InitiateCheckout
  trackFBPixel('InitiateCheckout', {
    content_name: orderData.material,
    currency: 'USD',
    value: orderData.total
  });
};

export const trackOrderComplete = (orderData) => {
  // GA4 event
  trackEvent('purchase', {
    transaction_id: orderData.order_number,
    currency: 'USD',
    value: orderData.total,
    items: [{
      item_id: orderData.material_id,
      item_name: orderData.material,
      quantity: orderData.quantity,
      price: orderData.price_per_unit
    }]
  });
  
  // Facebook Pixel standard event - Purchase
  trackFBPixel('Purchase', {
    content_name: orderData.material,
    currency: 'USD',
    value: orderData.total,
    content_type: 'product'
  });
};

export const trackContractorPortalAccess = () => {
  trackEvent('contractor_portal_access', {
    event_category: 'contractor'
  });
};

export const trackServiceAreaView = (areaName) => {
  trackEvent('service_area_view', {
    area_name: areaName
  });
};

export const trackPopupInteraction = (popupTitle, action) => {
  trackEvent('popup_interaction', {
    popup_title: popupTitle,
    action: action // 'view', 'click', 'dismiss'
  });
};
