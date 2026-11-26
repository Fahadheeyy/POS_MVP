# POS.BITS — Indian GST & Restaurant Statutory Compliance Architecture

**Legal & Regulatory Basis:**  
- Central Goods and Services Tax Act, 2017 (CGST Act)  
- Integrated Goods and Services Tax Act, 2017 (IGST Act)  
- Notification No. 11/2017-Central Tax (Rate) dated 28-June-2017 as amended by Notification No. 46/2017-Central Tax (Rate) dated 14-Nov-2017  
- Central Goods and Services Tax Rules, 2017 (Rule 46: Tax Invoice, Rule 49: Bill of Supply, Rule 53: Credit and Debit Notes)  
- Section 170 of the CGST Act (Rounding off of tax)  
- [FSSAI direction to restaurants and hotels on the 14-digit licence or registration number on receipts and invoices](https://fssai.gov.in/upload/advisories/2022/09/6320614d91afaOrder_License_Food_13_09_2022.pdf)

---

## 1. Restaurant GST Classification Matrix

| Category | Eligibility / Threshold | Tax Rate | ITC Eligibility | Required Document Type |
|---|---|---|---|---|
| **Standalone Restaurant (Regular)** | Standard QSR, Cafe, Dining (Air-conditioned or Non-AC) | **5.00%** (2.5% CGST + 2.5% SGST/UTGST) | **NO ITC** (Input Tax Credit cannot be claimed) | **Tax Invoice** (Rule 46) |
| **Restaurant in "Specified Premises"** | Determined for the financial year from qualifying prior-year hotel accommodation supplies above ₹7,500 per unit per day or an eligible declaration. [CBIC Notification 05/2025-Central Tax (Rate)](https://taxinformation.cbic.gov.in/view-pdf/1010273/ENG/Notifications) | **18.00%** (9.0% CGST + 9.0% SGST / 18% IGST) | **YES Full ITC** | **Tax Invoice** (Rule 46) |
| **Composition Scheme (Sec. 10)** | Annual aggregate turnover ≤ ₹1.5 Crore; non-alcohol, non-inter-state supply | **5.00%** (2.5% CGST + 2.5% SGST) paid by supplier | **NO ITC** (Cannot collect tax from customer) | **Bill of Supply** (Rule 49) |
| **Unregistered Small Supplier** | Annual aggregate turnover below threshold (₹20 Lakhs / ₹10 Lakhs for Special Category States) | **0.00%** (Cannot charge tax) | **NO ITC** | **Retail Bill / Cash Memo** |

> [!IMPORTANT]
> **State-Specific Rates Do Not Exist:** GST rates for restaurant services are uniform across all Indian States and Union Territories via the GST Council notifications.  
> **Composition Scheme Rule:** Under Section 10(4) of the CGST Act, a composition taxpayer **shall not collect any tax from the recipient on supplies made by him**, nor is he entitled to any input tax credit. The bill issued must prominently state: *"Composition taxable person, not eligible to collect tax on supplies"*.

---

## 2. Place of Supply (POS) Determination for Restaurants

Under **Section 12(4) of the IGST Act, 2017**:
> *"The place of supply of restaurant and catering services, personal grooming, fitness, beauty treatment, health service including cosmetic and plastic surgery shall be the location where the services are actually performed."*

### Application:
1. Since food and beverages are prepared and consumed or delivered at the physical restaurant location, the **Place of Supply is always the location of the restaurant outlet**.
2. If the restaurant outlet is in Karnataka (`State Code 29`):
   - Place of Supply = Karnataka (`29`).
   - Location of Supplier = Karnataka (`29`).
   - **Transaction is Intra-State:** **CGST (2.5%) + SGST (2.5%)** applies.
3. If the restaurant outlet is in a Union Territory without legislature (e.g., Chandigarh `04`, Andaman & Nicobar `35`, Ladakh `38`, Lakshadweep `31`, DNH & DD `26`):
   - **Transaction is Intra-UT:** **CGST (2.5%) + UTGST (2.5%)** applies.
4. **Inter-State IGST (5% or 18%):** Only arises in rare outstation outdoor catering contracts where the service is physically performed in a State different from the registered branch.

---

## 3. Financial Calculation Engine Specifications

All calculations must be performed on the server with deterministic `Decimal` / `NUMERIC(12,2)` arithmetic:

### 3.1 Tax-Exclusive Pricing (Menu Price = ₹100, Tax Rate = 5%)
$$\text{Taxable Value} = \text{Item Price} \times \text{Quantity} - \text{Discount}$$
$$\text{CGST} = \text{Taxable Value} \times 2.5\%$$
$$\text{SGST} = \text{Taxable Value} \times 2.5\%$$
$$\text{Net Total} = \text{Taxable Value} + \text{CGST} + \text{SGST}$$

*Example: ₹100.00 base $\rightarrow$ CGST ₹2.50 + SGST ₹2.50 = Total ₹105.00*

### 3.2 Tax-Inclusive Pricing (Menu Price = ₹105, Tax Rate = 5%)
$$\text{Taxable Value} = \frac{\text{Gross Price}}{1 + \text{Tax Rate}} = \frac{105}{1 + 0.05} = 100.00$$
$$\text{Total Tax} = \text{Gross Price} - \text{Taxable Value} = 5.00$$
$$\text{CGST} = \frac{\text{Total Tax}}{2} = 2.50, \quad \text{SGST} = \frac{\text{Total Tax}}{2} = 2.50$$

### 3.3 Discounts & Taxable Value
Under **Section 15(3) of the CGST Act**, discounts given before or at the time of supply and duly recorded in the invoice are excluded from the taxable value:
- Item: ₹200.00
- Discount (10%): -₹20.00
- Taxable Value: ₹180.00
- CGST (2.5% of ₹180): ₹4.50
- SGST (2.5% of ₹180): ₹4.50
- Final Payable: ₹189.00

### 3.4 Statutory Rounding Off (Section 170)
The final invoice amount must be rounded off to the nearest Indian Rupee:
- Value $\ge 50$ paise: Rounded up to next higher rupee.
- Value $< 50$ paise: Disregarded.
- Rounding adjustment is stored as a distinct ledger column (`rounding_adjustment NUMERIC(5,2)`).

---

## 4. Mandatory Rule 46 Tax Invoice Particulars

Every generated Tax Invoice must contain:
1. **Supplier Identity:** Registered Legal Name, Trade Name (Sign Laban), registered outlet address, and 15-digit GSTIN.
2. **Consecutive Serial Number:** Unbroken, strictly sequential serial number not exceeding 16 characters, unique for each financial year (e.g., `SL/BLR/26-27/000104`).
3. **Date of Issue:** Date and timestamp of transaction.
4. **Recipient Details:**
   - For B2B orders: Customer Legal Name, Billing Address, and GSTIN.
   - For B2C orders: Optional if value $< ₹50,000$; mandatory Name, Address, and State if $\ge ₹50,000$.
5. **Service Accounting Code (SAC):** `9963` (Restaurant Service).
6. **Description of Supply:** Name of dish/product, selected modifier options.
7. **Quantity & Rate:** Number of units and unit price.
8. **Taxable Value:** Net of trade discounts.
9. **Tax Rate & Breakdown:** Explicit columns for CGST (₹), SGST (₹), or IGST (₹).
10. **Place of Supply:** State name and 2-digit code (e.g., `Karnataka (29)`).
11. **FSSAI License:** 14-digit FSSAI number (e.g., `FSSAI Lic No: 11223334000123`).
12. **Software Generation Note:** *"This is a computer-generated invoice, no physical signature required."*

---

## 5. Refunds & Credit Notes (Rule 53)

When an order is cancelled or refunded post-billing:
1. Original invoice remains immutable in the audit ledger.
2. A **Credit Note** is issued referencing the original Invoice Number and Date.
3. The Credit Note reverses the exact taxable value, CGST, and SGST originally charged.
4. Credit Notes are tracked in a dedicated serial sequence (`CN/BLR/26-27/000012`).


Where CGST Act section 34(2) applies, track the GST reporting deadline separately from the payment refund. The deadline is the earlier of 30 November following the financial year of supply and the date the relevant annual return is filed. Section 36 generally requires covered records to be retained for 72 months from the annual return due date, with an extension where specified proceedings or investigations are pending. [Central Goods and Services Tax Act, sections 34 and 36](https://upload.indiacode.nic.in/showfile?actid=AC_CEN_2_2_00042_201712_1517807328102&filename=a2017-12.pdf&type=actfile)

## 6. Production payment and privacy requirements

- Use a provider-hosted or provider-controlled payment flow and keep customer card credentials out of merchant-accessible storage. Track provider references and refund status, with refunds routed to the original payment method by default. Use the provider's mandate flow for recurring subscription payments. [RBI payment aggregator directions](https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=12896) · [RBI e-mandate framework](https://www.rbi.org.in/SCRIPTS/BS_ViewMasDirections.aspx?id=13374)
- Design customer-data controls around the applicable DPDP provisions and their phased commencement. Separate optional customer contact data from financial records subject to legal retention before implementing export or erasure. [MeitY Digital Personal Data Protection Rules, 2025](https://www.meity.gov.in/static/uploads/2025/11/53450e6e5dc0bfa85ebd78686cadad39.pdf)

The platform outlet form checks the format of the FSSAI number. Licence verification, receipt issuance, payment integration, statutory retention, and privacy request handling require separate implementation and staging verification.
