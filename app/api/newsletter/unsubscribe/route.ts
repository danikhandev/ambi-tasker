import { NextResponse } from "next/server";
import { prisma } from "@/services/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return new NextResponse("Invalid or missing email parameter.", { status: 400 });
    }

    const db = prisma as any;

    const subscriber = await db.newsletterSubscriber.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!subscriber) {
      return new NextResponse("Subscriber not found.", { status: 404 });
    }

    if (subscriber.status === "ACTIVE") {
      await db.newsletterSubscriber.update({
        where: { email: email.toLowerCase() },
        data: {
          status: "UNSUBSCRIBED",
          unsubscribedAt: new Date(),
        },
      });
    }

    // Return a simple success HTML page
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Unsubscribed Successfully</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f9fafb; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
          .container { background-color: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); text-align: center; max-width: 400px; width: 100%; }
          h1 { color: #111827; font-size: 24px; margin-bottom: 16px; }
          p { color: #4b5563; line-height: 1.5; margin-bottom: 24px; }
          a { display: inline-block; background-color: #4f46e5; color: white; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: 500; }
          a:hover { background-color: #4338ca; }
        </style>
      </head>
      <body>
        <div class="container">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin: 0 auto 20px;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          <h1>Unsubscribed</h1>
          <p>You have been successfully unsubscribed from Ambi Tasker updates. We're sorry to see you go!</p>
          <a href="/">Return to Homepage</a>
        </div>
      </body>
      </html>
    `;

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html" },
    });
  } catch (error: any) {
    console.error("Unsubscribe error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
