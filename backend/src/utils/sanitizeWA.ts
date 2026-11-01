// Sanitasi nomor WhatsApp ke format 62xx (aturan PRD)
// Input: 08xx / 8xx / +62xx / 62xx (spasi, tanda hubung, titik dibuang)
// Output: selalu 62xx
export function sanitizeWA(input: string): string {
  let digits = String(input ?? "").replace(/[^\d]/g, "");

  if (digits.startsWith("62")) {
    // sudah benar
  } else if (digits.startsWith("0")) {
    digits = "62" + digits.slice(1);
  } else if (digits.startsWith("8")) {
    digits = "62" + digits;
  }

  return digits;
}

// Validasi: 62 diikuti 8–13 digit
export function isValidWA(sanitized: string): boolean {
  return /^62\d{8,13}$/.test(sanitized);
}
