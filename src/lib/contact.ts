/**
 * Where "get in touch" points. Set NEXT_PUBLIC_BOOKING_URL to a scheduling page;
 * without it the links fall back to email, so a fork or a fresh deployment never
 * ships a dead CTA.
 */
export const CONTACT_EMAIL = 'jeff@provenanceadvisorsllc.com';
export const BOOKING_URL = process.env.NEXT_PUBLIC_BOOKING_URL || `mailto:${CONTACT_EMAIL}`;
