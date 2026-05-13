const fs = require('fs');
const path = 'd:/FYP/15-jan-2026/ambi-tasker/constants/services.ts';
let code = fs.readFileSync(path, 'utf8');

// 1. Update Category Description
code = code.replace(
    /description: "24\/7 immediate assistance for emergencies\.",/g,
    'description: "Immediate help for urgent, time-critical situations and safety emergencies.",'
);

// 2. Define new Emergency Services
const emergencyServices = [
    {
        id: "roadside-assistance",
        title: "Roadside Assistance",
        titleKey: "Roadside Assistance",
        category: "Emergency Assistance",
        categoryId: "emergency-assistance",
        desc: "Immediate help for vehicle issues on the road.",
        descKey: "Immediate help for vehicle issues on the road.",
        icon: 'Siren',
        color: "bg-red-50 text-red-600 border-red-100",
        image: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&q=80&w=400&h=300",
        startingPrice: 3000,
        isEmergency: true
    },
    {
        id: "vehicle-breakdown-help",
        title: "Vehicle Breakdown Help",
        titleKey: "Vehicle Breakdown Help",
        category: "Emergency Assistance",
        categoryId: "emergency-assistance",
        desc: "Urgent mechanical help for broken down vehicles.",
        descKey: "Urgent mechanical help for broken down vehicles.",
        icon: 'Siren',
        color: "bg-red-50 text-red-600 border-red-100",
        image: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&q=80&w=400&h=300",
        startingPrice: 2500,
        isEmergency: true
    },
    {
        id: "battery-jump-start",
        title: "Battery Jump Start",
        titleKey: "Battery Jump Start",
        category: "Emergency Assistance",
        categoryId: "emergency-assistance",
        desc: "Quick jump start service for dead car batteries.",
        descKey: "Quick jump start service for dead car batteries.",
        icon: 'Siren',
        color: "bg-red-50 text-red-600 border-red-100",
        image: "https://images.unsplash.com/photo-1620714223084-8fcacc6dfd8d?auto=format&fit=crop&q=80&w=400&h=300",
        startingPrice: 1500,
        isEmergency: true
    },
    {
        id: "flat-tire-assistance",
        title: "Flat Tire Assistance",
        titleKey: "Flat Tire Assistance",
        category: "Emergency Assistance",
        categoryId: "emergency-assistance",
        desc: "Immediate tire change or repair for flat tires.",
        descKey: "Immediate tire change or repair for flat tires.",
        icon: 'Siren',
        color: "bg-red-50 text-red-600 border-red-100",
        image: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=400&h=300",
        startingPrice: 1000,
        isEmergency: true
    },
    {
        id: "emergency-towing-request",
        title: "Emergency Towing Request",
        titleKey: "Emergency Towing Request",
        category: "Emergency Assistance",
        categoryId: "emergency-assistance",
        desc: "Urgent towing service for disabled vehicles.",
        descKey: "Urgent towing service for disabled vehicles.",
        icon: 'Siren',
        color: "bg-red-50 text-red-600 border-red-100",
        image: "https://images.unsplash.com/photo-1559297434-fae8a1916a79?auto=format&fit=crop&q=80&w=400&h=300",
        startingPrice: 5000,
        isEmergency: true
    },
    {
        id: "ambulance-service",
        title: "Ambulance Service",
        titleKey: "Ambulance Service",
        category: "Emergency Assistance",
        categoryId: "emergency-assistance",
        desc: "Instant ambulance booking for medical emergencies.",
        descKey: "Instant ambulance booking for medical emergencies.",
        icon: 'Siren',
        color: "bg-red-50 text-red-600 border-red-100",
        image: "https://images.unsplash.com/photo-1587741355088-6627f1c10757?auto=format&fit=crop&q=80&w=400&h=300",
        startingPrice: 5000,
        isEmergency: true
    },
    {
        id: "emergency-medical-help",
        title: "Emergency Medical Help",
        titleKey: "Emergency Medical Help",
        category: "Emergency Assistance",
        categoryId: "emergency-assistance",
        desc: "Immediate first aid or medical support.",
        descKey: "Immediate first aid or medical support.",
        icon: 'Siren',
        color: "bg-red-50 text-red-600 border-red-100",
        image: "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=400&h=300",
        startingPrice: 2000,
        isEmergency: true
    },
    {
        id: "fire-emergency-support",
        title: "Fire Emergency Support",
        titleKey: "Fire Emergency Support",
        category: "Emergency Assistance",
        categoryId: "emergency-assistance",
        desc: "Urgent fire safety and support services.",
        descKey: "Urgent fire safety and support services.",
        icon: 'Siren',
        color: "bg-red-50 text-red-600 border-red-100",
        image: "https://images.unsplash.com/photo-1599591410651-6893700072e5?auto=format&fit=crop&q=80&w=400&h=300",
        startingPrice: 1000,
        isEmergency: true
    },
    {
        id: "disaster-rescue-assistance",
        title: "Disaster & Rescue Assistance",
        titleKey: "Disaster & Rescue Assistance",
        category: "Emergency Assistance",
        categoryId: "emergency-assistance",
        desc: "Immediate help for disasters and rescue operations.",
        descKey: "Immediate help for disasters and rescue operations.",
        icon: 'Siren',
        color: "bg-red-50 text-red-600 border-red-100",
        image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=400&h=300",
        startingPrice: 0,
        isEmergency: true
    }
];

// 3. Replace the Emergency block in SERVICES_LIST
// I'll look for the start and end of the emergency items in SERVICES_LIST
const startPattern = 'id: "emergency-electrician"';
const nextBlockPattern = 'id: "home-nursing"';

const startIdx = code.indexOf(startPattern);
const endIdx = code.indexOf(nextBlockPattern);

if (startIdx !== -1 && endIdx !== -1) {
    // Find the opening brace of the first item
    const blockStart = code.lastIndexOf('{', startIdx);
    // Find the closing brace of the last item before the next category
    const blockEnd = code.lastIndexOf('}', endIdx) + 1;

    const newBlockCode = emergencyServices.map(s => {
        return `    {
        id: "${s.id}",
        title: "${s.title}",
        titleKey: "${s.titleKey}",
        category: "${s.category}",
        categoryId: "${s.categoryId}",
        desc: "${s.desc}",
        descKey: "${s.descKey}",
        icon: ${s.icon},
        color: "${s.color}",
        image: "${s.image}",
        startingPrice: ${s.startingPrice},
        isEmergency: true
    },`;
    }).join('\n');

    code = code.substring(0, blockStart) + newBlockCode + code.substring(blockEnd);
    console.log("Successfully replaced Emergency services block.");
} else {
    console.log("Could not find Emergency services block to replace.", { startIdx, endIdx });
}

fs.writeFileSync(path, code);
