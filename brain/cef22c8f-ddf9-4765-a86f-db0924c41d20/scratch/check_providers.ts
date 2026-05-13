import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("--- Checking Haripur District ---");
  const district = await prisma.district.findFirst({
    where: { name: { contains: 'Haripur', mode: 'insensitive' } }
  });
  console.log("Haripur District ID:", district?.id);

  if (district) {
    console.log("\n--- Checking Providers in Haripur ---");
    const providers = await prisma.providerProfile.findMany({
      where: {
        OR: [
          { user: { districtId: district.id } },
          { serviceAreas: { some: { city: { districtId: district.id } } } }
        ]
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            role: true,
            isActive: true,
            districtId: true
          }
        }
      }
    });

    console.log(`Found ${providers.length} providers linked to Haripur.`);
    providers.forEach(p => {
      console.log(`- ${p.user.name} (${p.user.email}) | Verified: ${p.verificationStatus} | Available: ${p.isAvailable} | Active: ${p.user.isActive} | Title: ${p.professionalTitle}`);
    });
  }

  console.log("\n--- Checking ALL Verified Electricians ---");
  const electricians = await prisma.providerProfile.findMany({
    where: {
      professionalTitle: { contains: 'Electrician', mode: 'insensitive' },
      verificationStatus: 'VERIFIED'
    },
    include: {
      user: { select: { name: true, email: true, district: { select: { name: true } } } }
    }
  });
  console.log(`Found ${electricians.length} verified electricians globally.`);
  electricians.forEach(e => {
    console.log(`- ${e.user.name} | District: ${e.user.district?.name || 'Unknown'}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
