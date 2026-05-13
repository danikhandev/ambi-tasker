import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import "dotenv/config";

async function main() {
  const pool = new pg.Pool({ 
    connectionString: process.env.DATABASE_URL,
    ssl: true
  });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log("🗑️  Starting database cleanup...");

  try {
    // Exact table names from the database
    const tables = [
      "reviews", 
      "payments", 
      "messages", 
      "Receipt", 
      "admin_logs", 
      "user_notifications", 
      "admin_notifications", 
      "Report", 
      "support_tickets", 
      "Booking", 
      "conversations", 
      "providers", 
      "user_addresses", 
      "profiles", 
      "admins", 
      "Service", 
      "posters", 
      "system_settings", 
      "otp_codes", 
      "VerificationToken", 
      "notifications",
      "Area",
      "City",
      "District",
      "Province",
      "Country",
      "_ProviderServiceAreas"
    ];

    const truncateQuery = `TRUNCATE TABLE ${tables.map(t => `"${t}"`).join(", ")} RESTART IDENTITY CASCADE;`;
    
    await prisma.$executeRawUnsafe(truncateQuery);

    console.log("✅ All dummy data and configuration have been removed.");
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
