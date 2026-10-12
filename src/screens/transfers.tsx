"use client";
import { useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  ArrowRight,
  ArrowLeftRight,
  ShieldCheck,
  CalendarClock,
  Check,
  Users,
} from "lucide-react";
import { useBank } from "@/components/bank-provider";
import { Heading, Field, Empty, Status } from "@/components/bank-ui";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { available, cents, feeFor, money } from "@/services/bank";

export function TransferForm({
  scheduled = false,
  onDone,
}: {
  scheduled?: boolean;
  onDone?: () => void;
}) {
  const { world, profile, run, busy } = useBank();
  const accounts =
    world?.accounts.filter((item) => item.customerId === profile?.customerId) ??
    [];
  const beneficiaries =
    world?.beneficiaries.filter(
      (item) => item.customerId === profile?.customerId,
    ) ?? [];
  const [mode, setMode] = useState(scheduled ? "schedule" : "send"),
    [accountId, setAccountId] = useState(accounts[0]?.id ?? ""),
    [destination, setDestination] = useState(beneficiaries[0]?.id ?? ""),
    [amount, setAmount] = useState(""),
    [reference, setReference] = useState(""),
    [date, setDate] = useState(""),
    [review, setReview] = useState(false),
    [complete, setComplete] = useState(false),
    [error, setError] = useState("");
  if (!world || !profile) return null;
  const account = accounts.find((item) => item.id === accountId);
  const beneficiary = beneficiaries.find((item) => item.id === destination);
  const own = accounts.find(
    (item) => item.id === destination && item.id !== accountId,
  );
  const fee = feeFor(!!(own || beneficiary?.destinationId));
  const getPayload = () => ({
    accountId,
    ...(mode === "own"
      ? { destinationId: destination }
      : { beneficiaryId: destination }),
    amount: cents(amount),
    reference: reference || "Bank transfer",
    ...(mode === "schedule"
      ? { date: new Date(`${date}T09:00:00Z`).toISOString() }
      : {}),
  });
  const prepare = (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    try {
      const payload = getPayload();
      if (!account || !(own || beneficiary))
        throw new Error("Choose a valid source and recipient.");
      if (available(world, account) < payload.amount + fee)
        throw new Error(
          "Insufficient funds. Choose a smaller amount or another account.",
        );
      if (mode === "schedule" && payload.date! <= world.now)
        throw new Error("Choose a date after the current simulation date.");
      setReview(true);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Check your transfer details.",
      );
    }
  };
  const confirm = async () => {
    if (
      await run(mode === "schedule" ? "schedule" : "transfer", getPayload())
    ) {
      setComplete(true);
      onDone?.();
    }
  };
  if (!accounts.length)
    return (
      <Empty
        title="An account comes first"
        message="Open an account before sending money."
        action={
          <Link href="/onboarding" className="button-link primary">
            Open an account
          </Link>
        }
      />
    );
  if (complete)
    return (
      <div className="success-state">
        <span className="success-check">
          <Check size={32} />
        </span>
        <h2>{mode === "schedule" ? "Payment scheduled" : "You're all set"}</h2>
        <p>
          {money(cents(amount))} to {own?.name ?? beneficiary?.name}
        </p>
        <p className="muted">
          {mode === "schedule"
            ? `Scheduled for ${date}.`
            : "Your transfer is pending. Funds are reserved until settlement."}
        </p>
        <Button
          onClick={() => {
            setComplete(false);
            setReview(false);
            setAmount("");
            setReference("");
          }}
        >
          Make another transfer <ArrowUpRight size={16} />
        </Button>
        <Link href="/activity" className="inline-link">
          View activity <ArrowRight size={14} />
        </Link>
      </div>
    );
  return (
    <div className="transfer-form">
      {!review ? (
        <>
          <div className="segmented" role="tablist" aria-label="Transfer type">
            {[
              { value: "send", label: "Send money", icon: ArrowUpRight },
              { value: "own", label: "Between accounts", icon: ArrowLeftRight },
              { value: "schedule", label: "Schedule", icon: CalendarClock },
            ].map((item) => (
              <button
                type="button"
                role="tab"
                aria-selected={mode === item.value}
                key={item.value}
                className={mode === item.value ? "selected" : ""}
                onClick={() => {
                  setMode(item.value);
                  setDestination(
                    item.value === "own"
                      ? (accounts.find((item) => item.id !== accountId)?.id ??
                          "")
                      : (beneficiaries[0]?.id ?? ""),
                  );
                }}
              >
                <item.icon size={16} />
                {item.label}
              </button>
            ))}
          </div>
          <form onSubmit={prepare} className="form-stack">
            <Field label="From account">
              <select
                value={accountId}
                onChange={(event) => {
                  setAccountId(event.target.value);
                  if (mode === "own" && destination === event.target.value)
                    setDestination(
                      accounts.find((item) => item.id !== event.target.value)
                        ?.id ?? "",
                    );
                }}
              >
                {accounts.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} · {item.number.slice(-4)} ·{" "}
                    {money(available(world, item))}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={mode === "own" ? "To account" : "Recipient"}>
              <select
                required
                value={destination}
                onChange={(event) => setDestination(event.target.value)}
              >
                <option value="">Choose a recipient</option>
                {mode === "own"
                  ? accounts
                      .filter((item) => item.id !== accountId)
                      .map((item) => (
                        <option value={item.id} key={item.id}>
                          {item.name} · {item.number.slice(-4)}
                        </option>
                      ))
                  : beneficiaries.map((item) => (
                      <option value={item.id} key={item.id}>
                        {item.name} · {item.bank}
                      </option>
                    ))}
              </select>
            </Field>
            {mode !== "own" && (
              <Link
                href="/beneficiaries"
                className="inline-link form-recipient-link"
              >
                <Users size={14} />
                Manage beneficiaries
              </Link>
            )}
            <Field
              label="Amount"
              hint={
                account
                  ? `Available balance: ${money(available(world, account))}`
                  : ""
              }
            >
              <div className="amount-input">
                <span>$</span>
                <Input
                  aria-label="Amount"
                  required
                  inputMode="decimal"
                  placeholder="0.00"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                />
                <span>USD</span>
              </div>
            </Field>
            {mode === "schedule" && (
              <Field label="Payment date">
                <Input
                  aria-label="Payment date"
                  required
                  type="date"
                  min={new Date(new Date(world.now).getTime() + 86400000)
                    .toISOString()
                    .slice(0, 10)}
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                />
              </Field>
            )}
            <Field label="Reference (optional)">
              <Input
                maxLength={80}
                placeholder="What's it for?"
                value={reference}
                onChange={(event) => setReference(event.target.value)}
              />
            </Field>
            <div className="fee-line">
              <span>Transfer fee</span>
              <strong>{fee === 0 ? "Free" : money(fee)}</strong>
            </div>
            {error && (
              <p role="alert" className="form-error">
                {error}
              </p>
            )}
            <Button type="submit" className="wide-button" disabled={busy}>
              Review {mode === "schedule" ? "payment" : "transfer"}
              <ArrowRight size={16} />
            </Button>
            <p className="form-security">
              <ShieldCheck size={13} />
              Your money. Protected every step of the way.
            </p>
          </form>
        </>
      ) : (
        <div className="review-transfer">
          <span className="review-icon">
            <ArrowUpRight size={28} />
          </span>
          <h2>Review your {mode === "schedule" ? "payment" : "transfer"}</h2>
          <p className="detail-amount">{money(cents(amount))}</p>
          <dl className="details-list">
            <div>
              <dt>From</dt>
              <dd>
                {account?.name} · {account?.number.slice(-4)}
              </dd>
            </div>
            <div>
              <dt>To</dt>
              <dd>{own?.name ?? beneficiary?.name}</dd>
            </div>
            <div>
              <dt>Bank</dt>
              <dd>{own ? "ACME Bank" : beneficiary?.bank}</dd>
            </div>
            <div>
              <dt>Reference</dt>
              <dd>{reference || "Bank transfer"}</dd>
            </div>
            {mode === "schedule" && (
              <div>
                <dt>Payment date</dt>
                <dd>{date}</dd>
              </div>
            )}
            <div>
              <dt>Transfer fee</dt>
              <dd>{money(fee)}</dd>
            </div>
            <div className="review-total">
              <dt>Total debit</dt>
              <dd>{money(cents(amount) + fee)}</dd>
            </div>
          </dl>
          <p className="review-note">
            {mode === "schedule"
              ? "Funds will be checked again on the payment date."
              : "Funds will be reserved now. The transfer settles when the simulation advances."}
          </p>
          <Button
            className="wide-button"
            disabled={busy}
            onClick={() => void confirm()}
          >
            {busy ? "Processing..." : "Confirm transfer"}
            <Check size={16} />
          </Button>
          <Button
            variant="ghost"
            disabled={busy}
            onClick={() => setReview(false)}
          >
            Back to details
          </Button>
        </div>
      )}
    </div>
  );
}
export function Transfers() {
  const { world, profile } = useBank();
  if (!world || !profile) return null;
  const payments = world.payments
    .filter(
      (item) =>
        item.customerId === profile.customerId && item.status !== "scheduled",
    )
    .slice(0, 6);
  return (
    <>
      <Heading
        title="Move money, effortlessly"
        subtitle="To someone else. Between your accounts. On your schedule."
      />
      <div className="two-column transfer-layout">
        <section className="form-surface">
          <TransferForm />
        </section>
        <aside className="transfer-aside">
          <Section title="A good transfer starts here">
            <div className="transfer-info-row">
              <span>
                <ArrowLeftRight size={20} />
              </span>
              <div>
                <h3>ACME to ACME</h3>
                <p>No fees. Money stays in good company.</p>
                <strong>Free</strong>
              </div>
            </div>
            <div className="transfer-info-row">
              <span>
                <ArrowUpRight size={20} />
              </span>
              <div>
                <h3>To another bank</h3>
                <p>One simple fee, shown before you send.</p>
                <strong>$1.50 per transfer</strong>
              </div>
            </div>
            <div className="transfer-info-row">
              <span>
                <ShieldCheck size={20} />
              </span>
              <div>
                <h3>No surprises</h3>
                <p>Pending transfers reserve your balance until they settle.</p>
              </div>
            </div>
          </Section>
          <Section title="Recent transfers">
            {payments.length ? (
              payments.map((item) => (
                <div key={item.id} className="recent-payment">
                  <div>
                    <strong>{item.description}</strong>
                    <small>{item.reference}</small>
                  </div>
                  <div>
                    <strong>{money(item.amount)}</strong>
                    <Status value={item.status} />
                  </div>
                </div>
              ))
            ) : (
              <p className="muted">Your transfers will appear here.</p>
            )}
          </Section>
        </aside>
      </div>
    </>
  );
}
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="aside-section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}
