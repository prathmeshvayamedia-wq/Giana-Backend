const { createClient } = require('@supabase/supabase-js');

// These come from your .env file - never hardcode them, never commit them.
// SERVICE_ROLE key is used here because this is trusted backend code.
// It must NEVER be sent to the mobile app.
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = supabase;
