import { prisma } from "@/services/prisma";

/**
 * Validates a hierarchical location (District -> City -> Area)
 * Returns true if valid and active, false otherwise.
 */
export async function validateLocationHierarchy(
  districtId?: string | null,
  cityId?: string | null,
  areaId?: string | null
): Promise<{ isValid: boolean; error?: string }> {
  
  if (areaId) {
    const area = await prisma.area.findUnique({
      where: { id: areaId },
      include: { 
        city: { 
          include: { 
            district: true 
          } 
        } 
      }
    });

    if (!area) return { isValid: false, error: "Area not found" };
    if (!area.isActive) return { isValid: false, error: "Selected area is currently inactive" };
    if (!area.city.district.isActive) return { isValid: false, error: "Selected district is currently inactive" };

    // Strict hierarchy check if other IDs are provided
    if (cityId && area.cityId !== cityId) {
        return { isValid: false, error: "Area does not belong to the selected city" };
    }
    if (districtId && area.city.districtId !== districtId) {
        return { isValid: false, error: "Area does not belong to the selected district" };
    }

    return { isValid: true };
  }

  if (cityId) {
    const city = await prisma.city.findUnique({
      where: { id: cityId },
      include: { district: true }
    });

    if (!city) return { isValid: false, error: "City not found" };
    if (!city.district.isActive) return { isValid: false, error: "Selected district is currently inactive" };

    if (districtId && city.districtId !== districtId) {
        return { isValid: false, error: "City does not belong to the selected district" };
    }

    return { isValid: true };
  }

  if (districtId) {
    const district = await prisma.district.findUnique({
      where: { id: districtId }
    });

    if (!district) return { isValid: false, error: "District not found" };
    if (!district.isActive) return { isValid: false, error: "Selected district is currently inactive" };

    return { isValid: true };
  }

  return { isValid: true }; // Nothing to validate
}
