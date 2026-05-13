import 'dotenv/config';
import { VerificationStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { prisma } from '../services/prisma';

async function main() {
    const passwordHash = await bcrypt.hash('12345678', 10);
    
    // Find or create country PK
    let country = await prisma.country.findFirst({ where: { code: 'PK' } });
    if (!country) {
        country = await prisma.country.create({ data: { name: 'Pakistan', code: 'PK' } });
    }

    // Find or create province KPK
    let province = await prisma.province.findFirst({ where: { name: 'Khyber Pakhtunkhwa', countryId: country.id } });
    if (!province) {
        province = await prisma.province.create({ data: { name: 'Khyber Pakhtunkhwa', countryId: country.id } });
    }

    // Find or create district Haripur
    let district = await prisma.district.findFirst({ where: { name: 'Haripur', provinceId: province.id } });
    if (!district) {
        district = await prisma.district.create({ data: { name: 'Haripur', provinceId: province.id, isActive: true } });
    }

    let city = await prisma.city.findFirst({ where: { name: 'Haripur City', districtId: district.id } });
    if (!city) {
        city = await prisma.city.create({ data: { name: 'Haripur City', districtId: district.id } });
    }

    let area = await prisma.area.findFirst({ where: { name: 'Central Haripur', cityId: city.id } });
    if (!area) {
        area = await prisma.area.create({ data: { name: 'Central Haripur', cityId: city.id, isActive: true } });
    }

    const providers = [
        { name: 'Test Provider 1', email: 'provider1@test.com' },
        { name: 'Test Provider 2', email: 'provider2@test.com' },
        { name: 'Test Provider 3', email: 'provider3@test.com' }
    ];

    for (const p of providers) {
        const u = await prisma.user.upsert({
            where: { email: p.email },
            update: {
                name: p.name,
                passwordHash,
                role: 'PROVIDER',
                isActive: true,
                isEmailVerified: true,
            },
            create: {
                name: p.name,
                email: p.email,
                passwordHash,
                role: 'PROVIDER',
                isActive: true,
                isEmailVerified: true,
                districtId: district.id,
                cityId: city.id,
                areaId: area.id,
            }
        });

        const profile = await prisma.providerProfile.upsert({
            where: { userId: u.id },
            update: {
                verificationStatus: VerificationStatus.VERIFIED,
                hourlyRate: 1500,
                isAvailable: true,
            },
            create: {
                userId: u.id,
                professionalTitle: 'Expert Technician',
                serviceDescription: 'Providing expert test services.',
                hourlyRate: 1500,
                experienceYears: 5,
                isAvailable: true,
                verificationStatus: VerificationStatus.VERIFIED,
            }
        });

        // Ensure service area is linked
        await prisma.providerProfile.update({
            where: { userId: u.id },
            data: {
                serviceAreas: {
                    connect: [{ id: area.id }]
                }
            }
        });

        console.log(`Created provider: ${u.email} with profile ID: ${profile.id}`);
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
