'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Cookie } from 'lucide-react';

export const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already accepted cookies
    const hasAcceptedCookies = localStorage.getItem('cookiesAccepted');
    if (!hasAcceptedCookies) {
      // Add a small delay before showing the popup
      setTimeout(() => setIsVisible(true), 1000);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookiesAccepted', 'true');
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('cookiesAccepted', 'false');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-fade-in">
      <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-sm p-4 max-w-[300px] border border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <Cookie size={16} className="text-primary" />
          <p className="text-sm font-medium">Folosim cookie-uri</p>
          <button
            onClick={() => setIsVisible(false)}
            className="ml-auto text-gray-400 hover:text-gray-600"
          >
            <X size={16} />
          </button>
        </div>
        <p className="text-xs text-gray-600 mb-3">
          Acest site folosește cookie-uri pentru a îmbunătăți experiența dumneavoastră.
        </p>
        <div className="flex gap-2">
          <Button
            onClick={handleAccept}
            size="sm"
            className="bg-primary/90 hover:bg-primary text-xs px-3"
          >
            Accept
          </Button>
          <Button
            onClick={handleDecline}
            size="sm"
            variant="outline"
            className="text-xs px-3"
          >
            Refuz
          </Button>
        </div>
      </div>
    </div>
  );
}; 