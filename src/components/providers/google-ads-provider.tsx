'use client';

import { useGoogleAds } from '@/hooks/useGoogleAds';

interface GoogleAdsProviderProps {
  children: React.ReactNode;
}

export function GoogleAdsProvider({ children }: GoogleAdsProviderProps) {
  // This hook will automatically track page views on navigation
  useGoogleAds();

  return <>{children}</>;
} 