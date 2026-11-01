// Sanitasi nomor WhatsApp ke format 62xx (aturan PRD)
// 08xx / 8xx / +62xx / 62xx → 62xx
export function sanitizeWhatsapp(input: string): string {
  let digits = input.replace(/[^\d]/g, ""); // buang +, spasi, -, dll.

  if (digits.startsWith("62")) {
    // sudah benar
  } else if (digits.startsWith("0")) {
    digits = "62" + digits.slice(1);
  } else if (digits.startsWith("8")) {
    digits = "62" + digits;
  }

  return digits;
}

// Validasi: 62 diikuti 8–13 digit (total 10–15 digit)
export function isValidWhatsapp(sanitized: string): boolean {
  return /^62\d{8,13}$/.test(sanitized);
}
