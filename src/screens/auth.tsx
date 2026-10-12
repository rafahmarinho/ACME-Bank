"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowLeft,
  Check,
} from "lucide-react";
import { useBank } from "@/components/bank-provider";
import { Logo, Field } from "@/components/bank-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/database/supabase";
import {
  DEMO_PASSWORD,
  demoAuthenticate,
  demoRecovery,
  demoResetPassword,
} from "@/services/demo-auth";
export function AuthScreen({ view = "login" }: { view?: string }) {
  const { demo, world, switchProfile, registerDemo, refresh } =
    useBank();
  const router = useRouter(),
    params = useSearchParams();
  const [email, setEmail] = useState(demo ? "alex@acme.demo" : ""),
    [password, setPassword] = useState(
      demo && view === "login" ? DEMO_PASSWORD : "",
    ),
    [name, setName] = useState(""),
    [show, setShow] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [recoveryLink, setRecoveryLink] = useState("");
  const signup = view === "signup",
    recovery = view === "forgot-password",
    reset = view === "reset-password";
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (recovery) {
        if (demo) {
          setRecoveryLink(demoRecovery(email));
          setMessage(
            "A simulated recovery email is ready. Open the local recovery link below.",
          );
        } else {
          const { error } = await supabase().auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
          });
          if (error) throw error;
          setMessage(
            "If an account exists for this email, you will receive a recovery link shortly.",
          );
        }
      } else if (reset) {
        if (demo) await demoResetPassword(params.get("token") ?? "", password);
        else {
          const { data } = await supabase().auth.getSession();
          if (!data.session)
            throw new Error(
              "Open the password recovery link from your email first.",
            );
          const { error } = await supabase().auth.updateUser({ password });
          if (error) throw error;
        }
        setMessage("Your password has been updated. You can now sign in.");
      } else if (signup) {
        if (demo) {
          await registerDemo(name, email, password);
          router.push("/onboarding");
        } else {
          const { data, error } = await supabase().auth.signUp({
            email,
            password,
            options: {
              data: { name },
              emailRedirectTo: `${window.location.origin}/onboarding`,
            },
          });
          if (error) throw error;
          if (data.session) {
            await refresh();
            router.push("/onboarding");
          } else
            setMessage(
              "Check your email to confirm your account, then sign in to open your bank account.",
            );
        }
      } else {
        if (demo) {
          const actor = world?.profiles.find(
            (item) => item.email.toLowerCase() === email.toLowerCase(),
          );
          if (!actor || !(await demoAuthenticate(email, password)))
            throw new Error("Email or password is incorrect.");
          switchProfile(actor.id);
          router.push(actor.role === "customer" ? "/" : "/staff");
        } else {
          const { error } = await supabase().auth.signInWithPassword({
            email,
            password,
          });
          if (error) throw new Error("Email or password is incorrect.");
          await refresh();
          router.push("/");
        }
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to sign in. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="auth-page">
      <div className="auth-main">
        <Link href="/" className="auth-logo">
          <Logo />
        </Link>
        <div className="auth-form-wrap">
          <span className="auth-eyebrow">YOUR NEXT CHAPTER</span>
          <h1>
            {recovery
              ? "Forgot your password?"
              : reset
                ? "A fresh start."
                : signup
                  ? "Make yourself at home."
                  : "Welcome back."}
          </h1>
          <p>
            {recovery
              ? "We'll help you get back to your money."
              : reset
                ? "Choose a new password for your account."
                : signup
                  ? "A little more possibility. A lot less banking hassle."
                  : "Good to see you. Let's get you signed in."}
          </p>
          <form className="form-stack" onSubmit={submit}>
            {signup && (
              <Field label="Full name">
                <Input
                  required
                  maxLength={80}
                  autoComplete="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Your full name"
                />
              </Field>
            )}
            {!reset && (
              <Field label="Email address">
                <Input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                />
              </Field>
            )}
            {!recovery && (
              <Field label={reset ? "New password" : "Password"}>
                <div className="password-input">
                  <Input
                    required
                    type={show ? "text" : "password"}
                    minLength={signup || reset ? 12 : 1}
                    autoComplete={
                      signup || reset ? "new-password" : "current-password"
                    }
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder={
                      signup || reset
                        ? "At least 12 characters"
                        : "Enter your password"
                    }
                  />
                  <button
                    type="button"
                    title={show ? "Hide password" : "Show password"}
                    aria-label={show ? "Hide password" : "Show password"}
                    onClick={() => setShow(!show)}
                  >
                    {show ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </Field>
            )}
            {!signup && !recovery && !reset && (
              <Link href="/forgot-password" className="auth-forgot">
                Forgot password?
              </Link>
            )}
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            {message && (
              <div className="auth-message">
                <Check size={17} />
                <span>{message}</span>
              </div>
            )}
            {recoveryLink && (
              <Link href={recoveryLink} className="inline-link">
                Open simulated recovery email <ArrowRight size={14} />
              </Link>
            )}
            <Button disabled={busy} type="submit" className="wide-button">
              {busy
                ? "Please wait..."
                : recovery
                  ? "Send recovery link"
                  : reset
                    ? "Update password"
                    : signup
                      ? "Create account"
                      : "Sign in"}
              <ArrowRight size={16} />
            </Button>
          </form>
          <p className="auth-switch">
            {recovery || reset ? (
              <Link href="/login">
                <ArrowLeft size={14} />
                Back to sign in
              </Link>
            ) : signup ? (
              <>
                Already have an account? <Link href="/login">Sign in</Link>
              </>
            ) : (
              <>
                New to ACME? <Link href="/signup">Open an account</Link>
              </>
            )}
          </p>
          {demo && (
            <div className="demo-signin">
              <span>LOCAL DEMO</span>
              <p>
                Choose a demo profile or sign in with the prefilled credentials.
              </p>
              <select
                aria-label="Demo login profile"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setPassword(DEMO_PASSWORD);
                }}
              >
                {world?.profiles.map((item) => (
                  <option key={item.id} value={item.email}>
                    {item.name} · {item.role}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        <footer>
          <ShieldCheck size={14} />
          Secure access. Simulated banking.<span>© 2026 ACME Bank</span>
        </footer>
      </div>
      <div className="auth-art">
        <div className="auth-art-text">
          <span>MORE LIFE. LESS BANKING.</span>
          <h2>
            Your money.
            <br />
            Your next move.
          </h2>
          <p>A bank that makes room for what matters.</p>
        </div>
        <Image
          src="/images/coast.jpg"
          alt="Mountain lake surrounded by forest"
          fill
          sizes="50vw"
          priority
        />
        <div className="auth-art-bottom">
          <Logo light />
          <span>Made for the way you live.</span>
        </div>
      </div>
    </div>
  );
}
