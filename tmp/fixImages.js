const fs = require('fs');
const path = 'd:/FYP/15-jan-2026/ambi-tasker/constants/services.ts';
let code = fs.readFileSync(path, 'utf8');

// Comprehensive image mapping: service id -> relevant Unsplash image
const imageMap = {
    // ⚡ Electrician Services
    "wiring-installation": "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=400&h=300",
    "switch-socket-repair": "https://images.unsplash.com/photo-1558002038-1055e2e28ed1?auto=format&fit=crop&q=80&w=400&h=300",
    "fan-installation": "https://images.unsplash.com/photo-1585338107529-13afc25806f9?auto=format&fit=crop&q=80&w=400&h=300",
    "light-installation": "https://images.unsplash.com/photo-1565814329452-e1432bc13e8d?auto=format&fit=crop&q=80&w=400&h=300",
    "circuit-breaker-repair": "https://images.unsplash.com/photo-1555963966-b7ae5404b6ed?auto=format&fit=crop&q=80&w=400&h=300",
    "power-failure-troubleshooting": "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&q=80&w=400&h=300",
    "generator-connection": "https://images.unsplash.com/photo-1581093458791-9d42e3c7e117?auto=format&fit=crop&q=80&w=400&h=300",
    "ups-installation": "https://images.unsplash.com/photo-1620714223084-8fcacc6dfd8d?auto=format&fit=crop&q=80&w=400&h=300",
    "electrical-inspection": "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&q=80&w=400&h=300",

    // 🚰 Plumber Services
    "pipe-leakage-repair": "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&q=80&w=400&h=300",
    "water-tank-installation": "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&q=80&w=400&h=300",
    "bathroom-plumbing": "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=400&h=300",
    "kitchen-plumbing": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&q=80&w=400&h=300",
    "drain-cleaning": "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&q=80&w=400&h=300",
    "tap-shower-repair": "https://images.unsplash.com/photo-1564540586988-aa4e53ab3154?auto=format&fit=crop&q=80&w=400&h=300",
    "water-motor-installation": "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&q=80&w=400&h=300",
    "sewer-line-fixing": "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&q=80&w=400&h=300",

    // 🔧 Mechanic Services
    "engine-repair": "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&q=80&w=400&h=300",
    "oil-change-service": "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&q=80&w=400&h=300",
    "brake-repair": "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?auto=format&fit=crop&q=80&w=400&h=300",
    "battery-replacement": "https://images.unsplash.com/photo-1620714223084-8fcacc6dfd8d?auto=format&fit=crop&q=80&w=400&h=300",
    "car-inspection": "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&q=80&w=400&h=300",
    "bike-repair": "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?auto=format&fit=crop&q=80&w=400&h=300",
    "breakdown-assistance": "https://images.unsplash.com/photo-1504439468489-c8920d796a29?auto=format&fit=crop&q=80&w=400&h=300",

    // 🎨 Painting Services
    "interior-painting": "https://images.unsplash.com/photo-1589939705384-5185138a047a?auto=format&fit=crop&q=80&w=400&h=300",
    "exterior-painting": "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&q=80&w=400&h=300",
    "wall-texture-design": "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?auto=format&fit=crop&q=80&w=400&h=300",
    "polish-finishing": "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=400&h=300",
    "waterproof-coating": "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=400&h=300",
    "wall-putty-work": "https://images.unsplash.com/photo-1589939705384-5185138a047a?auto=format&fit=crop&q=80&w=400&h=300",

    // 📚 Education Services
    "home-tutoring": "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&q=80&w=400&h=300",
    "online-classes": "https://images.unsplash.com/photo-1588702547923-7093a6c3ba33?auto=format&fit=crop&q=80&w=400&h=300",
    "quran-teaching": "https://images.unsplash.com/photo-1609599006353-e629aaabfeae?auto=format&fit=crop&q=80&w=400&h=300",
    "computer-courses": "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=400&h=300",
    "language-learning": "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=400&h=300",
    "exam-preparation": "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=400&h=300",

    // 🌿 Gardening Services
    "lawn-maintenance": "https://images.unsplash.com/photo-1558905619-1725426140ad?auto=format&fit=crop&q=80&w=400&h=300",
    "plant-installation": "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&q=80&w=400&h=300",
    "garden-design": "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&q=80&w=400&h=300",
    "tree-trimming": "https://images.unsplash.com/photo-1598902108854-d1446a710c91?auto=format&fit=crop&q=80&w=400&h=300",
    "grass-cutting": "https://images.unsplash.com/photo-1592417817098-8fd3d9eb14a5?auto=format&fit=crop&q=80&w=400&h=300",
    "irrigation-setup": "https://images.unsplash.com/photo-1563299796-17596ed6b017?auto=format&fit=crop&q=80&w=400&h=300",

    // 🧹 Cleaning Services
    "home-cleaning": "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=400&h=300",
    "deep-cleaning": "https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?auto=format&fit=crop&q=80&w=400&h=300",
    "sofa-cleaning": "https://images.unsplash.com/photo-1558317374-067fb5f30001?auto=format&fit=crop&q=80&w=400&h=300",
    "carpet-cleaning": "https://images.unsplash.com/photo-1558317374-067fb5f30001?auto=format&fit=crop&q=80&w=400&h=300",
    "office-cleaning": "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=400&h=300",
    "kitchen-cleaning": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&q=80&w=400&h=300",
    "post-construction-cleaning": "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=400&h=300",

    // 🛡️ Security Services
    "security-guards": "https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&q=80&w=400&h=300",
    "event-security": "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=400&h=300",
    "cctv-monitoring": "https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&q=80&w=400&h=300",
    "residential-security": "https://images.unsplash.com/photo-1558002038-1055e2e28ed1?auto=format&fit=crop&q=80&w=400&h=300",
    "commercial-security": "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=400&h=300",

    // 🚗 Automotive Services
    "car-wash": "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&q=80&w=400&h=300",
    "car-detailing": "https://images.unsplash.com/photo-1507136566006-cfc505b114fc?auto=format&fit=crop&q=80&w=400&h=300",
    "tire-change": "https://images.unsplash.com/photo-1578844251758-2f71da64c96f?auto=format&fit=crop&q=80&w=400&h=300",
    "battery-jump-start": "https://images.unsplash.com/photo-1620714223084-8fcacc6dfd8d?auto=format&fit=crop&q=80&w=400&h=300",
    "vehicle-inspection": "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&q=80&w=400&h=300",
    "roadside-assistance": "https://images.unsplash.com/photo-1504439468489-c8920d796a29?auto=format&fit=crop&q=80&w=400&h=300",

    // 📱 Appliance Repair
    "ac-repair": "https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&q=80&w=400&h=300",
    "refrigerator-repair": "https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&q=80&w=400&h=300",
    "washing-machine-repair": "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&q=80&w=400&h=300",
    "microwave-repair": "https://images.unsplash.com/photo-1574269909862-7e3d7bc94817?auto=format&fit=crop&q=80&w=400&h=300",
    "water-dispenser-repair": "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&q=80&w=400&h=300",
    "led-tv-repair": "https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&q=80&w=400&h=300",

    // 🚨 Emergency Assistance
    "emergency-electrician": "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=400&h=300",
    "emergency-plumber": "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&q=80&w=400&h=300",
    "lockout-assistance": "https://images.unsplash.com/photo-1558002038-1055e2e28ed1?auto=format&fit=crop&q=80&w=400&h=300",
    "roadside-help": "https://images.unsplash.com/photo-1504439468489-c8920d796a29?auto=format&fit=crop&q=80&w=400&h=300",
    "urgent-home-repair": "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=400&h=300",

    // ⚕️ Health & Medical
    "home-nursing": "https://images.unsplash.com/photo-1576765608535-5f04d1e3f2ec?auto=format&fit=crop&q=80&w=400&h=300",
    "physiotherapy-at-home": "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=400&h=300",
    "doctor-visit": "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&q=80&w=400&h=300",
    "lab-sample-collection": "https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&q=80&w=400&h=300",
    "elder-care-service": "https://images.unsplash.com/photo-1576765608535-5f04d1e3f2ec?auto=format&fit=crop&q=80&w=400&h=300",

    // ☀️ Solar Installation
    "solar-panel-installation": "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&q=80&w=400&h=300",
    "solar-maintenance": "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?auto=format&fit=crop&q=80&w=400&h=300",
    "battery-installation": "https://images.unsplash.com/photo-1620714223084-8fcacc6dfd8d?auto=format&fit=crop&q=80&w=400&h=300",
    "solar-inspection": "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&q=80&w=400&h=300",
    "solar-system-upgrade": "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?auto=format&fit=crop&q=80&w=400&h=300",

    // ✂️ Beauty & Salon
    "haircut-service": "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=400&h=300",
    "makeup-service": "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=400&h=300",
    "facial-treatment": "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&q=80&w=400&h=300",
    "bridal-makeup": "https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&q=80&w=400&h=300",
    "massage-therapy": "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=400&h=300",
    "manicure-pedicure": "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&q=80&w=400&h=300",

    // 📹 CCTV Installation
    "cctv-setup": "https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&q=80&w=400&h=300",
    "camera-repair": "https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&q=80&w=400&h=300",
    "security-system-upgrade": "https://images.unsplash.com/photo-1558002038-1055e2e28ed1?auto=format&fit=crop&q=80&w=400&h=300",
    "dvr-installation": "https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&q=80&w=400&h=300",
    "camera-maintenance": "https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&q=80&w=400&h=300",

    // 🏠 Home Renovation
    "full-home-renovation": "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&q=80&w=400&h=300",
    "kitchen-remodeling": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&q=80&w=400&h=300",
    "bathroom-remodeling": "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&q=80&w=400&h=300",
    "interior-remodeling": "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=400&h=300",
    "structural-renovation": "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=400&h=300",
    "flooring-replacement": "https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?auto=format&fit=crop&q=80&w=400&h=300",
    "false-ceiling-design": "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=400&h=300",
    "wall-partition-work": "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=400&h=300",

    // 🎉 Event Management
    "wedding-planning": "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=400&h=300",
    "birthday-event-setup": "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&q=80&w=400&h=300",
    "corporate-events": "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=400&h=300",
    "decoration-services": "https://images.unsplash.com/photo-1478146059778-26028b07395a?auto=format&fit=crop&q=80&w=400&h=300",
    "sound-lighting-setup": "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=400&h=300",

    // 🚚 Transport Services
    "ride-booking": "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&q=80&w=400&h=300",
    "driver-on-demand": "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&q=80&w=400&h=300",
    "house-shifting": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=400&h=300",
    "goods-delivery": "https://images.unsplash.com/photo-1580674285054-bed31e145f59?auto=format&fit=crop&q=80&w=400&h=300",
    "pickup-truck-service": "https://images.unsplash.com/photo-1559297434-fae8a1916a79?auto=format&fit=crop&q=80&w=400&h=300",
    "airport-pickup-drop": "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&q=80&w=400&h=300",
    "staff-transport": "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=400&h=300",
};

// Also set proper starting prices
const priceMap = {
    // Electrician
    "wiring-installation": 5000, "switch-socket-repair": 500, "fan-installation": 1500,
    "light-installation": 1000, "circuit-breaker-repair": 2000, "power-failure-troubleshooting": 1500,
    "generator-connection": 5000, "ups-installation": 3500, "electrical-inspection": 2000,
    // Plumber
    "pipe-leakage-repair": 1000, "water-tank-installation": 8000, "bathroom-plumbing": 3000,
    "kitchen-plumbing": 2500, "drain-cleaning": 1500, "tap-shower-repair": 800,
    "water-motor-installation": 4000, "sewer-line-fixing": 5000,
    // Mechanic
    "engine-repair": 5000, "oil-change-service": 1500, "brake-repair": 2500,
    "battery-replacement": 3000, "car-inspection": 2000, "bike-repair": 1000,
    "breakdown-assistance": 2000,
    // Painting
    "interior-painting": 12000, "exterior-painting": 15000, "wall-texture-design": 5000,
    "polish-finishing": 4000, "waterproof-coating": 8000, "wall-putty-work": 3000,
    // Education
    "home-tutoring": 5000, "online-classes": 3000, "quran-teaching": 3000,
    "computer-courses": 8000, "language-learning": 5000, "exam-preparation": 4000,
    // Gardening
    "lawn-maintenance": 2000, "plant-installation": 3000, "garden-design": 10000,
    "tree-trimming": 1500, "grass-cutting": 1000, "irrigation-setup": 5000,
    // Cleaning
    "home-cleaning": 3000, "deep-cleaning": 8000, "sofa-cleaning": 2500,
    "carpet-cleaning": 2000, "office-cleaning": 5000, "kitchen-cleaning": 2000,
    "post-construction-cleaning": 15000,
    // Security
    "security-guards": 25000, "event-security": 15000, "cctv-monitoring": 8000,
    "residential-security": 20000, "commercial-security": 30000,
    // Automotive
    "car-wash": 1500, "car-detailing": 5000, "tire-change": 1000,
    "battery-jump-start": 1500, "vehicle-inspection": 2000, "roadside-assistance": 3000,
    // Appliance
    "ac-repair": 2500, "refrigerator-repair": 2000, "washing-machine-repair": 2000,
    "microwave-repair": 1000, "water-dispenser-repair": 1500, "led-tv-repair": 2500,
    // Emergency
    "emergency-electrician": 3000, "emergency-plumber": 3000, "lockout-assistance": 2000,
    "roadside-help": 3500, "urgent-home-repair": 4000,
    // Health
    "home-nursing": 5000, "physiotherapy-at-home": 3000, "doctor-visit": 2000,
    "lab-sample-collection": 1000, "elder-care-service": 8000,
    // Solar
    "solar-panel-installation": 50000, "solar-maintenance": 5000, "battery-installation": 15000,
    "solar-inspection": 3000, "solar-system-upgrade": 25000,
    // Beauty
    "haircut-service": 500, "makeup-service": 3000, "facial-treatment": 2000,
    "bridal-makeup": 15000, "massage-therapy": 3000, "manicure-pedicure": 1500,
    // CCTV
    "cctv-setup": 8000, "camera-repair": 2000, "security-system-upgrade": 10000,
    "dvr-installation": 5000, "camera-maintenance": 2000,
    // Home Renovation
    "full-home-renovation": 500000, "kitchen-remodeling": 150000, "bathroom-remodeling": 80000,
    "interior-remodeling": 200000, "structural-renovation": 300000, "flooring-replacement": 50000,
    "false-ceiling-design": 30000, "wall-partition-work": 25000,
    // Events
    "wedding-planning": 150000, "birthday-event-setup": 25000, "corporate-events": 50000,
    "decoration-services": 20000, "sound-lighting-setup": 15000,
    // Transport
    "ride-booking": 500, "driver-on-demand": 2000, "house-shifting": 15000,
    "goods-delivery": 1000, "pickup-truck-service": 3000, "airport-pickup-drop": 3000,
    "staff-transport": 15000,
};

let count = 0;

// Replace images for each service
for (const [id, imgUrl] of Object.entries(imageMap)) {
    // Match the image line that follows the id line
    const idPattern = `id: "${id}"`;
    const idIdx = code.indexOf(idPattern);
    if (idIdx === -1) continue;

    // Find the image line after this id
    const afterId = code.substring(idIdx);
    const imageMatch = afterId.match(/image: "[^"]+"/);
    if (imageMatch) {
        const oldImage = imageMatch[0];
        const newImage = `image: "${imgUrl}"`;
        // Replace only the first occurrence after the id
        const startPos = idIdx + afterId.indexOf(oldImage);
        code = code.substring(0, startPos) + newImage + code.substring(startPos + oldImage.length);
        count++;
    }
}

// Replace prices for each service
let priceCount = 0;
for (const [id, price] of Object.entries(priceMap)) {
    const idPattern = `id: "${id}"`;
    const idIdx = code.indexOf(idPattern);
    if (idIdx === -1) continue;

    const afterId = code.substring(idIdx);
    const priceMatch = afterId.match(/startingPrice: \d+/);
    if (priceMatch) {
        const oldPrice = priceMatch[0];
        const newPrice = `startingPrice: ${price}`;
        const startPos = idIdx + afterId.indexOf(oldPrice);
        code = code.substring(0, startPos) + newPrice + code.substring(startPos + oldPrice.length);
        priceCount++;
    }
}

fs.writeFileSync(path, code);
console.log(`Updated ${count} service images and ${priceCount} prices successfully.`);
