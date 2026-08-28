import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://njayikstvcernrnwqsci.supabase.co";

const SUPABASE_ANON_KEY = "sb_publishable_2dhn7tdbB6fjiGZ-sSyy1w_JXGaokvO";

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);
