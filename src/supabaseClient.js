import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mphbzgppiiiheubvrsmd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1waGJ6Z3BwaWlpaGV1YnZyc21kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2MzI3NDgsImV4cCI6MjEwNTIwODc0OH0.UvJxIMPOw1JofbJ7Ay9PM8Gyy421r5WFBnOpmzESeNk';

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
