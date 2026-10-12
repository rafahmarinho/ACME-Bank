"use client";
import { useDeferredValue, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Search,
  SlidersHorizontal,
  ArrowDownLeft,
  ArrowUpRight,
  ShoppingBag,
  Coffee,
  Car,
  House,
  Music,
  Download,
  ChevronDown,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useBank } from "@/components/bank-provider";
import { Empty, Heading, Modal, Status, Field } from "@/components/bank-ui";
import { money } from "@/services/bank";
import type { Transaction } from "@/lib/types";
import { exportStatement } from "@/services/statements";
export function MerchantIcon({ transaction }: { transaction: Transaction }) {
  const category = transaction.category;
  const Icon =
    category === "Food & drink"
      ? Coffee
      : category === "Transport"
        ? Car
        : category === "Housing"
          ? House
          : category === "Subscriptions"
            ? Music
            : transaction.amount > 0
              ? ArrowDownLeft
              : category === "Transfer"
                ? ArrowUpRight
                : ShoppingBag;
  return (
    <span
      className={`merchant-icon ${transaction.amount > 0 ? "income-merchant" : ""} ${transaction.description.includes("Spotify") ? "spotify-merchant" : ""} ${transaction.description.includes("Blue Bottle") ? "coffee-merchant" : ""}`}
    >
      <Icon size={18} />
    </span>
  );
}
export function ActivityTable({
  transactions,
  compact = false,
}: {
  transactions: Transaction[];
  compact?: boolean;
}) {
  const [selected, setSelected] = useState<Transaction | null>(null);
  if (!transactions.length)
    return (
      <Empty
        title="No matching activity"
        message="Try adjusting your search or filters."
      />
    );
  return (
    <>
      <div className="table-scroll">
        <table className={`activity-table ${compact ? "compact-table" : ""}`}>
          <thead>
            <tr>
              <th>Transaction</th>
              <th>Category</th>
              <th>Date</th>
              {!compact && <th>Status</th>}
              <th className="amount-cell">Amount</th>
              <th>
                <span className="sr-only">Details</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <tr key={transaction.id}>
                <td>
                  <button
                    className="transaction-name"
                    onClick={() => setSelected(transaction)}
                  >
                    <MerchantIcon transaction={transaction} />
                    <span>
                      <strong>{transaction.description}</strong>
                      <small>
                        {transaction.status === "completed"
                          ? transaction.amount > 0
                            ? "Bank deposit"
                            : transaction.category === "Transfer"
                              ? "Bank transfer"
                              : "Card payment"
                          : transaction.status === "pending"
                            ? "Awaiting settlement"
                            : "Payment declined"}
                      </small>
                    </span>
                  </button>
                </td>
                <td>
                  <span className="category-label">{transaction.category}</span>
                </td>
                <td>
                  {new Date(transaction.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    timeZone: "UTC",
                  })}
                </td>
                {!compact && (
                  <td>
                    <Status value={transaction.status} />
                  </td>
                )}
                <td
                  className={`amount-cell ${transaction.amount > 0 ? "positive" : ""}`}
                >
                  {transaction.amount > 0 ? "+" : "−"}
                  {money(Math.abs(transaction.amount))}
                </td>
                <td>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label={`Details for ${transaction.description}`}
                    title="Transaction details"
                    onClick={() => setSelected(transaction)}
                  >
                    <ArrowUpRight size={14} />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title="Transaction details"
      >
        {selected && (
          <>
            <div className="detail-amount">{money(selected.amount)}</div>
            <Status value={selected.status} />
            <dl className="details-list">
              <div>
                <dt>Description</dt>
                <dd>{selected.description}</dd>
              </div>
              <div>
                <dt>Category</dt>
                <dd>{selected.category}</dd>
              </div>
              <div>
                <dt>Date</dt>
                <dd>
                  {new Date(selected.date).toLocaleString("en-US", {
                    timeZone: "UTC",
                  })}{" "}
                  UTC
                </dd>
              </div>
              <div>
                <dt>Reference</dt>
                <dd>{selected.reference}</dd>
              </div>
              <div>
                <dt>Amount in cents</dt>
                <dd>{selected.amount}</dd>
              </div>
            </dl>
          </>
        )}
      </Modal>
    </>
  );
}
export function Activity({ accountId }: { accountId?: string }) {
  const { world, profile } = useBank();
  const params = useSearchParams();
  const [search, setSearch] = useState(params.get("q") ?? ""),
    [status, setStatus] = useState("all"),
    [category, setCategory] = useState("all"),
    [account, setAccount] = useState(accountId ?? "all"),
    [filters, setFilters] = useState(false),
    [from, setFrom] = useState(""),
    [to, setTo] = useState(""),
    [count, setCount] = useState(15);
  const query = useDeferredValue(search);
  if (!world || !profile) return null;
  const accounts = world.accounts.filter(
    (item) => item.customerId === profile.customerId,
  );
  const ownTransactions = world.transactions.filter((item) =>
    accounts.some((account) => account.id === item.accountId),
  );
  const pending: Transaction[] = world.payments
    .filter(
      (item) =>
        item.customerId === profile.customerId && item.status === "pending",
    )
    .map((item) => ({
      id: item.id,
      accountId: item.accountId,
      description: item.description,
      category: "Transfer",
      amount: -item.amount,
      date: item.date,
      status: "pending",
      reference: item.reference,
    }));
  const transactions = [...ownTransactions, ...pending]
    .filter(
      (item) =>
        (account === "all" || item.accountId === account) &&
        (status === "all" || item.status === status) &&
        (category === "all" || item.category === category) &&
        (!from || item.date.slice(0, 10) >= from) &&
        (!to || item.date.slice(0, 10) <= to) &&
        `${item.description} ${item.reference} ${item.category}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .sort((first, second) => second.date.localeCompare(first.date));
  return (
    <>
      <Heading
        title="Account activity"
        subtitle="Every payment, deposit, and little coffee. All in one place."
        action={
          <Button
            variant="outline"
            disabled={!accounts.length}
            onClick={() =>
              exportStatement(
                "csv",
                accounts.find((item) => item.id === account) ?? accounts[0],
                world.transactions,
                world.now.slice(0, 7),
                profile.name,
              )
            }
          >
            <Download size={15} />
            Export this month
          </Button>
        }
      />
      <div className="filter-bar">
        <div className="search-input">
          <Search size={17} />
          <Input
            aria-label="Search transactions"
            placeholder="Search transactions..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setCount(15);
            }}
          />
        </div>
        <select
          aria-label="Filter by account"
          value={account}
          onChange={(event) => setAccount(event.target.value)}
        >
          <option value="all">All accounts</option>
          {accounts.map((item) => (
            <option value={item.id} key={item.id}>
              {item.name} · {item.number.slice(-4)}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter by status"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="all">All statuses</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
        <Button variant="outline" onClick={() => setFilters(!filters)}>
          <SlidersHorizontal size={15} />
          Filters
        </Button>
      </div>
      {filters && (
        <div className="expanded-filters">
          <Field label="Category">
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option value="all">All categories</option>
              {[...new Set(ownTransactions.map((item) => item.category))].map(
                (item) => (
                  <option key={item}>{item}</option>
                ),
              )}
            </select>
          </Field>
          <Field label="From">
            <Input
              type="date"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
            />
          </Field>
          <Field label="To">
            <Input
              type="date"
              value={to}
              onChange={(event) => setTo(event.target.value)}
            />
          </Field>
          <Button
            variant="ghost"
            onClick={() => {
              setCategory("all");
              setFrom("");
              setTo("");
              setStatus("all");
              setSearch("");
            }}
          >
            Clear filters
          </Button>
        </div>
      )}
      <section className="data-section">
        <div className="results-label">
          {transactions.length} transactions <span>All amounts in USD</span>
        </div>
        <ActivityTable transactions={transactions.slice(0, count)} />
        {transactions.length > count && (
          <div className="load-more">
            <Button variant="outline" onClick={() => setCount(count + 20)}>
              Show more <ChevronDown size={15} />
            </Button>
          </div>
        )}
      </section>
    </>
  );
}
