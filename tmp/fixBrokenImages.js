const fs = require('fs');
const path = 'd:/FYP/15-jan-2026/ambi-tasker/constants/services.ts';
let code = fs.readFileSync(path, 'utf8');

// Only fix the broken image URLs with known-working ones
const fixMap = {
    // Electrician - broken ones
    "photo-1558002038-1055e2e28ed1": "photo-1621905252507-b35492cc74b4",   // switch/socket - use electrician at panel
    "photo-1585338107529-13afc25806f9": "photo-1565814329452-e1432bc13e8d", // fan - use lighting/ceiling
    "photo-1555963966-b7ae5404b6ed": "photo-1621905251189-08b45d6a269e",   // circuit breaker
    "photo-1473341304170-971dccb5ac1e": "photo-1621905252507-b35492cc74b4", // power failure
    "photo-1581093458791-9d42e3c7e117": "photo-1558618666-fcd25c85f82e",   // generator
    "photo-1620714223084-8fcacc6dfd8d": "photo-1621905251189-08b45d6a269e", // ups installation

    // Plumber - broken ones
    "photo-1504328345606-18bbc8c9d7d1": "photo-1581244277943-fe4a9c777189", // water tank
    "photo-1585704032915-c3400ca199e7": "photo-1584622650111-993a426fbf0a", // drain cleaning
    "photo-1564540586988-aa4e53ab3154": "photo-1581244277943-fe4a9c777189", // tap shower

    // Mechanic
    "photo-1487754180451-c456f719a1fc": "photo-1486262715619-67b85e0b08d3", // oil change
    "photo-1558618666-fcd25c85f82e": "photo-1486262715619-67b85e0b08d3",   // brake/texture
    "photo-1619642751034-765dfdf7c58e": "photo-1486262715619-67b85e0b08d3", // car inspection

    // Painting
    "photo-1562259949-e8e7689d7828": "photo-1589939705384-5185138a047a",   // exterior
    "photo-1513694203232-719a280e022f": "photo-1589939705384-5185138a047a", // polish

    // Gardening
    "photo-1598902108854-d1446a710c91": "photo-1416879595882-3373a0480b5b", // tree trimming
    "photo-1592417817098-8fd3d9eb14a5": "photo-1558905619-1725426140ad",   // grass cutting
    "photo-1563299796-17596ed6b017": "photo-1416879595882-3373a0480b5b",   // irrigation

    // Cleaning
    "photo-1558317374-067fb5f30001": "photo-1628177142898-93e36e4e3a50",   // sofa/carpet cleaning

    // Security
    "photo-1557597774-9d273605dfa9": "photo-1582139329536-e7284fece509",   // cctv monitoring

    // Automotive
    "photo-1507136566006-cfc505b114fc": "photo-1520340356584-f9917d1eea6f", // car detailing
    "photo-1578844251758-2f71da64c96f": "photo-1520340356584-f9917d1eea6f", // tire change

    // Appliance
    "photo-1585771724684-38269d6639fd": "photo-1571175443880-49e1d25b2bc5", // ac repair
    "photo-1626806787461-102c1bfaaea1": "photo-1571175443880-49e1d25b2bc5", // washing machine
    "photo-1574269909862-7e3d7bc94817": "photo-1571175443880-49e1d25b2bc5", // microwave
    "photo-1548839140-29a749e1cf4d": "photo-1571175443880-49e1d25b2bc5",   // water dispenser
    "photo-1593784991095-a205069470b6": "photo-1571175443880-49e1d25b2bc5", // led tv

    // Health
    "photo-1576091160550-2173dba999ef": "photo-1576765608535-5f04d1e3f2ec", // physio
    "photo-1579154204601-01588f351e67": "photo-1505751172876-fa1923c5c528", // lab sample

    // Solar
    "photo-1508514177221-188b1cf16e9d": "photo-1509391366360-2e959784a276", // solar maintenance

    // Beauty
    "photo-1519699047748-de8e457a634e": "photo-1522335789203-aabd1fc54bc9", // bridal
    "photo-1604654894610-df63bc536371": "photo-1560066984-138dadb4c035",   // manicure

    // Renovation
    "photo-1552321554-5fefe8c9ef14": "photo-1484154218962-a197022b5858",   // bathroom
    "photo-1618221195710-dd6b41faaea6": "photo-1484154218962-a197022b5858", // interior/false ceiling
    "photo-1581858726788-75bc0f6a952d": "photo-1484154218962-a197022b5858", // flooring

    // Events
    "photo-1478146059778-26028b07395a": "photo-1530103862676-de8c9debad1d", // decoration
    "photo-1492684223066-81342ee5ff30": "photo-1540575467063-178a50c2df87", // sound/lighting

    // Transport
    "photo-1559297434-fae8a1916a79": "photo-1449965408869-eaa3f722e40d",   // pickup truck  
    "photo-1544620347-c4fd4a3d5957": "photo-1449965408869-eaa3f722e40d",   // staff transport
};

let count = 0;
for (const [oldId, newId] of Object.entries(fixMap)) {
    const regex = new RegExp(oldId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    const matches = code.match(regex);
    if (matches) {
        code = code.replace(regex, newId);
        count += matches.length;
    }
}

fs.writeFileSync(path, code);
console.log(`Fixed ${count} broken image URLs.`);
