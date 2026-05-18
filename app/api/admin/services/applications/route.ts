import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/services/prisma';
import { getAdminAuth } from '@/utils/admin-auth';
import { logger } from '@/utils/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = await getAdminAuth(req);
    if (!auth) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'PENDING';

    const applications = await prisma.serviceApplication.findMany({
      where: status !== 'ALL' ? { status } : undefined,
      include: {
        provider: {
          include: {
            user: {
              select: { name: true, email: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, data: applications });
  } catch (error: any) {
    logger.error('Failed to fetch service applications:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
