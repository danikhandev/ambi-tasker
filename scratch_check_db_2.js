const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const apps = await prisma.serviceApplication.findMany();
    console.log("Total Applications:", apps.length);
    console.log(apps);
}
main().catch(console.error).finally(() => prisma.$disconnect());
