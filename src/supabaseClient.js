import { createClient } from "@supabase/supabase-js";

// TEMPORARY HARDCODED FOR TESTING
const supabaseUrl = "https://mphbzgppiiiheubvrsmd.supabase.co";
const supabaseKey = "sb_publishable_HCw0B6kraLfjKW9LEc-6Yg_26WtU7XY";

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;