# TIKKIT single-outlet QSR release plan

The pilot uses an online web register, kitchen browser and customer TV. Cashiers record payment at the counter. Keep the existing dine-in table field until the outlet confirms whether it needs table service. Preserve shift-free sales and one payment selector.

| Order | Deliverable | Acceptance check |
|---|---|---|
| 1 | Reproduce the current app from tracked source and forward migrations. Isolate sample records and demo credentials from customer provisioning. | Clean staging install and upgrade rehearsal preserve historical bills and create a usable blank outlet. |
| 2 | Compact register with catalog and cart side by side on tablets and desktops. Switch between them on phones. Use visible keyboard focus, large touch targets, scrolling panels and concise empty states. | Add, customize, change quantity and tender payment at 390, 768, 1024 and 1440 CSS pixels. Also exercise landscape, zoom and a short viewport. |
| 3 | Shared loading, empty, no-results, stale, access-denied and recoverable error states. Give checkout a pending state. | First load, failed load, revoked access, empty basket/catalog, invalid search and reconnect have distinct outcomes. Failed requests preserve the operator's work. |
| 4 | Connect pickup display to the kitchen ticket state. A revocable outlet-specific TV link reads only active tokens. | Checkout appears under Preparing, complete order moves to Ready for pickup, handoff or refund removes it. Reload, disconnection and invalid links are handled. |
| 5 | Make checkout recoverable after browser restart, including unknown commit outcomes. Preserve server-authoritative totals. | Drop response after database commit; recover one order, one payment and one ticket. Test simultaneous registers. |
| 6 | Finish production onboarding and operational data access. Separate time-bounded counter and kitchen queries from reporting. Gate unsupported demo controls. | Owner invites cashier and cook, edits menu, disables staff and checks isolation with two staging tenants. Workspace size stays bounded as history grows. |
| 7 | Reconcile local business dates, refunds, invoices and tender totals. Test receipt printing and reprinting on pilot hardware. | One trading day balances by tender, including early sales and a refund from an earlier date. Paper failure permits reprint without a new sale. |
| 8 | Run CI, staging restore, peak service and pilot acceptance. | Staff finish a service on their actual devices; measured order latency, touch usability and recovery meet agreed thresholds. |

## Interaction rules

Use the same token on receipt, kitchen and TV. Only whole-order readiness calls a customer. Keep completed tickets accessible to staff. A disconnected display clearly marks its last known queue. Use empty-state actions only when they can change the outcome. Keyboard and touch both reach essential actions. Keep financial reporting to daily sales, tender and refunds. Offline issuance and advanced analytics are outside the pilot.

## Release evidence

Record automated results separately from manual hardware and pilot sign-off. A production build does not establish iPad touch behavior, printer success, a clean hosted install or suitability for live sales.
