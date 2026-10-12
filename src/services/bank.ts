import { z } from "zod";
import type {
  Command,
  Profile,
  World,
  Transaction,
  Account,
} from "@/lib/types";

export const money = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    cents / 100,
  );
export const cents = (value: string) => {
  if (!/^\d+(\.\d{1,2})?$/.test(value))
    throw new Error("Enter a positive amount with at most two decimal places.");
  const [whole, fraction = ""] = value.split(".");
  const result = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return z.number().int().positive().max(100_000_000).parse(result);
};
export const feeFor = (internal: boolean) => (internal ? 0 : 150);
export const available = (world: World, account: Account) =>
  account.balance -
  world.payments
    .filter(
      (payment) =>
        payment.accountId === account.id && payment.status === "pending",
    )
    .reduce((sum, payment) => sum + payment.amount + payment.fee, 0);
const names = [
  "Alex Morgan",
  "Sarah Chen",
  "James Wilson",
  "Emily Davis",
  "Michael Brooks",
  "Olivia Taylor",
];
export function seedWorld(): World {
  const world: World = {
    version: 1,
    now: "2026-10-11T09:30:00.000Z",
    profiles: [],
    accounts: [],
    transactions: [],
    beneficiaries: [],
    payments: [],
    cards: [],
    tickets: [],
    events: [],
    processed: [],
  };
  names.forEach((name, index) => {
    const customerId = `customer-${index + 1}`;
    world.profiles.push({
      id: customerId,
      customerId,
      name,
      email: `${name.split(" ")[0].toLowerCase()}@acme.demo`,
      role: "customer",
      phone: "+1 (415) 555-0124",
      address: "120 Market Street, San Francisco, CA",
      notifications: true,
    });
    const checking: Account = {
      id: `${customerId}-checking`,
      customerId,
      name: "Everyday Checking",
      number: `083102${4821 + index}`,
      kind: "checking",
      balance: 0,
      status: "active",
    };
    const savings: Account = {
      ...checking,
      id: `${customerId}-savings`,
      name: "Growth Savings",
      number: `083104${9036 + index}`,
      kind: "savings",
    };
    world.accounts.push(checking, savings);
    const add = (
      account: Account,
      amount: number,
      description: string,
      category: string,
      date: string,
    ) => {
      account.balance += amount;
      world.transactions.push({
        id: `seed-${world.transactions.length}`,
        accountId: account.id,
        amount,
        description,
        category,
        date,
        status: "completed",
        reference: `ACM-${20000 + world.transactions.length}`,
      });
    };
    add(
      checking,
      850000 + index * 23000,
      "Opening balance",
      "Deposit",
      "2026-08-01T08:00:00Z",
    );
    add(
      savings,
      1545000 + index * 13000,
      "Opening balance",
      "Deposit",
      "2026-08-01T08:00:00Z",
    );
    for (const month of [8, 9]) {
      add(
        checking,
        425000,
        "Acme Studio · Salary",
        "Income",
        `2026-${month.toString().padStart(2, "0")}-28T09:00:00Z`,
      );
      for (let day = 2; day <= 28; day += 3) {
        const merchants = [
          "Whole Foods Market",
          "Blue Bottle Coffee",
          "Apple",
          "Netflix",
          "Uber",
          "Trader Joe's",
          "Spotify",
          "Amazon",
          "Sweetgreen",
        ];
        const categories = [
          "Groceries",
          "Food & drink",
          "Shopping",
          "Subscriptions",
          "Transport",
          "Groceries",
          "Subscriptions",
          "Shopping",
          "Food & drink",
        ];
        const position = Math.floor(day / 3) % merchants.length;
        add(
          checking,
          -(1450 + position * 570 + index * 103),
          merchants[position],
          categories[position],
          `2026-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}T14:00:00Z`,
        );
      }
      add(
        checking,
        -175000,
        "Maple Apartments · Rent",
        "Housing",
        `2026-0${month}-01T08:00:00Z`,
      );
    }
    add(
      checking,
      -8642,
      "Whole Foods Market",
      "Groceries",
      "2026-10-10T16:42:00Z",
    );
    add(
      checking,
      -650,
      "Blue Bottle Coffee",
      "Food & drink",
      "2026-10-10T10:15:00Z",
    );
    add(
      checking,
      -1599,
      "Spotify Premium",
      "Subscriptions",
      "2026-10-09T08:00:00Z",
    );
    add(
      checking,
      245000,
      "Acme Studio · Project payment",
      "Income",
      "2026-10-08T09:00:00Z",
    );
    add(checking, -12900, "Apple", "Shopping", "2026-10-08T11:20:00Z");
    const target = index === 5 ? 1 : index + 2;
    world.beneficiaries.push(
      {
        id: `beneficiary-${index}-1`,
        customerId,
        name: names[target - 1],
        bank: "ACME Bank",
        accountNumber: `083102${4820 + target}`,
        destinationId: `customer-${target}-checking`,
      },
      {
        id: `beneficiary-${index}-2`,
        customerId,
        name: "Maple Apartments",
        bank: "Chase Bank",
        accountNumber: "021000089432",
      },
    );
    world.cards.push(
      {
        id: `card-${index}-1`,
        customerId,
        accountId: checking.id,
        last4: String(4821 + index),
        frozen: false,
        limit: 250000,
        spent: 43850,
        expiry: "09/29",
        kind: "physical",
      },
      {
        id: `card-${index}-2`,
        customerId,
        accountId: checking.id,
        last4: String(9062 + index),
        frozen: false,
        limit: 100000,
        spent: 1599,
        expiry: "09/29",
        kind: "virtual",
      },
    );
    world.payments.push({
      id: `scheduled-${index}`,
      customerId,
      accountId: checking.id,
      beneficiaryId: `beneficiary-${index}-2`,
      amount: 175000,
      fee: 150,
      reference: "November rent",
      date: "2026-11-01T09:00:00Z",
      status: "scheduled",
      description: "Maple Apartments",
    });
  });
  world.profiles.push(
    {
      id: "support-1",
      customerId: "",
      name: "Jamie Parker",
      email: "support@acme.demo",
      role: "support",
      phone: "",
      address: "",
      notifications: true,
    },
    {
      id: "admin-1",
      customerId: "",
      name: "Jordan Lee",
      email: "admin@acme.demo",
      role: "administrator",
      phone: "",
      address: "",
      notifications: true,
    },
  );
  world.tickets.push({
    id: "ticket-seed",
    customerId: "customer-1",
    subject: "Question about my card limit",
    category: "Cards",
    status: "open",
    date: "2026-10-10T12:00:00Z",
    messages: [
      {
        author: "Alex Morgan",
        body: "Can I adjust my daily spending limit before my trip?",
        date: "2026-10-10T12:00:00Z",
      },
      {
        author: "Jamie · ACME Support",
        body: "Absolutely. Open Cards, choose your card, and update the daily spending limit. Changes take effect immediately.",
        date: "2026-10-10T12:15:00Z",
      },
    ],
  });
  world.events.push({
    id: "event-seed",
    date: world.now,
    type: "system",
    message:
      "Demo environment initialized with six customers and two months of activity.",
  });
  return world;
}

const text = (value: unknown, maximum = 200) =>
  z.string().trim().min(1).max(maximum).parse(value);
const positive = (value: unknown) =>
  z.number().int().positive().max(100_000_000).parse(value);
export function execute(
  source: World,
  actor: Profile,
  command: Command,
): World {
  z.string().min(1).max(100).parse(command.id);
  if (source.processed.includes(command.id)) return source;
  if (
    ![
      "transfer",
      "schedule",
      "cancel-payment",
      "beneficiary",
      "delete-beneficiary",
      "freeze",
      "limit",
      "profile",
      "open-account",
      "ticket",
      "reply",
      "resolve-ticket",
      "scenario",
      "advance",
      "reset",
    ].includes(command.type)
  )
    throw new Error("Unknown banking action.");
  const admin = actor.role === "administrator";
  const staff = actor.role !== "customer";
  if (["scenario", "advance", "reset"].includes(command.type) && !admin)
    throw new Error("Administrator access is required.");
  if (
    staff &&
    [
      "transfer",
      "schedule",
      "cancel-payment",
      "beneficiary",
      "delete-beneficiary",
      "freeze",
      "limit",
      "open-account",
      "ticket",
    ].includes(command.type)
  )
    throw new Error("Only customers can change their own banking data.");
  if (command.type === "reset") {
    const reset = seedWorld();
    reset.profiles = reset.profiles.map((profile) => {
      const existing = source.profiles.find(
        (item) =>
          item.email === profile.email ||
          (!!profile.customerId && item.customerId === profile.customerId),
      );
      return existing
        ? { ...profile, id: existing.id, email: existing.email }
        : profile;
    });
    reset.profiles.push(
      ...source.profiles.filter(
        (profile) => !reset.profiles.some((item) => item.id === profile.id),
      ),
    );
    reset.version = source.version + 1;
    reset.processed = [command.id];
    return reset;
  }
  const world = structuredClone(source);
  const payload = command.payload;
  let sequence = 0;
  const id = (prefix: string) => `${prefix}-${command.id}-${sequence++}`;
  const log = (type: string, message: string, customerId = actor.customerId) =>
    world.events.unshift({
      id: id("event"),
      date: world.now,
      type,
      message,
      customerId,
    });
  const ownedAccount = (accountId: unknown) => {
    const account = world.accounts.find(
      (item) => item.id === accountId && item.customerId === actor.customerId,
    );
    if (!account) throw new Error("Account not found or access denied.");
    return account;
  };
  const post = (
    account: Account,
    amount: number,
    description: string,
    category: string,
    reference: string,
  ) => {
    account.balance += amount;
    if (!Number.isSafeInteger(account.balance) || account.balance < 0)
      throw new Error("Insufficient funds.");
    const transaction: Transaction = {
      id: id("transaction"),
      accountId: account.id,
      amount,
      description,
      category,
      date: world.now,
      status: "completed",
      reference,
    };
    world.transactions.unshift(transaction);
  };
  const settle = (payment: World["payments"][number]) => {
    const account = world.accounts.find(
      (item) => item.id === payment.accountId,
    )!;
    post(
      account,
      -payment.amount,
      payment.description,
      "Transfer",
      payment.reference,
    );
    if (payment.fee)
      post(
        account,
        -payment.fee,
        "External transfer fee",
        "Fees",
        payment.reference,
      );
    if (payment.destinationId) {
      const target = world.accounts.find(
        (item) => item.id === payment.destinationId,
      );
      if (!target) throw new Error("Destination account no longer exists.");
      post(
        target,
        payment.amount,
        `Transfer from ${world.profiles.find((profile) => profile.customerId === payment.customerId)?.name ?? "ACME customer"}`,
        "Transfer",
        payment.reference,
      );
    }
    payment.status = "completed";
    log(
      "settlement",
      `${payment.description}: ${money(payment.amount)} settled.`,
      payment.customerId,
    );
  };
  switch (command.type) {
    case "transfer":
    case "schedule": {
      const account = ownedAccount(payload.accountId);
      const beneficiary = world.beneficiaries.find(
        (item) =>
          item.id === payload.beneficiaryId &&
          item.customerId === actor.customerId,
      );
      const ownDestination = world.accounts.find(
        (item) =>
          item.id === payload.destinationId &&
          item.customerId === actor.customerId &&
          item.id !== account.id,
      );
      if (!beneficiary && !ownDestination)
        throw new Error("Choose a valid beneficiary or another account.");
      const amount = positive(payload.amount);
      const fee = feeFor(!!(ownDestination || beneficiary?.destinationId));
      if (available(world, account) < amount + fee)
        throw new Error(
          "Insufficient funds. Your available balance must cover the amount and fee.",
        );
      let date = world.now;
      if (command.type === "schedule") {
        date = z.iso.datetime().parse(payload.date);
        if (date <= world.now)
          throw new Error("Choose a date after the simulation date.");
      }
      const reference = text(payload.reference || "Bank transfer", 80);
      world.payments.unshift({
        id: id("payment"),
        customerId: actor.customerId,
        accountId: account.id,
        beneficiaryId: beneficiary?.id ?? "own-account",
        amount,
        fee,
        reference,
        date,
        status: command.type === "schedule" ? "scheduled" : "pending",
        destinationId: ownDestination?.id ?? beneficiary?.destinationId,
        description: ownDestination?.name ?? beneficiary!.name,
      });
      log(
        command.type,
        `${money(amount)} ${command.type === "schedule" ? "scheduled" : "pending"}; fee ${money(fee)}.`,
      );
      break;
    }
    case "cancel-payment": {
      const payment = world.payments.find(
        (item) =>
          item.id === payload.paymentId && item.customerId === actor.customerId,
      );
      if (!payment || payment.status !== "scheduled")
        throw new Error("Only scheduled payments can be cancelled.");
      payment.status = "cancelled";
      log("payment", "Scheduled payment cancelled.");
      break;
    }
    case "beneficiary": {
      const number = z
        .string()
        .regex(/^\d{8,18}$/, "Account number must contain 8 to 18 digits.")
        .parse(payload.accountNumber);
      const destination = world.accounts.find((item) => item.number === number);
      if (destination?.customerId === actor.customerId)
        throw new Error(
          "Use the between-accounts transfer option for your own account.",
        );
      world.beneficiaries.push({
        id: id("beneficiary"),
        customerId: actor.customerId,
        name: text(payload.name, 80),
        bank: destination ? "ACME Bank" : text(payload.bank, 80),
        accountNumber: number,
        destinationId: destination?.id,
      });
      log("beneficiary", "Beneficiary added.");
      break;
    }
    case "delete-beneficiary": {
      if (
        world.payments.some(
          (item) =>
            item.beneficiaryId === payload.beneficiaryId &&
            ["scheduled", "pending"].includes(item.status),
        )
      )
        throw new Error(
          "Cancel or settle linked payments before removing this beneficiary.",
        );
      world.beneficiaries = world.beneficiaries.filter(
        (item) =>
          !(
            item.id === payload.beneficiaryId &&
            item.customerId === actor.customerId
          ),
      );
      break;
    }
    case "freeze":
    case "limit": {
      const card = world.cards.find(
        (item) =>
          item.id === payload.cardId && item.customerId === actor.customerId,
      );
      if (!card) throw new Error("Card not found.");
      if (command.type === "freeze")
        card.frozen = z.boolean().parse(payload.frozen);
      else card.limit = positive(payload.limit);
      log(
        "card",
        `Card ending ${card.last4} ${command.type === "freeze" ? (card.frozen ? "frozen" : "unfrozen") : "limit updated"}.`,
      );
      break;
    }
    case "profile": {
      const profile = world.profiles.find((item) => item.id === actor.id);
      if (!profile) throw new Error("Profile not found.");
      profile.name = text(payload.name, 80);
      profile.phone = z.string().max(40).parse(payload.phone);
      profile.address = z.string().max(240).parse(payload.address);
      profile.notifications = z.boolean().parse(payload.notifications);
      if (payload.avatar !== undefined)
        profile.avatar = z.string().max(500).parse(payload.avatar);
      break;
    }
    case "open-account": {
      const kind = z.enum(["checking", "savings"]).parse(payload.kind);
      if (
        world.accounts.filter((item) => item.customerId === actor.customerId)
          .length >= 5
      )
        throw new Error("You can open up to five simulated accounts.");
      const accountId = id("account");
      world.accounts.push({
        id: accountId,
        customerId: actor.customerId,
        name: text(
          payload.name ||
            (kind === "checking" ? "Everyday Checking" : "Growth Savings"),
          50,
        ),
        number: String(8310000000 + world.accounts.length),
        kind,
        balance: 0,
        status: "active",
      });
      if (kind === "checking")
        world.cards.push({
          id: id("card"),
          customerId: actor.customerId,
          accountId,
          last4: String(6000 + world.cards.length),
          frozen: false,
          limit: 250000,
          spent: 0,
          expiry: "10/29",
          kind: "physical",
        });
      log(
        "onboarding",
        "Simulated identity verification passed. Account opened.",
      );
      break;
    }
    case "ticket": {
      world.tickets.unshift({
        id: id("ticket"),
        customerId: actor.customerId,
        subject: text(payload.subject, 120),
        category: text(payload.category, 50),
        status: "open",
        date: world.now,
        messages: [
          {
            author: actor.name,
            body: text(payload.body, 2000),
            date: world.now,
            attachment: payload.attachment
              ? text(payload.attachment, 500)
              : undefined,
          },
        ],
      });
      break;
    }
    case "reply":
    case "resolve-ticket": {
      const ticket = world.tickets.find(
        (item) =>
          item.id === payload.ticketId &&
          (staff || item.customerId === actor.customerId),
      );
      if (!ticket) throw new Error("Ticket not found or access denied.");
      if (command.type === "resolve-ticket") ticket.status = "resolved";
      else {
        ticket.messages.push({
          author: actor.name,
          body: text(payload.body, 2000),
          date: world.now,
        });
        ticket.status = "open";
      }
      break;
    }
    case "scenario": {
      const customerId = text(payload.customerId);
      const account = world.accounts.find(
        (item) => item.customerId === customerId && item.kind === "checking",
      );
      if (!account) throw new Error("Customer account not found.");
      const scenario = z
        .enum(["deposit", "purchase", "insufficient", "pending"])
        .parse(payload.scenario);
      if (scenario === "deposit") {
        post(
          account,
          250000,
          "Simulated payroll deposit",
          "Income",
          command.id,
        );
        log("deposit", "Payroll deposit received: $2,500.00.", customerId);
      }
      if (scenario === "purchase" || scenario === "insufficient") {
        const card = world.cards.find(
          (item) => item.accountId === account.id && item.kind === "physical",
        )!;
        const amount =
          scenario === "insufficient"
            ? available(world, account) + 10000
            : 7850;
        const declined =
          card.frozen ||
          card.spent + amount > card.limit ||
          available(world, account) < amount;
        if (declined) {
          const reason =
            scenario === "insufficient"
              ? "Insufficient funds"
              : card.frozen
                ? "Card frozen"
                : card.spent + amount > card.limit
                  ? "Daily limit exceeded"
                  : "Insufficient funds";
          world.transactions.unshift({
            id: id("decline"),
            accountId: account.id,
            amount: -amount,
            description: `Purchase declined · ${reason}`,
            category: "Shopping",
            date: world.now,
            status: "failed",
            reference: command.id,
          });
          log("declined", reason, customerId);
        } else {
          post(
            account,
            -amount,
            "Nike · Simulated purchase",
            "Shopping",
            command.id,
          );
          card.spent += amount;
          log("purchase", "Card purchase approved: $78.50.", customerId);
        }
      }
      if (scenario === "pending") {
        const beneficiary = world.beneficiaries.find(
          (item) => item.customerId === customerId,
        )!;
        if (available(world, account) < 12500)
          throw new Error("Insufficient funds for the pending scenario.");
        world.payments.unshift({
          id: id("payment"),
          customerId,
          accountId: account.id,
          beneficiaryId: beneficiary.id,
          amount: 12500,
          fee: 0,
          reference: "Weekend dinner",
          date: world.now,
          status: "pending",
          destinationId: beneficiary.destinationId,
          description: beneficiary.name,
        });
        log("pending", "Transfer reserved; awaiting settlement.", customerId);
      }
      break;
    }
    case "advance": {
      const days = z
        .number()
        .int()
        .min(1)
        .max(31)
        .parse(payload.days ?? 1);
      world.now = new Date(
        new Date(world.now).getTime() + days * 86400000,
      ).toISOString();
      world.cards.forEach((card) => {
        card.spent = 0;
      });
      for (const payment of world.payments.filter(
        (item) => item.status === "pending",
      ))
        settle(payment);
      for (const payment of world.payments.filter(
        (item) => item.status === "scheduled" && item.date <= world.now,
      )) {
        const account = world.accounts.find(
          (item) => item.id === payment.accountId,
        )!;
        if (available(world, account) < payment.amount + payment.fee) {
          payment.status = "failed";
          log(
            "declined",
            `Scheduled payment to ${payment.description} failed: insufficient funds.`,
            payment.customerId,
          );
        } else {
          payment.status = "pending";
          log(
            "pending",
            `Scheduled payment to ${payment.description} submitted.`,
            payment.customerId,
          );
        }
      }
      log("clock", `Simulation advanced ${days} day(s).`);
      break;
    }
  }
  world.version += 1;
  world.processed.push(command.id);
  return world;
}

export function projectWorld(world: World, actor: Profile): World {
  if (actor.role !== "customer") return world;
  const accounts = world.accounts.filter(
    (item) => item.customerId === actor.customerId,
  );
  return {
    ...world,
    profiles: world.profiles.filter((item) => item.id === actor.id),
    accounts,
    transactions: world.transactions.filter((item) =>
      accounts.some((account) => account.id === item.accountId),
    ),
    beneficiaries: world.beneficiaries.filter(
      (item) => item.customerId === actor.customerId,
    ),
    payments: world.payments.filter(
      (item) => item.customerId === actor.customerId,
    ),
    cards: world.cards.filter((item) => item.customerId === actor.customerId),
    tickets: world.tickets.filter(
      (item) => item.customerId === actor.customerId,
    ),
    events: world.events.filter((item) => item.customerId === actor.customerId),
    processed: [],
  };
}
