import pg from "pg";
import "dotenv/config";

async function main() {
  const pool = new pg.Pool({ 
    connectionString: process.env.DATABASE_URL,
    ssl: true
  });

  console.log("🔍 Checking columns of 'Country' table...");

  try {
    const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Country'
    `);
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await pool.end();
  }
}

main();
