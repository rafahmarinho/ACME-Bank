export type Role = "customer" | "support" | "administrator";
export type Profile = {
  id: string;
  name: string;
  email: string;
  role: Role;
  customerId: string;
  phone: string;
  address: string;
  notifications: boolean;
  avatar?: string;
};
export type Account = {
  id: string;
  customerId: string;
  name: string;
  number: string;
  kind: "checking" | "savings";
  balance: number;
  status: "active";
};
export type Transaction = {
  id: string;
  accountId: string;
  description: string;
  category: string;
  amount: number;
  date: string;
  status: "completed" | "pending" | "failed";
  reference: string;
};
export type Beneficiary = {
  id: string;
  customerId: string;
  name: string;
  bank: string;
  accountNumber: string;
  destinationId?: string;
};
export type Payment = {
  id: string;
  customerId: string;
  accountId: string;
  beneficiaryId: string;
  amount: number;
  fee: number;
  reference: string;
  date: string;
  status: "scheduled" | "pending" | "completed" | "failed" | "cancelled";
  destinationId?: string;
  description: string;
};
export type Card = {
  id: string;
  customerId: string;
  accountId: string;
  last4: string;
  frozen: boolean;
  limit: number;
  spent: number;
  expiry: string;
  kind: "physical" | "virtual";
};
export type Ticket = {
  id: string;
  customerId: string;
  subject: string;
  category: string;
  status: "open" | "resolved";
  date: string;
  messages: {
    author: string;
    body: string;
    date: string;
    attachment?: string;
  }[];
};
export type BankEvent = {
  id: string;
  date: string;
  type: string;
  message: string;
  customerId?: string;
};
export type World = {
  version: number;
  now: string;
  profiles: Profile[];
  accounts: Account[];
  transactions: Transaction[];
  beneficiaries: Beneficiary[];
  payments: Payment[];
  cards: Card[];
  tickets: Ticket[];
  events: BankEvent[];
  processed: string[];
};
export type Command = {
  id: string;
  type:
    | "transfer"
    | "schedule"
    | "cancel-payment"
    | "beneficiary"
    | "delete-beneficiary"
    | "freeze"
    | "limit"
    | "profile"
    | "open-account"
    | "ticket"
    | "reply"
    | "resolve-ticket"
    | "scenario"
    | "advance"
    | "reset";
  payload: Record<string, unknown>;
};
