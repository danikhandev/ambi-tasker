import { prisma } from "./services/prisma";

async function main() {
  const adminEmail = "adminambitasker@gmail.com";
  
  console.log(`Checking admin with email: ${adminEmail}`);
  
  const admin = await prisma.admin.findUnique({
    where: { email: adminEmail }
  });

  if (admin) {
    console.log(`Found admin: ${admin.name}. Updating name to "Super Admin"...`);
    await prisma.admin.update({
      where: { id: admin.id },
      data: { name: "Super Admin" }
    });
    console.log("Admin name updated successfully.");
    
    // Also update the User record if it exists
    const user = await prisma.user.findUnique({
      where: { email: adminEmail }
    });
    if (user) {
      console.log(`Found User record. Updating name...`);
      await prisma.user.update({
        where: { id: user.id },
        data: { name: "Super Admin" }
      });
      console.log("User name updated successfully.");
    }
  } else {
    console.log("Admin not found.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
