import { NextResponse } from "next/server";
import { prisma } from "@/services/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, honeypot } = body;

    // Honeypot check for spam protection
    if (honeypot) {
      return NextResponse.json({ success: true, message: "Thank you for subscribing to Ambi Tasker updates." });
    }

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { success: false, error: "Email is required." },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();
    
    // Basic email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return NextResponse.json(
        { success: false, error: "Invalid email format." },
        { status: 400 }
      );
    }

    const db = prisma as any;

    // Check if already subscribed
    const existing = await db.newsletterSubscriber.findUnique({
      where: { email: trimmedEmail },
    });

    if (existing) {
      if (existing.status === "ACTIVE") {
        return NextResponse.json(
          { success: true, message: "You are already subscribed!" }
        );
      } else {
        // Re-subscribe
        await db.newsletterSubscriber.update({
          where: { id: existing.id },
          data: { 
            status: "ACTIVE",
            subscribedAt: new Date(),
            unsubscribedAt: null,
            source: "website_footer_resubscribe"
          },
        });
        return NextResponse.json({
          success: true,
          message: "Welcome back! You have been successfully re-subscribed.",
        });
      }
    }

    // Create new subscriber
    await db.newsletterSubscriber.create({
      data: {
        email: trimmedEmail,
        status: "ACTIVE",
        source: "website_footer",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Thank you for subscribing to Ambi Tasker updates.",
    });
  } catch (error: any) {
    console.error("Newsletter Subscription Error:", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again later." },
      { status: 500 }
    );
  }
}
