/**
 * This file contains access control configuration for the admin control panel
 */

// List of email addresses that have access to the control panel
// Add or remove email addresses as needed
export const AUTHORIZED_ADMIN_EMAILS = [
  "andrei@ciocoiu.net",
  "office@iacaiace.ro",
  "filip.ilinca14@gmail.com"
  // Add more authorized emails here
];

/**
 * Check if a given email has admin access to the control panel
 * @param email The email address to check
 * @returns boolean indicating if the email has access
 */
export function hasControlPanelAccess(email: string | null | undefined): boolean {
  if (!email) return false;
  
  // Convert to lowercase for case-insensitive comparison
  const normalizedEmail = email.toLowerCase();
  
  return AUTHORIZED_ADMIN_EMAILS.some(
    adminEmail => adminEmail.toLowerCase() === normalizedEmail
  );
} 