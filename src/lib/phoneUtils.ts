/**
 * Phone Number Formatting Utilities
 * Handles E.164 formatting and display formatting for US phone numbers
 */

/**
 * Format a phone number to E.164 format (+1XXXXXXXXXX)
 */
export function toE164(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }
  if (digits.startsWith('+')) {
    return phone.replace(/[^\d+]/g, '');
  }
  // Return as-is with + prefix if already long enough
  if (digits.length > 10) {
    return `+${digits}`;
  }
  return phone;
}

/**
 * Format a phone number for display: (212) 555-1234
 */
export function formatPhoneDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  
  // Handle +1XXXXXXXXXX or 1XXXXXXXXXX
  const nationalDigits = digits.length === 11 && digits.startsWith('1') 
    ? digits.slice(1) 
    : digits;
  
  if (nationalDigits.length === 10) {
    return `(${nationalDigits.slice(0, 3)}) ${nationalDigits.slice(3, 6)}-${nationalDigits.slice(6)}`;
  }
  
  // International or short numbers - return cleaned up
  if (digits.length > 10) {
    return `+${digits.slice(0, digits.length - 10)} (${digits.slice(-10, -7)}) ${digits.slice(-7, -4)}-${digits.slice(-4)}`;
  }
  
  return phone;
}

/**
 * Format with country code displayed: +1 (212) 555-1234
 */
export function formatPhoneWithCountry(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  
  const nationalDigits = digits.length === 11 && digits.startsWith('1')
    ? digits.slice(1)
    : digits;
  
  if (nationalDigits.length === 10) {
    return `+1 (${nationalDigits.slice(0, 3)}) ${nationalDigits.slice(3, 6)}-${nationalDigits.slice(6)}`;
  }
  
  return phone;
}

/**
 * Validate if a string looks like a valid US phone number
 */
export function isValidUSPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  return (digits.length === 10 || (digits.length === 11 && digits.startsWith('1')));
}
