-- ============================================================
-- ambi-tasker CORE SEED DATA (PRODUCTION ALIGNED V3)
-- Purpose: Ensures Haroon (Provider), Danyal (User) and ALL 18 categories exist.
-- Instructions: Run this in your Supabase SQL Editor.
-- ============================================================

-- 1. Populate ALL 18 Service Categories
INSERT INTO public.service_categories (id, category_name, icon, status)
VALUES 
    (gen_random_uuid(), 'Electrician Services', 'Zap', 'active'),
    (gen_random_uuid(), 'Plumber Services', 'Droplets', 'active'),
    (gen_random_uuid(), 'Mechanic Services', 'Wrench', 'active'),
    (gen_random_uuid(), 'Painting Services', 'Paintbrush', 'active'),
    (gen_random_uuid(), 'Education Services', 'BookOpen', 'active'),
    (gen_random_uuid(), 'Gardening Services', 'Leaf', 'active'),
    (gen_random_uuid(), 'Cleaning Services', 'Sparkles', 'active'),
    (gen_random_uuid(), 'Security Services', 'ShieldCheck', 'active'),
    (gen_random_uuid(), 'Automotive Services', 'Car', 'active'),
    (gen_random_uuid(), 'Appliance Repair', 'Smartphone', 'active'),
    (gen_random_uuid(), 'Emergency Assistance', 'Siren', 'active'),
    (gen_random_uuid(), 'Health & Medical', 'Stethoscope', 'active'),
    (gen_random_uuid(), 'Solar Installation', 'Sun', 'active'),
    (gen_random_uuid(), 'Beauty & Salon', 'Scissors', 'active'),
    (gen_random_uuid(), 'CCTV Installation', 'Video', 'active'),
    (gen_random_uuid(), 'Construction & Home Renovation', 'Hammer', 'active'),
    (gen_random_uuid(), 'Event Management', 'PartyPopper', 'active'),
    (gen_random_uuid(), 'Transport Services', 'Truck', 'active')
ON CONFLICT (category_name) DO UPDATE SET status = 'active';

-- 2. Create Danyal (User) Profile
INSERT INTO public.profiles (id, full_name, email, role, phone, district, area, account_status)
VALUES 
    (gen_random_uuid(), 'Danyal Khan', 'allaboutdanyalkhan@ambitasker.pk', 'user', '03001234567', 'Haripur', '1088', 'active')
ON CONFLICT (email) DO UPDATE 
SET full_name = EXCLUDED.full_name, role = 'user', account_status = 'active';

-- 3. Create Haroon (Provider) Profile
INSERT INTO public.profiles (id, full_name, email, role, phone, district, area, account_status)
VALUES 
    (gen_random_uuid(), 'Muhammad Haroon', 'haroon@ambitasker.pk', 'provider', '03112345678', 'Haripur', 'Khalabat Township', 'active')
ON CONFLICT (email) DO UPDATE 
SET full_name = EXCLUDED.full_name, role = 'provider', account_status = 'active';

-- 4. Initialize Haroon as Provider Details
INSERT INTO public.providers (id, service_category, professional_title, service_description, rating, hourly_rate, availability_status, approval_status, experience_years)
VALUES (
    (SELECT id FROM public.profiles WHERE email = 'haroon@ambitasker.pk'),
    (SELECT id FROM public.service_categories WHERE category_name = 'Plumber Services' LIMIT 1),
    'Certified Plumbing & Electrical Specialist',
    'Expert in residential maintenance with over 10 years of professional experience in Haripur and Islamabad.',
    4.9,
    2500,
    true,
    'approved',
    10
)
ON CONFLICT (id) DO UPDATE 
SET professional_title = EXCLUDED.professional_title, service_description = EXCLUDED.service_description, approval_status = 'approved';

-- 5. Initialize Danyal User Details
INSERT INTO public.users_details (user_id, address, city, booking_count)
VALUES (
    (SELECT id FROM public.profiles WHERE email = 'allaboutdanyalkhan@ambitasker.pk'),
    '1088, Haripur',
    'Haripur',
    12
)
ON CONFLICT (user_id) DO UPDATE 
SET address = EXCLUDED.address;

-- 6. Add Services for ALL 18 Categories to show dynamic data
INSERT INTO public.services (provider_id, category_id, title, price, description, image_url, service_status)
VALUES 
    -- ⚡ Electrician
    ((SELECT id FROM public.profiles WHERE email = 'haroon@ambitasker.pk'), (SELECT id FROM public.service_categories WHERE category_name = 'Electrician Services' LIMIT 1), 'Wiring Installation', 5000, 'Residential and commercial wiring.', 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=400&h=300', 'active'),
    ((SELECT id FROM public.profiles WHERE email = 'haroon@ambitasker.pk'), (SELECT id FROM public.service_categories WHERE category_name = 'Electrician Services' LIMIT 1), 'Electrical Repair', 1200, 'Fixture and switch repairs.', 'https://images.unsplash.com/photo-1555963966-b7ae5404b6ed?auto=format&fit=crop&q=80&w=400&h=300', 'active'),
    
    -- 🚰 Plumber
    ((SELECT id FROM public.profiles WHERE email = 'haroon@ambitasker.pk'), (SELECT id FROM public.service_categories WHERE category_name = 'Plumber Services' LIMIT 1), 'Pipe Leakage Repair', 1500, 'Fixing burst pipes and leaks.', 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&q=80&w=400&h=300', 'active'),
    ((SELECT id FROM public.profiles WHERE email = 'haroon@ambitasker.pk'), (SELECT id FROM public.service_categories WHERE category_name = 'Plumber Services' LIMIT 1), 'Water Tank Installation', 9500, 'Overhead tank maintenance.', 'https://images.unsplash.com/photo-1542013936693-884638332954?auto=format&fit=crop&q=80&w=400&h=300', 'active'),
    
    -- 👨‍🔧 Mechanic
    ((SELECT id FROM public.profiles WHERE email = 'haroon@ambitasker.pk'), (SELECT id FROM public.service_categories WHERE category_name = 'Mechanic Services' LIMIT 1), 'Engine Diagnostics', 3000, 'Full car engine checkup.', 'https://images.unsplash.com/photo-1486006396113-ad794cc93623?auto=format&fit=crop&q=80&w=400&h=300', 'active'),
    
    -- 🎨 Painting
    ((SELECT id FROM public.profiles WHERE email = 'haroon@ambitasker.pk'), (SELECT id FROM public.service_categories WHERE category_name = 'Painting Services' LIMIT 1), 'Deep Wall Painting', 15000, 'Full room painting service.', 'https://images.unsplash.com/photo-1589939705384-5185138a0470?auto=format&fit=crop&q=80&w=400&h=300', 'active'),
    
    -- 📚 Education
    ((SELECT id FROM public.profiles WHERE email = 'haroon@ambitasker.pk'), (SELECT id FROM public.service_categories WHERE category_name = 'Education Services' LIMIT 1), 'Math Home Tuition', 8000, 'Grade 9-12 Mathematics.', 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=400&h=300', 'active'),
    
    -- 🏡 Gardening
    ((SELECT id FROM public.profiles WHERE email = 'haroon@ambitasker.pk'), (SELECT id FROM public.service_categories WHERE category_name = 'Gardening Services' LIMIT 1), 'Lawn Mowing & Care', 2000, 'Complete garden maintenance.', 'https://images.unsplash.com/photo-1585320806297-9794b3e3eeae?auto=format&fit=crop&q=80&w=400&h=300', 'active'),
    
    -- 🧹 Cleaning
    ((SELECT id FROM public.profiles WHERE email = 'haroon@ambitasker.pk'), (SELECT id FROM public.service_categories WHERE category_name = 'Cleaning Services' LIMIT 1), 'Deep House Cleaning', 6000, 'Full sanitation service.', 'https://images.unsplash.com/photo-1581578731548-c64695ce6958?auto=format&fit=crop&q=80&w=400&h=300', 'active'),
    
    -- 🛡️ Security
    ((SELECT id FROM public.profiles WHERE email = 'haroon@ambitasker.pk'), (SELECT id FROM public.service_categories WHERE category_name = 'Security Services' LIMIT 1), 'Security Guard Hire', 35000, 'Monthly guard placement.', 'https://images.unsplash.com/photo-1557597774-9d2739f85a94?auto=format&fit=crop&q=80&w=400&h=300', 'active'),
    
    -- 🚗 Automotive
    ((SELECT id FROM public.profiles WHERE email = 'haroon@ambitasker.pk'), (SELECT id FROM public.service_categories WHERE category_name = 'Automotive Services' LIMIT 1), 'Premium Car Wash', 1200, 'Inside out detailing.', 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&q=80&w=400&h=300', 'active'),
    
    -- 🔧 Appliance Repair
    ((SELECT id FROM public.profiles WHERE email = 'haroon@ambitasker.pk'), (SELECT id FROM public.service_categories WHERE category_name = 'Appliance Repair' LIMIT 1), 'AC Servicing', 2500, 'Gas refill and cleaning.', 'https://images.unsplash.com/photo-1581094288338-2314dddb7ecb?auto=format&fit=crop&q=80&w=400&h=300', 'active'),
    
    -- 🚨 Emergency
    ((SELECT id FROM public.profiles WHERE email = 'haroon@ambitasker.pk'), (SELECT id FROM public.service_categories WHERE category_name = 'Emergency Assistance' LIMIT 1), 'Rapid Response Repair', 3000, 'Immediate repair service.', 'https://images.unsplash.com/photo-1587748866751-2f3b97669d58?auto=format&fit=crop&q=80&w=400&h=300', 'active'),
    
    -- ⚕️ Health
    ((SELECT id FROM public.profiles WHERE email = 'haroon@ambitasker.pk'), (SELECT id FROM public.service_categories WHERE category_name = 'Health & Medical' LIMIT 1), 'Nursing Care at Home', 5000, 'Professional elderly care.', 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=400&h=300', 'active'),
    
    -- ☀️ Solar
    ((SELECT id FROM public.profiles WHERE email = 'haroon@ambitasker.pk'), (SELECT id FROM public.service_categories WHERE category_name = 'Solar Installation' LIMIT 1), '5KW Solar Setup', 450000, 'Hybrid solar system.', 'https://images.unsplash.com/photo-1509391366360-fe5bb6521e7c?auto=format&fit=crop&q=80&w=400&h=300', 'active'),
    
    -- ✂️ Beauty
    ((SELECT id FROM public.profiles WHERE email = 'haroon@ambitasker.pk'), (SELECT id FROM public.service_categories WHERE category_name = 'Beauty & Salon' LIMIT 1), 'Bridal Makeup', 25000, 'Full wedding makeover.', 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&q=80&w=400&h=300', 'active'),
    
    -- 📹 CCTV
    ((SELECT id FROM public.profiles WHERE email = 'haroon@ambitasker.pk'), (SELECT id FROM public.service_categories WHERE category_name = 'CCTV Installation' LIMIT 1), '8 Camera HD Setup', 40000, 'Smart surveillance.', 'https://images.unsplash.com/photo-1557597774-9d2739f85a94?auto=format&fit=crop&q=80&w=400&h=300', 'active'),
    
    -- 🏠 Renovation
    ((SELECT id FROM public.profiles WHERE email = 'haroon@ambitasker.pk'), (SELECT id FROM public.service_categories WHERE category_name = 'Construction & Home Renovation' LIMIT 1), 'Kitchen Remodeling', 150000, 'Modern kitchen setup.', 'https://images.unsplash.com/photo-1556911220-e15595b67cd3?auto=format&fit=crop&q=80&w=400&h=300', 'active'),
    
    -- 🎈 Event
    ((SELECT id FROM public.profiles WHERE email = 'haroon@ambitasker.pk'), (SELECT id FROM public.service_categories WHERE category_name = 'Event Management' LIMIT 1), 'Birthday Planning', 10000, 'Themed birthday events.', 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&q=80&w=400&h=300', 'active'),
    
    -- 🚚 Transport
    ((SELECT id FROM public.profiles WHERE email = 'haroon@ambitasker.pk'), (SELECT id FROM public.service_categories WHERE category_name = 'Transport Services' LIMIT 1), 'Car Carrier Service', 12000, 'Inter-city car towing.', 'https://images.unsplash.com/photo-1601758124510-52d02ddb7cbd?auto=format&fit=crop&q=80&w=400&h=300', 'active')
ON CONFLICT DO NOTHING;

-- 7. Ensure System Admin exists
INSERT INTO public.profiles (id, full_name, email, role, avatar_url, account_status)
VALUES (gen_random_uuid(), 'AmbiTasker Admin', 'admin@ambitasker.pk', 'admin', '/admin/system-admin.jpg', 'active')
ON CONFLICT (email) DO UPDATE SET role = 'admin', avatar_url = '/admin/system-admin.jpg';
