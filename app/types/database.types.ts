/**
 * Supabase database types for this app. Mirrors supabase/migrations/ in the format `supabase gen types typescript` produces.
 *
 * Regenerate after any schema change:  npm run types:db   (needs `npx supabase login` once)
 *
 * Note: Postgres CHECK constraints (e.g. expenses.cat) can't be expressed in generated types,
 * so `cat` is `string` here; the allowed values are validated in server/utils/*.ts.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      households: {
        Row: {
          id: string;
          name: string;
          owner_id: string;
          personal: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          owner_id: string;
          personal?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          owner_id?: string;
          personal?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: []; // foreign keys are listed in supabase/migrations/
      };
      household_members: {
        Row: {
          household_id: string;
          user_id: string;
          role: string; // owner | admin | member | viewer
          joined_at: string;
        };
        Insert: {
          household_id: string;
          user_id: string;
          role: string;
          joined_at?: string;
        };
        Update: {
          household_id?: string;
          user_id?: string;
          role?: string;
          joined_at?: string;
        };
        Relationships: []; // foreign keys are listed in supabase/migrations/
      };
      household_invitations: {
        Row: {
          id: string;
          household_id: string;
          email: string;
          role: string; // admin | member | viewer
          invited_by: string | null;
          expires_at: string;
          accepted_at: string | null;
          declined_at: string | null;
          revoked_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          email: string;
          role: string;
          invited_by?: string | null;
          expires_at: string;
          accepted_at?: string | null;
          declined_at?: string | null;
          revoked_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          email?: string;
          role?: string;
          invited_by?: string | null;
          expires_at?: string;
          accepted_at?: string | null;
          declined_at?: string | null;
          revoked_at?: string | null;
          created_at?: string;
        };
        Relationships: []; // foreign keys are listed in supabase/migrations/
      };
      categories: {
        Row: {
          id: string;
          user_id: string | null;
          household_id: string;
          key: string | null; // a default category's key (groceries, ...); null for custom ones
          name: string | null; // null = a default using its translated name
          color: string;
          icon: string;
          budget: number | null; // monthly budget; null = none
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          household_id: string;
          key?: string | null;
          name?: string | null;
          color: string;
          icon: string;
          budget?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          household_id?: string;
          key?: string | null;
          name?: string | null;
          color?: string;
          icon?: string;
          budget?: number | null;
          created_at?: string;
        };
        Relationships: []; // foreign keys are listed in supabase/migrations/
      };
      category_seed_done: {
        Row: {
          household_id: string;
          user_id: string | null;
          created_at: string;
        };
        Insert: {
          household_id: string;
          user_id?: string | null;
          created_at?: string;
        };
        Update: {
          household_id?: string;
          user_id?: string | null;
          created_at?: string;
        };
        Relationships: []; // foreign keys are listed in supabase/migrations/
      };
      month_amounts: {
        Row: {
          household_id: string;
          user_id: string | null;
          y: number;
          m: number; // 0-based month
          amount: number; // the main amount for that month
          updated_at: string;
        };
        Insert: {
          household_id: string;
          user_id?: string | null;
          y: number;
          m: number;
          amount: number;
          updated_at?: string;
        };
        Update: {
          household_id?: string;
          user_id?: string | null;
          y?: number;
          m?: number;
          amount?: number;
          updated_at?: string;
        };
        Relationships: []; // foreign keys are listed in supabase/migrations/
      };
      expenses: {
        Row: {
          id: number;
          household_id: string;
          user_id: string | null;
          cat: string;
          amount: number;
          y: number;
          m: number;
          day: number;
          note: string | null;
          merchant: string | null;
          payment_method: string | null; // cash | card | bank_transfer | wallet | other
          receipt_path: string | null; // file name in the private receipts bucket
          created_by: string | null;
          paid_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: never; // generated always as identity
          household_id: string;
          user_id?: string | null;
          cat: string;
          amount: number;
          y: number;
          m: number;
          day: number;
          note?: string | null;
          merchant?: string | null;
          payment_method?: string | null;
          receipt_path?: string | null;
          created_by?: string | null;
          paid_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: never;
          household_id?: string;
          user_id?: string | null;
          cat?: string;
          amount?: number;
          y?: number;
          m?: number;
          day?: number;
          note?: string | null;
          merchant?: string | null;
          payment_method?: string | null;
          receipt_path?: string | null;
          created_by?: string | null;
          paid_by?: string | null;
          created_at?: string;
        };
        Relationships: []; // foreign keys are listed in supabase/migrations/
      };
      budget_alerts: {
        Row: {
          user_id: string;
          household_id: string;
          scope: string;
          y: number;
          m: number;
          level: number;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          household_id: string;
          scope: string;
          y: number;
          m: number;
          level: number;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          household_id?: string;
          scope?: string;
          y?: number;
          m?: number;
          level?: number;
          updated_at?: string;
        };
        Relationships: []; // foreign keys are listed in supabase/migrations/
      };
      incomes: {
        Row: {
          id: number;
          household_id: string;
          user_id: string | null;
          amount: number;
          y: number;
          m: number; // 0-based month
          day: number;
          source: string; // salary | freelance | gift | refund | other
          note: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: never; // generated always as identity
          household_id: string;
          user_id?: string | null;
          amount: number;
          y: number;
          m: number;
          day: number;
          source: string;
          note?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: never;
          household_id?: string;
          user_id?: string | null;
          amount?: number;
          y?: number;
          m?: number;
          day?: number;
          source?: string;
          note?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: []; // foreign keys are listed in supabase/migrations/
      };
      user_settings: {
        Row: {
          household_id: string;
          user_id: string | null;
          rollover_enabled: boolean;
          rollover_since_y: number | null;
          rollover_since_m: number | null;
          updated_at: string;
        };
        Insert: {
          household_id: string;
          user_id?: string | null;
          rollover_enabled?: boolean;
          rollover_since_y?: number | null;
          rollover_since_m?: number | null;
          updated_at?: string;
        };
        Update: {
          household_id?: string;
          user_id?: string | null;
          rollover_enabled?: boolean;
          rollover_since_y?: number | null;
          rollover_since_m?: number | null;
          updated_at?: string;
        };
        Relationships: []; // foreign keys are listed in supabase/migrations/
      };
      expense_templates: {
        Row: {
          id: string;
          user_id: string | null;
          household_id: string;
          name: string;
          amount: number | null;
          cat: string;
          note: string | null;
          merchant: string | null;
          payment_method: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          household_id: string;
          name: string;
          amount?: number | null;
          cat: string;
          note?: string | null;
          merchant?: string | null;
          payment_method?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          household_id?: string;
          name?: string;
          amount?: number | null;
          cat?: string;
          note?: string | null;
          merchant?: string | null;
          payment_method?: string | null;
          created_at?: string;
        };
        Relationships: []; // foreign keys are listed in supabase/migrations/
      };
      recurring_expenses: {
        Row: {
          id: string;
          user_id: string | null;
          household_id: string;
          title: string;
          amount: number;
          cat: string;
          note: string | null;
          merchant: string | null;
          payment_method: string | null;
          frequency: string; // daily | weekly | monthly | yearly
          interval_count: number;
          start_date: string; // YYYY-MM-DD
          next_due: string | null; // the occurrence waiting for confirmation; null once finished
          end_date: string | null;
          active: boolean;
          remind_days_before: number;
          last_reminded_for: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          household_id: string;
          title: string;
          amount: number;
          cat: string;
          note?: string | null;
          merchant?: string | null;
          payment_method?: string | null;
          frequency: string;
          interval_count?: number;
          start_date: string;
          next_due?: string | null;
          end_date?: string | null;
          active?: boolean;
          remind_days_before?: number;
          last_reminded_for?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          household_id?: string;
          title?: string;
          amount?: number;
          cat?: string;
          note?: string | null;
          merchant?: string | null;
          payment_method?: string | null;
          frequency?: string;
          interval_count?: number;
          start_date?: string;
          next_due?: string | null;
          end_date?: string | null;
          active?: boolean;
          remind_days_before?: number;
          last_reminded_for?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: []; // foreign keys are listed in supabase/migrations/
      };
      recurring_occurrences: {
        Row: {
          id: number;
          user_id: string | null;
          household_id: string;
          rule_id: string;
          scheduled_date: string;
          status: string; // confirmed | skipped
          expense_id: number | null;
          created_at: string;
        };
        Insert: {
          id?: never; // generated always as identity
          user_id?: string | null;
          household_id: string;
          rule_id: string;
          scheduled_date: string;
          status: string;
          expense_id?: number | null;
          created_at?: string;
        };
        Update: {
          id?: never;
          user_id?: string | null;
          household_id?: string;
          rule_id?: string;
          scheduled_date?: string;
          status?: string;
          expense_id?: number | null;
          created_at?: string;
        };
        Relationships: []; // foreign keys are listed in supabase/migrations/
      };
      expense_splits: {
        Row: {
          expense_id: number;
          household_id: string;
          user_id: string; // the participant
          share: number;
          settled_at: string | null;
          settled_by: string | null;
        };
        Insert: {
          expense_id: number;
          household_id: string;
          user_id: string;
          share: number;
          settled_at?: string | null;
          settled_by?: string | null;
        };
        Update: {
          expense_id?: number;
          household_id?: string;
          user_id?: string;
          share?: number;
          settled_at?: string | null;
          settled_by?: string | null;
        };
        Relationships: []; // foreign keys are listed in supabase/migrations/
      };
      expense_split_log: {
        Row: {
          id: number;
          expense_id: number;
          household_id: string;
          participant_id: string;
          action: string; // settled | unsettled
          by_user: string | null;
          created_at: string;
        };
        Insert: {
          id?: never; // generated always as identity
          expense_id: number;
          household_id: string;
          participant_id: string;
          action: string;
          by_user?: string | null;
          created_at?: string;
        };
        Update: {
          id?: never;
          expense_id?: number;
          household_id?: string;
          participant_id?: string;
          action?: string;
          by_user?: string | null;
          created_at?: string;
        };
        Relationships: []; // foreign keys are listed in supabase/migrations/
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type PublicSchema = Database["public"];

/** Row / Insert / Update shapes for a table, e.g. `Tables<'expenses'>`. */
export type Tables<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Row"];
export type TablesInsert<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Update"];
