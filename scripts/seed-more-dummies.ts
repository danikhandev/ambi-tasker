import 'dotenv/config';
import { PrismaClient, VerificationStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { prisma } from '../services/prisma';

async function main() {
    const passwordHash = await bcrypt.hash('12345678', 10);

    // Find location context
    const country = await prisma.country.findFirst({ where: { code: 'PK' } });
    if (!country) throw new Error("Country PK not found. Run previous seed first.");
    
    const province = await prisma.province.findFirst({ where: { name: 'Khyber Pakhtunkhwa', countryId: country.id } });
    if (!province) throw new Error("Province not found.");

    const district = await prisma.district.findFirst({ where: { name: 'Haripur', provinceId: province.id } });
    if (!district) throw new Error("District not found.");

    const city = await prisma.city.findFirst({ where: { name: 'Haripur City', districtId: district.id } });
    if (!city) throw new Error("City not found.");

    const area = await prisma.area.findFirst({ where: { name: 'Central Haripur', cityId: city.id } });
    if (!area) throw new Error("Area not found.");

    console.log("Seeding User: Danyal Khan...");
    const user = await prisma.user.upsert({
        where: { email: 'danyalkhan@gmail.com' },
        update: {
            name: 'Danyal Khan',
            passwordHash,
            role: 'USER',
            isActive: true,
            isEmailVerified: true,
            isPhoneVerified: true,
            districtId: district.id,
            cityId: city.id,
            areaId: area.id,
        },
        create: {
            name: 'Danyal Khan',
            email: 'danyalkhan@gmail.com',
            passwordHash,
            role: 'USER',
            isActive: true,
            isEmailVerified: true,
            isPhoneVerified: true,
            districtId: district.id,
            cityId: city.id,
            areaId: area.id,
        }
    });
    console.log(`User created/updated: ${user.email}`);

    const providersData = [
        {
            name: 'Mohib Ullah',
            email: 'mohibullah@test.com',
            service: 'Electrician',
            icon: 'Zap' // just illustrative
        },
        {
            name: 'Haroon',
            email: 'haroon@test.com',
            service: 'Plumber',
            icon: 'Droplet'
        }
    ];

    for (const p of providersData) {
        console.log(`Seeding Provider: ${p.name}...`);
        
        const provUser = await prisma.user.upsert({
            where: { email: p.email },
            update: {
                name: p.name,
                passwordHash,
                role: 'PROVIDER',
                isActive: true,
                isEmailVerified: true,
                isPhoneVerified: true,
                districtId: district.id,
                cityId: city.id,
                areaId: area.id,
            },
            create: {
                name: p.name,
                email: p.email,
                passwordHash,
                role: 'PROVIDER',
                isActive: true,
                isEmailVerified: true,
                isPhoneVerified: true,
                districtId: district.id,
                cityId: city.id,
                areaId: area.id,
            }
        });

        const profile = await prisma.providerProfile.upsert({
            where: { userId: provUser.id },
            update: {
                verificationStatus: VerificationStatus.VERIFIED,
                hourlyRate: 1200,
                isAvailable: true,
                skills: [p.service],
                servicesList: JSON.stringify([
                    { id: '1', title: `${p.service} Troubleshooting`, price: 1000, type: 'HOURLY' },
                    { id: '2', title: `Full ${p.service} Checkup`, price: 3000, type: 'FIXED' }
                ])
            },
            create: {
                userId: provUser.id,
                professionalTitle: p.service,
                serviceDescription: `Providing professional ${p.service} services in Haripur with top-notch quality and satisfaction guaranteed.`,
                hourlyRate: 1200,
                experienceYears: 8,
                isAvailable: true,
                verificationStatus: VerificationStatus.VERIFIED,
                skills: [p.service],
                servicesList: JSON.stringify([
                    { id: '1', title: `${p.service} Troubleshooting`, price: 1000, type: 'HOURLY' },
                    { id: '2', title: `Full ${p.service} Checkup`, price: 3000, type: 'FIXED' }
                ])
            }
        });

        await prisma.providerProfile.update({
            where: { userId: provUser.id },
            data: {
                serviceAreas: {
                    connect: [{ id: area.id }]
                }
            }
        });

        // Ensure global Service object is also accessible/exists to match search APIs
        const existingCategoryService = await prisma.service.findFirst({
            where: { name: p.service }
        });

        if (!existingCategoryService) {
            await prisma.service.create({
                data: {
                    name: p.service,
                    category: 'Home Repair',
                    price: 1200,
                    description: `General ${p.service} categories`,
                    icon: p.icon,
                    isActive: true
                }
            });
            console.log(`Created global service category for: ${p.service}`);
        }

        console.log(`Provider created/updated: ${provUser.email} with profile ID: ${profile.id}`);
    }
}

main()
    .catch(e => {
        console.error("Migration Failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
