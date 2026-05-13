/**
 * Location Configuration — Central Source of Truth
 * 
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  TO ADD A NEW DISTRICT:                                        ║
 * ║  1. Add it to SUPPORTED_DISTRICTS below                        ║
 * ║  2. Run `npm run db:seed` to seed its location data            ║
 * ║  3. That's it — all APIs, UI, and validation auto-update       ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

// ─── Supported Districts ──────────────────────────────────────────────────────

export interface SupportedDistrict {
  /** Must match the district name in the database exactly */
  name: string;
  /** Province this district belongs to */
  province: string;
}

/**
 * Districts where the platform is currently active.
 * All location dropdowns, APIs, seed scripts, and validation
 * use this as the single source of truth.
 * 
 * To expand to new districts, simply add them here and re-seed.
 */
export const SUPPORTED_DISTRICTS: SupportedDistrict[] = [
  { name: "Haripur", province: "Khyber Pakhtunkhwa" },
  { name: "Abbottabad", province: "Khyber Pakhtunkhwa" },
  { name: "Peshawar", province: "Khyber Pakhtunkhwa" },
  { name: "Lahore", province: "Punjab" },
  { name: "Rawalpindi", province: "Punjab" },
  { name: "Islamabad (ICT)", province: "ICT" },
  { name: "Karachi", province: "Sindh" },
  { name: "Quetta", province: "Balochistan" },
];

// ─── Derived Helpers ──────────────────────────────────────────────────────────

/** Get all supported district names (case-insensitive matching helper) */
export const SUPPORTED_DISTRICT_NAMES = SUPPORTED_DISTRICTS.map(d => d.name);

/** Get all supported province names (unique) */
export const SUPPORTED_PROVINCES = [
  ...new Set(SUPPORTED_DISTRICTS.map(d => d.province)),
];

/** Check if a district name is supported */
export function isDistrictSupported(districtName: string): boolean {
  return SUPPORTED_DISTRICT_NAMES.some(
    name => name.toLowerCase() === districtName.toLowerCase()
  );
}

/** Check if a province is supported (has at least one active district) */
export function isProvinceSupported(provinceName: string): boolean {
  return SUPPORTED_PROVINCES.some(
    name => name.toLowerCase() === provinceName.toLowerCase()
  );
}

/** Get supported districts for a given province */
export function getDistrictsForProvince(provinceName: string): string[] {
  return SUPPORTED_DISTRICTS
    .filter(d => d.province.toLowerCase() === provinceName.toLowerCase())
    .map(d => d.name);
}

// ─── Platform Messaging ───────────────────────────────────────────────────────

/** Human-readable list of active districts for UI display */
export function getActiveDistrictLabel(): string {
  if (SUPPORTED_DISTRICTS.length === 1) {
    return SUPPORTED_DISTRICTS[0].name;
  }
  return SUPPORTED_DISTRICTS.map(d => d.name).join(", ");
}

/** Whether the platform is in single-district beta mode */
export const IS_BETA = false;

/** Banner message for restricted availability */
export const AVAILABILITY_MESSAGE = `Providing trusted home services across major districts of Pakistan.`;

/** App subtitle for beta mode */
export const PLATFORM_SUBTITLE = "Pakistan's Trusted Home Services Marketplace";
