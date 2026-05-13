import { NextResponse } from "next/server";
import { prisma } from "@/services/prisma";
import { createCheckoutSession } from "@/lib/stripe";

// Note: Using standard next-auth or custom JWT logic here.
// For production, this should be guarded by a user session check.

export async function POST(req: Request) {
    try {
        const { bookingId } = await req.json();

        if (!bookingId) {
            return NextResponse.json({ error: "Booking ID is required" }, { status: 400 });
        }

        // 1. Fetch booking details
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
                payment: true,
                service: true,
                customer: true
            }
        });

        if (!booking) {
            return NextResponse.json({ error: "Booking not found" }, { status: 404 });
        }

        if (booking.payment?.status === "COMPLETED") {
            return NextResponse.json({ error: "Booking already paid" }, { status: 400 });
        }

        const amount = booking.totalPrice || booking.service.price;

        // 2. Create Stripe Session
        const session = await createCheckoutSession({
            bookingId: booking.id,
            amount,
            customerEmail: booking.customer.email,
            description: `Payment for ${booking.service.name} service`
        });

        return NextResponse.json({ url: session.url });

    } catch (error: any) {
        console.error("[CHECKOUT_ERROR]", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
