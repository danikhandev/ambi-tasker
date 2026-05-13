import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import "dotenv/config";

const pool = new pg.Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: true
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const servicesData = [
  // 1) Mechanic
  { category: "Mechanic", name: "Engine Diagnostics", price: 2500, description: "Advanced engine diagnostics and scanning" },
  { category: "Mechanic", name: "Brake & Suspension Repair", price: 4000, description: "Complete brake system and suspension overhaul" },
  { category: "Mechanic", name: "General Tuning", price: 2000, description: "Standard engine tuning and oil check" },

  // 2) Electrician
  { category: "Electrician", name: "Wiring & Circuit Repair", price: 3000, description: "Expert electrical wiring and circuit troubleshooting" },
  { category: "Electrician", name: "Fan & Light Installation", price: 800, description: "Installation of ceiling fans and light fixtures" },
  { category: "Electrician", name: "UPS & Inverter Maintenance", price: 1500, description: "Maintenance and repair of UPS and battery systems" },

  // 3) Plumber
  { category: "Plumber", name: "Leakage & Pipe Repair", price: 1500, description: "Fixing water leakages and pipe cracks" },
  { category: "Plumber", name: "Bathroom Fixture Installation", price: 3500, description: "Installation of taps, showers, and commodes" },
  { category: "Plumber", name: "Motor & Pump Repair", price: 2500, description: "Repairing water motors and pressure pumps" },

  // 4) Painting
  { category: "Painting", name: "Interior Wall Painting", price: 15000, description: "Complete interior wall painting service" },
  { category: "Painting", name: "Exterior & Weather Sheet", price: 25000, description: "Protective exterior painting and weather sheet application" },
  { category: "Painting", name: "Wood Polish & Varnish", price: 8000, description: "Polishing and varnishing wooden furniture and doors" },

  // 5) Appliance Repair
  { category: "Appliance Repair", name: "Refrigerator & Freezer Repair", price: 3500, description: "Repairing gas leaks, compressors, and thermostats" },
  { category: "Appliance Repair", name: "Washing Machine Service", price: 2500, description: "Servicing and repairing automatic and manual washers" },

  // 6) Construction
  { category: "Construction", name: "General Construction", price: 500000, description: "Gray structure construction and civil work" },
  { category: "Construction", name: "Home Renovation", price: 100000, description: "Modernizing and renovating existing home structures" },
  { category: "Construction", name: "Concrete Work", price: 20000, description: "Concrete slabs, pillars, and foundation work" },
  { category: "Construction", name: "Tile & Marble Fitting", price: 15000, description: "Professional floor and wall tiling/marble work" },
  { category: "Construction", name: "Ceiling Design", price: 25000, description: "False ceiling, gypsum, and decorative designs" },

  // 7) AC Installation
  { category: "AC Service", name: "AC Installation", price: 8000, description: "Standard split AC installation and mounting" },

  // 8) Solar Installation
  { category: "Solar Installation", name: "Solar Panel Setup", price: 15000, description: "Complete installation of solar panels and racks" },
  { category: "Solar Installation", name: "Inverter Programming", price: 5000, description: "Configuration and programming of solar inverters" },
  { category: "Solar Installation", name: "Battery Health Check", price: 2000, description: "Testing and maintaining solar battery banks" },

  // 9) CCTV Installation
  { category: "Security", name: "CCTV Installation", price: 10000, description: "Setting up cameras, DVRs, and network monitoring" },

  // 10) Security
  { category: "Security", name: "Guard Services", price: 35000, description: "Professional security guard deployment" },
  { category: "Security", name: "Smart Lock Installation", price: 5000, description: "Installing digital and biometric smart locks" },

  // 11) Gardening
  { category: "Gardening", name: "Lawn Mowing & Trimming", price: 2000, description: "Grass cutting and aesthetic hedge trimming" },
  { category: "Gardening", name: "Plantation & Soil Care", price: 3000, description: "New plantation and soil nutrient management" },
  { category: "Gardening", name: "Pest Control for Gardens", price: 4000, description: "Eliminating pests and insects from gardens" },

  // 12) Cleaning
  { category: "Cleaning", name: "Full House Deep Cleaning", price: 12000, description: "Top-to-bottom comprehensive house cleaning" },
  { category: "Cleaning", name: "Water Tank Cleaning", price: 3000, description: "Mechanical and chemical cleaning of water tanks" },
  { category: "Cleaning", name: "Sofa & Carpet Cleaning", price: 5000, description: "Steam cleaning of sofas, chairs, and carpets" },

  // 13) Automotive
  { category: "Automotive", name: "Car Wash & Detailing", price: 3000, description: "Interior and exterior car detailing and waxing" },
  { category: "Automotive", name: "Oil & Filter Change", price: 1500, description: "Standard engine oil and filter replacement" },
  { category: "Automotive", name: "Battery Replacement", price: 1000, description: "New battery installation and health check" },
  { category: "Automotive", name: "Car Modification", price: 20000, description: "Custom aesthetics and performance modifications" },

  // 14) Health & Medical
  { category: "Health & Medical", name: "Home Nursing Care", price: 3000, description: "At-home nursing and patient monitoring services" },
  { category: "Health & Medical", name: "Physiotherapy Sessions", price: 2500, description: "Professional physical therapy and rehabilitation" },
  { category: "Health & Medical", name: "Lab Test Sample Collection", price: 500, description: "Hygienic collection of lab samples from home" },

  // 15) Emergency Assistance
  { category: "Emergency Assistance", name: "Roadside Recovery", price: 5000, description: "Towing and emergency mechanical help on road" },
  { category: "Emergency Assistance", name: "Fire Safety Equipment", price: 10000, description: "Installation and maintenance of fire extinguishers" },

  // 16) Education Services
  { category: "Education Services", name: "Home Tuition (K-12)", price: 8000, description: "Academic tutoring for school and college students" },
  { category: "Education Services", name: "Language Learning", price: 5000, description: "English, Arabic, or other language proficiency courses" },
  { category: "Education Services", name: "Computer & IT Skills", price: 6000, description: "Training in basic computing, MS Office, or coding" },

  // 17) Event Management
  { category: "Event Management", name: "Catering & Food Setup", price: 50000, description: "Professional catering and buffet management" },
  { category: "Event Management", name: "Decoration & Lighting", price: 30000, description: "Thematic decorations and ambient lighting" },
  { category: "Event Management", name: "Photography & Videography", price: 40000, description: "Digital coverage of events with high-res edits" },

  // 18) Transport Services
  { category: "Transport Services", name: "House Shifting (Movers)", price: 25000, description: "Safe packing and moving of household goods" },
  { category: "Transport Services", name: "Cargo & Delivery", price: 2000, description: "Local and inter-city cargo transportation" },
  { category: "Transport Services", name: "Inter-city Car Rental", price: 8000, description: "Rent a car with driver for inter-city travel" },

  // 19) Beauty & Salon
  { category: "Beauty & Salon", name: "Haircut & Styling", price: 1500, description: "Professional haircuts and grooming at home" },
  { category: "Beauty & Salon", name: "Bridal/Party Makeup", price: 10000, description: "Expert makeup artists for special occasions" },
  { category: "Beauty & Salon", name: "Skin Care & Facials", price: 5000, description: "Facial treatments and dermatological care" },

  // 20) Tour
  { category: "Tour", name: "International Flight Booking", price: 500, description: "Assistance with international flight reservations" },
  { category: "Tour", name: "Tour Packages", price: 100000, description: "Customized local and international tour plans" },
  { category: "Tour", name: "Tour Guides", price: 5000, description: "Professional guides for historic and scenic sites" },

  // 21) Agriculture
  { category: "Agriculture", name: "Machinery and equipments", price: 15000, description: "Rent or repair agricultural machinery" },
  { category: "Agriculture", name: "Irrigation", price: 10000, description: "Setting up and maintaining irrigation systems" },
  { category: "Agriculture", name: "Harvesting", price: 20000, description: "Professional harvesting and crop management" },
  { category: "Agriculture", name: "Water Pump Installation", price: 25000, description: "Installing deep wells and turbine pumps" },
];

async function main() {
  console.log("🌱 Seeding production services...");
  
  for (const s of servicesData) {
    const id = `svc-${s.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    await prisma.service.upsert({
      where: { id },
      update: { 
        price: s.price, 
        description: s.description, 
        category: s.category,
        isActive: true 
      },
      create: {
        id,
        name: s.name,
        category: s.category,
        price: s.price,
        description: s.description,
        isActive: true
      }
    });
  }

  console.log(`✅ Successfully seeded ${servicesData.length} production services.`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
