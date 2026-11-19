# POS.BITS — Next.js Route Handlers & Server Actions API Design

## 1. Architectural Standards

1. **Next.js App Router Conventions:**
   - Server Actions for form submissions, order creation, ticket bumping, and fast interactions with optimistic UI.
   - Route Handlers (`app/api/*`) for external integrations, mobile terminals, background sync, webhooks, and reporting exports.
2. **Standard Response Envelope:**
   ```typescript
   interface ApiResponse<T = any> {
     success: boolean;
     data?: T;
     error?: {
       code: string;       // e.g. "UNAUTHORIZED", "INSUFFICIENT_STOCK", "INVALID_GSTIN"
       message: string;    // Human-readable message
       details?: any;      // Zod validation errors
     };
     meta?: {
       timestamp: string;
       requestId: string;
     };
   }
   ```
3. **Session & Security Headers:**
   - Extracted and verified via `@supabase/ssr` cookies.
   - `x-tenant-id` and `x-outlet-id` are validated against the authenticated user's active memberships.
   - Cross-Site Request Forgery (CSRF) protection built into Server Actions and SameSite cookies.

---

## 2. API Endpoints Catalog

### 2.1 Authentication & Profile (`app/api/auth/*`)
- `POST /api/auth/login` — Email and password authentication with Supabase SSR session cookie.
- `POST /api/auth/logout` — Revoke active session and clear HTTP-only cookies.
- `POST /api/auth/forgot-password` — Dispatch Supabase password recovery email.
- `POST /api/auth/verify-pin` — Server-side bcrypt verification of 4-digit PIN for supervisor step-up authorization.
- `GET /api/auth/session` — Fetch current verified user, tenant, outlet, and effective permissions.

### 2.2 Onboarding & Outlets (`app/api/onboarding/*`)
- `POST /api/onboarding/business` — Step 1: Legal business information.
- `POST /api/onboarding/gst` — Step 2: Validate GSTIN and FSSAI parameters.
- `POST /api/onboarding/outlet` — Step 3: Outlet configuration and operating hours.
- `POST /api/onboarding/complete` — Step 6: Finalize tenant setup and initialize admin invite.

### 2.3 POS Orders & Billing (`app/api/orders/*`)
- `GET /api/orders` — List orders for active outlet with date range, status, and search filters.
- `POST /api/orders` — Create new order atomically (calculates tax, reserves inventory, creates invoice, dispatches KDS ticket).
- `GET /api/orders/:id` — Retrieve full order detail including modifiers and payment breakdown.
- `POST /api/orders/:id/cancel` — Cancel order (requires `orders.cancel` permission).
- `POST /api/orders/:id/refund` — Issue refund and credit note (requires `orders.refund` permission).

### 2.4 Payments & Tenders (`app/api/payments/*`)
- `POST /api/payments/record` — Record completed payment tender (Cash, UPI QR, Card EDC, Split).
- `GET /api/payments/upi-status/:ref` — Poll dynamic UPI payment status.

### 2.5 Kitchen Display System (`app/api/kds/*`)
- `GET /api/kds/tickets` — Active tickets scoped to station (`All`, `Grill`, `Fry`, `Cold`, `Expo`).
- `POST /api/kds/tickets/:id/advance` — Transition ticket status (`new` $\rightarrow$ `cooking` $\rightarrow$ `ready` $\rightarrow$ `bumped`).
- `POST /api/kds/tickets/:id/toggle-item` — Mark individual dish item prepared.
- `POST /api/kds/tickets/recall` — Recall most recently bumped ticket back to active queue.

### 2.6 Menu Engineering (`app/api/menu/*`)
- `GET /api/menu/products` — Catalog products with category and modifier groups.
- `POST /api/menu/products` — Add new product (requires `menu.manage`).
- `PUT /api/menu/products/:id` — Update pricing, availability, or station mapping.
- `PATCH /api/menu/products/:id/toggle-stock` — Instant 86 item out-of-stock toggle.

### 2.7 Staff & RBAC (`app/api/staff/*`)
- `GET /api/staff` — Roster of employees for active tenant/outlet.
- `POST /api/staff/invite` — Send employee invitation email.
- `POST /api/staff/:id/pin-reset` — Set new 4-digit PIN hash for terminal unlock.
- `PUT /api/staff/:id/permissions` — Update custom permissions and overrides.

### 2.8 Reports & Exports (`app/api/reports/*`)
- `GET /api/reports/sales-summary` — Daily / date-range sales ledger.
- `GET /api/reports/gst-audit` — CGST/SGST audit ledger with taxable values.
- `GET /api/reports/export-csv` — Stream CSV file for accounting systems.
- `GET /api/reports/gstr1-json` — Official GSTR-1 JSON schema output for tax filing.
