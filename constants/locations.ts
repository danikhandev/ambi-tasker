/**
 * AMBI-TASKER — LOCATION SYSTEM
 * Scalable Pakistan location hierarchy.
 * Currently enabled: Haripur District only.
 * To expand: add districts to ENABLED_DISTRICTS and populate their data below.
 */

import { SUPPORTED_DISTRICT_NAMES, getActiveDistrictLabel } from "./locationConfig";

// ─── FEATURE FLAG ──────────────────────────────────────────────────────────────
// ✅ Points to central config now
export const ENABLED_DISTRICTS: string[] = SUPPORTED_DISTRICT_NAMES;

// ─── DEFAULT DISTRICT ──────────────────────────────────────────────────────────
export const DEFAULT_DISTRICT = getActiveDistrictLabel();

// ─── FULL PAKISTAN LOCATION HIERARCHY ─────────────────────────────────────────
// Structure: Country → Province → District → Cities → Areas
export const PAKISTAN_LOCATION_TREE = {
  country: "Pakistan",
  provinces: {
    KPK: {
      name: "Khyber Pakhtunkhwa",
      districts: {
        Haripur: {
          name: "Haripur",
          enabled: true,
          tehsils: ["Haripur", "Ghazi", "Hattar"],
          cities: [
            "Haripur City",
            "Hattar",
            "Ghazi",
            "Khanpur",
            "Khalabat Township",
            "Sarai Saleh",
            "Beer",
            "Oghi Road",
            "Bagra",
            "Lund Khwar",
          ],
          areas: {
            "Haripur City": [
              "Qalandarabad",
              "Nawan Shehr",
              "Barakaho",
              "Pehla Dhok",
              "Naseerabad",
              "Pind Sultani",
              "Khurd Bazar",
              "GPO Chowk",
              "Commissioner Colony",
              "Civil Lines",
            ],
            "Khalabat Township": [
              "Block A",
              "Block B",
              "Block C",
              "Block D",
              "Block E",
              "Block F",
              "Main Boulevard",
              "Khalabat Bazar",
            ],
            Hattar: [
              "Industrial Estate",
              "Hazara Road",
              "Hattar Bazar",
              "New Hattar",
            ],
            Ghazi: [
              "Ghazi Bazar",
              "Tarbela Road",
              "Ghazi Colony",
              "Sirban Road",
            ],
            Khanpur: ["Khanpur Bazar", "Khanpur Road", "Thanda Pani"],
            "Sarai Saleh": ["Sarai Bazar", "Jhangi Syedan"],
            Beer: ["Beer Colony", "Beer Bazar"],
            "Oghi Road": ["Oghi Road Area"],
            Bagra: ["Bagra Town"],
            "Lund Khwar": ["Lund Khwar Colony"],
          },
        },
        // ── Future Districts (not yet enabled) ──────────────
        Abbottabad: {
          name: "Abbottabad",
          enabled: true,
          tehsils: ["Abbottabad", "Havelian"],
          cities: ["Abbottabad City", "Havelian", "Sherwan"],
          areas: {},
        },
        Mansehra: {
          name: "Mansehra",
          enabled: false,
          tehsils: ["Mansehra", "Balakot", "Oghi"],
          cities: ["Mansehra City", "Balakot", "Oghi"],
          areas: {},
        },
        Peshawar: {
          name: "Peshawar",
          enabled: false,
          tehsils: ["Peshawar City", "Nowshera"],
          cities: ["Peshawar City", "Hayatabad", "University Town"],
          areas: {},
        },
      },
    },
    Punjab: {
      name: "Punjab",
      districts: {
        Islamabad: {
          name: "Islamabad",
          enabled: true,
          tehsils: ["Islamabad"],
          cities: ["F-7", "F-10", "G-9", "DHA", "Bahria Town"],
          areas: {
            "F-7": ["F-7/1", "F-7/2", "F-7/3", "F-7/4", "Jinnah Super"],
            "F-10": ["F-10/1", "F-10/2", "F-10/3", "F-10/4", "Silver Oaks"],
            "G-9": ["G-9/1", "G-9/2", "G-9/3", "G-9/4", "Karachi Company"],
            "DHA": ["Phase 1", "Phase 2", "Phase 3", "Phase 4", "Phase 5"],
            "Bahria Town": ["Phase 7", "Phase 8", "Garden City"]
          },
        },
        Lahore: {
          name: "Lahore",
          enabled: false,
          tehsils: ["Lahore City", "Sheikhupura"],
          cities: ["Gulberg", "DHA Lahore", "Model Town"],
          areas: {},
        },
        Rawalpindi: {
          name: "Rawalpindi",
          enabled: false,
          tehsils: ["Rawalpindi City", "Taxila"],
          cities: ["Rawalpindi City", "Taxila", "Wah Cantt"],
          areas: {},
        },
      },
    },
    Sindh: {
      name: "Sindh",
      districts: {
        Karachi: {
          name: "Karachi",
          enabled: false,
          tehsils: ["Karachi City"],
          cities: ["Clifton", "DHA Karachi", "Gulshan-e-Iqbal"],
          areas: {},
        },
      },
    },
  },
} as const;

// ─── FLAT EXPORTS ──────────────────────────────────────────────────────────────
// These are used directly by components and forms.

/** Districts visible to users — only enabled ones */
export const AVAILABLE_DISTRICTS: string[] = ENABLED_DISTRICTS;

/** All districts in Pakistan (shown in admin panel for management) */
export const ALL_PAKISTAN_DISTRICTS: string[] = [
  // KPK
  "Haripur", "Abbottabad", "Mansehra", "Peshawar", "Swat", "Mardan",
  "Nowshera", "Charsadda", "Karak", "Bannu", "Tank", "Lakki Marwat",
  "Kohat", "Hangu", "Dera Ismail Khan", "Swabi", "Buner", "Shangla",
  "Upper Dir", "Lower Dir", "Chitral", "Battagram", "Kohistan",
  // Punjab
  "Lahore", "Rawalpindi", "Faisalabad", "Multan", "Gujranwala", "Sialkot",
  "Sargodha", "Sheikhupura", "Bahawalpur", "Gujrat", "Jhang", "Rahim Yar Khan",
  "Islamabad",
  // Sindh
  "Karachi", "Hyderabad", "Sukkur", "Larkana", "Nawabshah", "Mirpurkhas",
  // Balochistan
  "Quetta", "Gwadar", "Turbat", "Khuzdar", "Hub",
  // AJK & GB
  "Muzaffarabad", "Gilgit", "Skardu",
];

/** Alias used by existing pages — same as ALL_PAKISTAN_DISTRICTS for dropdowns */
export const PAKISTAN_DISTRICTS: string[] = ALL_PAKISTAN_DISTRICTS;

/** Cities in the currently enabled Haripur district */
export const HARIPUR_CITIES: string[] =
  PAKISTAN_LOCATION_TREE.provinces.KPK.districts.Haripur.cities as unknown as string[];

/** All areas across all cities in Haripur (flat list for simple dropdowns) */
export const HARIPUR_AREAS: string[] = Object.values(
  PAKISTAN_LOCATION_TREE.provinces.KPK.districts.Haripur.areas
).flat() as string[];

/**
 * Helper to get a district object from the tree by name
 */
function getDistrictFromTree(districtName: string) {
  for (const province of Object.values(PAKISTAN_LOCATION_TREE.provinces)) {
    const districts = (province as any).districts;
    if (districts[districtName]) {
      return districts[districtName];
    }
  }
  return null;
}

/**
 * Get areas for a specific city in an enabled district.
 * Returns an empty array if city/district not found.
 */
export function getAreasForCity(districtName: string, city: string): string[] {
  const district = getDistrictFromTree(districtName);
  if (!district || !district.enabled) return [];
  
  const areas = (district.areas as Record<string, readonly string[]>)[city];
  return areas ? [...areas] : [];
}

/**
 * Get all cities for an enabled district.
 */
export function getCitiesForDistrict(districtName: string): string[] {
  const district = getDistrictFromTree(districtName);
  if (!district || !district.enabled) return [];
  
  return [...district.cities];
}

/**
 * Check if a district is currently enabled for service.
 */
export function isDistrictEnabled(district: string): boolean {
  const districtObj = getDistrictFromTree(district);
  return districtObj?.enabled || false;
}

// ─── LOCATION TYPES ───────────────────────────────────────────────────────────
export interface UserLocation {
  country: string;
  province: string;
  district: string;
  city: string;
  area: string;
  address?: string;
}

export const DEFAULT_LOCATION: UserLocation = {
  country: "Pakistan",
  province: "Khyber Pakhtunkhwa",
  district: DEFAULT_DISTRICT,
  city: "Haripur City",
  area: "Qalandarabad",
};
