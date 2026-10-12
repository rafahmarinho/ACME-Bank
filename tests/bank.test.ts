import { test } from "node:test";
import assert from "node:assert/strict";
import {
  seedWorld,
  execute,
  available,
  cents,
  projectWorld,
} from "../src/services/bank";
import type { Command } from "../src/lib/types";
const command = (
  type: Command["type"],
  payload: Command["payload"],
  id = crypto.randomUUID(),
): Command => ({ id, type, payload });
test("six customers, two months, balances reconcile to completed cents ledger", () => {
  const world = seedWorld();
  assert.equal(
    world.profiles.filter((item) => item.role === "customer").length,
    6,
  );
  for (const account of world.accounts)
    assert.equal(
      account.balance,
      world.transactions
        .filter((item) => item.accountId === account.id)
        .reduce((sum, item) => sum + item.amount, 0),
    );
  assert.ok(world.transactions.some((item) => item.date.startsWith("2026-08")));
  assert.ok(world.transactions.some((item) => item.date.startsWith("2026-09")));
});
test("pending internal transfer reserves money, settles once and credits recipient", () => {
  const source = seedWorld(),
    actor = source.profiles[0],
    admin = source.profiles.at(-1)!;
  const transfer = command("transfer", {
    accountId: source.accounts[0].id,
    beneficiaryId: source.beneficiaries[0].id,
    amount: 12500,
    reference: "Dinner",
  });
  const pending = execute(source, actor, transfer);
  assert.equal(pending.accounts[0].balance, source.accounts[0].balance);
  assert.equal(
    available(pending, pending.accounts[0]),
    source.accounts[0].balance - 12500,
  );
  assert.deepEqual(execute(pending, actor, transfer), pending);
  const settled = execute(pending, admin, command("advance", { days: 1 }));
  assert.equal(settled.accounts[0].balance, source.accounts[0].balance - 12500);
  assert.equal(settled.accounts[2].balance, source.accounts[2].balance + 12500);
  const next = execute(settled, admin, command("advance", { days: 1 }));
  assert.equal(next.accounts[0].balance, settled.accounts[0].balance);
});
test("external fee and insufficient funds are enforced", () => {
  const world = seedWorld();
  assert.throws(
    () =>
      execute(
        world,
        world.profiles[0],
        command("transfer", {
          accountId: world.accounts[0].id,
          beneficiaryId: world.beneficiaries[1].id,
          amount: world.accounts[0].balance,
        }),
      ),
    /Insufficient funds/,
  );
  const pending = execute(
    world,
    world.profiles[0],
    command("transfer", {
      accountId: world.accounts[0].id,
      beneficiaryId: world.beneficiaries[1].id,
      amount: 10000,
    }),
  );
  assert.equal(pending.payments[0].fee, 150);
  const settled = execute(
    pending,
    world.profiles.at(-1)!,
    command("advance", {}),
  );
  assert.equal(settled.accounts[0].balance, world.accounts[0].balance - 10150);
});
test("frozen card declines without changing balance", () => {
  let world = seedWorld();
  const actor = world.profiles[0];
  world = execute(
    world,
    actor,
    command("freeze", { cardId: world.cards[0].id, frozen: true }),
  );
  const balance = world.accounts[0].balance;
  world = execute(
    world,
    world.profiles.at(-1)!,
    command("scenario", { customerId: actor.customerId, scenario: "purchase" }),
  );
  assert.equal(world.accounts[0].balance, balance);
  assert.equal(world.transactions[0].status, "failed");
});
test("scheduled payments submit on due day, settle on next tick, can cancel", () => {
  let world = seedWorld();
  const actor = world.profiles[0],
    admin = world.profiles.at(-1)!;
  world = execute(
    world,
    actor,
    command("schedule", {
      accountId: world.accounts[0].id,
      beneficiaryId: world.beneficiaries[0].id,
      amount: 10000,
      date: "2026-10-12T09:00:00.000Z",
    }),
  );
  world = execute(world, admin, command("advance", {}));
  assert.equal(world.payments[0].status, "pending");
  world = execute(world, admin, command("advance", {}));
  assert.equal(world.payments[0].status, "completed");
  world = execute(
    world,
    actor,
    command("cancel-payment", { paymentId: "scheduled-0" }),
  );
  assert.equal(
    world.payments.find((item) => item.id === "scheduled-0")!.status,
    "cancelled",
  );
});
test("role and ownership boundaries, projection, profile cannot elevate role", () => {
  const world = seedWorld(),
    actor = world.profiles[0];
  assert.throws(
    () => execute(world, actor, command("advance", {})),
    /Administrator/,
  );
  assert.throws(
    () =>
      execute(
        world,
        actor,
        command("freeze", { cardId: world.cards[2].id, frozen: true }),
      ),
    /not found/,
  );
  assert.equal(projectWorld(world, actor).profiles.length, 1);
  assert.equal(projectWorld(world, actor).accounts.length, 2);
  const changed = execute(
    world,
    actor,
    command("profile", {
      name: "Alex",
      phone: "",
      address: "",
      notifications: true,
      role: "administrator",
    }),
  );
  assert.equal(changed.profiles[0].role, "customer");
});
test("decimal amounts are parsed without floating point leakage", () => {
  assert.equal(cents("19.99"), 1999);
  assert.equal(cents("0.01"), 1);
  assert.throws(() => cents("1.999"));
  assert.throws(() => cents("-1"));
  assert.throws(() => cents("0"));
});
test("onboarding issues a debit card and reset preserves authentication IDs", () => {
  let world = seedWorld();
  world.profiles[0].id = "real-auth-id";
  const actor = world.profiles[0];
  world = execute(
    world,
    actor,
    command("open-account", { kind: "checking", name: "Travel" }),
  );
  assert.equal(world.cards.length, 13);
  assert.equal(world.cards.at(-1)!.accountId, world.accounts.at(-1)!.id);
  const reset = execute(world, world.profiles.at(-1)!, command("reset", {}));
  assert.equal(reset.profiles[0].id, "real-auth-id");
  assert.equal(reset.cards.length, 12);
});
