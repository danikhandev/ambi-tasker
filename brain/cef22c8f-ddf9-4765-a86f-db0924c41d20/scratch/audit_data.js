const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Searching for ALL providers...");
  const providers = await prisma.providerProfile.findMany({
    include: {
      user: {
        select: {
          name: true,
          email: true,
          role: true,
          isActive: true,
          district: { select: { name: true } }
        }
      }
    }
  });

  console.log(`\nFound ${providers.length} total provider profiles.`);
  providers.forEach((p, i) => {
    console.log(`${i+1}. ${p.user.name} | ${p.user.email}`);
    console.log(`   Verification: ${p.verificationStatus} | Available: ${p.isAvailable} | Active: ${p.user.isActive}`);
    console.log(`   District: ${p.user.district?.name || 'NONE'} | Title: ${p.professionalTitle}`);
    console.log("--------------------------------------------------");
  });

  const districts = await prisma.district.findMany({ select: { id: true, name: true } });
  console.log("\nDistricts in DB:", districts.map(d => `${d.name} (${d.id})`).join(', '));
}

main().catch(console.error).finally(() => prisma.$disconnect());
