import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/utils/auth';
import { logger } from '@/utils/logger';

export async function POST(req: Request) {
  try {
    const auth = await getAuth(req);
    if (!auth || auth.role !== 'PROVIDER') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, category, price, description } = body;

    if (!name || !category || !price || !description) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    // Ensure provider profile exists
    const providerProfile = await prisma.providerProfile.findUnique({
      where: { userId: auth.userId }
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
