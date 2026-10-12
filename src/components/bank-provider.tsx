"use client";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { cloudEnabled, supabase } from "@/database/supabase";
import { execute, seedWorld } from "@/services/bank";
import type { Command, Profile, World } from "@/lib/types";
import { demoSetPassword } from "@/services/demo-auth";
import { useRouter } from "next/navigation";

type BankContext = {
  world: World | null;
  profile: Profile | null;
  loading: boolean;
  busy: boolean;
  error: string;
  notice: string;
  demo: boolean;
  run: (
    type: Command["type"],
    payload?: Command["payload"],
  ) => Promise<boolean>;
  registerDemo: (
    name: string,
    email: string,
    password: string,
  ) => Promise<void>;
  switchProfile: (id: string) => void;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
  clearNotice: () => void;
};
const Context = createContext<BankContext | null>(null);
const STORAGE = "acme-bank-world-v1",
  SESSION = "acme-bank-session-v1";
async function request(command?: Command) {
  const { data } = await supabase().auth.getSession();
  if (!data.session) throw new Error("Please sign in to continue.");
  const response = await fetch("/api/bank", {
    method: command ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${data.session.access_token}`,
      "Content-Type": "application/json",
    },
    body: command ? JSON.stringify(command) : undefined,
  });
  const result = await response.json();
  if (!response.ok)
    throw new Error(result.error || "Banking service unavailable.");
  return result as { world: World; profile: Profile };
}
export function BankProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [world, setWorld] = useState<World | null>(null),
    [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const mutation = useRef(false);
  const refresh = async () => {
    if (!cloudEnabled) return;
    try {
      const result = await request();
      setWorld(result.world);
      setProfile(result.profile);
      setError("");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to load accounts.",
      );
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (!cloudEnabled) {
      queueMicrotask(() => { try {
        const saved = localStorage.getItem(STORAGE);
        const loaded = saved ? (JSON.parse(saved) as World) : seedWorld();
        if (!loaded.accounts || !loaded.profiles)
          throw new Error("Invalid demo data");
        setWorld(loaded);
        const session = localStorage.getItem(SESSION);
        setProfile(
          session === "signed-out"
            ? null
            : (loaded.profiles.find(
                (item) => item.id === (session || "customer-1"),
              ) ?? loaded.profiles[0]),
        );
      } catch {
        setWorld(seedWorld());
        setProfile(seedWorld().profiles[0]);
        setError(
          "Stored demo data was unavailable. A fresh demo has been loaded.",
        );
      }
      setLoading(false);
      });
      const update = (event: StorageEvent) => {
        if (event.key === STORAGE && event.newValue) {
          try {
            setWorld(JSON.parse(event.newValue));
          } catch {
            setError("Could not synchronize demo data.");
          }
        }
      };
      window.addEventListener("storage", update);
      return () => window.removeEventListener("storage", update);
    }
    const { data: listener } = supabase().auth.onAuthStateChange(
      (event, session) => {
        if (session) {
          if (event === "PASSWORD_RECOVERY")
            router.push("/reset-password");
          else queueMicrotask(() => void refresh());
        } else {
          setProfile(null);
          setWorld(null);
          setLoading(false);
        }
      },
    );
    const channel = supabase()
      .channel("bank-updates")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "bank_revisions" },
        () => void refresh(),
      )
      .subscribe();
    return () => {
      listener.subscription.unsubscribe();
      void supabase().removeChannel(channel);
    };
  }, [router]);
  const run: BankContext["run"] = async (type, payload = {}) => {
    if (!world || !profile || mutation.current) return false;
    mutation.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const command: Command = { id: crypto.randomUUID(), type, payload };
      if (cloudEnabled) {
        const result = await request(command);
        setWorld(result.world);
        setProfile(result.profile);
      } else {
        const stored = localStorage.getItem(STORAGE);
        const current = stored ? (JSON.parse(stored) as World) : world;
        const actor = ["scenario", "advance", "reset"].includes(type)
          ? current.profiles.find((item) => item.role === "administrator")!
          : (current.profiles.find((item) => item.id === profile.id) ??
            profile);
        const next = execute(current, actor, command);
        localStorage.setItem(STORAGE, JSON.stringify(next));
        setWorld(next);
        setProfile(
          next.profiles.find((item) => item.id === profile.id) ??
            next.profiles[0],
        );
      }
      setNotice(
        type === "transfer"
          ? "Transfer submitted. Funds are reserved until settlement."
          : type === "schedule"
            ? "Payment scheduled successfully."
            : type === "reset"
              ? "Demo data has been reset."
              : "Changes saved successfully.",
      );
      return true;
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message.startsWith("[")
            ? "Check the fields and try again."
            : error.message
          : "Something went wrong. Please try again.",
      );
      return false;
    } finally {
      mutation.current = false;
      setBusy(false);
    }
  };
  const switchProfile = (id: string) => {
    if (!cloudEnabled && world) {
      setProfile(world.profiles.find((item) => item.id === id) ?? null);
      localStorage.setItem(SESSION, id);
      setError("");
    }
  };
  const registerDemo = async (
    name: string,
    email: string,
    password: string,
  ) => {
    if (cloudEnabled || !world)
      throw new Error("Demo registration is unavailable.");
    if (
      world.profiles.some(
        (item) => item.email.toLowerCase() === email.toLowerCase(),
      )
    )
      throw new Error("This email already has a demo account.");
    await demoSetPassword(email, password);
    const id = crypto.randomUUID();
    const created: Profile = {
      id,
      customerId: id,
      name,
      email: email.toLowerCase(),
      role: "customer",
      phone: "",
      address: "",
      notifications: true,
    };
    const next = {
      ...world,
      version: world.version + 1,
      profiles: [...world.profiles, created],
    };
    localStorage.setItem(STORAGE, JSON.stringify(next));
    localStorage.setItem(SESSION, id);
    setWorld(next);
    setProfile(created);
  };
  const signOut = async () => {
    if (cloudEnabled) await supabase().auth.signOut();
    else localStorage.setItem(SESSION, "signed-out");
    setProfile(null);
  };
  return (
    <Context.Provider
      value={{
        world,
        profile,
        loading,
        busy,
        error,
        notice,
        demo: !cloudEnabled,
        run,
        registerDemo,
        switchProfile,
        signOut,
        refresh,
        clearNotice: () => {
          setNotice("");
          setError("");
        },
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useBank() {
  const context = useContext(Context);
  if (!context) throw new Error("BankProvider is required.");
  return context;
}
