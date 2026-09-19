import { createClient } from "@supabase/supabase-js";

// TEMPORARY HARDCODED FOR TESTING
const supabaseUrl = "https://mphbzgppiiiheubvrsmd.supabase.co";
const supabaseKey = "PASTE_YOUR_SB_PUBLISHABLE_KEY_HERE";

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
