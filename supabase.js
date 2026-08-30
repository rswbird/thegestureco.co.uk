```js
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL =
  "https://njayikstvcernrnwqsci.supabase.co";

const SUPABASE_ANON_KEY =
  "sb_publishable_2dhn7tdbB6fjiGZ-sSyy1w_JXGaokvO";

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

console.log(
  "[The Gesture Co.] Supabase client loaded successfully."
);
```
