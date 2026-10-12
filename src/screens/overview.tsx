"use client";
import Link from "next/link";
import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRight,
  Plus,
  Eye,
  EyeOff,
  CreditCard,
  Wallet,
  TrendingUp,
  CalendarClock,
  Snowflake,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBank } from "@/components/bank-provider";
import { BankCard, Heading, SectionHead, Empty } from "@/components/bank-ui";
import { available, money } from "@/services/bank";
import { ActivityTable } from "./activity";

export function Overview() {
  const { world, profile, run, busy } = useBank();
  const [hidden, setHidden] = useState(false),
    [period, setPeriod] = useState("30"),
    [cardIndex, setCardIndex] = useState(0);
  if (!world || !profile) return null;
  const accounts = world.accounts.filter(
    (item) => item.customerId === profile.customerId,
  );
  const cards = world.cards.filter(
    (item) => item.customerId === profile.customerId,
  );
  const transactions = world.transactions.filter((item) =>
    accounts.some((account) => account.id === item.accountId),
  );
  const total = accounts.reduce(
    (sum, account) => sum + available(world, account),
    0,
  );
  const month = world.now.slice(0, 7);
  const monthly = transactions.filter(
    (item) => item.date.startsWith(month) && item.status === "completed",
  );
  const income = monthly
    .filter((item) => item.amount > 0)
    .reduce((sum, item) => sum + item.amount, 0);
  const spent = -monthly
    .filter((item) => item.amount < 0)
    .reduce((sum, item) => sum + item.amount, 0);
  const days = Number(period);
  const chart = Array.from({ length: days }, (_, index) => {
    const date = new Date(
      new Date(world.now).getTime() - (days - index - 1) * 86400000,
    )
      .toISOString()
      .slice(0, 10);
    return {
      date: new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      balance:
        transactions
          .filter(
            (item) =>
              item.status === "completed" && item.date.slice(0, 10) <= date,
          )
          .reduce((sum, item) => sum + item.amount, 0) / 100,
    };
  });
  const display = (amount: number) => (hidden ? "••••••" : money(amount));
  const card = cards[cardIndex % Math.max(cards.length, 1)];
  const next = world.payments
    .filter(
      (item) =>
        item.customerId === profile.customerId && item.status === "scheduled",
    )
    .sort((first, second) => first.date.localeCompare(second.date))[0];
  if (!accounts.length)
    return (
      <>
        <Heading
          title={`Welcome, ${profile.name.split(" ")[0]}`}
          subtitle="Your next chapter starts with an account."
        />
        <Empty
          title="Let's make it official"
          message="Open your first simulated ACME Bank account."
          action={
            <Link href="/onboarding" className="button-link primary">
              Open an account <ArrowRight size={16} />
            </Link>
          }
        />
      </>
    );
  return (
    <>
      <Heading
        title={`Good morning, ${profile.name.split(" ")[0]}`}
        subtitle="Here's what's happening with your money today."
        action={
          <div className="heading-date">
            <CalendarClock size={15} />
            {new Date(world.now).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
              timeZone: "UTC",
            })}
          </div>
        }
      />
      <div className="summary-grid">
        <div className="summary-card balance-summary">
          <div className="summary-label">
            <span>Total available balance</span>
            <Button
              title={hidden ? "Show balances" : "Hide balances"}
              aria-label={hidden ? "Show balances" : "Hide balances"}
              size="icon-sm"
              variant="ghost"
              onClick={() => setHidden(!hidden)}
            >
              {hidden ? <EyeOff size={16} /> : <Eye size={16} />}
            </Button>
          </div>
          <div className="summary-amount">
            {display(total)}
            <span>USD</span>
          </div>
          <div className="summary-foot">
            <span className="positive-dot" />
            Across {accounts.length} active accounts <Wallet size={15} />
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-label">
            <span>Money in</span>
            <span className="summary-icon green">
              <ArrowDownLeft size={19} />
            </span>
          </div>
          <div className="summary-amount">{display(income)}</div>
          <div className="summary-foot">
            <span className="positive">
              <ArrowDownLeft size={13} /> Income
            </span>
            <span>This month</span>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-label">
            <span>Money out</span>
            <span className="summary-icon peach">
              <ArrowUpRight size={19} />
            </span>
          </div>
          <div className="summary-amount">{display(spent)}</div>
          <div className="summary-foot">
            <span className="orange-text">Spending & payments</span>
            <span>This month</span>
          </div>
        </div>
      </div>
      <div className="overview-grid">
        <div className="overview-main">
          <section className="chart-section">
            <SectionHead
              title="Balance overview"
              aside={
                <select
                  aria-label="Chart period"
                  value={period}
                  onChange={(event) => setPeriod(event.target.value)}
                  className="compact-select"
                >
                  <option value="30">Last 30 days</option>
                  <option value="60">Last 60 days</option>
                  <option value="7">Last 7 days</option>
                </select>
              }
            />
            <div className="chart-topline">
              <span className="chart-key" />
              Total balance{" "}
              <strong>
                {display(
                  accounts.reduce((sum, account) => sum + account.balance, 0),
                )}
              </strong>
              <span className="muted">USD</span>
            </div>
            <div className={`balance-chart ${hidden ? "chart-hidden" : ""}`}>
              <ResponsiveContainer width="100%" height={224}>
                <AreaChart
                  data={chart}
                  margin={{ top: 10, right: 12, left: -15, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="balanceFill"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#f67537"
                        stopOpacity={0.18}
                      />
                      <stop offset="100%" stopColor="#f67537" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    vertical={false}
                    stroke="#e8ebef"
                    strokeDasharray="4 4"
                  />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    minTickGap={54}
                    tick={{ fontSize: 10, fill: "#8b929c" }}
                    dy={10}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 10, fill: "#8b929c" }}
                    tickFormatter={(value) => `$${(Number(value) / 1000).toFixed(0)}k`}
                    domain={[
                      Math.max(0, Math.min(...chart.map((point) => point.balance)) - 2000),
                      Math.max(...chart.map((point) => point.balance)) + 2000,
                    ]}
                  />
                  <Tooltip
                    formatter={(value) => [
                      money(Number(value) * 100),
                      "Balance",
                    ]}
                    contentStyle={{
                      borderRadius: 6,
                      borderColor: "#e8ebef",
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="balance"
                    stroke="#ee7438"
                    fill="url(#balanceFill)"
                    strokeWidth={2.5}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>
          <section className="quick-section">
            <SectionHead title="Quick actions" />
            <div className="quick-actions">
              <Link href="/transfers">
                <span className="quick-icon">
                  <ArrowUpRight />
                </span>
                <span>Send money</span>
              </Link>
              <Link href="/accounts">
                <span className="quick-icon">
                  <Plus />
                </span>
                <span>Add money</span>
              </Link>
              <Link href="/scheduled-payments">
                <span className="quick-icon">
                  <CalendarClock />
                </span>
                <span>Schedule payment</span>
              </Link>
              <Link href="/statements">
                <span className="quick-icon">
                  <TrendingUp />
                </span>
                <span>View statements</span>
              </Link>
            </div>
          </section>
          <section className="activity-section">
            <SectionHead
              title="Recent activity"
              aside={
                <Link className="inline-link" href="/activity">
                  View all activity <ArrowRight size={14} />
                </Link>
              }
            />
            <ActivityTable
              transactions={[...transactions]
                .sort((first, second) => second.date.localeCompare(first.date))
                .slice(0, 5)}
              compact
            />
          </section>
        </div>
        <aside className="overview-aside">
          <section className="my-card-section">
            <SectionHead
              title="My cards"
              aside={
                <Link
                  href="/cards"
                  className="icon-link"
                  aria-label="Manage cards"
                  title="Manage cards"
                >
                  <MoreHorizontal size={19} />
                </Link>
              }
            />
            {card ? (
              <>
                <BankCard card={card} profile={profile} />
                <div className="card-selector">
                  <span>
                    <span className={cardIndex === 0 ? "active-dot" : ""} />
                    <span className={cardIndex === 1 ? "active-dot" : ""} />
                  </span>
                  <div>
                    <Button
                      title="Previous card"
                      aria-label="Previous card"
                      size="icon-sm"
                      variant="ghost"
                      onClick={() =>
                        setCardIndex(
                          (cardIndex + cards.length - 1) % cards.length,
                        )
                      }
                    >
                      <ChevronLeft size={15} />
                    </Button>
                    <Button
                      title="Next card"
                      aria-label="Next card"
                      size="icon-sm"
                      variant="ghost"
                      onClick={() =>
                        setCardIndex((cardIndex + 1) % cards.length)
                      }
                    >
                      <ChevronRight size={15} />
                    </Button>
                  </div>
                </div>
                <div className="card-shortcuts">
                  <Button
                    variant="outline"
                    disabled={busy}
                    onClick={() =>
                      void run("freeze", {
                        cardId: card.id,
                        frozen: !card.frozen,
                      })
                    }
                  >
                    <Snowflake size={15} />
                    {card.frozen ? "Unfreeze card" : "Freeze card"}
                  </Button>
                  <Link href="/cards" className="button-link outline">
                    <CreditCard size={15} />
                    Manage
                  </Link>
                </div>
              </>
            ) : (
              <Empty
                title="No cards yet"
                message="Cards are provided with your demo checking account."
              />
            )}
          </section>
          <section className="accounts-mini">
            <SectionHead
              title="My accounts"
              aside={
                <Link href="/accounts" className="inline-link">
                  View all <ArrowRight size={13} />
                </Link>
              }
            />
            {accounts.map((account) => (
              <Link
                href={`/accounts?account=${account.id}`}
                className="mini-account"
                key={account.id}
              >
                <span className={`account-icon ${account.kind}`}>
                  <Wallet size={18} />
                </span>
                <div>
                  <strong>
                    {account.kind === "checking"
                      ? "Everyday Checking"
                      : account.name}
                  </strong>
                  <small>•••• {account.number.slice(-4)}</small>
                </div>
                <span>{display(available(world, account))}</span>
              </Link>
            ))}
          </section>
          <section className="upcoming-mini">
            <SectionHead
              title="Coming up"
              aside={<CalendarClock size={16} className="muted" />}
            />
            {next ? (
              <>
                <div className="upcoming-row">
                  <span className="date-tile">
                    <small>
                      {new Date(next.date).toLocaleDateString("en-US", {
                        month: "short",
                        timeZone: "UTC",
                      })}
                    </small>
                    <strong>{new Date(next.date).getUTCDate()}</strong>
                  </span>
                  <div>
                    <strong>{next.description}</strong>
                    <small>{next.reference}</small>
                  </div>
                  <strong>{money(next.amount)}</strong>
                </div>
                <Link href="/scheduled-payments" className="inline-link">
                  Manage scheduled payments <ArrowRight size={14} />
                </Link>
              </>
            ) : (
              <p className="muted">No upcoming payments.</p>
            )}
          </section>
          <Link href="/support" className="peace-of-mind">
            <ShieldCheck size={23} />
            <div>
              <strong>A little peace of mind.</strong>
              <p>We&apos;re here when you need us.</p>
            </div>
            <ArrowUpRight size={17} />
          </Link>
        </aside>
      </div>
    </>
  );
}
