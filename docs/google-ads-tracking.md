# Google Ads Tracking Implementation

This document explains how Google Ads tracking has been implemented in the iaCaiace.ro application to track all pages and user interactions.

## Overview

The Google Ads tracking system has been implemented with the following components:

1. **Global Tracking Setup** - Automatically tracks all page views
2. **Conversion Tracking** - Track specific user actions and purchases
3. **Event Tracking** - Track custom events like form submissions, add to cart, etc.

## Implementation Details

### 1. Global Setup (`src/app/layout.tsx`)

The Google Ads (gtag.js) script is loaded globally in the root layout:

```javascript
// Google Ads tracking ID: AW-16886522730
<Script src="https://www.googletagmanager.com/gtag/js?id=AW-16886522730" />
```

### 2. Automatic Page View Tracking

**File**: `src/components/providers/google-ads-provider.tsx` & `src/hooks/useGoogleAds.ts`

All page views are automatically tracked when users navigate between pages. This includes:
- Initial page load
- Client-side navigation (Next.js router)
- All routes and subpages

### 3. Utility Functions (`src/lib/google-ads.ts`)

Available tracking functions:

#### `trackConversion(conversionId, conversionLabel?, value?, currency?)`
Track conversion events for Google Ads campaigns.

#### `trackPurchase(transactionId, value, currency?, items?)`
Track e-commerce purchases with detailed transaction data.

#### `trackEvent(eventName, parameters?)`
Track custom events for analysis.

#### `trackContact()`
Track contact form submissions.

#### `trackAddToCart(itemId, itemName, value, currency?)`
Track when users add items to cart.

#### `trackPageView(url)`
Manually track page views (automatically handled by the provider).

## Usage Examples

### Track a Purchase

```typescript
import { trackPurchase } from '@/lib/google-ads';

// In your checkout success component
const handlePurchaseComplete = (order: Order) => {
  trackPurchase(
    order.id,           // transaction ID
    order.total,        // total value
    'RON',             // currency
    order.items        // items array
  );
};
```

### Track Add to Cart

```typescript
import { useTrackEvent } from '@/hooks/useGoogleAds';

const ProductComponent = () => {
  const { trackAddToCart } = useTrackEvent();
  
  const handleAddToCart = (product: Product) => {
    trackAddToCart(
      product.id,
      product.name,
      product.price,
      'RON'
    );
  };
  
  return (
    <button onClick={() => handleAddToCart(product)}>
      Add to Cart
    </button>
  );
};
```

### Track Contact Form Submission

```typescript
import { useTrackEvent } from '@/hooks/useGoogleAds';

const ContactForm = () => {
  const { trackContact } = useTrackEvent();
  
  const handleSubmit = async (formData: FormData) => {
    // Submit form logic
    await submitContactForm(formData);
    
    // Track the conversion
    trackContact();
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
    </form>
  );
};
```

### Track Custom Conversion

```typescript
import { useTrackEvent } from '@/hooks/useGoogleAds';

const NewsletterSignup = () => {
  const { trackConversion } = useTrackEvent();
  
  const handleSignup = async (email: string) => {
    await subscribeToNewsletter(email);
    
    // Track newsletter signup conversion
    trackConversion('AW-16886522730', 'newsletter_signup');
  };
  
  return (
    <button onClick={() => handleSignup(email)}>
      Subscribe
    </button>
  );
};
```

## What's Being Tracked

### Automatically Tracked:
- ✅ All page views (including SPA navigation)
- ✅ Initial page loads
- ✅ Route changes

### Ready to Track (implement in components):
- 🔧 Purchase completions
- 🔧 Add to cart events
- 🔧 Contact form submissions
- 🔧 Newsletter signups
- 🔧 Custom conversion events

## Files Modified/Created

1. **`src/app/layout.tsx`** - Added Google Ads script and GoogleAdsProvider
2. **`src/lib/google-ads.ts`** - Core tracking utilities (NEW)
3. **`src/hooks/useGoogleAds.ts`** - React hooks for tracking (NEW)
4. **`src/components/providers/google-ads-provider.tsx`** - Auto-tracking provider (NEW)

## Configuration

- **Google Ads ID**: `AW-16886522730`
- **Default Currency**: `RON` (Romanian Leu)
- **Tracking Strategy**: `afterInteractive` (optimal performance)

## Privacy & GDPR Compliance

The tracking respects the existing `CookieConsent` component. Consider:
- Only tracking after user consent
- Providing opt-out options
- Following GDPR guidelines for data collection

## Testing

To verify tracking is working:

1. Open Chrome DevTools
2. Go to Network tab
3. Filter by "google"
4. Navigate between pages and perform actions
5. Look for requests to `www.googletagmanager.com`

Or use Google Tag Assistant browser extension for detailed debugging.

## Next Steps

1. **Implement tracking calls** in your specific components (cart, checkout, contact forms)
2. **Set up Google Ads conversion goals** in your Google Ads account
3. **Configure enhanced e-commerce** if needed for detailed product tracking
4. **Set up custom audiences** based on tracked events
5. **Monitor and optimize** campaigns based on tracking data

## Support

For questions about implementation or tracking setup, refer to:
- [Google Ads Help Center](https://support.google.com/google-ads)
- [Google Tag Manager Documentation](https://developers.google.com/tag-manager)
- This implementation documentation 