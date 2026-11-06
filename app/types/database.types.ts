/**
 * Supabase database types for this app. Mirrors supabase/migrations/20261106000000_init.sql
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
      app_users: {
        Row: {
          id: string;
          user_name: string;
          display_name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_name: string;
          display_name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_name?: string;
          display_name?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      passkeys: {
        Row: {
          id: string;
          user_id: string;
          public_key: string;
          counter: number;
          backed_up: boolean;
          transports: string[] | null;
          aaguid: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          user_id: string;
          public_key: string;
          counter?: number;
          backed_up?: boolean;
          transports?: string[] | null;
          aaguid?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          public_key?: string;
          counter?: number;
          backed_up?: boolean;
          transports?: string[] | null;
          aaguid?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "passkeys_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "app_users";
            referencedColumns: ["id"];
          },
        ];
      };
      webauthn_challenges: {
        Row: {
          attempt_id: string;
          challenge: string;
          expires_at: string;
        };
        Insert: {
          attempt_id: string;
          challenge: string;
          expires_at: string;
        };
        Update: {
          attempt_id?: string;
          challenge?: string;
          expires_at?: string;
        };
        Relationships: [];
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
        Relationships: [
          {
            foreignKeyName: "expenses_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "app_users";
            referencedColumns: ["id"];
          },
        ];
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
