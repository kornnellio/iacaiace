'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { trackPageView } from '@/lib/google-ads';

// Hook to automatically track page views on navigation
export const useGoogleAds = () => {
  const pathname = usePathname();

  useEffect(() => {
    // Track page view on route change
    const url = window.location.origin + pathname;
    trackPageView(url);
  }, [pathname]);
};

// Hook for manual event tracking
export const useTrackEvent = () => {
  return {
    trackConversion: (conversionId: string, conversionLabel?: string, value?: number, currency?: string) => {
      import('@/lib/google-ads').then(({ trackConversion }) => {
        trackConversion(conversionId, conversionLabel, value, currency);
      });
    },
    trackPurchase: (transactionId: string, value: number, currency?: string, items?: any[]) => {
      import('@/lib/google-ads').then(({ trackPurchase }) => {
        trackPurchase(transactionId, value, currency, items);
      });
    },
    trackContact: () => {
      import('@/lib/google-ads').then(({ trackContact }) => {
        trackContact();
      });
    },
    trackAddToCart: (itemId: string, itemName: string, value: number, currency?: string) => {
      import('@/lib/google-ads').then(({ trackAddToCart }) => {
        trackAddToCart(itemId, itemName, value, currency);
      });
    },
  };
}; 