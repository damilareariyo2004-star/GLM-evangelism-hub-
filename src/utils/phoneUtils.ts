/**
 * Utilities for cleaning phone numbers, validation, duplicate checking,
 * and generating direct Call and WhatsApp links.
 */

/**
 * Strips non-digits, keeping leading plus if present
 */
export function sanitizePhoneNumber(phone: string): string {
  if (!phone) return '';
  const trimmed = phone.trim();
  const hasPlus = trimmed.startsWith('+');
  const digitsOnly = trimmed.replace(/\D/g, '');
  return hasPlus ? `+${digitsOnly}` : digitsOnly;
}

/**
 * Normalizes phone numbers to a common canonical digit string for duplicate checking
 * e.g., '0808 123 4567' and '+234 808 123 4567' and '2348081234567' map to the same digits
 */
export function normalizePhoneForComparison(phone: string): string {
  if (!phone) return '';
  let digits = phone.replace(/\D/g, '');
  // If Nigerian format starting with 0 and length 11 (e.g. 08081234567), normalize to 2348081234567
  if (digits.startsWith('0') && digits.length === 11) {
    digits = `234${digits.slice(1)}`;
  }
  return digits;
}

/**
 * Validates a phone number
 * Requires at least 7 digits (up to 15 digits according to ITU-T E.164)
 */
export function validatePhoneNumber(phone: string): { isValid: boolean; message?: string } {
  if (!phone || !phone.trim()) {
    return { isValid: false, message: 'Phone number is required.' };
  }
  const clean = sanitizePhoneNumber(phone);
  const digitsOnly = clean.replace(/\D/g, '');

  if (digitsOnly.length < 7) {
    return { isValid: false, message: 'Phone number is too short (minimum 7 digits).' };
  }

  if (digitsOnly.length > 16) {
    return { isValid: false, message: 'Phone number is too long (maximum 16 digits).' };
  }

  // Check valid characters (+ and digits)
  if (!/^\+?[0-9\s\-().]+$/.test(phone.trim())) {
    return { isValid: false, message: 'Phone number contains invalid characters.' };
  }

  return { isValid: true };
}

/**
 * Formats a phone number for direct tel: links
 */
export function getTelLink(phone: string): string {
  const sanitized = sanitizePhoneNumber(phone);
  return sanitized ? `tel:${sanitized}` : '#';
}

/**
 * Converts Nigerian numbers to international format (0808... becomes 234808...)
 * and builds a WhatsApp click-to-chat URL with pre-filled greeting.
 */
export function formatWhatsAppNumber(phone: string): string {
  if (!phone) return '';
  let cleanDigits = phone.replace(/\D/g, '');

  // If Nigerian 11-digit local format starting with 0 (e.g. 08081234567, 0803..., 090..., 070...)
  if (cleanDigits.startsWith('0') && cleanDigits.length === 11) {
    cleanDigits = `234${cleanDigits.slice(1)}`;
  } else if (cleanDigits.startsWith('234') && cleanDigits.length === 13) {
    // Already in 234 format
    cleanDigits = cleanDigits;
  }

  return cleanDigits;
}

/**
 * Builds the official Gospel Labour Ministry follow-up message:
 * “Hello [Person’s Name], This is [Evangelist’s Name] from Gospel Labour Ministry. We met during evangelism today and I was really blessed to meet you. I would love to follow you up and keep in touch with you. Hope you are doing great. God bless you!”
 */
export function getFollowUpMessage(contactName?: string, evangelistName?: string): string {
  const contact = contactName && contactName.trim() ? contactName.trim() : 'Friend';
  const evangelist = evangelistName && evangelistName.trim() ? evangelistName.trim() : 'an Evangelist';
  return `Hello ${contact}, This is ${evangelist} from Gospel Labour Ministry. We met during evangelism today and I was really blessed to meet you. I would love to follow you up and keep in touch with you. Hope you are doing great. God bless you!`;
}

/**
 * Builds an official Gospel Labour Ministry program invitation message for WhatsApp
 */
export function getProgramInvitationMessage(
  program: string,
  contactName?: string,
  evangelistName?: string
): string {
  const contact = contactName && contactName.trim() ? contactName.trim() : 'Friend';
  const evangelist = evangelistName && evangelistName.trim() ? evangelistName.trim() : 'an Evangelist';
  return `Hello ${contact}, good day. I am ${evangelist} from Gospel Labour Ministry. We warmly invite you to join us for ${program}. We would love to fellowship with you! God bless you.`;
}

/**
 * Builds the complete WhatsApp click-to-chat URL with dynamic Evangelist name and Contact name
 * for Action A: WhatsApp — Send Message
 */
export function getWhatsAppLink(phone: string, contactName?: string, evangelistName?: string): string {
  const cleanDigits = formatWhatsAppNumber(phone);
  if (!cleanDigits) return '#';

  const message = encodeURIComponent(getFollowUpMessage(contactName, evangelistName));
  return `https://wa.me/${cleanDigits}?text=${message}`;
}

/**
 * Builds the direct WhatsApp DM URL (without prefilled text) for Action B:
 * Opening the person's DM to manually attach a sermon document (📎 -> Document)
 */
export function getDirectWhatsAppDmUrl(phone: string): string {
  const cleanDigits = formatWhatsAppNumber(phone);
  if (!cleanDigits) return '#';
  return `https://wa.me/${cleanDigits}`;
}

/**
 * Builds a WhatsApp click-to-chat URL for inviting a contact to a specific church program
 */
export function getProgramWhatsAppLink(
  phone: string,
  program: string,
  contactName?: string,
  evangelistName?: string
): string {
  const cleanDigits = formatWhatsAppNumber(phone);
  if (!cleanDigits) return '#';

  const message = encodeURIComponent(getProgramInvitationMessage(program, contactName, evangelistName));
  return `https://wa.me/${cleanDigits}?text=${message}`;
}
