import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/services/prisma';
import { getAuth } from '@/utils/auth';
import { logger } from '@/utils/logger';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuth(req);
    if (!auth || !auth.user || auth.user.role !== 'PROVIDER') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, category, price, description } = body;

    if (!name || !category || !price || !description) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    // Ensure provider profile exists
    const providerProfile = await prisma.providerProfile.findUnique({
      where: { userId: auth.user.id }
    });

    if (!providerProfile) {
      return NextResponse.json({ success: false, error: 'Provider profile not found' }, { status: 404 });
    }

    // Create the application
    const application = await prisma.serviceApplication.create({
      data: {
        providerId: providerProfile.id,
        name,
        category,
        price: parseFloat(price.toString()),
        description,
        status: 'PENDING'
      }
    });

    return NextResponse.json({ success: true, data: application });
  } catch (error: any) {
    logger.error('Failed to submit service application:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
