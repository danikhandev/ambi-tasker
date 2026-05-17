import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";
import { verifyAdminAccess } from "@/utils/adminAuth";
import { sendEmail } from "@/services/email/send";

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdminAccess(request);
    if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.errorStatus });

    const db = prisma as any;
    const campaigns = await db.newsletterCampaign.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, campaigns });
  } catch (error: any) {
    console.error("Failed to fetch campaigns:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch campaigns" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdminAccess(request);
    if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.errorStatus });

    const body = await request.json();
    const { subject, content, segment } = body;

    if (!subject || !content) {
      return NextResponse.json({ error: "Subject and content are required" }, { status: 400 });
    }

    const db = prisma as any;

    // Determine recipients
    const subscribers = await db.newsletterSubscriber.findMany({
      where: { status: "ACTIVE" },
    });

    if (subscribers.length === 0) {
      return NextResponse.json({ success: false, error: "No active subscribers found." }, { status: 400 });
    }

    // Create Campaign Record
    const campaign = await db.newsletterCampaign.create({
      data: {
        subject,
        content,
        status: "SENDING",
        recipientCount: subscribers.length,
        createdBy: auth.adminId,
      },
    });

    // Send emails (In a real production app, this should be sent to a queue like BullMQ or trigger a background job)
    // For now, we'll process them in batches asynchronously so we don't block the request.
    
    // Background execution
    (async () => {
      let successCount = 0;
      let failCount = 0;

      for (const sub of subscribers) {
        try {
          // Add unsubscribe link
          const unsubscribeUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/newsletter/unsubscribe?email=${encodeURIComponent(sub.email)}`;
          const emailHtml = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              ${content}
              <hr style="border: none; border-top: 1px solid #eaeaea; margin: 30px 0;" />
              <p style="font-size: 12px; color: #666; text-align: center;">
                You are receiving this email because you subscribed to Ambi Tasker updates.<br/>
                <a href="${unsubscribeUrl}" style="color: #666; text-decoration: underline;">Unsubscribe here</a>
              </p>
            </div>
          `;

          await sendEmail({
            to: sub.email,
            subject: subject,
            html: emailHtml,
            text: "Please view this email in an HTML compatible client.",
          });

          await db.campaignLog.create({
            data: {
              campaignId: campaign.id,
              subscriberId: sub.id,
              status: "SENT",
            }
          });

          await db.newsletterSubscriber.update({
             where: { id: sub.id },
             data: { 
               emailsSent: { increment: 1 },
               lastEmailSent: new Date()
             }
          });

          successCount++;
        } catch (err: any) {
          console.error(`Failed to send to ${sub.email}:`, err);
          await db.campaignLog.create({
            data: {
              campaignId: campaign.id,
              subscriberId: sub.id,
              status: "FAILED",
              error: err.message || "Unknown error",
            }
          });
          failCount++;
        }
      }

      // Update campaign final status
      await db.newsletterCampaign.update({
        where: { id: campaign.id },
        data: {
          status: "SENT",
          successfulCount: successCount,
          failedCount: failCount,
          sentAt: new Date(),
        }
      });
    })(); // Execute async without awaiting so API returns early

    return NextResponse.json({
      success: true,
      message: `Campaign initiated. Sending to ${subscribers.length} subscribers in the background.`,
      campaignId: campaign.id
    });
  } catch (error: any) {
    console.error("Campaign creation failed:", error);
    return NextResponse.json({ success: false, error: "Failed to process campaign" }, { status: 500 });
  }
}
