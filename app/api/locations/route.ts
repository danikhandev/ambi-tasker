import { prisma } from '@/services/prisma';
import { NextRequest, NextResponse } from 'next/server';
import localData from '@/data/pakistan_locations.json';
import {
  AVAILABILITY_MESSAGE,
} from '@/constants/locationConfig';

export const dynamic = 'force-dynamic';

// ─── Types for local JSON ──────────────────────────────────────────────────────
interface JsonArea { district: string; areas: string[] }
interface JsonProvince { province: string; districts: JsonArea[] }
const jsonData = localData as JsonProvince[];

function fakeId(name: string) {
  return name.toLowerCase().replace(/\s+/g, '-');
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const parentId = searchParams.get('parentId');

    if (!type) {
      return NextResponse.json({ success: false, error: 'Type is required' }, { status: 400 });
    }

    let data: { id: string; name: string }[] = [];

    switch (type) {
      case 'provinces': {
        const country = await prisma.country.findUnique({ where: { code: 'PK' } });
        if (!country || !country.isActive) return NextResponse.json({ success: true, data: [] });

        const rows = await prisma.province.findMany({
          where: {
            countryId: country.id,
            isActive: true,
          },
          orderBy: { name: 'asc' },
        });
        return NextResponse.json({ success: true, data: rows });
      }

      case 'districts': {
        const where: any = { 
          isActive: true,
          province: { isActive: true }
        };
        if (parentId) where.provinceId = parentId;
        
        const rows = await prisma.district.findMany({
          where,
          orderBy: { name: 'asc' },
        });
        return NextResponse.json({ success: true, data: rows });
      }

      case 'cities': {
        if (!parentId) return NextResponse.json({ success: false, error: 'districtId required' }, { status: 400 });
        const rows = await prisma.city.findMany({
          where: { 
            districtId: parentId,
            isActive: true,
            district: { isActive: true, province: { isActive: true } }
          },
          orderBy: { name: 'asc' },
        });
        return NextResponse.json({ success: true, data: rows });
      }

      case 'areas': {
        if (!parentId) {
          const districtId = searchParams.get('districtId');
          if (!districtId) return NextResponse.json({ success: false, error: 'cityId or districtId required' }, { status: 400 });
          
          // Flatten: Get all areas for a district
          const rows = await prisma.area.findMany({
            where: {
              city: { districtId: districtId, isActive: true, district: { isActive: true, province: { isActive: true } } },
              isActive: true
            },
            orderBy: { name: 'asc' },
          });
          return NextResponse.json({ success: true, data: rows });
        }
        
        const rows = await prisma.area.findMany({
          where: { 
            cityId: parentId,
            isActive: true,
            city: { isActive: true, district: { isActive: true, province: { isActive: true } } }
          },
          orderBy: { name: 'asc' },
        });
        return NextResponse.json({ success: true, data: rows });
      }

      default:
        return NextResponse.json({ success: false, error: 'Invalid type' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data,
      meta: { availabilityMessage: AVAILABILITY_MESSAGE },
    });
  } catch (error: any) {
    console.error('Location API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
