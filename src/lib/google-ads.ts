// Google Ads tracking utilities

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

// Track a conversion event
export const trackConversion = (conversionId: string, conversionLabel?: string, value?: number, currency: string = 'RON') => {
  if (typeof window !== 'undefined' && window.gtag) {
    const conversionData: any = {
      send_to: conversionId,
    };

    if (conversionLabel) {
      conversionData.send_to = `${conversionId}/${conversionLabel}`;
    }

    if (value !== undefined) {
      conversionData.value = value;
      conversionData.currency = currency;
    }

    window.gtag('event', 'conversion', conversionData);
  }
};

// Track a custom event
export const trackEvent = (eventName: string, parameters?: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, {
      event_category: 'engagement',
      ...parameters,
    });
  }
};

// Track a purchase conversion
export const trackPurchase = (transactionId: string, value: number, currency: string = 'RON', items?: any[]) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'purchase', {
      transaction_id: transactionId,
      value: value,
      currency: currency,
      items: items,
    });

    // Also track as a conversion
    trackConversion('AW-16886522730', undefined, value, currency);
  }
};

// Track page view (for SPA navigation)
export const trackPageView = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', 'AW-16886522730', {
      page_location: url,
    });
  }
};

// Track contact form submission
export const trackContact = () => {
  trackEvent('contact_form_submit', {
    event_category: 'form',
    event_label: 'contact',
  });
};

// Track add to cart
export const trackAddToCart = (itemId: string, itemName: string, value: number, currency: string = 'RON') => {
  trackEvent('add_to_cart', {
    event_category: 'ecommerce',
    event_label: itemName,
    currency: currency,
    value: value,
    items: [{
      item_id: itemId,
      item_name: itemName,
      value: value,
    }],
  });
}; 