# TIKKIT

TIKKIT is a restaurant counter POS, kitchen display, and outlet reporting application. It uses Next.js App Router, Supabase Auth, and PostgreSQL.

## Local setup

1. Run `npm ci`.
2. Copy `.env.example` to `.env.local` and set the Supabase URL and publishable key. A legacy anon key also works.
3. Apply the SQL files in `supabase/migrations` in numeric order to a development Supabase project. For an existing project, apply only migrations missing from its migration history. The standalone `supabase/schema.sql` is a historical snapshot.
4. Provision staff users in Supabase Auth and link them to `profiles.auth_user_id` and an active `outlet_memberships` record. Demo seed profiles do not create Supabase sign-in accounts. For platform administration, provision a separate, active super-admin record in `platform_admins`.
5. Allow the application's `/auth/callback` URL in Supabase Auth redirect settings for password recovery.
6. Run `npm run dev` and open [localhost:3000](http://localhost:3000).

## Counter workflows

- Staff sign in to their assigned outlet. Staff with several active assignments can switch outlets from the account menu.
- Cash entries require sufficient tender. Checkout records the selected card or UPI method directly.
- Checkout commits the order, kitchen ticket, payment, and applicable invoice in one transaction. Connected counter and kitchen screens refresh from the outlet database every three seconds.
- To record a refund, return the cash or reverse the original charge on the terminal first. A supervisor assigned to the same outlet signs in to authorize recording it. Card and UPI refunds require the external refund reference.
- Reports use Indian Standard Time. Monthly GST exports contain invoice and credit-note working papers for review with an accountant.
- Connected checkout requires database connectivity. Existing browser-local demo history stays separate from the database.

## Checks

```sh
npm test
npm run lint
npx tsc --noEmit --incremental false
npm run build
```

The database tests run on a disposable local PostgreSQL runtime and use fixture identities. They do not require a Supabase project.

See [implementation status](docs/IMPLEMENTATION_STATUS.md) for deployment verification and the current scope of integrations.

## Local demo logins

After applying the migrations to **local** Supabase, set `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in your shell using the local instance values. Run `npm run seed:demo`, then sign in with one of these accounts. All use `TikkitDemo2026!`.

| Role | Email |
|---|---|
| Cashier | `cashier@tikkit.test` |
| Kitchen lead | `kitchen@tikkit.test` |
| Kitchen cook | `kitchen2@tikkit.test` |
| Manager | `manager@tikkit.test` |
| Owner | `owner@tikkit.test` |
| Platform admin | `admin@tikkit.test` |

## Single-outlet release

The rollout checklist and device test matrix are in [the QSR release plan](docs/QSR_V1_PLAN.md). Fresh migrations install platform reference data. Local Supabase seeds load the sample outlet and menu separately. Existing databases retain their records. Keep demo seeds disabled for customer deployments.

A platform administrator creates the outlet and shares its owner invitation from the tenant page. Owners invite cashiers and cooks from Manager → Staff. Configure Supabase email delivery, email confirmation and the allowed application callback URL for the deployment. Employees open their invitation and confirm their email in the same browser before setting a password.

Open Settings → Pickup display to get a read-only TV link. Paste it into the display browser. Disabling the link disconnects that display. Ready tickets stay visible until staff tap Collected.
