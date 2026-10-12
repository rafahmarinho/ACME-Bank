"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Check,
  Camera,
  LockKeyhole,
  Bell,
  ShieldCheck,
  Database,
  Search,
  ArrowUpRight,
  Users,
  FileText,
  Wallet,
  Headphones,
} from "lucide-react";
import { useBank } from "@/components/bank-provider";
import { Empty, Field, Heading, SectionHead } from "@/components/bank-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/database/supabase";
import { demoSetPassword } from "@/services/demo-auth";
import { uploadFile, fileUrl } from "@/services/files";
import type { Profile } from "@/lib/types";

export function Avatar({
  profile,
  large = false,
}: {
  profile: Profile;
  large?: boolean;
}) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    let active = true;
    if (profile.avatar)
      void fileUrl(profile.avatar)
        .then((value) => {
          if (active) setUrl(value);
        })
        .catch(() => {
          if (active) setUrl("");
        });
    return () => {
      active = false;
    };
  }, [profile.avatar]);
  return (
    <span className={`user-avatar ${large ? "large-avatar" : ""}`}>
      {url ? (
        <Image src={url} alt={profile.name} width={66} height={66} unoptimized />
      ) : profile.customerId === "customer-1" ? (
        <Image src="/images/avatar.jpg" alt={profile.name} width={66} height={66} />
      ) : (
        profile.name
          .split(" ")
          .map((part) => part[0])
          .slice(0, 2)
          .join("")
      )}
    </span>
  );
}
export function Settings({ personal = false }: { personal?: boolean }) {
  const { profile, run, busy, demo } = useBank();
  const [name, setName] = useState(profile?.name ?? ""),
    [phone, setPhone] = useState(profile?.phone ?? ""),
    [address, setAddress] = useState(profile?.address ?? ""),
    [notifications, setNotifications] = useState(
      profile?.notifications ?? true,
    ),
    [password, setPassword] = useState(""),
    [uploading, setUploading] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  if (!profile) return null;
  const payload = { name, phone, address, notifications };
  return (
    <>
      <Heading
        title={personal ? "A little more you" : "Just the way you like it"}
        subtitle={
          personal
            ? "Keep your personal details up to date."
            : "Your preferences, security, and account settings."
        }
      />
      <div className="settings-layout">
        <aside className="settings-nav">
          <Link href="/profile" className={personal ? "selected" : ""}>
            <Users size={17} />
            Personal details
          </Link>
          <Link href="/settings" className={!personal ? "selected" : ""}>
            <LockKeyhole size={17} />
            Preferences & security
          </Link>
        </aside>
        <div className="settings-content">
          {personal ? (
            <section className="settings-section">
              <SectionHead title="Personal information" />
              <div className="profile-identity">
                <Avatar profile={profile} large />
                <div>
                  <strong>{profile.name}</strong>
                  <span>{profile.email}</span>
                  <label className="upload-avatar">
                    <Camera size={14} />
                    {uploading ? "Uploading..." : "Change photo"}
                    <input
                      className="sr-only"
                      type="file"
                      accept="image/png,image/jpeg"
                      disabled={uploading || busy}
                      onChange={async (event) => {
                        const file = event.target.files?.[0];
                        if (!file) return;
                        setUploading(true);
                        setError("");
                        try {
                          if (!file.type.startsWith("image/"))
                            throw new Error("Choose a JPG or PNG image.");
                          const path = await uploadFile(file, profile.id);
                          await run("profile", { ...payload, avatar: path });
                        } catch (error) {
                          setError(
                            error instanceof Error
                              ? error.message
                              : "Upload failed.",
                          );
                        } finally {
                          setUploading(false);
                        }
                      }}
                    />
                  </label>
                </div>
                <span className="role-tag">{profile.role}</span>
              </div>
              <form
                className="form-stack"
                onSubmit={async (event) => {
                  event.preventDefault();
                  await run("profile", payload);
                }}
              >
                <Field label="Full name">
                  <Input
                    required
                    maxLength={80}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                  />
                </Field>
                <Field
                  label="Email address"
                  hint="Your sign-in email is managed by Supabase Auth."
                >
                  <Input type="email" disabled value={profile.email} />
                </Field>
                <Field label="Phone number">
                  <Input
                    type="tel"
                    maxLength={40}
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                  />
                </Field>
                <Field label="Mailing address">
                  <Input
                    maxLength={240}
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                  />
                </Field>
                <Button type="submit" disabled={busy}>
                  Save changes <Check size={16} />
                </Button>
              </form>
            </section>
          ) : (
            <>
              <section className="settings-section">
                <SectionHead title="Notifications" />
                <div className="setting-row">
                  <span className="setting-icon">
                    <Bell size={19} />
                  </span>
                  <div>
                    <strong>Activity notifications</strong>
                    <p>Show new account events in your notification inbox.</p>
                  </div>
                  <Switch
                    aria-label="Activity notifications"
                    checked={notifications}
                    disabled={busy}
                    onCheckedChange={async (value) => {
                      setNotifications(value);
                      if (
                        !(await run("profile", {
                          ...payload,
                          notifications: value,
                        }))
                      )
                        setNotifications(!value);
                    }}
                  />
                </div>
              </section>
              <section className="settings-section">
                <SectionHead title="Security" />
                <div className="setting-row">
                  <span className="setting-icon">
                    <LockKeyhole size={19} />
                  </span>
                  <div>
                    <strong>Change password</strong>
                    <p>Use a unique password with at least 12 characters.</p>
                  </div>
                </div>
                <form
                  className="form-stack"
                  onSubmit={async (event) => {
                    event.preventDefault();
                    setError("");
                    setMessage("");
                    try {
                      if (demo) await demoSetPassword(profile.email, password);
                      else {
                        const { error } = await supabase().auth.updateUser({
                          password,
                        });
                        if (error) throw error;
                      }
                      setMessage("Password updated successfully.");
                      setPassword("");
                    } catch (error) {
                      setError(
                        error instanceof Error
                          ? error.message
                          : "Password update failed.",
                      );
                    }
                  }}
                >
                  <Field label="New password">
                    <Input
                      aria-label="New password"
                      type="password"
                      required
                      minLength={12}
                      autoComplete="new-password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                    />
                  </Field>
                  <Button type="submit" variant="outline">
                    <LockKeyhole size={15} />
                    Update password
                  </Button>
                </form>
              </section>
              <section className="settings-section">
                <SectionHead title="Workspace" />
                <div className="setting-row">
                  <span className="setting-icon">
                    <Database size={19} />
                  </span>
                  <div>
                    <strong>
                      {demo ? "Local demo" : "Supabase connected"}
                    </strong>
                    <p>
                      {demo
                        ? "Your banking data is saved in this browser."
                        : "Your banking data is saved in PostgreSQL and synchronized in realtime."}
                    </p>
                  </div>
                  <span className="connection-indicator">
                    <span />
                    Connected
                  </span>
                </div>
                <dl className="details-list">
                  <div>
                    <dt>Display currency</dt>
                    <dd>USD · US Dollar</dd>
                  </div>
                  <div>
                    <dt>Language</dt>
                    <dd>English (United States)</dd>
                  </div>
                  <div>
                    <dt>Profile role</dt>
                    <dd>{profile.role}</dd>
                  </div>
                </dl>
                <p className="small-note">
                  <ShieldCheck size={14} />
                  ACME Bank is a simulation. Never enter real banking
                  credentials.
                </p>
              </section>
            </>
          )}
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          {message && <p className="auth-message">{message}</p>}
        </div>
      </div>
    </>
  );
}
export function SearchScreen() {
  const { world, profile } = useBank();
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");
  if (!world || !profile) return null;
  const staff = profile.role !== "customer";
  const accounts = world.accounts.filter(
    (item) => staff || item.customerId === profile.customerId,
  );
  const results = [
    ...accounts.map((item) => ({
      id: item.id,
      name: item.name,
      detail: `Account ending ${item.number.slice(-4)}`,
      href: staff ? "/staff" : `/accounts?account=${item.id}`,
      icon: Wallet,
    })),
    ...world.beneficiaries
      .filter((item) => staff || item.customerId === profile.customerId)
      .map((item) => ({
        id: item.id,
        name: item.name,
        detail: item.bank,
        href: staff ? "/staff" : "/beneficiaries",
        icon: Users,
      })),
    ...world.transactions
      .filter((item) =>
        accounts.some((account) => account.id === item.accountId),
      )
      .map((item) => ({
        id: item.id,
        name: item.description,
        detail: `${item.category} · ${item.date.slice(0, 10)} · ${item.reference}`,
        href: staff ? "/staff" : `/activity?q=${encodeURIComponent(query)}`,
        icon: FileText,
      })),
    ...world.tickets
      .filter((item) => staff || item.customerId === profile.customerId)
      .map((item) => ({
        id: item.id,
        name: item.subject,
        detail: `Support · ${item.status}`,
        href: "/support",
        icon: Headphones,
      })),
  ].filter(
    (item) =>
      query.trim() &&
      `${item.name} ${item.detail}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <Heading
        title="Find your next thing"
        subtitle="Search accounts, activity, beneficiaries, and conversations."
      />
      <div className="filter-bar">
        <div className="search-input">
          <Search size={18} />
          <Input
            aria-label="Search all banking data"
            placeholder="What are you looking for?"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <span className="muted">{results.length} results</span>
      </div>
      <div className="search-results">
        {results.length ? (
          results.slice(0, 50).map((item) => (
            <Link href={item.href} key={item.id} className="search-result">
              <span>
                <item.icon size={19} />
              </span>
              <div>
                <strong>{item.name}</strong>
                <small>{item.detail}</small>
              </div>
              <ArrowUpRight size={16} />
            </Link>
          ))
        ) : (
          <Empty
            title={query ? "No matches yet" : "A good place to start"}
            message={
              query
                ? "Try a different name, reference, or category."
                : "Enter a name, account, or transaction to search."
            }
          />
        )}
      </div>
    </>
  );
}
