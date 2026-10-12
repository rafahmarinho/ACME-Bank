"use client";
import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  Users,
  CalendarClock,
  CreditCard,
  FileText,
  Headphones,
  Settings as SettingsIcon,
  FlaskConical,
  Search,
  Bell,
  ChevronDown,
  ArrowUpRight,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  CircleHelp,
  Activity as ActivityIcon,
  LoaderCircle,
  Check,
  AlertCircle,
} from "lucide-react";
import { useBank } from "./bank-provider";
import { Logo } from "./bank-ui";
import { Button } from "@/components/ui/button";
import { Overview } from "@/screens/overview";
import { Activity } from "@/screens/activity";
import { Transfers } from "@/screens/transfers";
import {
  Accounts,
  Beneficiaries,
  ScheduledPayments,
  Cards,
  Statements,
  Onboarding,
} from "@/screens/banking";
import { Support } from "@/screens/support";
import { Staff, Simulation } from "@/screens/operations";
import { Avatar, SearchScreen, Settings } from "@/screens/settings";
import { AuthScreen } from "@/screens/auth";
const customerNav = [
  { id: "overview", label: "Overview", href: "/", icon: LayoutDashboard },
  { id: "accounts", label: "Accounts", href: "/accounts", icon: Wallet },
  { id: "activity", label: "Activity", href: "/activity", icon: ActivityIcon },
  {
    id: "transfers",
    label: "Transfers",
    href: "/transfers",
    icon: ArrowLeftRight,
  },
  {
    id: "beneficiaries",
    label: "Beneficiaries",
    href: "/beneficiaries",
    icon: Users,
  },
  {
    id: "scheduled-payments",
    label: "Scheduled payments",
    href: "/scheduled-payments",
    icon: CalendarClock,
  },
  { id: "cards", label: "Cards", href: "/cards", icon: CreditCard },
  {
    id: "statements",
    label: "Statements",
    href: "/statements",
    icon: FileText,
  },
];
const screens: Record<string, React.ComponentType> = {
  overview: Overview,
  accounts: Accounts,
  activity: Activity,
  transfers: Transfers,
  beneficiaries: Beneficiaries,
  "scheduled-payments": ScheduledPayments,
  cards: Cards,
  statements: Statements,
  onboarding: Onboarding,
  staff: Staff,
  simulation: Simulation,
  settings: Settings,
  search: SearchScreen,
};
export function BankApp({ view = "overview" }: { view?: string }) {
  return (
    <Suspense fallback={<Loading />}>
      <Workspace view={view} />
    </Suspense>
  );
}
function Loading() {
  return (
    <div className="app-loading">
      <Logo />
      <LoaderCircle className="spinner" size={25} />
      <span>Getting your workspace ready...</span>
    </div>
  );
}
function Workspace({ view }: { view: string }) {
  const {
    world,
    profile,
    demo,
    loading,
    busy,
    error,
    notice,
    clearNotice,
    switchProfile,
    signOut,
    refresh,
  } = useBank();
  const [mobileMenu, setMobileMenu] = useState(false),
    [notifications, setNotifications] = useState(false),
    [query, setQuery] = useState("");
  const router = useRouter();
  if (loading) return <Loading />;
  const authViews = ["login", "signup", "forgot-password", "reset-password"];
  if (authViews.includes(view) || !profile)
    return (
      <>
        <AuthScreen view={authViews.includes(view) ? view : "login"} />
        {error && (
          <div className="global-toast error-toast" role="alert">
            <AlertCircle size={18} />
            <span>{error}</span>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => void refresh()}
              title="Retry"
              aria-label="Retry"
            >
              <ArrowLeftRight size={15} />
            </Button>
          </div>
        )}
      </>
    );
  if (!world)
    return (
      <div className="app-loading">
        <Logo />
        <p>{error || "Your bank data is unavailable."}</p>
        <Button onClick={() => void refresh()}>Try again</Button>
        <Button variant="outline" onClick={() => void signOut()}>
          Sign out
        </Button>
      </div>
    );
  const staff = profile.role !== "customer";
  const effectiveView = view === "overview" && staff ? "staff" : view;
  const allowed = !(
    (effectiveView === "staff" && !staff) ||
    (effectiveView === "simulation" &&
      !demo &&
      profile.role !== "administrator") ||
    (staff &&
      [
        "accounts",
        "activity",
        "transfers",
        "beneficiaries",
        "scheduled-payments",
        "cards",
        "statements",
        "onboarding",
      ].includes(effectiveView))
  );
  const nav = staff
    ? [
        {
          id: "staff",
          label: "Staff dashboard",
          href: "/staff",
          icon: LayoutDashboard,
        },
      ]
    : customerNav;
  const title =
    [
      ...customerNav,
      { id: "staff", label: "Staff dashboard" },
      { id: "simulation", label: "Simulation" },
      { id: "support", label: "Support" },
      { id: "settings", label: "Settings" },
      { id: "profile", label: "Profile" },
      { id: "onboarding", label: "Open an account" },
      { id: "search", label: "Search" },
    ].find((item) => item.id === effectiveView)?.label ?? "Overview";
  const Screen = screens[effectiveView] ?? Overview;
  const events = world.events
    .filter((item) => staff || item.customerId === profile.customerId)
    .slice(0, 8);
  const navLink = (item: {
    id: string;
    label: string;
    href: string;
    icon: typeof Wallet;
  }) => (
    <Link
      key={item.id}
      href={item.href}
      className={`nav-item ${effectiveView === item.id ? "active" : ""}`}
      onClick={() => setMobileMenu(false)}
    >
      <item.icon size={19} strokeWidth={1.65} />
      <span>{item.label}</span>
      {item.id === "scheduled-payments" && (
        <small>
          {
            world.payments.filter(
              (item) =>
                item.customerId === profile.customerId &&
                item.status === "scheduled",
            ).length
          }
        </small>
      )}
    </Link>
  );
  return (
    <div className="bank-workspace">
      {mobileMenu && (
        <button
          className="mobile-backdrop"
          aria-label="Close navigation"
          onClick={() => setMobileMenu(false)}
        />
      )}
      <aside className={`sidebar ${mobileMenu ? "mobile-open" : ""}`}>
        <Link href="/" className="sidebar-logo">
          <Logo light />
        </Link>
        <button
          className="mobile-close"
          onClick={() => setMobileMenu(false)}
          aria-label="Close menu"
        >
          <X size={21} />
        </button>
        <div className="workspace-type">
          <span>{staff ? "TEAM WORKSPACE" : "PERSONAL BANKING"}</span>
          <ChevronDown size={13} />
        </div>
        <nav className="primary-nav">{nav.map(navLink)}</nav>
        <div className="nav-divider" />
        <nav className="secondary-nav">
          {navLink({
            id: "support",
            label: "Support",
            href: "/support",
            icon: Headphones,
          })}
          {navLink({
            id: "settings",
            label: "Settings",
            href: "/settings",
            icon: SettingsIcon,
          })}
          {(demo || profile.role === "administrator") &&
            navLink({
              id: "simulation",
              label: "Simulation",
              href: "/simulation",
              icon: FlaskConical,
            })}
        </nav>
        <div className="sidebar-bottom">
          <Link href="/support" className="sidebar-help">
            <span className="help-icon">
              <CircleHelp size={22} />
            </span>
            <strong>A little help?</strong>
            <p>We&apos;ve got your back.</p>
            <span>
              Let&apos;s talk <ArrowUpRight size={14} />
            </span>
          </Link>
          <div className="sidebar-mode">
            <span className="connection-dot" />
            <span>{demo ? "Demo workspace" : "Supabase connected"}</span>
            <ShieldCheck size={14} />
          </div>
          <span className="sidebar-copyright">© 2026 ACME Bank</span>
        </div>
      </aside>
      <div className="workspace-content">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="menu-toggle"
              aria-label="Open navigation"
              onClick={() => setMobileMenu(true)}
            >
              <Menu size={21} />
            </button>
            <span className="breadcrumb">
              Banking <span>/</span>
              <strong>{title}</strong>
            </span>
            <Link href="/" className="mobile-brand">
              <Logo />
            </Link>
          </div>
          <div className="topbar-right">
            <form
              className="global-search"
              onSubmit={(event) => {
                event.preventDefault();
                router.push(`/search?q=${encodeURIComponent(query)}`);
              }}
            >
              <Search size={16} />
              <input
                aria-label="Search banking workspace"
                placeholder="Search anything..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <button aria-label="Submit search" title="Search">
                <ArrowUpRight size={13} />
              </button>
            </form>
            <div className="notifications-wrap">
              <Button
                size="icon"
                variant="ghost"
                title="Notifications"
                aria-label="Notifications"
                onClick={() => setNotifications(!notifications)}
              >
                <Bell size={19} />
                {profile.notifications && events.length > 0 && (
                  <span className="notification-dot" />
                )}
              </Button>
              {notifications && (
                <div className="notification-panel">
                  <div>
                    <h3>Notifications</h3>
                    <Button
                      title="Close notifications"
                      aria-label="Close notifications"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setNotifications(false)}
                    >
                      <X size={15} />
                    </Button>
                  </div>
                  {profile.notifications && events.length ? (
                    events.map((event) => (
                      <div key={event.id}>
                        <span className="event-dot" />
                        <p>
                          {event.message}
                          <small>{event.date.slice(0, 10)}</small>
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="muted notification-empty">
                      {profile.notifications
                        ? "You're all caught up."
                        : "Activity notifications are turned off."}
                    </p>
                  )}
                  <Link
                    href="/settings"
                    onClick={() => setNotifications(false)}
                  >
                    Notification settings <ArrowUpRight size={13} />
                  </Link>
                </div>
              )}
            </div>
            <div className="topbar-divider" />
            <div className="user-menu">
              <Link href="/profile" aria-label="Open profile">
                <Avatar profile={profile} />
              </Link>
              <div>
                {demo ? (
                  <select
                    aria-label="Active demo profile"
                    value={profile.id}
                    onChange={(event) => {
                      switchProfile(event.target.value);
                      router.push(
                        world.profiles.find(
                          (item) => item.id === event.target.value,
                        )?.role === "customer"
                          ? "/"
                          : "/staff",
                      );
                    }}
                  >
                    {world.profiles.map((item) => (
                      <option value={item.id} key={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Link href="/profile">
                    <strong>{profile.name}</strong>
                  </Link>
                )}
                <small>
                  {profile.role === "customer"
                    ? "Personal account"
                    : profile.role === "support"
                      ? "Support team"
                      : "Administrator"}
                </small>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Sign out"
                title="Sign out"
                onClick={() => void signOut().then(() => router.push("/login"))}
              >
                <LogOut size={15} />
              </Button>
            </div>
          </div>
        </header>
        <main className="main-content" key={`${profile.id}-${effectiveView}`}>
          {allowed ? (
            effectiveView === "support" ? (
              <Support staff={staff} />
            ) : effectiveView === "profile" ? (
              <Settings personal />
            ) : (
              <Screen />
            )
          ) : (
            <div className="access-denied">
              <ShieldCheck size={36} />
              <h1>This workspace is restricted.</h1>
              <p>Your current role does not have access to this page.</p>
              <Link href="/" className="button-link primary">
                Back to your workspace
              </Link>
            </div>
          )}
        </main>
        <footer className="workspace-footer">
          <span>ACME Bank. Make room for more.</span>
          <span>
            <ShieldCheck size={12} />
            {demo
              ? "Simulated banking · Saved in this browser"
              : "Simulated banking · Powered by Supabase"}
          </span>
        </footer>
      </div>
      <nav className="bottom-nav" aria-label="Mobile navigation">
        {(staff
          ? [
              {
                id: "staff",
                label: "Dashboard",
                href: "/staff",
                icon: LayoutDashboard,
              },
              {
                id: "support",
                label: "Support",
                href: "/support",
                icon: Headphones,
              },
            ]
          : customerNav.filter((item) =>
              ["overview", "accounts", "transfers", "cards"].includes(item.id),
            )
        ).map((item) => (
          <Link
            href={item.href}
            key={item.id}
            className={effectiveView === item.id ? "active" : ""}
          >
            <item.icon size={21} />
            <span>{item.label}</span>
          </Link>
        ))}
        <button
          className={mobileMenu ? "active" : ""}
          onClick={() => setMobileMenu(!mobileMenu)}
        >
          <Menu size={21} />
          <span>More</span>
        </button>
      </nav>
      {(error || notice) && (
        <div
          className={`global-toast ${error ? "error-toast" : ""}`}
          role={error ? "alert" : "status"}
        >
          {error ? <AlertCircle size={19} /> : <Check size={19} />}
          <span>{error || notice}</span>
          <Button
            size="icon-sm"
            variant="ghost"
            title="Dismiss message"
            aria-label="Dismiss message"
            onClick={clearNotice}
          >
            <X size={15} />
          </Button>
        </div>
      )}
      {busy && <div className="busy-bar" aria-label="Saving changes" />}
    </div>
  );
}
