# ACME Bank

A complete English-language digital banking **simulation**, built with Next.js 16.4, React 19.3, TypeScript, Tailwind CSS 4.3, shadcn/ui (Base UI), and pnpm. Supabase provides PostgreSQL persistence, email/password authentication, private files, and realtime signals. The web application and API deploy together on Vercel.

## Run locally

Requirements: Node.js 22 LTS or later and pnpm 10.30 or later.

```sh
pnpm install
pnpm dev
```

Open http://localhost:3000. Without Supabase environment variables, the app starts in clearly labeled local demo mode as Alex Morgan. Data survives reloads in browser localStorage. Use the profile selector to explore six customers, support, and administrator roles. Demo sign-in password: `AcmeDemo!2026`. Local passwords/recovery are simulation-only and must not be used as production authentication.

## Supabase setup

1. Create a Supabase project. Run `supabase/migrations/001_bank.sql` once in its SQL Editor. It creates protected profile records, the banking state, an atomic revision-checked commit function, realtime publication, and a private `bank-files` bucket.
2. Create `.env.local` using `.env.example`. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and server-only `SUPABASE_SERVICE_ROLE_KEY`. Set a unique `DEMO_SEED_PASSWORD` of at least 12 characters. Never prefix the service role key with `NEXT_PUBLIC_`, commit it, or paste it into chat.
3. Enable email/password Auth. Set the Site URL to `http://localhost:3000` and allow redirects to `/onboarding` and `/reset-password`. This application uses the Supabase JS browser client's implicit email-confirmation/recovery flow and default email templates. For production, configure custom SMTP and the deployed redirect URLs. Supabase's default email sender is limited.
4. Run `pnpm seed`. It creates or reuses the eight demo Auth identities, assigns roles on the server, and inserts deterministic banking data. It refuses to overwrite an existing bank. Later resets are performed in the administrator Simulation screen.
5. Restart the dev server. Supabase mode requires login and removes the demo profile switcher. All API requests verify the Supabase access token and load role/customer ownership from protected PostgreSQL profile records.

Demo emails: `alex@acme.demo`, `sarah@acme.demo`, `james@acme.demo`, `emily@acme.demo`, `michael@acme.demo`, `olivia@acme.demo`, `support@acme.demo`, `admin@acme.demo`. The password is the `DEMO_SEED_PASSWORD` chosen during initial creation. Existing users' passwords are not overwritten by seeding.

New registrations always receive the customer role, regardless of user metadata. They confirm their email, sign in, and open a simulated checking or savings account through Onboarding. New checking accounts issue a debit card. Staff accounts are provisioned through the seed or trusted database administration, not self-registration.

## Screens and roles

- Customers: onboarding, overview, accounts, activity, transfers, beneficiaries, scheduled payments, cards, monthly statements, support, profile, settings, and search.
- Support: read-only customer/account/payment inspection, support conversations/replies/resolution, event trail, profile, settings, and search.
- Administrators: staff capabilities plus scenarios, clock advancement, and demo reset. In local demo mode the Simulation area is also available to customers as an explicit demo convenience; this does not bypass production authorization.
- Desktop sidebar and responsive mobile bottom navigation. Forms include validation, fee review, loading states, persisted outcomes, and error messages.

## Banking behavior

Every money value is an integer number of cents. Decimal input is parsed without floating-point rounding. Balances reconcile to completed debit/credit entries. Internal transfers and transfers between the customer's own accounts are free; external transfers cost 150 cents, shown before confirmation and checked alongside the amount.

Transfers begin pending and reserve amount plus fee immediately. Advancing the clock posts debit, fee, and internal-recipient credit exactly once. Pending reservations prevent overspending. Scheduled payments are checked on submission and again on the due date; advancing to the due date submits them as pending, and another tick settles them. Insufficient funds mark due payments as failed; scheduled payments can be cancelled before submission. Cards can be frozen and daily limits changed; purchases enforce card status, daily spending, and available funds. Each clock advance resets daily spending.

Simulation scenarios: $2,500 payroll deposit, $78.50 purchase, insufficient-funds decline, and a $125 pending internal transfer. Results update all affected screens and persist. Event inspection records approvals, declines, reservations, settlements, and clock changes. Reset restores the six seeded customers and August/September 2026 transactions, plus sample October activity, while preserving Auth identities and any other registered profiles. Reset removes their banking data as explicitly confirmed in the UI.

Statements export CSV with signed integer-cent amounts and PDF with opening/closing balances. Only completed entries are included. Private support attachments and profile images support PNG/JPG/PDF up to 5 MB in Supabase; demo attachments are limited to 700 KB. Recovery emails, registration confirmations, and private file URLs use Supabase. Payments, KYC, deposits, and card processors are simulated, not connected to real external banking services.

## Architecture

```text
src/app/                  Next.js pages and /api/bank route
src/screens/              Customer, authentication, support, and operations screens
src/components/           Navigation, provider, reusable banking UI, shadcn controls
src/services/             Banking engine, demo auth, files, statement exports
src/database/             Supabase clients and authenticated database repository
src/lib/                  Domain types and utilities
supabase/migrations/      Database schema, permissions, RLS, Storage, realtime
scripts/seed.ts           Deterministic seed and demo Auth provisioning
tests/                    Ledger invariants and browser workflow tests
```

This intentionally straightforward simulator stores the typed banking world in a PostgreSQL JSONB document, including accounts, entries, cards, and events. This keeps the same transactional engine in demo and cloud modes. It is **not** a production banking ledger design: production-scale banking would need normalized ledger tables, formal accounting controls, independent audit storage, pagination, MFA, abuse protection, monitoring, and compliance review. The document is inaccessible to browser roles. The API commits through a PostgreSQL compare-and-swap revision function, retrying conflicts to prevent lost updates. Command IDs make retries idempotent. Realtime exposes only a revision signal; clients fetch their authorized projection, never a full bank document. Customer data is projected by ownership; roles cannot be edited through profile updates. Service role credentials remain server-only.

## API

`GET /api/bank` returns `{ world, profile }` for the authenticated user. `POST /api/bank` accepts a command and returns the updated authorized projection. Send `Authorization: Bearer <Supabase access token>`. The browser provider does this automatically. Anonymous calls return 401. Validation/action failures return 400. Requests are limited to 16 KB.

Example command shape (amount is cents):

```json
{
  "id": "unique-request-id",
  "type": "transfer",
  "payload": {
    "accountId": "customer-1-checking",
    "beneficiaryId": "beneficiary-0-1",
    "amount": 12500,
    "reference": "Dinner"
  }
}
```

Other commands: `schedule`, `cancel-payment`, `beneficiary`, `delete-beneficiary`, `freeze`, `limit`, `profile`, `open-account`, `ticket`, `reply`, `resolve-ticket`, `scenario`, `advance`, `reset`. Typed definitions are in `src/lib/types.ts`, validation/ownership in `src/services/bank.ts`. Never directly update balances from the UI.

## Verification

```sh
pnpm test
pnpm lint
pnpm build
pnpm exec playwright install chromium
# With pnpm dev running in another terminal:
pnpm test:e2e
```

Browser tests use isolated local demo sessions and cover responsive screens, pending/reload/settlement, fees, insufficient funds, cards, beneficiaries, scheduled cancellation, downloads, staff replies, onboarding, recovery, profile persistence, search, reset, and anonymous API rejection. Screenshots are written to `test-results/`. Hosted Supabase email delivery, database permissions, file uploads, and realtime require actual project credentials and must be checked after configuring that environment.

For production-mode verification, stop the development server, run `pnpm build`, then `pnpm start --port 3001` and `PLAYWRIGHT_BASE_URL=http://localhost:3001 pnpm test:e2e` (Bash syntax). Do not run dev and production servers against the same `.next` directory simultaneously.

## Deploy web and API to Vercel

1. Push this project to your Git provider and import it into Vercel. Select Next.js, project root `.`, install command `pnpm install --frozen-lockfile`, build command `pnpm build`, Node.js 22 or newer. Keep the checked-in pnpm lockfile.
2. Add the three Supabase environment variables above to Vercel production/preview environments as appropriate. `SUPABASE_SERVICE_ROLE_KEY` is server-only. `DEMO_SEED_PASSWORD` is needed only by the local provisioning script, not the deployed application.
3. Apply the migration and seed to the intended Supabase project **before** using the deployment. Use a separate project for previews if resets must not affect another environment.
4. Update Supabase Site URL and allowed redirect URLs to your HTTPS Vercel/custom domain, including `/onboarding` and `/reset-password`. Configure production SMTP, test confirmation and recovery emails, and verify Storage/realtime access with customer/support/admin identities.
5. Deploy. Next.js publishes the pages and `/api/bank` serverless API in the same project; no separate API server or filesystem persistence is required. The cloud database is Supabase PostgreSQL. Do not expose a public deployment without Supabase configured unless you intentionally want browser-local demo mode.

This is a demonstration application only. It does not hold real money, open regulated accounts, issue real cards, or provide financial services. Do not submit real personal identification or payment data.

Visual assets: locally downloaded Unsplash photography (forested mountain lake and demo profile portrait). No external image host is required at runtime.