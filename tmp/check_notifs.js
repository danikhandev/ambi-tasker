const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase environment variables.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable() {
  const { data, error } = await supabase
    .from('notifications')
    .select('id')
    .limit(1);

  if (error) {
    if (error.code === '42P01') {
      console.log("TABLE_MISSING");
    } else {
      console.error("Error checking table:", error);
    }
  } else {
    console.log("TABLE_EXISTS");
  }
}

checkTable();
