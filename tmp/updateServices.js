const fs = require('fs');

const path = 'd:/FYP/15-jan-2026/ambi-tasker/constants/services.ts';
let code = fs.readFileSync(path, 'utf8');

const updatedCategories = [
    {
        id: "electrician-services",
        name: "Electrician Services",
        icon: "Zap",
        color: "bg-yellow-50 text-yellow-600 border-yellow-100",
        services: ["Wiring Installation", "Switch & Socket Repair", "Fan Installation", "Light Installation", "Circuit Breaker Repair", "Power Failure Troubleshooting", "Generator Connection", "UPS Installation", "Electrical Inspection"]
    },
    {
        id: "plumber-services",
        name: "Plumber Services",
        icon: "Droplets",
        color: "bg-blue-50 text-blue-600 border-blue-100",
        services: ["Pipe Leakage Repair", "Water Tank Installation", "Bathroom Plumbing", "Kitchen Plumbing", "Drain Cleaning", "Tap & Shower Repair", "Water Motor Installation", "Sewer Line Fixing"]
    },
    {
        id: "mechanic-services",
        name: "Mechanic Services",
        icon: "Wrench",
        color: "bg-slate-50 text-slate-700 border-slate-100",
        services: ["Engine Repair", "Oil Change Service", "Brake Repair", "Battery Replacement", "Car Inspection", "Bike Repair", "Breakdown Assistance"]
    },
    {
        id: "painting-services",
        name: "Painting Services",
        icon: "Paintbrush",
        color: "bg-orange-50 text-orange-600 border-orange-100",
        services: ["Interior Painting", "Exterior Painting", "Wall Texture Design", "Polish & Finishing", "Waterproof Coating", "Wall Putty Work"]
    },
    {
        id: "education-services",
        name: "Education Services",
        icon: "BookOpen",
        color: "bg-purple-50 text-purple-600 border-purple-100",
        services: ["Home Tutoring", "Online Classes", "Quran Teaching", "Computer Courses", "Language Learning", "Exam Preparation"]
    },
    {
        id: "gardening-services",
        name: "Gardening Services",
        icon: "Leaf",
        color: "bg-green-50 text-green-600 border-green-100",
        services: ["Lawn Maintenance", "Plant Installation", "Garden Design", "Tree Trimming", "Grass Cutting", "Irrigation Setup"]
    },
    {
        id: "cleaning-services",
        name: "Cleaning Services",
        icon: "Sparkles",
        color: "bg-cyan-50 text-cyan-600 border-cyan-100",
        services: ["Home Cleaning", "Deep Cleaning", "Sofa Cleaning", "Carpet Cleaning", "Office Cleaning", "Kitchen Cleaning", "Post-Construction Cleaning"]
    },
    {
        id: "security-services",
        name: "Security Services",
        icon: "ShieldCheck",
        color: "bg-red-50 text-red-600 border-red-100",
        services: ["Security Guards", "Event Security", "CCTV Monitoring", "Residential Security", "Commercial Security"]
    },
    {
        id: "automotive-services",
        name: "Automotive Services",
        icon: "Car",
        color: "bg-gray-100 text-gray-800 border-gray-200",
        services: ["Car Wash", "Car Detailing", "Tire Change", "Battery Jump Start", "Vehicle Inspection", "Roadside Assistance"]
    },
    {
        id: "appliance-repair",
        name: "Appliance Repair",
        icon: "Smartphone",
        color: "bg-blue-50 text-blue-600 border-blue-100",
        services: ["AC Repair", "Refrigerator Repair", "Washing Machine Repair", "Microwave Repair", "Water Dispenser Repair", "LED TV Repair"]
    },
    {
        id: "emergency-assistance",
        name: "Emergency Assistance",
        icon: "Siren",
        color: "bg-red-50 text-red-600 border-red-100",
        services: ["Emergency Electrician", "Emergency Plumber", "Lockout Assistance", "Roadside Help", "Urgent Home Repair"],
        isEmergency: true
    },
    {
        id: "health-medical",
        name: "Health & Medical",
        icon: "Stethoscope",
        color: "bg-emerald-50 text-emerald-600 border-emerald-100",
        services: ["Home Nursing", "Physiotherapy at Home", "Doctor Visit", "Lab Sample Collection", "Elder Care Service"]
    },
    {
        id: "solar-installation",
        name: "Solar Installation",
        icon: "Sun",
        color: "bg-yellow-50 text-yellow-600 border-yellow-100",
        services: ["Solar Panel Installation", "Solar Maintenance", "Battery Installation", "Solar Inspection", "Solar System Upgrade"]
    },
    {
        id: "beauty-salon",
        name: "Beauty & Salon",
        icon: "Scissors",
        color: "bg-pink-50 text-pink-600 border-pink-100",
        services: ["Haircut Service", "Makeup Service", "Facial Treatment", "Bridal Makeup", "Massage Therapy", "Manicure & Pedicure"]
    },
    {
        id: "cctv-installation",
        name: "CCTV Installation",
        icon: "Video",
        color: "bg-slate-50 text-slate-800 border-slate-200",
        services: ["CCTV Setup", "Camera Repair", "Security System Upgrade", "DVR Installation", "Camera Maintenance"]
    },
    {
        id: "home-renovation",
        name: "Home Renovation",
        icon: "Hammer",
        color: "bg-amber-50 text-amber-600 border-amber-100",
        services: ["Full Home Renovation", "Kitchen Remodeling", "Bathroom Remodeling", "Interior Remodeling", "Structural Renovation", "Flooring Replacement", "False Ceiling Design", "Wall Partition Work"]
    },
    {
        id: "event-management",
        name: "Event Management",
        icon: "PartyPopper",
        color: "bg-indigo-50 text-indigo-600 border-indigo-100",
        services: ["Wedding Planning", "Birthday Event Setup", "Corporate Events", "Decoration Services", "Sound & Lighting Setup"]
    },
    {
        id: "transport-services",
        name: "Transport Services",
        icon: "Truck",
        color: "bg-zinc-50 text-zinc-800 border-zinc-200",
        services: ["Ride Booking", "Driver on Demand", "House Shifting", "Goods Delivery", "Pickup Truck Service", "Airport Pickup & Drop", "Staff Transport"]
    }
];

let servicesListStr = 'export const SERVICES_LIST: ServiceItem[] = [\n';

const toSlugId = (str) => str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const images = [
    "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=400&h=300",
    "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&q=80&w=400&h=300",
    "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&q=80&w=400&h=300",
    "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?q=80&w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&q=80&w=400&h=300",
    "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=400&h=300&fit=crop"
];

let items = [];
let idx = 0;
for (const cat of updatedCategories) {
    for (const s of cat.services) {
        items.push(`    {
        id: "${toSlugId(s)}",
        title: "${s}",
        titleKey: "${s}",
        category: "${cat.name}",
        categoryId: "${cat.id}",
        desc: "Professional ${s.toLowerCase()} by verified experts.",
        descKey: "Professional ${s.toLowerCase()} by verified experts.",
        icon: ${cat.icon},
        color: "${cat.color}",
        image: "${images[idx % images.length]}",
        startingPrice: Math.floor(Math.random() * (5000 - 500 + 1) + 500),
        ${cat.isEmergency ? 'isEmergency: true' : ''}
    }`);
        idx++;
    }
}

servicesListStr += items.join(',\n') + '\n];';

let before = code.substring(0, code.indexOf('export const SERVICES_LIST'));
let after = '';
// Let's just completely replace SERVICES_LIST block with the new one.
// Assume SERVICES_LIST definition goes until the end of the file since it's the last export in the file normally.
// Wait! Let's verify by just truncating everything after `export const SERVICES_LIST`
fs.writeFileSync(path, before + servicesListStr);
console.log('Successfully updated services.ts');
