/**
 * Utility functions for normalizing and formatting Thai telephone numbers
 * Handles landlines (Bangkok 02-xxx-xxxx, Provincial 0xx-xxx-xxx),
 * mobile phones (0xx-xxx-xxxx), internal extensions (ต่อ 123),
 * and restores missing leading zeroes caused by Excel integer parsing or user typos.
 */

export function normalizeThaiPhoneNumber(phoneInput?: string | number | null): string {
  if (phoneInput === undefined || phoneInput === null) return '';
  const rawStr = String(phoneInput).trim();
  if (!rawStr || rawStr === '-') return '';

  // 1. Extract internal extension if present
  // Matches: "ต่อ 123", "ext 123", "ext. 123", "#123", "/ 123"
  let baseStr = rawStr;
  let extension = '';

  const extMatch = rawStr.match(/[\s,/]*(?:ต่อ|ext\.?|x|#|\/)\s*([0-9]+)/i);
  if (extMatch) {
    extension = extMatch[1];
    baseStr = rawStr.substring(0, extMatch.index).trim();
  }

  // 2. Extract digits only from base phone
  let digits = baseStr.replace(/\D/g, '');

  // If phone was empty or only non-digits
  if (!digits) {
    return extension ? `ต่อ ${extension}` : rawStr;
  }

  // 3. Handle international country code for Thailand (+66 or 66)
  if (digits.startsWith('66') && digits.length >= 10) {
    digits = '0' + digits.slice(2);
  }

  // 4. Restore missing leading '0'
  // 8 digits:
  // - Starts with 2: Bangkok landline (02-xxx-xxxx missing leading 0, e.g. 22520161 -> 022520161)
  // - Starts with 3, 4, 5, 7: Provincial landline (0xx-xxx-xxx missing leading 0)
  if (digits.length === 8) {
    if (['2', '3', '4', '5', '7'].includes(digits[0])) {
      digits = '0' + digits;
    }
  } else if (digits.length === 9) {
    // 9 digits:
    // - Starts with 8, 9, 6: Thai mobile number (08x, 09x, 06x missing leading 0, e.g. 812345678 -> 0812345678)
    if (['8', '9', '6'].includes(digits[0])) {
      digits = '0' + digits;
    }
  }

  if (extension) {
    return `${digits} ต่อ ${extension}`;
  }

  return digits;
}

export function formatThaiPhone(phoneInput?: string | number | null, fallback: string = '-'): string {
  if (phoneInput === undefined || phoneInput === null) return fallback;
  const rawStr = String(phoneInput).trim();
  if (!rawStr || rawStr === '-') return fallback;

  // 1. Separate extension
  let baseStr = rawStr;
  let extension = '';

  const extMatch = rawStr.match(/[\s,/]*(?:ต่อ|ext\.?|x|#|\/)\s*([0-9]+)/i);
  if (extMatch) {
    extension = extMatch[1];
    baseStr = rawStr.substring(0, extMatch.index).trim();
  }

  // Normalize base digits
  let digits = baseStr.replace(/\D/g, '');

  if (!digits) {
    return extension ? `ต่อ ${extension}` : rawStr || fallback;
  }

  if (digits.startsWith('66') && digits.length >= 10) {
    digits = '0' + digits.slice(2);
  }

  // Restore missing leading zero
  if (digits.length === 8 && ['2', '3', '4', '5', '7'].includes(digits[0])) {
    digits = '0' + digits;
  } else if (digits.length === 9 && ['8', '9', '6'].includes(digits[0])) {
    digits = '0' + digits;
  }

  let formatted = digits;

  // Format 9-digit landlines
  if (digits.length === 9) {
    if (digits.startsWith('02')) {
      // Bangkok landline: 02-xxx-xxxx
      formatted = `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`;
    } else if (digits.startsWith('0')) {
      // Provincial landline: 0xx-xxx-xxx (e.g. 038-123-456)
      formatted = `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
  } else if (digits.length === 10 && digits.startsWith('0')) {
    // 10-digit mobile or fixed: 0xx-xxx-xxxx
    formatted = `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  } else if (digits.length === 4) {
    // 4-digit internal extension: e.g. 2016
    formatted = `เบอร์ภายใน ${digits}`;
  }

  if (extension) {
    return `${formatted} ต่อ ${extension}`;
  }

  return formatted;
}
