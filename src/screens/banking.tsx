"use client";
import Link from "next/link";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  Landmark,
  Copy,
  Check,
  Search,
  Trash2,
  CalendarClock,
  Snowflake,
  SlidersHorizontal,
  Download,
  FileText,
  ShieldCheck,
  ArrowRight,
  LockKeyhole,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBank } from "@/components/bank-provider";
import {
  BankCard,
  Empty,
  Field,
  Heading,
  Modal,
  SectionHead,
  Status,
} from "@/components/bank-ui";
import { available, cents, money } from "@/services/bank";
import { exportStatement, statementRows } from "@/services/statements";
import { ActivityTable } from "./activity";
import { TransferForm } from "./transfers";
import type { Card, Beneficiary } from "@/lib/types";

export function Accounts() {
  const { world, profile, run, busy, demo } = useBank();
  const search = useSearchParams();
  const [selected, setSelected] = useState(search.get("account") ?? ""),
    [copied, setCopied] = useState(false),
    [deposit, setDeposit] = useState(false);
  if (!world || !profile) return null;
  const accounts = world.accounts.filter(
    (item) => item.customerId === profile.customerId,
  );
  const account = accounts.find((item) => item.id === selected) ?? accounts[0];
  return (
    <>
      <Heading
        title="A place for every dollar"
        subtitle="Your everyday spending. Your next big thing."
        action={
          <Link href="/onboarding" className="button-link primary">
            <Plus size={16} />
            Open an account
          </Link>
        }
      />
      <div className="account-grid">
        {accounts.map((item) => (
          <button
            className={`account-tile ${account?.id === item.id ? "selected-account" : ""}`}
            key={item.id}
            onClick={() => setSelected(item.id)}
          >
            <div>
              <span className={`account-icon ${item.kind}`}>
                <Wallet size={21} />
              </span>
              <Status value="active" />
            </div>
            <h2>{item.name}</h2>
            <span className="muted">
              Account ending {item.number.slice(-4)}
            </span>
            <strong className="account-balance">
              {money(available(world, item))}
            </strong>
            <div className="account-tile-footer">
              <span>Available balance</span>
              <ArrowUpRight size={18} />
            </div>
          </button>
        ))}
      </div>
      {account ? (
        <>
          <section className="account-details">
            <SectionHead
              title="Account details"
              aside={
                <div className="action-row">
                  <Button variant="outline" onClick={() => setDeposit(true)}>
                    <ArrowDownLeft size={15} />
                    Add money
                  </Button>
                  <Link href="/transfers" className="button-link primary">
                    <ArrowUpRight size={15} />
                    Transfer
                  </Link>
                </div>
              }
            />
            <div className="account-detail-grid">
              <div>
                <small>Account number</small>
                <strong>
                  {account.number}
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Copy account number"
                    title="Copy account number"
                    onClick={() => {
                      void navigator.clipboard
                        .writeText(account.number)
                        .then(() => setCopied(true));
                    }}
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                  </Button>
                </strong>
              </div>
              <div>
                <small>Routing number</small>
                <strong>084 000 101</strong>
              </div>
              <div>
                <small>Ledger balance</small>
                <strong>{money(account.balance)}</strong>
              </div>
              <div>
                <small>Pending reservations</small>
                <strong>
                  {money(account.balance - available(world, account))}
                </strong>
              </div>
            </div>
            <p className="small-note">
              <ShieldCheck size={14} />
              Simulated US dollar account. Not a real deposit account.
            </p>
          </section>
          <section className="data-section">
            <SectionHead
              title="Latest account activity"
              aside={
                <Link href="/activity" className="inline-link">
                  All activity <ArrowRight size={14} />
                </Link>
              }
            />
            <ActivityTable
              transactions={world.transactions
                .filter((item) => item.accountId === account.id)
                .sort((first, second) => second.date.localeCompare(first.date))
                .slice(0, 8)}
            />
          </section>
        </>
      ) : (
        <Empty
          title="Your first account is waiting"
          message="Open a simulated account to get started."
        />
      )}
      <Modal
        open={deposit}
        onClose={() => setDeposit(false)}
        title="Add money"
        description="Simulated external deposit. No real funds are moved."
      >
        <div className="deposit-bank">
          <Landmark size={32} />
          <h3>Bank transfer</h3>
          <p>Use your account details to receive money.</p>
          <strong>{account?.number}</strong>
        </div>
        {demo ? (
          <>
            <p className="muted">
              Run the payroll deposit scenario to add $2,500.00 to your checking
              account.
            </p>
            <Button
              disabled={busy}
              onClick={async () => {
                if (
                  await run("scenario", {
                    customerId: profile.customerId,
                    scenario: "deposit",
                  })
                )
                  setDeposit(false);
              }}
            >
              Simulate a $2,500 deposit <ArrowDownLeft size={16} />
            </Button>
          </>
        ) : (
          <p className="muted">
            An administrator can run a simulated deposit from the Simulation
            workspace. Your balance will update in realtime.
          </p>
        )}
      </Modal>
    </>
  );
}

export function Beneficiaries() {
  const { world, profile, run, busy } = useBank();
  const [query, setQuery] = useState(""),
    [add, setAdd] = useState(false),
    [name, setName] = useState(""),
    [bank, setBank] = useState(""),
    [number, setNumber] = useState(""),
    [remove, setRemove] = useState<Beneficiary | null>(null);
  if (!world || !profile) return null;
  const beneficiaries = world.beneficiaries.filter(
    (item) =>
      item.customerId === profile.customerId &&
      `${item.name} ${item.bank}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <Heading
        title="Your people, one tap away"
        subtitle="Save the people and businesses you pay most."
        action={
          <Button onClick={() => setAdd(true)}>
            <Plus size={16} />
            Add beneficiary
          </Button>
        }
      />
      <div className="filter-bar">
        <div className="search-input">
          <Search size={17} />
          <Input
            aria-label="Search beneficiaries"
            placeholder="Search by name or bank..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <span className="muted">{beneficiaries.length} saved recipients</span>
      </div>
      <div className="beneficiary-list">
        {beneficiaries.length ? (
          beneficiaries.map((item) => (
            <div className="beneficiary-row" key={item.id}>
              <span className="initials-avatar">
                {item.name
                  .split(" ")
                  .map((part) => part[0])
                  .slice(0, 2)
                  .join("")}
              </span>
              <div>
                <h3>{item.name}</h3>
                <p>
                  {item.bank} <span>·</span> Account ending{" "}
                  {item.accountNumber.slice(-4)}
                </p>
              </div>
              <span
                className={`bank-type ${item.destinationId ? "internal-bank" : ""}`}
              >
                {item.destinationId ? "ACME · Free transfers" : "External bank"}
              </span>
              <Link href="/transfers" className="button-link outline">
                <ArrowUpRight size={15} />
                Send money
              </Link>
              <Button
                variant="ghost"
                size="icon"
                title="Remove beneficiary"
                aria-label={`Remove ${item.name}`}
                onClick={() => setRemove(item)}
              >
                <Trash2 size={16} />
              </Button>
            </div>
          ))
        ) : (
          <Empty
            title="No beneficiaries found"
            message="Add a recipient or try a different search."
          />
        )}
      </div>
      <Modal open={add} onClose={() => setAdd(false)} title="Add a beneficiary">
        <form
          className="form-stack"
          onSubmit={async (event) => {
            event.preventDefault();
            if (
              await run("beneficiary", { name, bank, accountNumber: number })
            ) {
              setAdd(false);
              setName("");
              setBank("");
              setNumber("");
            }
          }}
        >
          <Field label="Full name or business">
            <Input
              required
              maxLength={80}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Sarah Chen"
            />
          </Field>
          <Field label="Bank name">
            <Input
              required
              maxLength={80}
              value={bank}
              onChange={(event) => setBank(event.target.value)}
              placeholder="e.g. ACME Bank"
            />
          </Field>
          <Field
            label="Account number"
            hint="8–18 digits. ACME accounts are recognized automatically."
          >
            <Input
              required
              inputMode="numeric"
              pattern="[0-9]{8,18}"
              value={number}
              onChange={(event) => setNumber(event.target.value)}
              placeholder="Enter account number"
            />
          </Field>
          <Button type="submit" disabled={busy}>
            {busy ? "Saving..." : "Save beneficiary"}
            <Check size={16} />
          </Button>
        </form>
      </Modal>
      <Modal
        open={!!remove}
        onClose={() => setRemove(null)}
        title="Remove beneficiary?"
      >
        <p>
          {remove?.name} will be removed from your saved recipients. Linked
          pending or scheduled payments must be settled or cancelled first.
        </p>
        <Button
          variant="destructive"
          disabled={busy}
          onClick={async () => {
            if (await run("delete-beneficiary", { beneficiaryId: remove?.id }))
              setRemove(null);
          }}
        >
          <Trash2 size={16} />
          Remove beneficiary
        </Button>
      </Modal>
    </>
  );
}

export function ScheduledPayments() {
  const { world, profile, run, busy } = useBank();
  const [add, setAdd] = useState(false),
    [status, setStatus] = useState("all"),
    [cancel, setCancel] = useState("");
  if (!world || !profile) return null;
  const payments = world.payments.filter(
    (item) =>
      item.customerId === profile.customerId &&
      (status === "all" || item.status === status),
  );
  return (
    <>
      <Heading
        title="One less thing to remember"
        subtitle="Plan your payments. We'll take it from here."
        action={
          <Button onClick={() => setAdd(true)}>
            <Plus size={16} />
            Schedule payment
          </Button>
        }
      />
      <div className="payments-banner">
        <CalendarClock size={24} />
        <div>
          <strong>Right on time, every time.</strong>
          <p>
            Payments are submitted on their due date and settle on the next
            simulation tick.
          </p>
        </div>
        <span>
          Simulation date <strong>{world.now.slice(0, 10)}</strong>
        </span>
      </div>
      <div className="filter-bar">
        <select
          aria-label="Payment status"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="all">All payments</option>
          {["scheduled", "pending", "completed", "failed", "cancelled"].map(
            (item) => (
              <option value={item} key={item}>
                {item.charAt(0).toUpperCase() + item.slice(1)}
              </option>
            ),
          )}
        </select>
        <span className="muted">{payments.length} payments</span>
      </div>
      <section className="data-section">
        <div className="table-scroll">
          <table className="activity-table">
            <thead>
              <tr>
                <th>Recipient</th>
                <th>Payment date</th>
                <th>Reference</th>
                <th>Status</th>
                <th className="amount-cell">Amount + fee</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {payments.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.description}</strong>
                  </td>
                  <td>
                    {new Date(item.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      timeZone: "UTC",
                    })}
                  </td>
                  <td>{item.reference}</td>
                  <td>
                    <Status value={item.status} />
                  </td>
                  <td className="amount-cell">
                    {money(item.amount + item.fee)}
                    <small className="fee-small">Fee {money(item.fee)}</small>
                  </td>
                  <td>
                    {item.status === "scheduled" && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        title="Cancel payment"
                        aria-label={`Cancel ${item.description} payment`}
                        onClick={() => setCancel(item.id)}
                      >
                        <Trash2 size={15} />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!payments.length && (
          <Empty
            title="No payments here"
            message="Schedule your next payment to get started."
          />
        )}
      </section>
      <Modal
        open={add}
        onClose={() => setAdd(false)}
        title="Schedule a payment"
      >
        <TransferForm scheduled onDone={() => setAdd(false)} />
      </Modal>
      <Modal
        open={!!cancel}
        onClose={() => setCancel("")}
        title="Cancel this payment?"
      >
        <p>
          The scheduled payment will not be sent. No money has been debited.
        </p>
        <Button
          variant="destructive"
          disabled={busy}
          onClick={async () => {
            if (await run("cancel-payment", { paymentId: cancel }))
              setCancel("");
          }}
        >
          Cancel payment
        </Button>
      </Modal>
    </>
  );
}

export function Cards() {
  const { world, profile, run, busy } = useBank();
  const [limitCard, setLimitCard] = useState<Card | null>(null),
    [limit, setLimit] = useState(""),
    [error, setError] = useState("");
  if (!world || !profile) return null;
  const cards = world.cards.filter(
    (item) => item.customerId === profile.customerId,
  );
  return (
    <>
      <Heading
        title="A card that keeps up"
        subtitle="Everyday essentials. Extra control. All yours."
      />
      <div className="cards-grid">
        {cards.map((card) => (
          <section key={card.id} className="card-management">
            <SectionHead
              title={
                card.kind === "physical"
                  ? "Everyday debit card"
                  : "Virtual debit card"
              }
              aside={<Status value={card.frozen ? "frozen" : "active"} />}
            />
            <BankCard card={card} profile={profile} />
            <div className="card-management-actions">
              <Button
                disabled={busy}
                variant={card.frozen ? "default" : "outline"}
                onClick={() =>
                  void run("freeze", { cardId: card.id, frozen: !card.frozen })
                }
              >
                <Snowflake size={16} />
                {card.frozen ? "Unfreeze card" : "Freeze card"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setLimitCard(card);
                  setLimit(String(card.limit / 100));
                  setError("");
                }}
              >
                <SlidersHorizontal size={16} />
                Change limit
              </Button>
            </div>
            <div className="spending-limit">
              <div>
                <span>Daily spending limit</span>
                <strong>{money(card.limit)}</strong>
              </div>
              <div className="progress-track">
                <span
                  style={{
                    width: `${Math.min(100, (card.spent / card.limit) * 100)}%`,
                  }}
                />
              </div>
              <div>
                <small>{money(card.spent)} spent today</small>
                <small>
                  {money(Math.max(0, card.limit - card.spent))} remaining
                </small>
              </div>
            </div>
            <dl className="details-list">
              <div>
                <dt>Linked account</dt>
                <dd>
                  {
                    world.accounts.find((item) => item.id === card.accountId)
                      ?.name
                  }
                </dd>
              </div>
              <div>
                <dt>Card number</dt>
                <dd>•••• •••• •••• {card.last4}</dd>
              </div>
              <div>
                <dt>Expires</dt>
                <dd>{card.expiry}</dd>
              </div>
            </dl>
            <p className="small-note">
              <LockKeyhole size={14} />
              {card.frozen
                ? "New purchases are declined while this card is frozen."
                : "Your card is ready for simulated purchases."}
            </p>
          </section>
        ))}
      </div>
      {!cards.length && (
        <Empty
          title="Your cards will live here"
          message="Open a checking account to receive a simulated debit card."
          action={
            <Link href="/onboarding" className="button-link primary">
              Open an account
            </Link>
          }
        />
      )}
      <Modal
        open={!!limitCard}
        onClose={() => setLimitCard(null)}
        title="Change daily spending limit"
      >
        <form
          className="form-stack"
          onSubmit={async (event) => {
            event.preventDefault();
            try {
              if (
                await run("limit", {
                  cardId: limitCard?.id,
                  limit: cents(limit),
                })
              )
                setLimitCard(null);
            } catch {
              setError(
                "Enter a positive amount with up to two decimal places.",
              );
            }
          }}
        >
          <p className="muted">
            Changes take effect immediately. Daily spending resets when the
            simulation advances.
          </p>
          <Field label="Daily limit (USD)">
            <Input
              aria-label="Daily limit"
              inputMode="decimal"
              value={limit}
              onChange={(event) => setLimit(event.target.value)}
              required
            />
          </Field>
          {error && <p className="form-error">{error}</p>}
          <Button type="submit" disabled={busy}>
            Save limit <Check size={16} />
          </Button>
        </form>
      </Modal>
    </>
  );
}

export function Statements() {
  const { world, profile } = useBank();
  const [accountId, setAccountId] = useState(""),
    [selectedMonth, setSelectedMonth] = useState("");
  if (!world || !profile) return null;
  const accounts = world.accounts.filter(
    (item) => item.customerId === profile.customerId,
  );
  const account = accounts.find((item) => item.id === accountId) ?? accounts[0];
  const months = [
    ...new Set(
      world.transactions
        .filter((item) => item.accountId === account?.id)
        .map((item) => item.date.slice(0, 7)),
    ),
  ]
    .sort()
    .reverse();
  return (
    <>
      <Heading
        title="Your money, on the record"
        subtitle="Monthly statements, ready whenever you need them."
      />
      <div className="filter-bar">
        <select
          aria-label="Statement account"
          value={account?.id ?? ""}
          onChange={(event) => setAccountId(event.target.value)}
        >
          {accounts.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} · {item.number.slice(-4)}
            </option>
          ))}
        </select>
        <span className="muted">PDF or CSV · All amounts in USD</span>
      </div>
      <div className="statement-list">
        {account &&
          months.map((month) => {
            const rows = statementRows(world.transactions, account.id, month);
            const movement = rows.reduce((sum, item) => sum + item.amount, 0);
            return (
              <div className="statement-row" key={month}>
                <span className="statement-icon">
                  <FileText size={23} />
                </span>
                <div>
                  <h3>
                    {new Date(`${month}-15T12:00:00Z`).toLocaleDateString(
                      "en-US",
                      { month: "long", year: "numeric" },
                    )}
                  </h3>
                  <p>
                    {account.name} · {rows.length} posted transactions
                  </p>
                </div>
                <div className="statement-net">
                  <small>Net movement</small>
                  <strong className={movement >= 0 ? "positive" : ""}>
                    {money(movement)}
                  </strong>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setSelectedMonth(month)}
                >
                  Preview
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    exportStatement(
                      "csv",
                      account,
                      world.transactions,
                      month,
                      profile.name,
                    )
                  }
                >
                  <Download size={15} />
                  CSV
                </Button>
                <Button
                  onClick={() =>
                    exportStatement(
                      "pdf",
                      account,
                      world.transactions,
                      month,
                      profile.name,
                    )
                  }
                >
                  <Download size={15} />
                  PDF
                </Button>
              </div>
            );
          })}
      </div>
      {!months.length && (
        <Empty
          title="No statements yet"
          message="Your first posted transaction will create a monthly statement."
        />
      )}
      <p className="small-note">
        <ShieldCheck size={14} />
        Statements include completed entries only. CSV amounts are integer
        cents. PDFs include opening and closing balances.
      </p>
      <Modal
        open={!!selectedMonth}
        onClose={() => setSelectedMonth("")}
        title={`Statement · ${selectedMonth}`}
        description={account?.name}
      >
        {account && (
          <ActivityTable
            transactions={statementRows(
              world.transactions,
              account.id,
              selectedMonth,
            )}
            compact
          />
        )}
      </Modal>
    </>
  );
}

export function Onboarding() {
  const { profile, run, busy } = useBank();
  const [step, setStep] = useState(1),
    [kind, setKind] = useState("checking"),
    [name, setName] = useState(""),
    [agreed, setAgreed] = useState(false);
  return (
    <>
      <Heading
        title="Hello, new possibilities"
        subtitle="A new account, a fresh start. Let's make it yours."
      />
      <div className="onboarding-layout">
        <div className="onboarding-steps">
          {["Choose your account", "Verify your details", "Ready to go"].map(
            (label, index) => (
              <div
                key={label}
                className={step >= index + 1 ? "current-step" : ""}
              >
                <span>
                  {step > index + 1 ? <Check size={16} /> : index + 1}
                </span>
                <strong>{label}</strong>
              </div>
            ),
          )}
        </div>
        <section className="onboarding-surface">
          {step === 1 ? (
            <>
              <h2>What are you saving for?</h2>
              <p className="muted">
                Choose the account that fits your next move.
              </p>
              <div className="account-choices">
                {[
                  {
                    value: "checking",
                    title: "Everyday Checking",
                    detail: "For the day-to-day and everything in between.",
                    icon: Wallet,
                  },
                  {
                    value: "savings",
                    title: "Growth Savings",
                    detail: "A dedicated home for your future plans.",
                    icon: Landmark,
                  },
                ].map((item) => (
                  <button
                    key={item.value}
                    className={kind === item.value ? "selected-choice" : ""}
                    onClick={() => setKind(item.value)}
                  >
                    <item.icon size={26} />
                    <h3>{item.title}</h3>
                    <p>{item.detail}</p>
                    <span>
                      $0 monthly fee <Check size={15} />
                    </span>
                  </button>
                ))}
              </div>
              <Field label="Account nickname (optional)">
                <Input
                  value={name}
                  maxLength={50}
                  onChange={(event) => setName(event.target.value)}
                  placeholder={
                    kind === "checking" ? "Everyday Checking" : "Growth Savings"
                  }
                />
              </Field>
              <Button className="wide-button" onClick={() => setStep(2)}>
                Continue <ArrowRight size={16} />
              </Button>
            </>
          ) : step === 2 ? (
            <>
              <h2>Let&apos;s check your details</h2>
              <p className="muted">
                Identity verification is simulated and completes instantly.
              </p>
              <dl className="details-list">
                <div>
                  <dt>Account holder</dt>
                  <dd>{profile?.name}</dd>
                </div>
                <div>
                  <dt>Email</dt>
                  <dd>{profile?.email}</dd>
                </div>
                <div>
                  <dt>Account type</dt>
                  <dd>{kind === "checking" ? "Checking" : "Savings"}</dd>
                </div>
                <div>
                  <dt>Monthly fee</dt>
                  <dd>$0.00</dd>
                </div>
              </dl>
              <label className="checkbox-field">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(event) => setAgreed(event.target.checked)}
                />
                <span>
                  I understand this is a simulated bank. No real account is
                  opened and no real money is held.
                </span>
              </label>
              <Button
                className="wide-button"
                disabled={!agreed || busy}
                onClick={async () => {
                  if (
                    await run("open-account", {
                      kind,
                      name:
                        name ||
                        (kind === "checking"
                          ? "Everyday Checking"
                          : "Growth Savings"),
                    })
                  )
                    setStep(3);
                }}
              >
                {busy ? "Opening your account..." : "Open my account"}
                <Check size={16} />
              </Button>
              <Button variant="ghost" onClick={() => setStep(1)}>
                Back
              </Button>
            </>
          ) : (
            <div className="success-state">
              <span className="success-check">
                <Check size={32} />
              </span>
              <h2>Welcome to your next chapter.</h2>
              <p>Your account is open and ready to go.</p>
              <Link href="/accounts" className="button-link primary">
                Go to my accounts <ArrowRight size={16} />
              </Link>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
