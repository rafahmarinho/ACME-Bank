"use client";
import Link from "next/link";
import { useState } from "react";
import {
  Users,
  Wallet,
  ArrowLeftRight,
  Headphones,
  Search,
  ArrowUpRight,
  Play,
  FastForward,
  RotateCcw,
  ArrowDownLeft,
  ShoppingBag,
  AlertTriangle,
  Clock,
  Check,
  ShieldCheck,
} from "lucide-react";
import { useBank } from "@/components/bank-provider";
import {
  Empty,
  Heading,
  Modal,
  SectionHead,
  Status,
  Field,
} from "@/components/bank-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { money } from "@/services/bank";
import { ActivityTable } from "./activity";
import { Support } from "./support";

export function Staff() {
  const { world, profile } = useBank();
  const [tab, setTab] = useState("customers"),
    [search, setSearch] = useState(""),
    [customerId, setCustomerId] = useState("");
  if (!world || !profile) return null;
  const customers = world.profiles.filter((item) => item.role === "customer");
  const customer = customers.find((item) => item.customerId === customerId);
  const customerAccounts = world.accounts.filter(
    (item) => item.customerId === customerId,
  );
  return (
    <>
      <Heading
        title="The bigger picture"
        subtitle={`Welcome, ${profile.name.split(" ")[0]}. Here's the bank at a glance.`}
        action={
          profile.role === "administrator" && (
            <Link href="/simulation" className="button-link primary">
              <Play size={15} />
              Simulation workspace
            </Link>
          )
        }
      />
      <div className="staff-stats">
        {[
          { label: "Customers", value: customers.length, icon: Users },
          {
            label: "Total deposits",
            value: money(
              world.accounts.reduce((sum, item) => sum + item.balance, 0),
            ),
            icon: Wallet,
          },
          {
            label: "Pending transfers",
            value: world.payments.filter((item) => item.status === "pending")
              .length,
            icon: ArrowLeftRight,
          },
          {
            label: "Open conversations",
            value: world.tickets.filter((item) => item.status === "open")
              .length,
            icon: Headphones,
          },
        ].map((item) => (
          <div className="summary-card" key={item.label}>
            <span className="summary-label">
              {item.label}
              <item.icon size={20} />
            </span>
            <strong className="staff-stat-value">{item.value}</strong>
            <small className="muted">Live bank snapshot</small>
          </div>
        ))}
      </div>
      <div
        className="page-tabs"
        role="tablist"
        aria-label="Staff dashboard views"
      >
        {["customers", "payments", "support", "events"].map((item) => (
          <button
            role="tab"
            aria-selected={tab === item}
            className={tab === item ? "active" : ""}
            onClick={() => setTab(item)}
            key={item}
          >
            {item.charAt(0).toUpperCase() + item.slice(1)}
            {item === "support" && (
              <span>
                {world.tickets.filter((item) => item.status === "open").length}
              </span>
            )}
          </button>
        ))}
      </div>
      {tab === "support" ? (
        <Support staff />
      ) : (
        <>
          <div className="filter-bar">
            <div className="search-input">
              <Search size={17} />
              <Input
                aria-label="Search staff dashboard"
                placeholder={`Search ${tab}...`}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <span className="muted">
              {profile.role === "support"
                ? "Support · Read-only customer access"
                : "Administrator workspace"}
            </span>
          </div>
          {tab === "customers" && (
            <section className="data-section">
              <div className="table-scroll">
                <table className="activity-table">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Accounts</th>
                      <th>Total balance</th>
                      <th>Status</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {customers
                      .filter((item) =>
                        `${item.name} ${item.email}`
                          .toLowerCase()
                          .includes(search.toLowerCase()),
                      )
                      .map((item) => {
                        const accounts = world.accounts.filter(
                          (account) => account.customerId === item.customerId,
                        );
                        return (
                          <tr key={item.id}>
                            <td>
                              <button
                                className="transaction-name"
                                onClick={() => setCustomerId(item.customerId)}
                              >
                                <span className="initials-avatar">
                                  {item.name
                                    .split(" ")
                                    .map((part) => part[0])
                                    .join("")}
                                </span>
                                <span>
                                  <strong>{item.name}</strong>
                                  <small>{item.email}</small>
                                </span>
                              </button>
                            </td>
                            <td>{accounts.length}</td>
                            <td>
                              {money(
                                accounts.reduce(
                                  (sum, account) => sum + account.balance,
                                  0,
                                ),
                              )}
                            </td>
                            <td>
                              <Status
                                value={
                                  accounts.length ? "active" : "onboarding"
                                }
                              />
                            </td>
                            <td>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                title="Inspect customer"
                                aria-label={`Inspect ${item.name}`}
                                onClick={() => setCustomerId(item.customerId)}
                              >
                                <ArrowUpRight size={16} />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </section>
          )}
          {tab === "payments" && (
            <section className="data-section">
              <div className="table-scroll">
                <table className="activity-table">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Recipient</th>
                      <th>Amount</th>
                      <th>Fee</th>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {world.payments
                      .filter((item) =>
                        `${item.description} ${item.status} ${item.reference}`
                          .toLowerCase()
                          .includes(search.toLowerCase()),
                      )
                      .map((item) => (
                        <tr key={item.id}>
                          <td>
                            {
                              customers.find(
                                (customer) =>
                                  customer.customerId === item.customerId,
                              )?.name
                            }
                          </td>
                          <td>{item.description}</td>
                          <td>{money(item.amount)}</td>
                          <td>{money(item.fee)}</td>
                          <td>{item.date.slice(0, 10)}</td>
                          <td>
                            <Status value={item.status} />
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
          {tab === "events" && <EventList query={search} />}
        </>
      )}
      <Modal
        open={!!customer}
        onClose={() => setCustomerId("")}
        title={customer?.name ?? "Customer"}
        description={customer?.email}
      >
        {customer && (
          <>
            <div className="customer-account-summary">
              {customerAccounts.map((account) => (
                <div key={account.id}>
                  <small>{account.name}</small>
                  <strong>{money(account.balance)}</strong>
                  <span>•••• {account.number.slice(-4)}</span>
                </div>
              ))}
            </div>
            <ActivityTable
              transactions={world.transactions
                .filter((item) =>
                  customerAccounts.some(
                    (account) => account.id === item.accountId,
                  ),
                )
                .sort((first, second) => second.date.localeCompare(first.date))
                .slice(0, 12)}
              compact
            />
          </>
        )}
      </Modal>
    </>
  );
}
export function EventList({ query = "" }: { query?: string }) {
  const { world } = useBank();
  const events =
    world?.events.filter((item) =>
      `${item.type} ${item.message}`
        .toLowerCase()
        .includes(query.toLowerCase()),
    ) ?? [];
  return (
    <div className="event-list">
      {events.length ? (
        events.slice(0, 100).map((event) => (
          <div className="event-row" key={event.id}>
            <span
              className={`event-dot ${event.type === "declined" ? "event-error" : ""}`}
            />
            <div>
              <strong>{event.message}</strong>
              <small>
                {event.type.toUpperCase()} · {event.customerId || "System"}
              </small>
            </div>
            <time>
              {new Date(event.date).toLocaleString("en-US", {
                timeZone: "UTC",
              })}
            </time>
          </div>
        ))
      ) : (
        <Empty
          title="No matching events"
          message="Run a scenario to see the event trail."
        />
      )}
    </div>
  );
}
export function Simulation() {
  const { world, run, busy, demo } = useBank();
  const [customerId, setCustomerId] = useState("customer-1"),
    [scenario, setScenario] = useState("deposit"),
    [days, setDays] = useState("1"),
    [reset, setReset] = useState(false),
    [query, setQuery] = useState("");
  if (!world) return null;
  const customers = world.profiles.filter((item) => item.role === "customer");
  const scenarios = [
    {
      id: "deposit",
      title: "Payday deposit",
      detail: "$2,500.00 payroll credit",
      icon: ArrowDownLeft,
    },
    {
      id: "purchase",
      title: "Card purchase",
      detail: "$78.50 at Nike",
      icon: ShoppingBag,
    },
    {
      id: "insufficient",
      title: "Insufficient funds",
      detail: "Declined · Balance unchanged",
      icon: AlertTriangle,
    },
    {
      id: "pending",
      title: "Pending transfer",
      detail: "$125.00 · Reserved, then settled",
      icon: Clock,
    },
  ];
  return (
    <>
      <Heading
        title="A bank. A whole world of possibilities."
        subtitle="Create a moment. See how the bank responds."
        action={
          <span className="simulation-mode">
            <span />
            {demo ? "Local demo environment" : "Administrator simulation"}
          </span>
        }
      />
      <div className="simulation-clock">
        <span>
          <Clock size={24} />
          <div>
            <small>SIMULATION CLOCK · UTC</small>
            <strong>
              {new Date(world.now).toLocaleString("en-US", {
                dateStyle: "long",
                timeStyle: "short",
                timeZone: "UTC",
              })}
            </strong>
          </div>
        </span>
        <div className="action-row">
          <select
            aria-label="Advance interval"
            value={days}
            onChange={(event) => setDays(event.target.value)}
          >
            <option value="1">1 day</option>
            <option value="7">7 days</option>
            <option value="30">30 days</option>
          </select>
          <Button
            disabled={busy}
            onClick={() => void run("advance", { days: Number(days) })}
          >
            <FastForward size={16} />
            Advance simulation
          </Button>
        </div>
      </div>
      <div className="simulation-layout">
        <section className="scenario-section">
          <SectionHead title="Choose a scenario" />
          <Field label="Customer">
            <select
              aria-label="Simulation customer"
              value={customerId}
              onChange={(event) => setCustomerId(event.target.value)}
            >
              {customers.map((item) => (
                <option value={item.customerId} key={item.id}>
                  {item.name} · {item.email}
                </option>
              ))}
            </select>
          </Field>
          <div
            className="scenario-options"
            role="radiogroup"
            aria-label="Banking scenario"
          >
            {scenarios.map((item) => (
              <button
                role="radio"
                aria-checked={scenario === item.id}
                key={item.id}
                className={scenario === item.id ? "selected-scenario" : ""}
                onClick={() => setScenario(item.id)}
              >
                <span>
                  <item.icon size={21} />
                </span>
                <div>
                  <strong>{item.title}</strong>
                  <small>{item.detail}</small>
                </div>
                <span className="scenario-radio">
                  {scenario === item.id && <Check size={13} />}
                </span>
              </button>
            ))}
          </div>
          <Button
            className="wide-button"
            disabled={busy}
            onClick={() => void run("scenario", { customerId, scenario })}
          >
            <Play size={16} />
            {busy ? "Running..." : "Run scenario"}
          </Button>
          <p className="small-note">
            <ShieldCheck size={14} />
            Results persist and appear across account, activity, card, and staff
            screens.
          </p>
        </section>
        <section className="simulation-state">
          <SectionHead title="Current state" />
          <div className="simulation-numbers">
            <div>
              <small>Total bank balance</small>
              <strong>
                {money(
                  world.accounts.reduce(
                    (sum, account) => sum + account.balance,
                    0,
                  ),
                )}
              </strong>
            </div>
            <div>
              <small>Pending transfers</small>
              <strong>
                {
                  world.payments.filter((item) => item.status === "pending")
                    .length
                }
              </strong>
            </div>
            <div>
              <small>Scheduled payments</small>
              <strong>
                {
                  world.payments.filter((item) => item.status === "scheduled")
                    .length
                }
              </strong>
            </div>
            <div>
              <small>Saved revision</small>
              <strong>{world.version}</strong>
            </div>
          </div>
          <div className="reset-area">
            <RotateCcw size={22} />
            <h3>Back to a clean slate.</h3>
            <p>
              Restore the six seeded customers, balances, cards, and two months
              of activity. Authentication identities are preserved.
            </p>
            <Button variant="outline" onClick={() => setReset(true)}>
              <RotateCcw size={15} />
              Reset demo data
            </Button>
          </div>
        </section>
      </div>
      <section className="events-section">
        <SectionHead
          title="Event trail"
          aside={
            <div className="search-input">
              <Search size={15} />
              <Input
                aria-label="Search events"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search events..."
              />
            </div>
          }
        />
        <EventList query={query} />
      </section>
      <Modal
        open={reset}
        onClose={() => setReset(false)}
        title="Reset all simulation data?"
      >
        <p>
          This replaces banking activity, cards, beneficiaries, payments, and
          support conversations with the original demo data. This action cannot
          be undone.
        </p>
        <Button
          variant="destructive"
          disabled={busy}
          onClick={async () => {
            if (await run("reset")) setReset(false);
          }}
        >
          <RotateCcw size={16} />
          Reset all demo data
        </Button>
      </Modal>
    </>
  );
}
