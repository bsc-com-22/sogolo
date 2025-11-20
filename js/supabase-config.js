// Supabase Configuration
const SUPABASE_URL = 'https://nwmhyhbgrfexugpggupm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53bWh5aGJncmZleHVncGdndXBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3MjU5ODEsImV4cCI6MjA3ODMwMTk4MX0.YmtdcLLBvQS_gs7KRi3Y2JxCTj-sgNLPy5CiwsQZV-Q';

// Initialize Supabase client
let supabaseClient = null;

// Initialize Supabase when the library is loaded
function initializeSupabase() {
    if (typeof window.supabase !== 'undefined') {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        window.supabaseClient = supabaseClient;
        console.log('Supabase client initialized successfully');
        return supabaseClient;
    } else {
        console.error('Supabase library not loaded. Please include the Supabase script tag.');
        return null;
    }
}

// Auto-initialize if Supabase is already loaded
if (typeof window.supabase !== 'undefined') {
    initializeSupabase();
}
