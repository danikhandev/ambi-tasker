import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import 'dotenv/config';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding newsletter subscribers...');

  const subscribers = [
    { email: 'john.doe@example.com', status: 'ACTIVE' as const, source: 'website_footer' },
    { email: 'jane.smith@example.com', status: 'ACTIVE' as const, source: 'checkout_flow' },
    { email: 'mark.johnson@example.com', status: 'UNSUBSCRIBED' as const, source: 'website_footer' },
    { email: 'emily.davis@example.com', status: 'ACTIVE' as const, source: 'campaign_landing' },
    { email: 'michael.brown@example.com', status: 'BOUNCED' as const, source: 'website_footer' },
    { email: 'sarah.wilson@example.com', status: 'ACTIVE' as const, source: 'website_footer' },
    { email: 'david.miller@example.com', status: 'UNSUBSCRIBED' as const, source: 'checkout_flow' },
    { email: 'jessica.taylor@example.com', status: 'ACTIVE' as const, source: 'website_footer' },
    { email: 'james.anderson@example.com', status: 'ACTIVE' as const, source: 'campaign_landing' },
    { email: 'linda.thomas@example.com', status: 'ACTIVE' as const, source: 'website_footer' },
  ];

  for (const sub of subscribers) {
    await prisma.newsletterSubscriber.upsert({
      where: { email: sub.email },
      update: {},
      create: {
        ...sub,
        emailsSent: Math.floor(Math.random() * 5),
        subscribedAt: new Date(Date.now() - Math.floor(Math.random() * 10000000000)),
      },
    });
  }

  console.log('Newsletter subscribers seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
