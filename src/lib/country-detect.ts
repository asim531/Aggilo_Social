/**
 * Country detection — non-blocking, privacy-light.
 *
 * Strategy:
 * 1. Try ipapi.co (HTTPS, no key, ~1000 req/day free) — gives country code.
 * 2. Fall back to browser geolocation if user permits.
 * 3. If both fail, return null and let the user pick manually.
 *
 * We never store the IP, only the resulting country code.
 */

export const SOUTH_SE_ASIA_COUNTRIES = [
  "India", "Pakistan", "Bangladesh", "Sri Lanka", "Nepal", "Bhutan", "Maldives",
  "Indonesia", "Malaysia", "Philippines", "Thailand", "Vietnam", "Myanmar",
  "Cambodia", "Laos", "Singapore", "Brunei", "Timor-Leste",
];

const ISO_TO_NAME: Record<string, string> = {
  IN: "India",
  PK: "Pakistan",
  BD: "Bangladesh",
  LK: "Sri Lanka",
  NP: "Nepal",
  BT: "Bhutan",
  MV: "Maldives",
  ID: "Indonesia",
  MY: "Malaysia",
  PH: "Philippines",
  TH: "Thailand",
  VN: "Vietnam",
  MM: "Myanmar",
  KH: "Cambodia",
  LA: "Laos",
  SG: "Singapore",
  BN: "Brunei",
  TL: "Timor-Leste",
  US: "United States",
  GB: "United Kingdom",
  CA: "Canada",
  AU: "Australia",
  AE: "United Arab Emirates",
  SA: "Saudi Arabia",
  EG: "Egypt",
  TR: "Turkey",
  DE: "Germany",
  FR: "France",
  IT: "Italy",
  ES: "Spain",
  NL: "Netherlands",
  SE: "Sweden",
  NO: "Norway",
  FI: "Finland",
  DK: "Denmark",
  BE: "Belgium",
  CH: "Switzerland",
  AT: "Austria",
  PL: "Poland",
  PT: "Portugal",
  IE: "Ireland",
  NZ: "New Zealand",
  ZA: "South Africa",
  NG: "Nigeria",
  KE: "Kenya",
  ET: "Ethiopia",
  GH: "Ghana",
  MA: "Morocco",
  TN: "Tunisia",
  DZ: "Algeria",
  LY: "Libya",
  SD: "Sudan",
  SO: "Somalia",
  YE: "Yemen",
  IQ: "Iraq",
  IR: "Iran",
  SY: "Syria",
  LB: "Lebanon",
  JO: "Jordan",
  PS: "Palestine",
  IL: "Israel",
  KW: "Kuwait",
  QA: "Qatar",
  BH: "Bahrain",
  OM: "Oman",
  AF: "Afghanistan",
  KZ: "Kazakhstan",
  UZ: "Uzbekistan",
  KG: "Kyrgyzstan",
  TJ: "Tajikistan",
  TM: "Turkmenistan",
  CN: "China",
  JP: "Japan",
  KR: "South Korea",
  RU: "Russia",
  BR: "Brazil",
  MX: "Mexico",
  CO: "Colombia",
  AR: "Argentina",
};

export async function detectCountryFromIp(): Promise<string | null> {
  try {
    const res = await fetch("https://ipapi.co/json/", {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const code = (data?.country_code || "").toUpperCase();
    return ISO_TO_NAME[code] || null;
  } catch {
    return null;
  }
}

export function detectCountryFromGeolocation(): Promise<string | null> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      // No browser geolocation API at all — fall back to IP-based country
      detectCountryFromIp().then(resolve);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          // Reverse-geocode (Nominatim, no key, polite usage)
          const r = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&zoom=3`,
            { headers: { "Accept-Language": "en" }, signal: AbortSignal.timeout(4000) }
          );
          const data = await r.json();
          const code = (data?.address?.country_code || "").toUpperCase();
          const country = ISO_TO_NAME[code] || data?.address?.country || null;
          if (country) {
            resolve(country);
            return;
          }
          // Reverse-geocode succeeded but returned no country — try IP fallback
          const ipFallback = await detectCountryFromIp();
          resolve(ipFallback);
        } catch {
          // Reverse-geocode failed — fall back to IP detection
          const ipFallback = await detectCountryFromIp();
          resolve(ipFallback);
        }
      },
      async () => {
        // User denied or browser blocked geolocation — try IP fallback.
        // This still requires no further user interaction (passive lookup).
        const ipFallback = await detectCountryFromIp();
        resolve(ipFallback);
      },
      { timeout: 4000, maximumAge: 600000 }
    );
  });
}

export function isIndia(country: string | null): boolean {
  return country === "India";
}
