"use client";
import {
  ArrowUpRight,
  Cpu,
  Wifi,
  ShieldCheck,
  LockKeyhole,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Card, Profile } from "@/lib/types";
export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className={`brand ${light ? "brand-light" : ""}`}>
      <span className="brand-symbol">
        <span />
        <span />
        <span />
      </span>
      <span>
        ACME<span className="brand-bank"> Bank</span>
      </span>
    </span>
  );
}
export function Heading({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {action}
    </div>
  );
}
export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}
export function Status({ value }: { value: string }) {
  return (
    <span className={`status status-${value}`}>
      <span />
      {value.charAt(0).toUpperCase() + value.slice(1)}
    </span>
  );
}
export function Empty({
  title = "Nothing here yet",
  message = "Your activity will appear here.",
  action,
}: {
  title?: string;
  message?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="empty-state">
      <ShieldCheck size={30} />
      <h3>{title}</h3>
      <p>{message}</p>
      {action}
    </div>
  );
}
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) onClose();
      }}
    >
      <DialogContent className="bank-modal">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description ?? "ACME Bank · Secure banking workspace"}
          </DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
export function BankCard({ card, profile }: { card: Card; profile: Profile }) {
  return (
    <div
      className={`payment-card ${card.kind === "virtual" ? "virtual-card" : ""} ${card.frozen ? "frozen-card" : ""}`}
    >
      <div className="payment-card-top">
        <Logo light />
        <span>{card.kind === "virtual" ? "VIRTUAL" : "DEBIT"}</span>
      </div>
      <div className="card-chip">
        <Cpu size={33} strokeWidth={1} />
        <Wifi size={23} />
      </div>
      <div className="card-number">
        •••• <span>••••</span> <span>••••</span> {card.last4}
      </div>
      <div className="payment-card-bottom">
        <div>
          <small>CARDHOLDER</small>
          <span>{profile.name.toUpperCase()}</span>
        </div>
        <div>
          <small>VALID THRU</small>
          <span>{card.expiry}</span>
        </div>
        <strong>VISA</strong>
      </div>
      {card.frozen && (
        <div className="frozen-overlay">
          <LockKeyhole size={22} /> Card frozen
        </div>
      )}
    </div>
  );
}
export function SectionHead({
  title,
  aside,
}: {
  title: string;
  aside?: React.ReactNode;
}) {
  return (
    <div className="section-head">
      <h2>{title}</h2>
      {aside}
    </div>
  );
}
export function TextLink({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Button variant="link" onClick={onClick}>
      {children}
      <ArrowUpRight size={14} />
    </Button>
  );
}
