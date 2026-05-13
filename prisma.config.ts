import "dotenv/config";
import { defineConfig } from "@prisma/config";

const config = defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL,
  },
  migrations: {
    seed: "npx tsx prisma/seed.ts",
  },
});

export default config;
