import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/services/prisma';
import { getAdminAuth } from '@/utils/admin-auth';
import { logger } from '@/utils/logger';

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await getAdminAuth(req);
    if (!auth) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { status, rejectionReason } = await req.json();

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 });
    }

    const application = await prisma.serviceApplication.findUnique({
      where: { id: params.id },
      include: { provider: true }
    });

    if (!application) {
      return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
    }

    if (application.status !== 'PENDING') {
      return NextResponse.json({ success: false, error: 'Application already processed' }, { status: 400 });
    }

    // Process the application
    const updatedApplication = await prisma.$transaction(async (tx) => {
      const updated = await tx.serviceApplication.update({
        where: { id: params.id },
        data: { status, rejectionReason }
      });

      if (status === 'APPROVED') {
        // Automatically add the service to the global services list
        await tx.service.create({
          data: {
            name: application.name,
            category: application.category,
            price: application.price,
            description: application.description,
            isActive: true
          }
        });
      }

      return updated;
    });

    // Notify Provider
    try {
      const { sendNotification } = await import('@/services/notifications');
      await sendNotification({
        title: `Service Application ${status}`,
        body: status === 'APPROVED' 
          ? `Your application for the service '${application.name}' has been approved and is now live!` 
          : `Your application for the service '${application.name}' was rejected.${rejectionReason ? ' Reason: ' + rejectionReason : ''}`,
        type: "GENERAL",
        targetType: "INDIVIDUAL",
        userId: application.provider.userId,
        actionUrl: "/provider/services",
      });
    } catch (notifyError) {
      logger.error(`Failed to notify provider for application ${params.id}:`, notifyError);
    }

    return NextResponse.json({ success: true, data: updatedApplication });
  } catch (error: any) {
    logger.error(`Failed to update application ${params.id}:`, error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
