const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  const { data, error } = await supabase.from('posts').select('id, content, location').order('created_at', { ascending: false }).limit(3);
  if (error) {
    console.error('Error fetching posts:', error);
  } else {
    console.log('Latest posts:');
    for (const p of data) {
      console.log(`ID: ${p.id}`);
      console.log(`Content: ${p.content}`);
      console.log(`Location:`, p.location, `(Type: ${typeof p.location})`);
      console.log('---');
    }
  }
}

check();
