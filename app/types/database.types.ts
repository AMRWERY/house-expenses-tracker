/**
 * Supabase database types for this app. Mirrors supabase/migrations/ (init + email_auth + drop_passkeys)
 * in the format `supabase gen types typescript` produces.
 *
 * Regenerate after any schema change:  npm run types:db   (needs `npx supabase login` once)
 *
 * Note: Postgres CHECK constraints (e.g. expenses.cat) can't be expressed in generated types,
 * so `cat` is `string` here; the allowed values are validated in server/utils/expenses.ts.
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
      categories: {
        Row: {
          id: string;
          user_id: string;
          key: string | null; // a default category's key (groceries, ...); null for custom ones
          name: string | null; // null = a default using its translated name
          color: string;
          icon: string;
          budget: number | null; // monthly budget; null = none
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          key?: string | null;
          name?: string | null;
          color: string;
          icon: string;
          budget?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          key?: string | null;
          name?: string | null;
          color?: string;
          icon?: string;
          budget?: number | null;
          created_at?: string;
        };
        Relationships: []; // user_id -> auth.users(id) (other schema, so not listed here)
      };
      category_seed_done: {
        Row: {
          user_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          created_at?: string;
        };
        Relationships: []; // user_id -> auth.users(id) (other schema, so not listed here)
      };
      month_amounts: {
        Row: {
          user_id: string;
          y: number;
          m: number; // 0-based month
          amount: number; // the main amount for that month
          updated_at: string;
        };
        Insert: {
          user_id: string;
          y: number;
          m: number;
          amount: number;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          y?: number;
          m?: number;
          amount?: number;
          updated_at?: string;
        };
        Relationships: []; // user_id -> auth.users(id) (other schema, so not listed here)
      };
      expenses: {
        Row: {
          id: number;
          user_id: string;
          cat: string;
          amount: number;
          y: number;
          m: number;
          day: number;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: never; // generated always as identity
          user_id: string;
          cat: string;
          amount: number;
          y: number;
          m: number;
          day: number;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: never;
          user_id?: string;
          cat?: string;
          amount?: number;
          y?: number;
          m?: number;
          day?: number;
          note?: string | null;
          created_at?: string;
        };
        Relationships: []; // user_id -> auth.users(id) (other schema, so not listed here)
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
