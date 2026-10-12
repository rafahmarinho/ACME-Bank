import { createClient } from "@supabase/supabase-js";
import { seedWorld } from "../src/services/bank";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
  key = process.env.SUPABASE_SERVICE_ROLE_KEY,
  password = process.env.DEMO_SEED_PASSWORD;
if (!url || !key || !password || password.length < 12)
  throw new Error(
    "Set Supabase URL, service role key, and DEMO_SEED_PASSWORD (at least 12 characters) in .env.local.",
  );
const db = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const world = seedWorld();
const { data: existingWorld } = await db
  .from("bank_world")
  .select("id")
  .eq("id", 1)
  .maybeSingle();
if (existingWorld)
  throw new Error(
    "Seed already exists. Use the administrator simulation reset. Seed will not overwrite an existing bank.",
  );
const users = [];
for (let page = 1; ; page++) {
  const { data, error } = await db.auth.admin.listUsers({
    page,
    perPage: 1000,
  });
  if (error) throw error;
  users.push(...data.users);
  if (data.users.length < 1000) break;
}
for (const profile of world.profiles) {
  let user = users.find((item) => item.email === profile.email);
  if (!user) {
    const { data, error } = await db.auth.admin.createUser({
      email: profile.email,
      password,
      email_confirm: true,
      user_metadata: { name: profile.name },
    });
    if (error || !data.user) throw error || new Error("User creation failed.");
    user = data.user;
  }
  profile.id = user.id;
  const { error } = await db
    .from("profiles")
    .upsert({
      id: user.id,
      customer_id: profile.customerId || profile.email.split("@")[0],
      name: profile.name,
      role: profile.role,
    });
  if (error) throw error;
}
const { error } = await db
  .from("bank_world")
  .insert({ id: 1, revision: 1, data: world });
if (error) throw error;
console.log(
  "Seed complete: six customers, support, administrator, and two months of integer-cent transactions.",
);
console.log(
  "Demo emails: alex@acme.demo, sarah@acme.demo, james@acme.demo, emily@acme.demo, michael@acme.demo, olivia@acme.demo, support@acme.demo, admin@acme.demo.",
);
