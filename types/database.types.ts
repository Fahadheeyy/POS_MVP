/**
 * Supabase Database TypeScript Definitions
 * Generated for POS.BITS Multi-Tenant Enterprise Restaurant SaaS Platform
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      states: {
        Row: {
          id: string;
          code: string;
          tin_code: string;
          alpha_code: string;
          name: string;
          is_union_territory: boolean;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          code: string;
          tin_code: string;
          alpha_code: string;
          name: string;
          is_union_territory?: boolean;
          is_active?: boolean;
        };
        Update: Partial<Database['public']['Tables']['states']['Insert']>;
      };
      subscription_plans: {
        Row: {
          id: string;
          code: string;
          name: string;
          description: string | null;
          price_monthly: number;
          price_annually: number;
          max_outlets: number;
          max_users: number;
          is_active: boolean;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          description?: string | null;
          price_monthly?: number;
          price_annually?: number;
          max_outlets?: number;
          max_users?: number;
          is_active?: boolean;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['subscription_plans']['Insert']>;
      };
      plan_features: {
        Row: {
          id: string;
          plan_id: string;
          feature_key: string;
          is_enabled: boolean;
          limit_value: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          plan_id: string;
          feature_key: string;
          is_enabled?: boolean;
          limit_value?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['plan_features']['Insert']>;
      };
      platform_admins: {
        Row: {
          id: string;
          user_id: string;
          email: string;
          name: string;
          is_super_admin: boolean;
          status: 'active' | 'suspended';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          email: string;
          name: string;
          is_super_admin?: boolean;
          status?: 'active' | 'suspended';
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['platform_admins']['Insert']>;
      };
      tenants: {
        Row: {
          id: string;
          slug: string;
          name: string;
          legal_name: string | null;
          brand_name: string;
          category: string;
          status: 'active' | 'suspended' | 'onboarding' | 'archived';
          logo_url: string | null;
          metadata: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          legal_name?: string | null;
          brand_name: string;
          category?: string;
          status?: 'active' | 'suspended' | 'onboarding' | 'archived';
          logo_url?: string | null;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['tenants']['Insert']>;
      };
      tenant_subscriptions: {
        Row: {
          id: string;
          tenant_id: string;
          plan_id: string;
          status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'suspended';
          current_period_start: string;
          current_period_end: string;
          cancel_at_period_end: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          plan_id: string;
          status?: 'trialing' | 'active' | 'past_due' | 'canceled' | 'suspended';
          current_period_start?: string;
          current_period_end?: string;
          cancel_at_period_end?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['tenant_subscriptions']['Insert']>;
      };
      tenant_feature_overrides: {
        Row: {
          id: string;
          tenant_id: string;
          feature_key: string;
          is_enabled: boolean;
          reason: string | null;
          granted_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          feature_key: string;
          is_enabled: boolean;
          reason?: string | null;
          granted_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['tenant_feature_overrides']['Insert']>;
      };
      outlets: {
        Row: {
          id: string;
          tenant_id: string;
          name: string;
          code: string;
          is_default: boolean;
          status: 'active' | 'temporarily_closed' | 'archived';
          address_line1: string;
          address_line2: string | null;
          city: string;
          state_id: string | null;
          pincode: string;
          phone: string;
          email: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          name: string;
          code: string;
          is_default?: boolean;
          status?: 'active' | 'temporarily_closed' | 'archived';
          address_line1: string;
          address_line2?: string | null;
          city: string;
          state_id?: string | null;
          pincode: string;
          phone: string;
          email: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['outlets']['Insert']>;
      };
      outlet_business_profiles: {
        Row: {
          id: string;
          outlet_id: string;
          fssai_number: string | null;
          fssai_expiry: string | null;
          tagline: string | null;
          receipt_header: string | null;
          receipt_footer: string | null;
          currency: string;
          currency_symbol: string;
          service_charge_percent: number;
          service_charge_enabled: boolean;
          rounding_strategy: 'none' | 'round_half_up' | 'floor' | 'ceil';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          outlet_id: string;
          fssai_number?: string | null;
          fssai_expiry?: string | null;
          tagline?: string | null;
          receipt_header?: string | null;
          receipt_footer?: string | null;
          currency?: string;
          currency_symbol?: string;
          service_charge_percent?: number;
          service_charge_enabled?: boolean;
          rounding_strategy?: 'none' | 'round_half_up' | 'floor' | 'ceil';
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['outlet_business_profiles']['Insert']>;
      };
      outlet_gst_registrations: {
        Row: {
          id: string;
          outlet_id: string;
          gstin: string;
          trade_name: string;
          legal_name: string;
          composition_scheme: boolean;
          state_code: string;
          registered_address: string;
          verified_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          outlet_id: string;
          gstin: string;
          trade_name: string;
          legal_name: string;
          composition_scheme?: boolean;
          state_code: string;
          registered_address: string;
          verified_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['outlet_gst_registrations']['Insert']>;
      };
      profiles: {
        Row: {
          id: string;
          auth_user_id: string | null;
          email: string;
          name: string;
          phone: string | null;
          avatar_initials: string | null;
          title: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          auth_user_id?: string | null;
          email: string;
          name: string;
          phone?: string | null;
          avatar_initials?: string | null;
          title?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      tenant_memberships: {
        Row: {
          id: string;
          tenant_id: string;
          profile_id: string;
          is_owner: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          profile_id: string;
          is_owner?: boolean;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['tenant_memberships']['Insert']>;
      };
      permissions: {
        Row: {
          id: string;
          code: string;
          name: string;
          category: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          category: string;
          description?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['permissions']['Insert']>;
      };
      roles: {
        Row: {
          id: string;
          tenant_id: string | null;
          code: string;
          name: string;
          description: string | null;
          is_system: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id?: string | null;
          code: string;
          name: string;
          description?: string | null;
          is_system?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['roles']['Insert']>;
      };
      role_permissions: {
        Row: {
          id: string;
          role_id: string;
          permission_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          role_id: string;
          permission_id: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['role_permissions']['Insert']>;
      };
      outlet_memberships: {
        Row: {
          id: string;
          outlet_id: string;
          profile_id: string;
          role_id: string;
          is_primary: boolean;
          status: 'active' | 'inactive' | 'invited';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          outlet_id: string;
          profile_id: string;
          role_id: string;
          is_primary?: boolean;
          status?: 'active' | 'inactive' | 'invited';
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['outlet_memberships']['Insert']>;
      };
      user_permission_overrides: {
        Row: {
          id: string;
          outlet_membership_id: string;
          permission_id: string;
          granted: boolean;
          assigned_by: string | null;
          reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          outlet_membership_id: string;
          permission_id: string;
          granted: boolean;
          assigned_by?: string | null;
          reason?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['user_permission_overrides']['Insert']>;
      };
      staff_pins: {
        Row: {
          id: string;
          profile_id: string;
          outlet_id: string;
          pin_hash: string;
          failed_attempts: number;
          locked_until: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          outlet_id: string;
          pin_hash: string;
          failed_attempts?: number;
          locked_until?: string | null;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['staff_pins']['Insert']>;
      };
      categories: {
        Row: {
          id: string;
          tenant_id: string;
          outlet_id: string | null;
          name: string;
          slug: string;
          icon: string | null;
          display_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          outlet_id?: string | null;
          name: string;
          slug: string;
          icon?: string | null;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['categories']['Insert']>;
      };
      products: {
        Row: {
          id: string;
          tenant_id: string;
          outlet_id: string | null;
          category_id: string;
          name: string;
          short_name: string | null;
          description: string | null;
          price: number;
          cost_price: number | null;
          hsn_sac_code: string;
          is_veg: boolean;
          is_active: boolean;
          sku: string | null;
          barcode: string | null;
          image_url: string | null;
          preparation_time_minutes: number;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          outlet_id?: string | null;
          category_id: string;
          name: string;
          short_name?: string | null;
          description?: string | null;
          price: number;
          cost_price?: number | null;
          hsn_sac_code?: string;
          is_veg?: boolean;
          is_active?: boolean;
          sku?: string | null;
          barcode?: string | null;
          image_url?: string | null;
          preparation_time_minutes?: number;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['products']['Insert']>;
      };
      modifier_groups: {
        Row: {
          id: string;
          tenant_id: string;
          outlet_id: string | null;
          name: string;
          min_selection: number;
          max_selection: number;
          is_required: boolean;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          outlet_id?: string | null;
          name: string;
          min_selection?: number;
          max_selection?: number;
          is_required?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['modifier_groups']['Insert']>;
      };
      modifier_options: {
        Row: {
          id: string;
          group_id: string;
          name: string;
          price_delta: number;
          is_default: boolean;
          is_active: boolean;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          name: string;
          price_delta?: number;
          is_default?: boolean;
          is_active?: boolean;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['modifier_options']['Insert']>;
      };
      product_modifier_groups: {
        Row: {
          id: string;
          product_id: string;
          group_id: string;
          display_order: number;
        };
        Insert: {
          id?: string;
          product_id: string;
          group_id: string;
          display_order?: number;
        };
        Update: Partial<Database['public']['Tables']['product_modifier_groups']['Insert']>;
      };
      dining_tables: {
        Row: {
          id: string;
          tenant_id: string;
          outlet_id: string;
          name: string;
          section: string;
          capacity: number;
          status: 'vacant' | 'occupied' | 'billed' | 'reserved';
          active_order_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          outlet_id: string;
          name: string;
          section?: string;
          capacity?: number;
          status?: 'vacant' | 'occupied' | 'billed' | 'reserved';
          active_order_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['dining_tables']['Insert']>;
      };
      orders: {
        Row: {
          id: string;
          tenant_id: string;
          outlet_id: string;
          order_number: string;
          order_type: 'dine_in' | 'takeaway' | 'delivery';
          table_id: string | null;
          status: 'open' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled' | 'refunded';
          customer_name: string | null;
          customer_phone: string | null;
          customer_gstin: string | null;
          item_count: number;
          subtotal: number;
          discount_total: number;
          tax_total: number;
          service_charge_total: number;
          rounding_adjustment: number;
          grand_total: number;
          notes: string | null;
          created_by: string | null;
          completed_at: string | null;
          cancelled_at: string | null;
          cancellation_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          outlet_id: string;
          order_number: string;
          order_type?: 'dine_in' | 'takeaway' | 'delivery';
          table_id?: string | null;
          status?: 'open' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled' | 'refunded';
          customer_name?: string | null;
          customer_phone?: string | null;
          customer_gstin?: string | null;
          item_count?: number;
          subtotal?: number;
          discount_total?: number;
          tax_total?: number;
          service_charge_total?: number;
          rounding_adjustment?: number;
          grand_total?: number;
          notes?: string | null;
          created_by?: string | null;
          completed_at?: string | null;
          cancelled_at?: string | null;
          cancellation_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['orders']['Insert']>;
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string | null;
          name: string;
          quantity: number;
          unit_price: number;
          total_price: number;
          notes: string | null;
          status: 'pending' | 'cooking' | 'ready' | 'served' | 'cancelled';
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id?: string | null;
          name: string;
          quantity: number;
          unit_price: number;
          total_price: number;
          notes?: string | null;
          status?: 'pending' | 'cooking' | 'ready' | 'served' | 'cancelled';
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['order_items']['Insert']>;
      };
      order_item_modifiers: {
        Row: {
          id: string;
          order_item_id: string;
          modifier_option_id: string | null;
          name: string;
          price_delta: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_item_id: string;
          modifier_option_id?: string | null;
          name: string;
          price_delta?: number;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['order_item_modifiers']['Insert']>;
      };
      payments: {
        Row: {
          id: string;
          order_id: string;
          tenant_id: string;
          outlet_id: string;
          payment_method: 'cash' | 'upi' | 'card' | 'split' | 'credit';
          amount: number;
          currency: string;
          status: 'pending' | 'success' | 'failed' | 'refunded';
          reference_number: string | null;
          collected_by: string | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          tenant_id: string;
          outlet_id: string;
          payment_method: 'cash' | 'upi' | 'card' | 'split' | 'credit';
          amount: number;
          currency?: string;
          status?: 'pending' | 'success' | 'failed' | 'refunded';
          reference_number?: string | null;
          collected_by?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['payments']['Insert']>;
      };
      kds_tickets: {
        Row: {
          id: string;
          order_id: string;
          tenant_id: string;
          outlet_id: string;
          ticket_number: string;
          status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
          priority: 'normal' | 'high' | 'urgent';
          started_at: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          tenant_id: string;
          outlet_id: string;
          ticket_number: string;
          status?: 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
          priority?: 'normal' | 'high' | 'urgent';
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['kds_tickets']['Insert']>;
      };
      kds_ticket_items: {
        Row: {
          id: string;
          ticket_id: string;
          order_item_id: string;
          status: 'pending' | 'cooking' | 'ready' | 'delivered';
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          ticket_id: string;
          order_item_id: string;
          status?: 'pending' | 'cooking' | 'ready' | 'delivered';
          completed_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['kds_ticket_items']['Insert']>;
      };
      tax_profiles: {
        Row: {
          id: string;
          tenant_id: string;
          name: string;
          is_composition_scheme: boolean;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          name?: string;
          is_composition_scheme?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['tax_profiles']['Insert']>;
      };
      tax_components: {
        Row: {
          id: string;
          tax_profile_id: string;
          name: 'CGST' | 'SGST' | 'IGST';
          rate_percent: number;
          is_intra_state_only: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          tax_profile_id: string;
          name: 'CGST' | 'SGST' | 'IGST';
          rate_percent: number;
          is_intra_state_only?: boolean;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['tax_components']['Insert']>;
      };
      invoices: {
        Row: {
          id: string;
          tenant_id: string;
          outlet_id: string;
          order_id: string;
          invoice_number: string;
          financial_year: string;
          invoice_date: string;
          place_of_supply_state_code: string;
          customer_gstin: string | null;
          customer_name: string | null;
          customer_address: string | null;
          b2b_b2c_type: 'B2C_SMALL' | 'B2C_LARGE' | 'B2B';
          taxable_value: number;
          cgst_rate: number;
          cgst_amount: number;
          sgst_rate: number;
          sgst_amount: number;
          igst_rate: number;
          igst_amount: number;
          service_charge: number;
          discount_amount: number;
          rounding_adjustment: number;
          grand_total: number;
          immutable_payload_snapshot: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          outlet_id: string;
          order_id: string;
          invoice_number: string;
          financial_year: string;
          invoice_date?: string;
          place_of_supply_state_code: string;
          customer_gstin?: string | null;
          customer_name?: string | null;
          customer_address?: string | null;
          b2b_b2c_type?: 'B2C_SMALL' | 'B2C_LARGE' | 'B2B';
          taxable_value?: number;
          cgst_rate?: number;
          cgst_amount?: number;
          sgst_rate?: number;
          sgst_amount?: number;
          igst_rate?: number;
          igst_amount?: number;
          service_charge?: number;
          discount_amount?: number;
          rounding_adjustment?: number;
          grand_total?: number;
          immutable_payload_snapshot: Json;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['invoices']['Insert']>;
      };
      credit_notes: {
        Row: {
          id: string;
          tenant_id: string;
          outlet_id: string;
          invoice_id: string;
          credit_note_number: string;
          financial_year: string;
          reason: string;
          amount: number;
          cgst_amount: number;
          sgst_amount: number;
          igst_amount: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          outlet_id: string;
          invoice_id: string;
          credit_note_number: string;
          financial_year: string;
          reason: string;
          amount: number;
          cgst_amount?: number;
          sgst_amount?: number;
          igst_amount?: number;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['credit_notes']['Insert']>;
      };
      audit_logs: {
        Row: {
          id: string;
          tenant_id: string | null;
          outlet_id: string | null;
          actor_profile_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          old_values: Json | null;
          new_values: Json | null;
          metadata: Json | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id?: string | null;
          outlet_id?: string | null;
          actor_profile_id?: string | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          old_values?: Json | null;
          new_values?: Json | null;
          metadata?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['audit_logs']['Insert']>;
      };
    };
    Functions: {
      get_current_profile_id: {
        Args: Record<PropertyKey, never>;
        Returns: string | null;
      };
      is_platform_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      get_user_tenant_ids: {
        Args: Record<PropertyKey, never>;
        Returns: { tenant_id: string }[];
      };
      get_user_outlet_ids: {
        Args: Record<PropertyKey, never>;
        Returns: { outlet_id: string }[];
      };
      has_permission: {
        Args: {
          p_outlet_id: string;
          p_permission_code: string;
        };
        Returns: boolean;
      };
      generate_next_invoice_number: {
        Args: {
          p_outlet_id: string;
          p_financial_year: string;
          p_prefix?: string;
        };
        Returns: string;
      };
    };
  };
}
