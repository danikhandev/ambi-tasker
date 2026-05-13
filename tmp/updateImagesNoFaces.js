const fs = require('fs');
const path = 'd:/FYP/15-jan-2026/ambi-tasker/constants/services.ts';
let code = fs.readFileSync(path, 'utf8');

const verifiedImages = {
    // ⚡ Electrician Services
    "wiring-installation": "https://images.unsplash.com/photo-1558002038-1055e2e28ed1?auto=format&fit=crop&q=80&w=400&h=300",
    "switch-socket-repair": "https://images.unsplash.com/photo-1555963966-b7ae5404b6ed?auto=format&fit=crop&q=80&w=400&h=300",
    "fan-installation": "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=400&h=300",
    "light-installation": "https://images.unsplash.com/photo-1565814329452-e1432bc13e8d?auto=format&fit=crop&q=80&w=400&h=300",
    "circuit-breaker-repair": "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&q=80&w=400&h=300",
    "power-failure-troubleshooting": "https://images.unsplash.com/photo-1581093458791-9d42e3c7e117?auto=format&fit=crop&q=80&w=400&h=300",
    "generator-connection": "https://images.unsplash.com/photo-1603988363607-e1e4a66d82c6?auto=format&fit=crop&q=80&w=400&h=300",
    "ups-installation": "https://images.unsplash.com/photo-1569012871812-f38ee64cd54c?auto=format&fit=crop&q=80&w=400&h=300",
    "electrical-inspection": "https://images.unsplash.com/photo-1454165833767-027ffea9e77b?auto=format&fit=crop&q=80&w=400&h=300",

    // 🚰 Plumber Services
    "pipe-leakage-repair": "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=400&h=300",
    "water-tank-installation": "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&q=80&w=400&h=300",
    "bathroom-plumbing": "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=400&h=300",
    "kitchen-plumbing": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&q=80&w=400&h=300",
    "drain-cleaning": "https://images.unsplash.com/photo-1621213054174-88aa38ba7372?auto=format&fit=crop&q=80&w=400&h=300",
    "tap-shower-repair": "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=400&h=300",
    "water-motor-installation": "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&q=80&w=400&h=300",
    "sewer-line-fixing": "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=400&h=300",

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
    "wall-putty-work": "https://images.unsplash.com/photo-1525909002-1b05e0c869d8?auto=format&fit=crop&q=80&w=400&h=300",

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
    "tree-trimming": "https://images.unsplash.com/photo-1599591410651-6893700072e5?auto=format&fit=crop&q=80&w=400&h=300",
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

let count = 0;

for (const [id, imgUrl] of Object.entries(verifiedImages)) {
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

fs.writeFileSync(path, code);
console.log(`Updated ${count} service images successfully.`);
