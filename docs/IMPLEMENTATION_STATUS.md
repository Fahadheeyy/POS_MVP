# TIKKIT implementation status

The runtime uses Next.js and Supabase. The versioned migrations are the source of truth for database upgrades.

| Area | Implemented behavior |
|---|---|
| Staff authentication | Supabase sign-in, password recovery, and server checks for an active outlet assignment and route permission |
| Outlet switching | Server-validated membership, outlet-scoped database calls, and separate cart and saved operational data |
| Checkout | Database-validated price and tender, idempotent sale creation, invoice numbering, and transactionally committed tickets and payments |
| Kitchen | Outlet-scoped ticket updates and synchronization of kitchen and order statuses |
| Refunds | Supervisor authorization, payment reference, and credit-note recording |
| Reports | IST business dates and month-specific GST working papers rendered from invoice and credit-note snapshots |
| Verification | Type checking, lint, application unit tests, and a disposable PostgreSQL integration suite |

UPI and card collection and reversal are performed on the operator's terminal or payment app. The POS records a confirmed reference. GST exports are working papers for the outlet's accountant. Browser-local demo records stay separate from operational data.

On deployment, apply the migrations to a staging Supabase project first. Check staff sign-in, password recovery, counter and kitchen synchronization across devices, printing, and payment reconciliation with the site's hardware.
