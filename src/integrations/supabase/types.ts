export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: Database["public"]["Enums"]["audit_action"]
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: unknown
          metadata: Json | null
          new_data: Json | null
          old_data: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: Database["public"]["Enums"]["audit_action"]
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          new_data?: Json | null
          old_data?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: Database["public"]["Enums"]["audit_action"]
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          new_data?: Json | null
          old_data?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          attempts: number
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          idempotency_key: string
          initiated_at: string
          mpesa_checkout_request_id: string | null
          mpesa_merchant_request_id: string | null
          mpesa_phone: string | null
          mpesa_transaction_id: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_reference: string | null
          sale_id: string
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          attempts?: number
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          idempotency_key: string
          initiated_at?: string
          mpesa_checkout_request_id?: string | null
          mpesa_merchant_request_id?: string | null
          mpesa_phone?: string | null
          mpesa_transaction_id?: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_reference?: string | null
          sale_id: string
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          attempts?: number
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          idempotency_key?: string
          initiated_at?: string
          mpesa_checkout_request_id?: string | null
          mpesa_merchant_request_id?: string | null
          mpesa_phone?: string | null
          mpesa_transaction_id?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_reference?: string | null
          sale_id?: string
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          barcode: string | null
          batch_number: string | null
          category: string | null
          category_id: string | null
          cost: number | null
          created_at: string | null
          created_by: string | null
          description: string | null
          expiry_date: string | null
          id: string
          is_active: boolean | null
          low_stock_threshold: number | null
          name: string
          price: number
          reorder_point: number | null
          reorder_quantity: number | null
          sku: string | null
          stock_quantity: number | null
          supplier_id: string | null
          updated_at: string | null
        }
        Insert: {
          barcode?: string | null
          batch_number?: string | null
          category?: string | null
          category_id?: string | null
          cost?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          expiry_date?: string | null
          id?: string
          is_active?: boolean | null
          low_stock_threshold?: number | null
          name: string
          price: number
          reorder_point?: number | null
          reorder_quantity?: number | null
          sku?: string | null
          stock_quantity?: number | null
          supplier_id?: string | null
          updated_at?: string | null
        }
        Update: {
          barcode?: string | null
          batch_number?: string | null
          category?: string | null
          category_id?: string | null
          cost?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          expiry_date?: string | null
          id?: string
          is_active?: boolean | null
          low_stock_threshold?: number | null
          name?: string
          price?: number
          reorder_point?: number | null
          reorder_quantity?: number | null
          sku?: string | null
          stock_quantity?: number | null
          supplier_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      promotions: {
        Row: {
          applicable_ids: string[] | null
          applicable_to: string
          coupon_code: string | null
          created_at: string | null
          current_uses: number | null
          description: string | null
          discount_type: string
          discount_value: number
          end_date: string | null
          id: string
          is_active: boolean | null
          max_uses: number | null
          min_purchase_amount: number | null
          min_quantity: number | null
          name: string
          start_date: string
          updated_at: string | null
        }
        Insert: {
          applicable_ids?: string[] | null
          applicable_to?: string
          coupon_code?: string | null
          created_at?: string | null
          current_uses?: number | null
          description?: string | null
          discount_type: string
          discount_value: number
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_purchase_amount?: number | null
          min_quantity?: number | null
          name: string
          start_date: string
          updated_at?: string | null
        }
        Update: {
          applicable_ids?: string[] | null
          applicable_to?: string
          coupon_code?: string | null
          created_at?: string | null
          current_uses?: number | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_purchase_amount?: number | null
          min_quantity?: number | null
          name?: string
          start_date?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      sales: {
        Row: {
          amount_paid: number | null
          balance_due: number | null
          cashier_id: string
          coupon_code: string | null
          created_at: string | null
          customer_id: string | null
          customer_name: string | null
          customer_phone: string | null
          device_id: string | null
          discount: number | null
          id: string
          idempotency_key: string | null
          notes: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_reference: string | null
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          promotion_id: string | null
          receipt_printed_at: string | null
          sale_number: string
          session_id: string | null
          subtotal: number
          tax: number | null
          total: number
        }
        Insert: {
          amount_paid?: number | null
          balance_due?: number | null
          cashier_id: string
          coupon_code?: string | null
          created_at?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          device_id?: string | null
          discount?: number | null
          id?: string
          idempotency_key?: string | null
          notes?: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_reference?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          promotion_id?: string | null
          receipt_printed_at?: string | null
          sale_number?: string
          session_id?: string | null
          subtotal: number
          tax?: number | null
          total: number
        }
        Update: {
          amount_paid?: number | null
          balance_due?: number | null
          cashier_id?: string
          coupon_code?: string | null
          created_at?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          device_id?: string | null
          discount?: number | null
          id?: string
          idempotency_key?: string | null
          notes?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_reference?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          promotion_id?: string | null
          receipt_printed_at?: string | null
          sale_number?: string
          session_id?: string | null
          subtotal?: number
          tax?: number | null
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_promotion_id_fkey"
            columns: ["promotion_id"]
            isOneToOne: false
            referencedRelation: "promotions"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_items: {
        Row: {
          created_at: string | null
          id: string
          product_id: string
          product_name: string
          quantity: number
          sale_id: string
          subtotal: number
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_id: string
          product_name: string
          quantity: number
          sale_id: string
          subtotal: number
          unit_price: number
        }
        Update: {
          created_at?: string | null
          id?: string
          product_id?: string
          product_name?: string
          quantity?: number
          sale_id?: string
          subtotal?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_adjustments: {
        Row: {
          adjusted_by: string
          adjustment_type: string
          created_at: string
          id: string
          new_quantity: number
          previous_quantity: number
          product_id: string
          quantity: number
          reason: string | null
          reference_number: string | null
        }
        Insert: {
          adjusted_by: string
          adjustment_type: string
          created_at?: string
          id?: string
          new_quantity: number
          previous_quantity: number
          product_id: string
          quantity: number
          reason?: string | null
          reference_number?: string | null
        }
        Update: {
          adjusted_by?: string
          adjustment_type?: string
          created_at?: string
          id?: string
          new_quantity?: number
          previous_quantity?: number
          product_id?: string
          quantity?: number
          reason?: string | null
          reference_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_adjustments_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          contact_person: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_print_receipt: { Args: { p_sale_id: string }; Returns: boolean }
      generate_sale_number: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_audit_event: {
        Args: {
          p_action: Database["public"]["Enums"]["audit_action"]
          p_entity_id?: string
          p_entity_type: string
          p_metadata?: Json
          p_new_data?: Json
          p_old_data?: Json
        }
        Returns: string
      }
      mark_receipt_printed: { Args: { p_sale_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "manager" | "cashier"
      audit_action:
        | "sale_created"
        | "sale_updated"
        | "payment_initiated"
        | "payment_completed"
        | "payment_failed"
        | "refund_initiated"
        | "refund_completed"
        | "stock_adjusted"
        | "product_created"
        | "product_updated"
        | "user_login"
        | "user_logout"
      payment_method: "cash" | "mpesa" | "airtel_money" | "card"
      payment_status:
        | "pending"
        | "processing"
        | "partially_paid"
        | "paid"
        | "failed"
        | "refunded"
        | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "manager", "cashier"],
      audit_action: [
        "sale_created",
        "sale_updated",
        "payment_initiated",
        "payment_completed",
        "payment_failed",
        "refund_initiated",
        "refund_completed",
        "stock_adjusted",
        "product_created",
        "product_updated",
        "user_login",
        "user_logout",
      ],
      payment_method: ["cash", "mpesa", "airtel_money", "card"],
      payment_status: [
        "pending",
        "processing",
        "partially_paid",
        "paid",
        "failed",
        "refunded",
        "cancelled",
      ],
    },
  },
} as const
