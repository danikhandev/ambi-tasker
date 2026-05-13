const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
  let log = "";
  log += "--- DATA AUDIT START ---\n";

  try {
    const districts = await prisma.district.findMany({ include: { province: true } });
    log += `\nDistricts found: ${districts.length}\n`;
    districts.forEach(d => log += `- ${d.name} (${d.id}) in ${d.province.name}\n`);

    const providers = await prisma.providerProfile.findMany({
      include: {
        user: { include: { district: true, area: true } },
        serviceAreas: true
      }
    });

    log += `\nProviders found: ${providers.length}\n`;
    providers.forEach(p => {
      log += `PROVIDER: ${p.user.name} (${p.user.email})\n`;
      log += `  Status: ${p.verificationStatus} | Available: ${p.isAvailable} | Active: ${p.user.isActive}\n`;
      log += `  Location: ${p.user.district?.name || 'No District'} | ${p.user.area?.name || 'No Area'}\n`;
      log += `  Title: ${p.professionalTitle}\n`;
      log += `  Skills: ${JSON.stringify(p.skills)}\n`;
      log += `  ServiceAreas: ${p.serviceAreas.map(a => a.name).join(', ')}\n`;
      log += "--------------------------------------------------\n";
    });

  } catch (e) {
    log += `\nERROR: ${e.message}\n`;
  }

  fs.writeFileSync('audit_results.log', log);
  console.log("Audit complete. Results in audit_results.log");
}

main().catch(console.error).finally(() => prisma.$disconnect());
