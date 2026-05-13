const fs = require('fs');
const path = 'd:/FYP/15-jan-2026/ambi-tasker/constants/services.ts';
let code = fs.readFileSync(path, 'utf8');

// Replace all Math.floor(Math.random() * ...) with fixed prices based on hash of service
let counter = 0;
const prices = [500, 800, 1000, 1200, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000];
code = code.replace(/Math\.floor\(Math\.random\(\) \* \(5000 - 500 \+ 1\) \+ 500\)/g, () => {
    const price = prices[counter % prices.length];
    counter++;
    return String(price);
});

fs.writeFileSync(path, code);
console.log(`Fixed ${counter} random prices to static values.`);
