import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { SERVICE_CATEGORIES } from "@/constants/services";

/**
 * PRODUCTION DATABASE SYNC / SEEDER
 * This route ensures the platform has the professional profiles required for production testing.
 */
export async function GET(req: NextRequest) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    if (!supabaseUrl || !supabaseKey || supabaseKey === 'YOUR_SUPABASE_SERVICE_ROLE_KEY') {
        return NextResponse.json({ 
            success: false, 
            error: "Supabase Service Role Key is missing. Please ensure it is set in .env.local" 
        }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const logs: string[] = [];

    try {
        logs.push("🚀 Starting Strategic Production Seeding...");

        // 1. Sync All 18 Categories First
        for (const cat of SERVICE_CATEGORIES) {
            await supabase.from('service_categories').upsert({
                category_name: cat.name,
                icon: cat.iconName || 'Zap',
                status: 'active'
            }, { onConflict: 'category_name' });
        }
        logs.push("✅ All 18 Service Categories Synced.");

        // 2. Define Production Accounts
        const productionAccounts = [
            {
                email: "allaboutdanyalkhan@ambitasker.pk",
                fullName: "Danyal Khan",
                role: "user",
                city: "Haripur",
                address: "1088",
                phone: "03001234567"
            },
            {
                email: "haroon@ambitasker.pk",
                fullName: "Muhammad Haroon",
                role: "provider",
                city: "Haripur",
                address: "Khalabat Township",
                phone: "03112345678"
            },
            {
                email: "admin@ambitasker.pk",
                fullName: "AmbiTasker Admin",
                role: "admin",
                city: "Islamabad",
                address: "Command Center",
                phone: "03223456789"
            }
        ];

        for (const acc of productionAccounts) {
            // A. Create Auth User if doesn't exist
            logs.push(`🔍 Checking Auth account for ${acc.email}...`);
            const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
            let authUser = userData?.users.find(u => u.email === acc.email);

            if (!authUser) {
                const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
                    email: acc.email,
                    password: "password123",
                    email_confirm: true,
                    user_metadata: { full_name: acc.fullName, role: acc.role }
                });
                if (createError) {
                    logs.push(`⚠️ Auth Create Error for ${acc.email}: ${createError.message}`);
                } else {
                    authUser = newUser.user;
                    logs.push(`✨ Auth Account Created for ${acc.email}.`);
                }
            } else {
                logs.push(`✅ Auth Account Exists for ${acc.email}.`);
            }

            if (!authUser) continue;

            // B. Upsert Profile
            const { data: profile, error: pErr } = await supabase
                .from('profiles')
                .upsert({
                    id: authUser.id,
                    full_name: acc.fullName,
                    email: acc.email,
                    role: acc.role,
                    district: acc.city,
                    area: acc.address,
                    phone: acc.phone,
                    account_status: 'active',
                    updated_at: new Date().toISOString()
                }, { onConflict: 'id' })
                .select()
                .single();

            if (pErr) {
                logs.push(`❌ Error seeding profile ${acc.email}: ${pErr.message}`);
                continue;
            }

            // C. Role Specific Seeding
            if (acc.role === 'user' || acc.role === 'USER') {
                await supabase.from('users_details').upsert({
                    user_id: profile.id,
                    address: acc.address,
                    city: acc.city
                }, { onConflict: 'user_id' });
                logs.push(`👤 Danyal Khan (User) Initialized in Haripur.`);
            }

            if (acc.role === 'provider' || acc.role === 'PROVIDER') {
                // Fetch first category for initial assignment
                const { data: qCat } = await supabase.from('service_categories').select('id').limit(1).single();
                
                await supabase.from('providers').upsert({
                    id: profile.id,
                    service_category: qCat?.id,
                    professional_title: 'Certified Service Specialist',
                    service_description: 'Expert professional with over 10 years of experience in Haripur and surrounding areas.',
                    rating: 4.9,
                    hourly_rate: 2500,
                    availability_status: true,
                    approval_status: 'approved',
                    experience_years: 12
                }, { onConflict: 'id' });

                logs.push(`🛠️ Muhammad Haroon (Provider) Initialized.`);
            }

            if (acc.role === 'admin' || acc.role === 'ADMIN') {
                logs.push(`🛡️ Admin Access Node Initialized.`);
            }
        }

        return NextResponse.json({ 
            success: true, 
            message: "Production environment successfully initialized.",
            logs 
        });

    } catch (error: any) {
        console.error("Critical Seeding Error:", error);
        return NextResponse.json({ success: false, error: error.message, logs }, { status: 500 });
    }
}
