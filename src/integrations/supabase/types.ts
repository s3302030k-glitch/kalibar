export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Enums
export type AppRole = 'super_admin' | 'admin' | 'moderator' | 'viewer';
export type ReservationStatus = 'pending' | 'pending_payment' | 'confirmed' | 'cancelled' | 'completed';
export type PaymentMethod = 'online_zarinpal' | 'online_paypal' | 'crypto_usdt' | 'cash_on_arrival';
export type PaymentStatus = 'unpaid' | 'pending' | 'paid' | 'refunded' | 'failed';
export type SeasonType = 'off_season' | 'regular' | 'high_season' | 'peak' | 'special';

export type Database = {
  public: {
    Tables: {
      cabins: {
        Row: {
          id: number
          name_fa: string
          name_en: string
          slug: string
          description_fa: string | null
          description_en: string | null
          size_sqm: number
          capacity: number
          base_price_irr: number
          base_price_usd: number
          images: string[]
          features_fa: string[]
          features_en: string[]
          amenities: Json
          is_available: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name_fa: string
          name_en: string
          slug: string
          description_fa?: string | null
          description_en?: string | null
          size_sqm: number
          capacity: number
          base_price_irr: number
          base_price_usd: number
          images?: string[]
          features_fa?: string[]
          features_en?: string[]
          amenities?: Json
          is_available?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name_fa?: string
          name_en?: string
          slug?: string
          description_fa?: string | null
          description_en?: string | null
          size_sqm?: number
          capacity?: number
          base_price_irr?: number
          base_price_usd?: number
          images?: string[]
          features_fa?: string[]
          features_en?: string[]
          amenities?: Json
          is_available?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      seasonal_prices: {
        Row: {
          id: string
          cabin_id: number
          season_name_fa: string
          season_name_en: string
          season_type: SeasonType
          start_date: string
          end_date: string
          price_irr: number
          price_usd: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          cabin_id: number
          season_name_fa: string
          season_name_en: string
          season_type?: SeasonType
          start_date: string
          end_date: string
          price_irr: number
          price_usd: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          cabin_id?: number
          season_name_fa?: string
          season_name_en?: string
          season_type?: SeasonType
          start_date?: string
          end_date?: string
          price_irr?: number
          price_usd?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "seasonal_prices_cabin_id_fkey"
            columns: ["cabin_id"]
            referencedRelation: "cabins"
            referencedColumns: ["id"]
          }
        ]
      }
      coupons: {
        Row: {
          id: string
          code: string
          discount_type: 'percent' | 'fixed'
          discount_value: number
          max_uses: number | null
          used_count: number
          expires_at: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          discount_type: 'percent' | 'fixed'
          discount_value: number
          max_uses?: number | null
          used_count?: number
          expires_at?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          code?: string
          discount_type?: 'percent' | 'fixed'
          discount_value?: number
          max_uses?: number | null
          used_count?: number
          expires_at?: string | null
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      daily_prices: {
        Row: {
          id: string
          cabin_id: number | null
          date: string
          price_irr: number
          price_usd: number
          reason_fa: string | null
          reason_en: string | null
          is_blocked: boolean
          created_at: string
        }
        Insert: {
          id?: string
          cabin_id?: number | null
          date: string
          price_irr: number
          price_usd: number
          reason_fa?: string | null
          reason_en?: string | null
          is_blocked?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          cabin_id?: number | null
          date?: string
          price_irr?: number
          price_usd?: number
          reason_fa?: string | null
          reason_en?: string | null
          is_blocked?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_prices_cabin_id_fkey"
            columns: ["cabin_id"]
            referencedRelation: "cabins"
            referencedColumns: ["id"]
          }
        ]
      }
      reservations: {
        Row: {
          id: string
          cabin_id: number
          guest_name: string
          guest_phone: string
          guest_email: string | null
          guest_national_id: string | null
          guests_count: number
          check_in_date: string
          check_out_date: string
          nights_count: number
          calculated_price_irr: number
          calculated_price_usd: number
          discount_amount_irr: number | null
          discount_amount_usd: number | null
          final_price_irr: number
          final_price_usd: number
          payment_method: PaymentMethod
          payment_status: PaymentStatus
          payment_reference: string | null
          payment_verified_at: string | null
          payment_verified_by: string | null
          status: ReservationStatus
          admin_notes: string | null
          internal_notes: string | null
          created_at: string
          updated_at: string
          confirmed_at: string | null
          cancelled_at: string | null
        }
        Insert: {
          id?: string
          cabin_id: number
          guest_name: string
          guest_phone: string
          guest_email?: string | null
          guest_national_id?: string | null
          guests_count: number
          check_in_date: string
          check_out_date: string
          calculated_price_irr: number
          calculated_price_usd: number
          discount_amount_irr?: number | null
          discount_amount_usd?: number | null
          payment_method?: PaymentMethod
          payment_status?: PaymentStatus
          payment_reference?: string | null
          status?: ReservationStatus
          admin_notes?: string | null
          internal_notes?: string | null
          created_at?: string
          updated_at?: string
          confirmed_at?: string | null
          cancelled_at?: string | null
        }
        Update: {
          id?: string
          cabin_id?: number
          guest_name?: string
          guest_phone?: string
          guest_email?: string | null
          guest_national_id?: string | null
          guests_count?: number
          check_in_date?: string
          check_out_date?: string
          calculated_price_irr?: number
          calculated_price_usd?: number
          discount_amount_irr?: number | null
          discount_amount_usd?: number | null
          payment_method?: PaymentMethod
          payment_status?: PaymentStatus
          payment_reference?: string | null
          payment_verified_at?: string | null
          payment_verified_by?: string | null
          status?: ReservationStatus
          admin_notes?: string | null
          internal_notes?: string | null
          created_at?: string
          updated_at?: string
          confirmed_at?: string | null
          cancelled_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reservations_cabin_id_fkey"
            columns: ["cabin_id"]
            referencedRelation: "cabins"
            referencedColumns: ["id"]
          }
        ]
      }
      reviews: {
        Row: {
          id: string
          cabin_id: number
          reservation_id: string | null
          guest_name: string
          guest_phone: string | null
          rating: number
          title: string | null
          comment: string
          admin_response: string | null
          admin_response_at: string | null
          is_approved: boolean
          is_featured: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          cabin_id: number
          reservation_id?: string | null
          guest_name: string
          guest_phone?: string | null
          rating: number
          title?: string | null
          comment: string
          admin_response?: string | null
          admin_response_at?: string | null
          is_approved?: boolean
          is_featured?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          cabin_id?: number
          reservation_id?: string | null
          guest_name?: string
          guest_phone?: string | null
          rating?: number
          title?: string | null
          comment?: string
          admin_response?: string | null
          admin_response_at?: string | null
          is_approved?: boolean
          is_featured?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_cabin_id_fkey"
            columns: ["cabin_id"]
            referencedRelation: "cabins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reservation_id_fkey"
            columns: ["reservation_id"]
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          }
        ]
      }
      user_roles: {
        Row: {
          id: string
          user_id: string
          role: AppRole
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role?: AppRole
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role?: AppRole
          created_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          type: string
          title: string
          message: string
          metadata: Json
          is_read: boolean
          read_at: string | null
          read_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          type: string
          title: string
          message: string
          metadata?: Json
          is_read?: boolean
          read_at?: string | null
          read_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          type?: string
          title?: string
          message?: string
          metadata?: Json
          is_read?: boolean
          read_at?: string | null
          read_by?: string | null
          created_at?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          id: number
          key: string
          value: Json
          description: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: number
          key: string
          value: Json
          description?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: number
          key?: string
          value?: Json
          description?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      blocked_dates: {
        Row: {
          id: string
          date: string
          reason_fa: string | null
          reason_en: string | null
          cabin_id: number | null
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          date: string
          reason_fa?: string | null
          reason_en?: string | null
          cabin_id?: number | null
          created_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          date?: string
          reason_fa?: string | null
          reason_en?: string | null
          cabin_id?: number | null
          created_at?: string
          created_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blocked_dates_cabin_id_fkey"
            columns: ["cabin_id"]
            referencedRelation: "cabins"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_availability: {
        Args: {
          p_cabin_id: number
          p_check_in: string
          p_check_out: string
          p_exclude_reservation_id?: string
        }
        Returns: boolean
      }
      calculate_reservation_price: {
        Args: {
          p_cabin_id: number
          p_check_in: string
          p_check_out: string
        }
        Returns: {
          total_irr: number
          total_usd: number
          nights: number
        }[]
      }
      create_reservation: {
        Args: {
          p_cabin_id: number
          p_guest_name: string
          p_guest_phone: string
          p_guest_email: string
          p_guests_count: number
          p_check_in: string
          p_check_out: string
          p_payment_method?: PaymentMethod
          p_coupon_code?: string
        }
        Returns: Json
      }
      get_price_for_date: {
        Args: {
          p_cabin_id: number
          p_date: string
        }
        Returns: {
          price_irr: number
          price_usd: number
        }[]
      }
      validate_coupon: {
        Args: {
          p_code: string
          p_total_amount: number
        }
        Returns: Json
      }
      has_role: {
        Args: {
          _user_id: string
          _role: AppRole
        }
        Returns: boolean
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      app_role: AppRole
      reservation_status: ReservationStatus
      payment_method: PaymentMethod
      payment_status: PaymentStatus
      season_type: SeasonType
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types for easier usage
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Convenience types
export type Cabin = Tables<'cabins'>
export type CabinInsert = TablesInsert<'cabins'>
export type CabinUpdate = TablesUpdate<'cabins'>

export type Reservation = Tables<'reservations'>
export type ReservationInsert = TablesInsert<'reservations'>
export type ReservationUpdate = TablesUpdate<'reservations'>

export type Review = Tables<'reviews'>
export type ReviewInsert = TablesInsert<'reviews'>
export type ReviewUpdate = TablesUpdate<'reviews'>

export type SeasonalPrice = Tables<'seasonal_prices'>
export type DailyPrice = Tables<'daily_prices'>
export type Notification = Tables<'notifications'>
export type Setting = Tables<'settings'>
export type BlockedDate = Tables<'blocked_dates'>
export type UserRole = Tables<'user_roles'>
export type Coupon = Tables<'coupons'>
export type CouponInsert = TablesInsert<'coupons'>
export type CouponUpdate = TablesUpdate<'coupons'>

// Create reservation response type
export type CreateReservationResponse = {
  success: boolean
  reservation_id?: string
  price_irr?: number
  price_usd?: number
  nights?: number
  error?: string
}
