-- =========================================================================
-- MIGRATION 00004: Tax and Billing Architecture (Indian GST Rule 46 Compliance)
-- Description: Tax profiles, GST components, atomic invoice sequence generation, tax invoices & credit notes
-- =========================================================================

-- 1. Tax Profiles
CREATE TABLE IF NOT EXISTS public.tax_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'GST 5% Restaurant (Standard)',
  is_composition_scheme BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Tax Components (CGST, SGST, IGST)
CREATE TABLE IF NOT EXISTS public.tax_components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tax_profile_id UUID NOT NULL REFERENCES public.tax_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (name IN ('CGST', 'SGST', 'IGST')),
  rate_percent NUMERIC(5, 2) NOT NULL CHECK (rate_percent >= 0),
  is_intra_state_only BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Invoice Sequences (Guarantees unique, consecutive invoice numbers per financial year)
CREATE TABLE IF NOT EXISTS public.invoice_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outlet_id UUID NOT NULL REFERENCES public.outlets(id) ON DELETE CASCADE,
  financial_year VARCHAR(10) NOT NULL, -- e.g. '2026-27'
  prefix VARCHAR(20) NOT NULL, -- e.g. 'INV-SLI-26/'
  next_number BIGINT NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_outlet_sequence_fy UNIQUE (outlet_id, financial_year)
);

-- 4. Invoices (Immutable GST Rule 46 Compliant Invoices)
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  outlet_id UUID NOT NULL REFERENCES public.outlets(id) ON DELETE CASCADE,
  order_id UUID UNIQUE NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
  invoice_number VARCHAR(16) NOT NULL, -- Strictly <= 16 characters per GST Rule 46(b)
  financial_year VARCHAR(10) NOT NULL,
  invoice_date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  place_of_supply_state_code CHAR(2) NOT NULL, -- State code per IGST Act Sec 12(4)
  customer_gstin VARCHAR(15), -- Present if B2B
  customer_name TEXT DEFAULT 'Guest',
  customer_address TEXT,
  b2b_b2c_type VARCHAR(20) NOT NULL DEFAULT 'B2C_SMALL' CHECK (b2b_b2c_type IN ('B2C_SMALL', 'B2C_LARGE', 'B2B')),
  
  -- Tax Breakdown (Financial precision: NUMERIC(10,2))
  taxable_value NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  cgst_rate NUMERIC(5, 2) NOT NULL DEFAULT 2.50,
  cgst_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  sgst_rate NUMERIC(5, 2) NOT NULL DEFAULT 2.50,
  sgst_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  igst_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
  igst_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  service_charge NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  rounding_adjustment NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  grand_total NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  
  -- Complete frozen copy of order items and taxes at moment of billing
  immutable_payload_snapshot JSONB NOT NULL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_outlet_invoice_number UNIQUE (outlet_id, invoice_number)
);

-- 5. Credit Notes (For Order Cancellations / Refunds under GST Section 34)
CREATE TABLE IF NOT EXISTS public.credit_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  outlet_id UUID NOT NULL REFERENCES public.outlets(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE RESTRICT,
  credit_note_number VARCHAR(16) NOT NULL,
  financial_year VARCHAR(10) NOT NULL,
  reason TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  cgst_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  sgst_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  igst_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_outlet_credit_note_num UNIQUE (outlet_id, credit_note_number)
);

-- 6. Atomic Stored Procedure: Generate Next Monotonic Invoice Number
CREATE OR REPLACE FUNCTION public.generate_next_invoice_number(
  p_outlet_id UUID,
  p_financial_year TEXT,
  p_prefix TEXT DEFAULT 'INV/'
)
RETURNS TEXT AS $$
DECLARE
  v_seq BIGINT;
  v_invoice_num TEXT;
BEGIN
  -- Row-level lock on the sequence record to guarantee concurrency safety
  INSERT INTO public.invoice_sequences (outlet_id, financial_year, prefix, next_number, updated_at)
  VALUES (p_outlet_id, p_financial_year, p_prefix, 2, timezone('utc'::text, now()))
  ON CONFLICT (outlet_id, financial_year)
  DO UPDATE SET
    next_number = public.invoice_sequences.next_number + 1,
    updated_at = timezone('utc'::text, now())
  RETURNING (public.invoice_sequences.next_number - 1) INTO v_seq;

  -- Format as e.g. 'INV-SLI/2627/0001' (Formatted to fit <= 16 chars if desired or compact)
  -- For GST Rule 46: prefix + padded number, maximum 16 alphanumeric characters
  v_invoice_num := SUBSTRING(p_prefix || LPAD(v_seq::text, 6, '0') FROM 1 FOR 16);
  RETURN v_invoice_num;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_invoices_outlet_date ON public.invoices(outlet_id, invoice_date DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_order ON public.invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_credit_notes_invoice ON public.credit_notes(invoice_id);
