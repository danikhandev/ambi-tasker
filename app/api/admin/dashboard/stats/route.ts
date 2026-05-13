import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";
import { getAdminAuth } from "@/utils/admin-auth";
import { logger } from "@/utils/logger";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const admin = await getAdminAuth(req);
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const [userCount, providerCount, servicesCount, activeBookings, revenueData, recentJobs, categories] = await Promise.all([
      prisma.user.count({ where: { role: "USER" } }),
      prisma.user.count({ where: { role: "PROVIDER" } }),
      prisma.service.count(),
      prisma.booking.count({ where: { status: { in: ["Accepted", "InProgress"] } } }),
      prisma.booking.findMany({ 
        where: { status: "Completed" }, 
        select: { totalPrice: true, updatedAt: true } 
      }),
      prisma.booking.findMany({
        take: 6,
        orderBy: { createdAt: "desc" },
        include: {
          customer: { select: { name: true } },
          provider: { include: { user: { select: { name: true } } } },
          service: { select: { name: true } }
        }
      }),
      prisma.service.findMany({
        select: { category: true }
      })
    ]);

    const revenue = revenueData.reduce((acc, curr) => acc + (curr.totalPrice || 0), 0);

    // Calculate Weekly Revenue for Chart
    const weeklyRevenue = Array.from({ length: 6 }).map((_, i) => {
        const end = new Date();
        end.setDate(end.getDate() - (i * 7));
        const start = new Date();
        start.setDate(start.getDate() - ((i + 1) * 7));
        
        const weekRev = revenueData
            .filter(b => {
                const date = new Date(b.updatedAt);
                return date >= start && date < end;
            })
            .reduce((sum, b) => sum + (b.totalPrice || 0), 0);
            
        return { name: `Week ${6-i}`, revenue: weekRev };
    }).reverse();

    const serviceCategoryRecords = await prisma.service.groupBy({
        by: ['category'],
        _count: { id: true }
    });

    const pendingApprovalsCount = await prisma.providerProfile.count({ where: { verificationStatus: "PENDING" } });

    // Real data: Fetch pending bookings grouped by category
    const pendingBookings = await prisma.booking.findMany({
      where: { status: 'Requested' },
      include: { service: { select: { category: true } } }
    });
    
    // Group them by category
    const pendingByCategory = pendingBookings.reduce((acc, booking) => {
      const category = booking.service?.category;
      if (category) {
        acc[category] = (acc[category] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // Calculate Service Distribution based on completed bookings
    const completedBookings = await prisma.booking.findMany({
        where: { status: 'Completed' },
        include: { service: { select: { category: true } } }
    });

    const categoryStats: Record<string, { active: number, pending: number }> = {};
    
    // Process completed bookings for distribution
    completedBookings.forEach(booking => {
        const category = booking.service?.category || 'Other';
        if (!categoryStats[category]) categoryStats[category] = { active: 0, pending: 0 };
        categoryStats[category].active += 1;
    });

    // Add pending counts
    Object.keys(pendingByCategory).forEach(cat => {
        if (!categoryStats[cat]) categoryStats[cat] = { active: 0, pending: 0 };
        categoryStats[cat].pending = pendingByCategory[cat];
    });

    // Ensure all existing categories are present even with 0 counts
    serviceCategoryRecords.forEach(svc => {
        if (!categoryStats[svc.category]) {
            categoryStats[svc.category] = { active: 0, pending: 0 };
        }
    });

    const serviceDistribution = Object.entries(categoryStats).map(([category, stats]) => ({
        category,
        active: stats.active,
        pending: stats.pending
    })).sort((a, b) => b.active - a.active); // Sort by most active

    const stats = {
      total_users: userCount,
      total_providers: providerCount,
      total_services: servicesCount,
      active_bookings: activeBookings,
      total_revenue: revenue,
      pending_approvals: pendingApprovalsCount
    };

    const formattedJobs = recentJobs.map(job => ({
        id: `JOB-${job.id.slice(0, 4).toUpperCase()}`,
        rawType: job.service?.name,
        rawProvider: job.provider?.user?.name,
        rawStatus: job.status,
        time: job.scheduledAt ? new Date(job.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "N/A",
        rawAmount: job.totalPrice
    }));

    return NextResponse.json({ 
        success: true, 
        stats, 
        recentJobs: formattedJobs,
        revenueByWeek: weeklyRevenue,
        serviceDistribution: serviceDistribution
    });
  } catch (error: unknown) {
    logger.error("Admin Dashboard Stats GET error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch dashboard stats" }, { status: 500 });
  }
}
