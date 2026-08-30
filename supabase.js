```js
/*
  =========================================================
  SUPABASE CLIENT
  =========================================================

  The Gesture Co.
  Supabase project:
  https://njayikstvcernrnwqsci.supabase.co

  This file is imported by app.js.
*/

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";


/* =========================================================
   SUPABASE PROJECT
========================================================= */

const SUPABASE_URL =
  "https://njayikstvcernrnwqsci.supabase.co";

const SUPABASE_ANON_KEY =
  "sb_publishable_2dhn7tdbB6fjiGZ-sSyy1w_JXGaokvO";


/* =========================================================
   CREATE CLIENT
========================================================= */

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);


/* =========================================================
   CONFIRM CONNECTION
========================================================= */

console.log(
  "[The Gesture Co.] Supabase client loaded successfully."
);
```
