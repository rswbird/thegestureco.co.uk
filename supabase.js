```js
/*
  =========================================================
  THE GESTURE CO. — SUPABASE CLIENT
  =========================================================

  This file creates the Supabase client used by app.js.

  IMPORTANT:
  - The URL below is your Supabase PROJECT URL.
  - The publishable key is safe to use in browser code.
  - NEVER put a Supabase secret/service-role key in this file.
  - Database security must be enforced using Supabase RLS policies.

  Supabase Project:
  https://njayikstvcernrnwqsci.supabase.co
*/


import { createClient } from "https://esm.sh/@supabase/supabase-js@2";


/* =========================================================
   SUPABASE PROJECT CONFIGURATION
========================================================= */

const SUPABASE_URL =
  "https://njayikstvcernrnwqsci.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_2dhn7tdbB6fjiGZ-sSyy1w_JXGaokvO";


/* =========================================================
   CREATE SUPABASE CLIENT
========================================================= */

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);


/* =========================================================
   OPTIONAL DEVELOPMENT CHECK
========================================================= */

console.log(
  "[The Gesture Co.] Supabase client initialised."
);
```
