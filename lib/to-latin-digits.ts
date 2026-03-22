/** Eastern Arabic (٠١٢…) and Persian (۰۱۲…) digits → Western 0–9 */
export function toLatinDigits(input: string): string {
  const eastern = "٠١٢٣٤٥٦٧٨٩";
  const persian = "۰۱۲۳۴۵۶۷۸۹";
  let s = input;
  for (let i = 0; i < 10; i++) {
    const re = new RegExp(`[${eastern[i]}${persian[i]}]`, "g");
    s = s.replace(re, String(i));
  }
  return s;
}
