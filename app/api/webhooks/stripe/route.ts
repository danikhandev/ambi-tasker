import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/services/prisma";
import { headers } from "next/headers";
import { PaymentStatus } from "@prisma/client";

export async function POST(req: Request) {
    const body = await req.text();
    const signature = (await headers()).get("Stripe-Signature") as string;

    let event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET || ""
        );
    } catch (error: any) {
        return NextResponse.json({ error: `Webhook Error: ${error.message}` }, { status: 400 });
    }

    const session = event.data.object as any;

    if (event.type === "checkout.session.completed") {
        const bookingId = session.metadata?.bookingId;

        if (bookingId) {
            // Update payment, booking, and notify atomically
            await prisma.$transaction(async (tx) => {
                await tx.payment.upsert({
                    where: { bookingId },
                    update: {
                        status: PaymentStatus.PAID,
                        paidAt: new Date(),
                        transactionId: session.payment_intent,
                    },
                    create: {
                        bookingId,
                        amount: session.amount_total / 100,
                        status: PaymentStatus.PAID,
                        paidAt: new Date(),
                        transactionId: session.payment_intent,
                        method: "STRIPE"
                    }
                });

                const booking = await tx.booking.update({
                    where: { id: bookingId },
                    data: { status: "Accepted" },
                    include: { customer: true }
                });

                // 1. Create a Master Notification
                const notification = await tx.notification.create({
                    data: {
                        title: "Payment Successful",
                        body: `Your payment for booking #${bookingId.slice(0, 8)} has been confirmed.`,
                        type: "PAYMENT",
                        targetType: "INDIVIDUAL"
                    }
                });

                // 2. Map to Users
                await tx.userNotification.createMany({
                    data: [
                        { userId: booking.userId, notificationId: notification.id },
                        { userId: booking.providerId, notificationId: notification.id }
                    ]
                });

                // 3. Dispatch Email Notification
                if (booking.customer?.email) {
                    await import('@/services/notifications/dispatcher').then(m => m.dispatchNotification({
                        to: booking.customer.email!,
                        name: booking.customer.name,
                        eventName: "BOOKING_CREATED",
                        metadata: { serviceName: "Your Service" }
                    }));
                }
            });
        }
    }

    return NextResponse.json({ received: true }, { status: 200 });
}
