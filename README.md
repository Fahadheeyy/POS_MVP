# pos.bits — Smart Cloud QSR Platform (India MVP)

A complete, working, clickable prototype of a multi-app Quick Service Restaurant POS platform engineered specifically for the Indian market, branded as **pos.bits**. Built pixel-faithfully from the design system tokens.

---

## 1. Quick Start & Execution

```bash
# 1. Install dependencies
npm install

# 2. Launch development server
npm run dev

# 3. Production build verification
npm run build
```

The prototype runs at `http://localhost:5173`.

---

## 2. Architecture & Role-Based Applications

The platform houses **6 interconnected applications** inside one web architecture with unified state and real-time tab synchronization:

| Application | Role & Access | Primary Entry URL | Auth Method |
| :--- | :--- | :--- | :--- |
| **1. Cashier POS** | Cashier | `/pos` | 4-Digit Staff PIN (`1234`) |
| **2. Kitchen Display (KDS)** | Kitchen Lead / Staff | `/kds` | 4-Digit Staff PIN (`1111`) |
| **3. Shift & Today's Orders** | Cashier / Shift Mgr | `/orders` & `/shift` | 4-Digit Staff PIN (`1234`) |
| **4. Manager Console** | Shift / Store Manager | `/manager` | Email + Password / PIN (`9999`) |
| **5. Owner Dashboard & Reports** | Franchise Owner | `/owner` & `/owner/reports` | Email + Password / PIN (`8888`) |
| **6. System Settings** | Owner / Manager | `/settings` | Role permission check |
| **UI Kit & Showcase** | Design System Viewer | `/ui-kit` | Public Design Token Spec |

---

## 3. Demo Credentials & Staff Logins

| Role | Staff Name | Title | Demo PIN | Demo Email | Password |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Cashier** | Priya Sharma | Head Cashier | `1234` | `priya@pos.bits` | `password123` |
| **Kitchen Lead** | Jesselyn Tan | Kitchen Lead | `1111` | `jesselyn@pos.bits` | `password123` |
| **Kitchen Staff** | Marcus Chen | Fry / Grill Staff | `2222` | `marcus@pos.bits` | `password123` |
| **Store Manager** | Alex Rivera | Shift Manager | `9999` | `alex@pos.bits` | `password123` |
| **Owner** | Vikram Sethi | Franchise Owner | `8888` | `vikram@pos.bits` | `password123` |

---

## 4. Specialized Workflows Built for Each Role

### A. Cashier (POS, Registers, CRM & Counter Operations)
1. **Docked Viewport Cart & Pinned Checkout**: The cart sidebar is constrained so only the list of items scrolls. The cart header, financial totals, GST breakdowns, discount selector, and the primary "Checkout" button are permanently pinned and visible at all times.
2. **Hold / Park & Recall Orders**: Click **"Hold Order"** on the cart to park an active order with customer name/reason, clearing the register immediately to serve the next customer in queue. Click **"Held (X)"** at any time to recall the parked ticket with live elapsed timers.
3. **VIP Customer CRM & Loyalty Lookup**: Click **"Customer Loyalty"** to search customers by phone number or name, view loyalty points balances, lifetime orders, Gold/Silver tier badges, and apply a 1-click 10% loyalty discount.
4. **Line Item Kitchen Instructions & Allergies**: Click **"Add note"** on any cart line item to apply 1-click dietary tags (*"No Onion/Garlic Jain"*, *"Less Spicy"*, *"Extra Crispy"*, *"Pack Separately"*, *"No Ice"*) or type custom instructions sent straight to the KDS.
5. **No-Sale Cash Drawer Kick**: Cashiers can manually pop open the physical cash drawer with audited reason selection (*Customer Change*, *Drawer Audit*, *Cash Drop*) and security logging.
6. **Proforma Bill Estimate**: Cashier can generate and print an 80mm pre-bill estimate for guests before finalizing settlement.

### B. Kitchen Staff (KDS & Production Line)
1. **Kitchen 86 / Line Out-of-Stock Controller**: Cooks can click **"86 Items (X)"** in the KDS header to instantly 86 raw ingredients or finished dishes right from the line. Status updates sync immediately to POS in real time.
2. **Chef Recipe & Prep Spec Sheets**: Tap the **Chef Hat icon** on any ticket item across the New and Cooking columns to inspect portion sizes in grams, griddle/fryer temperatures, target prep times, allergen warnings, and step-by-step assembly diagrams.
3. **Station Rush Delay Alert Broadcaster**: Tap **"+8m Rush Delay"** in the KDS header to broadcast an instant delay alert banner to the front counter and POS header, enabling cashiers to set guest expectations proactively.
4. **Station Routing & Bumping**: Filter tickets by Station (*Grill, Fry, Cold, Expo*), strike individual items when plated, bump tickets to history, and recall tickets with `[R]` or the Recall modal.

### C. Store Manager (Operations, Controls & Audits)
1. **Petty Cash & Drawer Disbursements Ledger**: KPI cards and payout logging modal for cash leaving the till (*Produce, Fresh Dairy, Packaging, Emergency Maintenance, Courier/Logistics, Staff Welfare*) with audited manager sign-off.
2. **Food Waste & Prep Scrap Log**: KPI cards tracking daily food scrap cost and waste-to-sales % ratio, with logging modal (*Burnt on Grill, Spilled on Floor, Expired Pre-prep, Quality Reject*) to prevent inventory shrinkage.
3. **Live Staff Attendance & Floor Punch Sheet**: Roster tracking all staff on shift, clock-in times, hours worked, and floor statuses (*On Floor, On Break, Clocked Out*) with interactive punch buttons.
4. **Cashier Approvals Queue**: Dedicated queue for authorizing high discounts (>20%), order cancellations, and refunds requiring Manager PIN override.
5. **Live Menu Management**: Update pricing, upload photos, toggle item availability, and adjust station assignments with immediate POS sync.

### D. Franchise Owner (Executive Analytics, BCG Matrix & GST Filing)
1. **Daily Revenue Target Pacing**: Daily sales goal gauge (₹60,000 target), real-time progress bar, and projected end-of-day run-rate pace (+6.2% vs target).
2. **Menu Engineering & BCG Profitability Matrix**: 4-quadrant interactive BCG matrix (*🌟 Stars, 🐎 Workhorses, 🧩 Puzzles, 🐕 Dogs*) analyzing portion volume vs food cost margin % with actionable culinary recommendations.
3. **Sensitive Security Audit Trail**: Real-time event log tracking high-risk operations (manual drawer kicks, high discounts, voided orders, PIN resets, petty cash disbursements).
4. **GSTR-1 Indian CA Tax Package (B2C HSN 9963)**: Formal Table 7 B2C Small turnover breakdown (5% composite GST: CGST 2.5% + SGST 2.5%), with 1-click **Download GSTR-1 JSON** for government portal import and CSV export for Chartered Accountants.
5. **10 Interactive Reports**: Sales Summary, Item-wise Sales, Category-wise Sales, Payment-mode Report, Hourly Sales Report, Staff Performance, Discount & Refund Audit, GST (CGST/SGST), Kitchen Ticket Performance, and GSTR-1 CA Package.

---

## 5. Adjustments Made to Design References for India

1. **Brand Identity**: Replaced placeholder logos with the official **pos.bits** brand asset and vector styling.
2. **Currency**: Replaced all `$` symbols with Indian Rupee `₹` and formatted using the Indian numbering system (e.g. `₹1,25,000.00`).
3. **Payment Methods**: Replaced Indonesian references (QRIS, OVO) with Indian standards:
   - **UPI** (Dynamic QR codes, GPay, PhonePe, Paytm, BHIM with store VPA `posbits@icici`).
   - **Cash** (with physical Indian currency denomination counter: ₹2000, ₹500, ₹200, ₹100, ₹50, ₹20, ₹10, and coins).
   - **Card** (Debit/Credit card POS swipe/tap simulation).
4. **Tax Compliance**: Implemented Indian **Goods and Services Tax (GST)** split into equal **CGST (2.5%)** and **SGST (2.5%)** for the standard 5% restaurant composite scheme.
5. **Indian QSR Menu**: Authentic fast-casual favorites alongside classic smash burgers: Paneer Makhani Burger, Masala Crinkle Fries, Peri-Peri Fries, Cold Coffee, Fresh Lime Soda, and Warm Gulab Jamun Sundae.

---

## 6. Deliberately Omitted / Optional Features

To preserve strict minimalism and adhere to the prompt's instructions:
- **Dine-in graphical table map**: Omitted graphical cafe floor plan; kept high-velocity Dine-in / Takeaway toggle and table number badge.
- **Reservations & Pre-orders**: Omitted forward booking engines as standard QSRs operate on counter queue order-and-pay models.
- **Multi-outlet inventory & ERP**: Kept single-outlet live inventory and station routing.
- **Decorative hero banners & illustrations**: Kept flat, purposeful surfaces with clean 1px borders and neutral slate tones.

---

## 7. UI Kit & Design Tokens

- Structured Token JSON: `/ui-kit/tokens.json`
- Printable UI Kit PDF: `/ui-kit/UI_KIT.pdf`
- Interactive Web Showcase: `/ui-kit`

