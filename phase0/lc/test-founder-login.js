const { loadEnvConfig } = require('@next/env');
loadEnvConfig(process.cwd());
const { createClient } = require('@supabase/supabase-js');

async function test() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data, error } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email: "world.asim@gmail.com",
    options: {
      redirectTo: "http://localhost:3001/auth/callback",
    },
  });

  if (error) {
    console.error("Error generating link:", error);
    return;
  }

  const actionLink = data.properties.action_link;
  console.log("Action link:", actionLink);

  const res = await fetch(actionLink, { redirect: 'manual' });
  console.log("Response status:", res.status);
  console.log("Location header:", res.headers.get("location"));
}

test();
