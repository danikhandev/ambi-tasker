import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function checkBookings() {
  const { data, error } = await supabase.from('bookings').select('*').limit(1);
  if (error) console.error(error);
  else console.log("Bookings columns:", Object.keys(data[0] || {}).join(', '));
}

checkBookings();
