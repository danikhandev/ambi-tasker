import { describe, test, expect } from 'vitest';

/**
 * Unit Test for Geographic Calculations
 */

function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

describe('Geographic Utils', () => {
  test('haversineDistance should correctly calculate distance between two points', () => {
    // Islamabad (33.6844, 73.0479) to Rawalpindi (33.5651, 73.0169)
    const dist = haversineDistance(33.6844, 73.0479, 33.5651, 73.0169);
    
    // Roughly 13.5 - 14.5 km
    expect(dist).toBeGreaterThan(13);
    expect(dist).toBeLessThan(15);
  });

  test('distance to the same point should be zero', () => {
    const dist = haversineDistance(34.0, 72.0, 34.0, 72.0);
    expect(dist).toBe(0);
  });
});
