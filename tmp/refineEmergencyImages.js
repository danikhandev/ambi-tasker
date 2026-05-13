const fs = require('fs');
const path = 'd:/FYP/15-jan-2026/ambi-tasker/constants/services.ts';
let code = fs.readFileSync(path, 'utf8');

const refinedImages = [
    {
        id: "battery-jump-start",
        image: "https://images.unsplash.com/photo-1597711762260-2521c7750171?auto=format&fit=crop&q=80&w=400&h=300"
    },
    {
        id: "emergency-towing-request",
        image: "https://images.unsplash.com/photo-1504439468489-c8920d796a29?auto=format&fit=crop&q=80&w=400&h=300"
    },
    {
        id: "ambulance-service",
        image: "https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&q=80&w=400&h=300"
    },
    {
        id: "fire-emergency-support",
        image: "https://images.unsplash.com/photo-1516057747705-0609711c1b31?auto=format&fit=crop&q=80&w=400&h=300"
    }
];

refinedImages.forEach(s => {
    const idPattern = `id: "${s.id}"`;
    const idIdx = code.indexOf(idPattern);
    if (idIdx !== -1) {
        const afterId = code.substring(idIdx);
        const imageMatch = afterId.match(/image: "[^"]+"/);
        if (imageMatch) {
            const oldImage = imageMatch[0];
            const newImage = `image: "${s.image}"`;
            const startPos = idIdx + afterId.indexOf(oldImage);
            code = code.substring(0, startPos) + newImage + code.substring(startPos + oldImage.length);
        }
    }
});

fs.writeFileSync(path, code);
console.log("Refined 4 emergency service images.");
