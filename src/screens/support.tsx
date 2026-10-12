"use client";
import { useState } from "react";
import {
  Plus,
  Send,
  Paperclip,
  Headphones,
  MessageSquare,
  Check,
  Search,
} from "lucide-react";
import { useBank } from "@/components/bank-provider";
import { Empty, Field, Heading, Modal, Status } from "@/components/bank-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fileUrl, uploadFile } from "@/services/files";
import type { Ticket } from "@/lib/types";
export function FileButton({ path }: { path: string }) {
  const [error, setError] = useState("");
  return (
    <>
      <Button
        variant="link"
        onClick={async () => {
          try {
            const url = await fileUrl(path);
            if (url.startsWith("data:")) {
              const anchor = document.createElement("a");
              anchor.href = url;
              anchor.download = url.startsWith("data:application/pdf")
                ? "attachment.pdf"
                : "attachment.png";
              anchor.click();
            } else window.open(url, "_blank", "noopener,noreferrer");
          } catch {
            setError("Could not open attachment.");
          }
        }}
      >
        <Paperclip size={14} />
        View attachment
      </Button>
      {error && <small className="form-error">{error}</small>}
    </>
  );
}
export function TicketConversation({ ticket }: { ticket: Ticket }) {
  const { run, busy } = useBank();
  const [body, setBody] = useState("");
  return (
    <div className="ticket-conversation">
      <div className="ticket-metadata">
        <Status value={ticket.status} />
        <span>
          {ticket.category} · {ticket.id.slice(0, 20)}
        </span>
      </div>
      <div className="ticket-messages">
        {ticket.messages.map((message, index) => (
          <div key={index} className="ticket-message">
            <div>
              <strong>{message.author}</strong>
              <small>
                {new Date(message.date).toLocaleString("en-US", {
                  timeZone: "UTC",
                })}
              </small>
            </div>
            <p>{message.body}</p>
            {message.attachment && <FileButton path={message.attachment} />}
          </div>
        ))}
      </div>
      <form
        className="reply-form"
        onSubmit={async (event) => {
          event.preventDefault();
          if (await run("reply", { ticketId: ticket.id, body })) setBody("");
        }}
      >
        <Input
          aria-label="Reply message"
          required
          maxLength={2000}
          placeholder="Write a reply..."
          value={body}
          onChange={(event) => setBody(event.target.value)}
        />
        <Button
          type="submit"
          disabled={busy}
          title="Send reply"
          aria-label="Send reply"
          size="icon"
        >
          <Send size={16} />
        </Button>
      </form>
      {ticket.status !== "resolved" && (
        <Button
          variant="outline"
          disabled={busy}
          onClick={() => void run("resolve-ticket", { ticketId: ticket.id })}
        >
          <Check size={15} />
          Mark as resolved
        </Button>
      )}
    </div>
  );
}
export function Support({ staff = false }: { staff?: boolean }) {
  const { world, profile, run, busy } = useBank();
  const [create, setCreate] = useState(false),
    [subject, setSubject] = useState(""),
    [category, setCategory] = useState("General"),
    [body, setBody] = useState(""),
    [attachment, setAttachment] = useState<File | null>(null),
    [selected, setSelected] = useState(""),
    [search, setSearch] = useState(""),
    [uploading, setUploading] = useState(false),
    [error, setError] = useState("");
  if (!world || !profile) return null;
  const tickets = world.tickets.filter(
    (item) =>
      (staff || item.customerId === profile.customerId) &&
      `${item.subject} ${item.category} ${item.status}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const selectedTicket = world.tickets.find((item) => item.id === selected);
  return (
    <>
      <Heading
        title={staff ? "Support inbox" : "Real people. Right here."}
        subtitle={
          staff
            ? "Help customers move forward. Keep every conversation in one place."
            : "A question, a concern, or a little guidance. We're here for you."
        }
        action={
          !staff && (
            <Button onClick={() => setCreate(true)}>
              <Plus size={16} />
              New conversation
            </Button>
          )
        }
      />
      {!staff && (
        <div className="support-intro">
          <span className="support-hero-icon">
            <Headphones size={37} />
          </span>
          <div>
            <h2>Good banking is personal.</h2>
            <p>
              Send us a message. Our support team will pick it up in their
              inbox.
            </p>
            <span className="support-online">
              <span />
              ACME support workspace
            </span>
          </div>
          <MessageSquare size={57} strokeWidth={1} />
        </div>
      )}
      <div className="filter-bar">
        <div className="search-input">
          <Search size={17} />
          <Input
            aria-label="Search conversations"
            placeholder="Search conversations..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <span className="muted">
          {tickets.filter((item) => item.status === "open").length} open
          conversations
        </span>
      </div>
      <section className="ticket-list">
        {tickets.length ? (
          tickets.map((ticket) => (
            <button
              className="ticket-row"
              key={ticket.id}
              onClick={() => setSelected(ticket.id)}
            >
              <span className="ticket-icon">
                <MessageSquare size={20} />
              </span>
              <div>
                <strong>{ticket.subject}</strong>
                <p>{ticket.messages.at(-1)?.body}</p>
                <small>
                  {staff
                    ? world.profiles.find(
                        (item) => item.customerId === ticket.customerId,
                      )?.name
                    : ticket.category}{" "}
                  · {new Date(ticket.date).toLocaleDateString("en-US")}
                </small>
              </div>
              <Status value={ticket.status} />
              <span>{ticket.messages.length} messages</span>
            </button>
          ))
        ) : (
          <Empty
            title="A clean inbox"
            message="Your support conversations will appear here."
          />
        )}
      </section>
      {!staff && (
        <section className="faq-section">
          <h2>A few helpful answers</h2>
          {[
            {
              q: "When will my transfer arrive?",
              a: "Transfers begin as pending and reserve funds. An administrator advances the simulation to settle them. In local demo mode, you can advance it yourself from Simulation.",
            },
            {
              q: "How do I freeze my card?",
              a: "Open Cards and choose Freeze card. New simulated purchases will be declined until you unfreeze it.",
            },
            {
              q: "Where can I download statements?",
              a: "Open Statements, choose an account, then download a monthly PDF or CSV. Only completed transactions are included.",
            },
            {
              q: "Is ACME Bank a real bank?",
              a: "No. This is a simulated digital banking application. It does not hold or transfer real money. Identity verification, deposits, purchases, and external transfers are simulated.",
            },
          ].map((item) => (
            <details key={item.q}>
              <summary>
                {item.q}
                <Plus size={15} />
              </summary>
              <p>{item.a}</p>
            </details>
          ))}
        </section>
      )}
      <Modal
        open={!!selectedTicket}
        onClose={() => setSelected("")}
        title={selectedTicket?.subject ?? "Conversation"}
      >
        {selectedTicket && <TicketConversation ticket={selectedTicket} />}
      </Modal>
      <Modal
        open={create}
        onClose={() => setCreate(false)}
        title="Start a conversation"
      >
        <form
          className="form-stack"
          onSubmit={async (event) => {
            event.preventDefault();
            setUploading(true);
            setError("");
            try {
              const path = attachment
                ? await uploadFile(attachment, profile.id)
                : undefined;
              if (
                await run("ticket", {
                  subject,
                  category,
                  body,
                  attachment: path,
                })
              ) {
                setCreate(false);
                setSubject("");
                setBody("");
                setAttachment(null);
              }
            } catch (error) {
              setError(
                error instanceof Error ? error.message : "Upload failed.",
              );
            } finally {
              setUploading(false);
            }
          }}
        >
          <Field label="Subject">
            <Input
              required
              maxLength={120}
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="How can we help?"
            />
          </Field>
          <Field label="Category">
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              {["General", "Accounts", "Cards", "Transfers", "Statements"].map(
                (item) => (
                  <option key={item}>{item}</option>
                ),
              )}
            </select>
          </Field>
          <Field label="Message">
            <textarea
              required
              maxLength={2000}
              rows={4}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="Tell us a little more..."
            />
          </Field>
          <Field
            label="Attachment (optional)"
            hint="JPG, PNG, or PDF · Up to 5 MB in Supabase"
          >
            <input
              type="file"
              accept="image/jpeg,image/png,application/pdf"
              onChange={(event) =>
                setAttachment(event.target.files?.[0] ?? null)
              }
            />
          </Field>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <Button disabled={busy || uploading} type="submit">
            {uploading || busy ? "Sending..." : "Send message"}
            <Send size={15} />
          </Button>
        </form>
      </Modal>
    </>
  );
}
