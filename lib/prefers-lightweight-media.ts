/**
 * Prefer static images over large background videos (cellular / Save-Data).
 * Uses User-Agent + optional Save-Data header from the incoming request.
 */
export function prefersLightweightMedia(
  userAgent: string | null | undefined,
  saveData: string | null | undefined,
): boolean {
  if (saveData?.trim() === "on") return true;
  const ua = userAgent ?? "";
  // Typical phone UA patterns (tablets often report as desktop Safari — omitted on purpose)
  return /Mobile|Android|iPhone|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua);
}
