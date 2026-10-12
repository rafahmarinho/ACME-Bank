import { notFound } from "next/navigation";
import { BankApp } from "@/components/bank-app";
const views = [
  "overview",
  "accounts",
  "activity",
  "transfers",
  "beneficiaries",
  "scheduled-payments",
  "cards",
  "statements",
  "support",
  "staff",
  "simulation",
  "profile",
  "settings",
  "onboarding",
  "search",
  "login",
  "signup",
  "forgot-password",
  "reset-password",
];
export function generateStaticParams() {
  return views.map((view) => ({ view }));
}
export default async function Page({
  params,
}: {
  params: Promise<{ view: string }>;
}) {
  const { view } = await params;
  if (!views.includes(view)) notFound();
  return <BankApp view={view} />;
}
