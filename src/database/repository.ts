import "server-only";
import { createClient } from "@supabase/supabase-js";
import { execute, projectWorld } from "@/services/bank";
import type { Command, Profile, World } from "@/lib/types";

function clients(token: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || !secret)
    throw new Error(
      "Bank service is not configured. Contact your administrator.",
    );
  return {
    auth: createClient(url, key, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    }),
    db: createClient(url, secret, {
      auth: { persistSession: false, autoRefreshToken: false },
    }),
  };
}
export async function bankingRequest(token: string, command?: Command) {
  const { auth, db } = clients(token);
  const { data: userData, error: authError } = await auth.auth.getUser(token);
  if (authError || !userData.user)
    throw new Error("Unauthorized. Please sign in again.");
  const { data: stored, error: profileError } = await db
    .from("profiles")
    .select("*")
    .eq("id", userData.user.id)
    .single();
  if (profileError || !stored)
    throw new Error("Your profile is not ready. Please contact support.");
  for (let attempt = 0; attempt < 6; attempt++) {
    const { data: row, error } = await db
      .from("bank_world")
      .select("data,revision")
      .eq("id", 1)
      .single();
    if (error || !row)
      throw new Error(
        "Bank database is not initialized. Run the seed command.",
      );
    let world = row.data as World;
    let actor = world.profiles.find((item) => item.id === stored.id);
    let changed = false;
    if (!actor) {
      actor = {
        id: stored.id,
        customerId: stored.customer_id,
        name: stored.name,
        email: userData.user.email ?? "",
        role: stored.role,
        phone: "",
        address: "",
        notifications: true,
      } as Profile;
      world = structuredClone(world);
      world.profiles.push(actor);
      changed = true;
    }
    actor = { ...actor, role: stored.role, customerId: stored.customer_id };
    if (command) {
      world = execute(world, actor, command);
      changed = true;
    }
    if (changed) {
      const { data: committed, error: commitError } = await db.rpc(
        "commit_bank_world",
        { expected_revision: row.revision, next_data: world },
      );
      if (commitError)
        throw new Error("Could not save this action. Please retry.");
      if (!committed) continue;
    }
    return {
      world: projectWorld(world, actor),
      profile: {
        ...(world.profiles.find((item) => item.id === actor!.id) ?? actor),
        role: stored.role,
      } as Profile,
    };
  }
  throw new Error("The bank is processing other requests. Please retry.");
}
