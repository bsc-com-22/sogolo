
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

// TODO: Replace with your actual Supabase URL and Anon Key
const SUPABASE_URL = (window.__env && window.__env.SUPABASE_URL) || 'https://kauosqegnisajlanwlpz.supabase.co';
const SUPABASE_ANON_KEY = (window.__env && window.__env.SUPABASE_ANON_KEY) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthdW9zcWVnbmlzYWpsYW53bHB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2NjExMjMsImV4cCI6MjA4MDIzNzEyM30.D7BU3ZMX7bZi7cq8xZs5DgnlUz1mUmSn2U0CXtwh_Fk';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
