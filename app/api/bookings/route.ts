import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";
import { userGuard } from "@/services/auth/guards";
import { logger } from "@/utils/logger";
import { validateLocationHierarchy } from "@/utils/location-validation";
import { sendNotification } from "@/services/notifications";
import { emailService } from "@/services/email/service";

export const dynamic = "force-dynamic";

/**
 * GET /api/bookings — List bookings for the current user
 *  - For USER: their bookings as customer
 *  - For PROVIDER: their bookings as provider
 *  - Query: ?status=Requested&role=customer|provider
 */
export async function GET(req: NextRequest) {
  try {
    const guard = await userGuard(req);
    if (guard.error) return guard.error;

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const roleFilter = searchParams.get("role"); // 'customer' or 'provider'
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const page = Math.max(parseInt(searchParams.get("page") || "1"), 1);

    const where: Record<string, unknown> = {};

    // Determine which bookings to fetch
    if (guard.user.role === "PROVIDER" && roleFilter === "provider") {
      // Provider viewing their received bookings
      const provider = await prisma.providerProfile.findUnique({
        where: { userId: guard.user.id },
      });
      if (!provider) {
        return NextResponse.json({ success: true, data: [], pagination: { total: 0, page, limit, totalPages: 0 } });
      }
      where.providerId = provider.id;
    } else {
      // User viewing their created bookings as customer
      where.userId = guard.user.id;
    }

    // Status filter - normalize to Requested, Accepted, etc.
    if (status) {
      const statusMap: Record<string, string> = {
        'PENDING': 'Requested',
        'ACCEPTED': 'Accepted',
        'IN_PROGRESS': 'InProgress',
        'COMPLETED': 'Completed',
        'CANCELLED': 'Cancelled',
      };
      where.status = statusMap[status.toUpperCase()] || status;
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          service: true,
          customer: {
            select: { 
              id: true, 
              name: true, 
              email: true, 
              phone: true, 
              profileImage: true
            },
          },
          provider: {
            include: {
              user: {
                select: { 
                  id: true, 
                  name: true, 
                  email: true, 
                  phone: true, 
                  profileImage: true
                },
              },
            },
          },
          payment: true,
          _count: { select: { messages: true } },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.booking.count({ where }),
    ]);

    // Map Prisma objects to frontend expectations if needed
    const transformed = bookings.map(b => ({
      ...b,
      booking_status: b.status, // Consistency with current frontend expectation
    }));

    return NextResponse.json({
      success: true,
      data: transformed,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: unknown) {
    logger.error("Bookings GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/bookings — Create a new booking
 */
export async function POST(req: NextRequest) {
  try {
    const guard = await userGuard(req);
    if (guard.error) return guard.error;

    const body = await req.json();
    const { serviceId, providerId, location, districtId, cityId, areaId, scheduledAt, notes, paymentMethod, latitude, longitude } = body;

    // Validation
    if (!serviceId || !providerId || (!location && !districtId)) {
      return NextResponse.json(
        { success: false, error: "serviceId, providerId, and location are required" },
        { status: 400 }
      );
    }

    // ─── Location validation ────────────────────────────────────
    if (districtId || cityId || areaId) {
       const locValidation = await validateLocationHierarchy(districtId, cityId, areaId);
       if (!locValidation.isValid) {
          return NextResponse.json({ success: false, error: locValidation.error }, { status: 400 });
       }
    }

    // Verify service exists
    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) {
      return NextResponse.json(
        { success: false, error: "Service not found" },
        { status: 404 }
      );
    }

    // Verify provider exists and is verified
    const provider = await prisma.providerProfile.findUnique({
      where: { id: providerId },
      include: { user: true, serviceAreas: true },
    });
    if (!provider) {
      return NextResponse.json(
        { success: false, error: "Provider not found" },
        { status: 404 }
      );
    }

    // Ensure provider covers this area if provided
    if (areaId) {
       const coversArea = provider.serviceAreas.some(sa => sa.id === areaId);
       if (!coversArea) {
          return NextResponse.json({ success: false, error: "Provider does not serve this area" }, { status: 400 });
       }
    }

    if (provider.verificationStatus !== "VERIFIED") {
      return NextResponse.json(
        { 
          success: false, 
          message: "This provider is not verified yet. Please choose another provider." 
        },
        { status: 400 }
      );
    }

    // Prevent self-booking
    if (provider.userId === guard.user.id) {
      return NextResponse.json(
        { success: false, error: "You cannot book your own service" },
        { status: 400 }
      );
    }

    // Prevent double booking
    if (scheduledAt) {
      const existingBookings = await prisma.booking.findFirst({
        where: {
          providerId: provider.id,
          scheduledAt: new Date(scheduledAt),
          status: "Accepted",
        },
      });

      if (existingBookings) {
        return NextResponse.json(
          { success: false, error: "This provider is already booked for this time slot. Please choose another time." },
          { status: 400 }
        );
      }
    }

    // Parse location if it contains coordinates (e.g. "Address ||| lat,lng")
    let locationStr = location || "";
    let parsedLat: number | null = null;
    let parsedLng: number | null = null;

    if (location && location.includes(" ||| ")) {
      const parts = location.split(" ||| ");
      locationStr = parts[0];
      const coords = parts[1].split(",");
      if (coords.length === 2) {
        parsedLat = latitude ?? parseFloat(coords[0]);
        parsedLng = longitude ?? parseFloat(coords[1]);
      }
    } else {
      parsedLat = latitude ?? null;
      parsedLng = longitude ?? null;
    }

    // Create booking and initial payment record in a transaction
    const booking = await prisma.$transaction(async (tx) => {
      const platformFee = 50;
      const finalPrice = service.price + platformFee;

      const b = await tx.booking.create({
        data: {
          userId: guard.user.id,
          providerId: provider.id,
          serviceId: service.id,
          location: locationStr || "Remote / Area",
          latitude: parsedLat,
          longitude: parsedLng,
          districtId: districtId || null,
          cityId: cityId || null,
          areaId: areaId || null,
          totalPrice: finalPrice,
          scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
          notes: notes || null,
          status: "Requested",
        },
        include: {
          service: true,
          provider: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
        },
      });

      // Create pending payment record
      await tx.payment.create({
        data: {
          bookingId: b.id,
          amount: finalPrice,
          method: (paymentMethod?.toUpperCase() || "CASH") as any,
          status: "PENDING",
        }
      });

      return b;
    });

    // Create notification for provider
    await sendNotification({
      userId: provider.userId,
      title: "New Booking Request",
      body: `${guard.user.name} has requested ${service.name}`,
      type: "BOOKING",
      actionUrl: `/provider/dashboard`,
    });

    // Send email to provider
    if (provider.user.email) {
      await emailService.sendBookingRequestEmail(provider.user.email, {
        providerName: provider.user.name,
        customerName: guard.user.name,
        serviceTitle: service.name,
        scheduledAt: booking.scheduledAt?.toISOString() || new Date().toISOString(),
        bookingId: booking.id
      }).catch(err => logger.error("Email send failed in booking create", err));
    }

    logger.info(`Booking created: ${booking.id} by ${guard.user.email}`);

    return NextResponse.json({
      success: true,
      message: "Booking created successfully",
      data: booking,
    }, { status: 201 });
  } catch (error: unknown) {
    logger.error("Booking create error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create booking" },
      { status: 500 }
    );
  }
}