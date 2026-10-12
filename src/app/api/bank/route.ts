import { NextResponse } from "next/server";
import { z } from "zod";
import { bankingRequest } from "@/database/repository";
import type { Command } from "@/lib/types";
const schema = z.object({
  id: z.string().min(1).max(100),
  type: z.enum([
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
  ]),
  payload: z.record(z.string(), z.unknown()),
});
async function handle(request: Request, mutate: boolean) {
  try {
    const token = request.headers
      .get("authorization")
      ?.match(/^Bearer (.+)$/)?.[1];
    if (!token)
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 },
      );
    if (mutate && Number(request.headers.get("content-length") ?? 0) > 16384)
      return NextResponse.json(
        { error: "Request is too large." },
        { status: 413 },
      );
    const body = mutate ? await request.text() : "";
    if (body.length > 16384)
      return NextResponse.json(
        { error: "Request is too large." },
        { status: 413 },
      );
    const command = mutate
      ? (schema.parse(JSON.parse(body)) as Command)
      : undefined;
    return NextResponse.json(await bankingRequest(token, command), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? "Check the fields and try again."
        : error instanceof Error
          ? error.message
          : "Unable to process your request.";
    return NextResponse.json(
      { error: message },
      { status: message.startsWith("Unauthorized") ? 401 : 400 },
    );
  }
}
export const GET = (request: Request) => handle(request, false);
export const POST = (request: Request) => handle(request, true);
