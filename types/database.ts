export type ProductCondition =
  | 'new_with_tags'
  | 'new_without_tags'
  | 'very_good'
  | 'good'
  | 'satisfactory';

export type ProductStatus = 'draft' | 'active' | 'reserved' | 'sold' | 'archived';
export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
export type AppRole = 'user' | 'trusted_user' | 'moderator' | 'lead_moderator' | 'admin';
export type AccountStatus = 'active' | 'warned' | 'banned';

export interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  rating: number;
  review_count: number;
  role: AppRole;
  account_status: AccountStatus;
  warning_count: number;
  featured_badge: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  seller_id: string;
  category_id: string | null;
  title: string;
  description: string;
  price_cents: number;
  currency: string;
  size: string;
  brand: string | null;
  color: string | null;
  condition: ProductCondition;
  shipping_options: string[];
  image_urls: string[];
  status: ProductStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  product_id: string;
  buyer_id: string;
  seller_id: string;
  amount_cents: number;
  currency: string;
  status: OrderStatus;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  shipping_address: Record<string, unknown> | null;
  tracking_number: string | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  product_id: string | null;
  sender_id: string;
  recipient_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  order_id: string;
  reviewer_id: string;
  reviewed_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
}

export interface Report {
  id: string;
  reporter_id: string;
  product_id: string | null;
  reported_user_id: string | null;
  reason: string;
  details: string | null;
  status: 'open' | 'in_review' | 'resolved' | 'dismissed' | 'escalated';
  assigned_to: string | null;
  resolution_note: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ModerationLogRow {
  id: string;
  actor_id: string;
  target_user_id: string | null;
  target_product_id: string | null;
  report_id: string | null;
  action: string;
  reason: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface PlatformSetting {
  setting_key: string;
  setting_value: Record<string, unknown>;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export type ProductWithSeller = Product & {
  seller: Pick<Profile, 'id' | 'username' | 'full_name' | 'avatar_url' | 'bio' | 'location' | 'rating' | 'review_count'> | null;
  category: Pick<Category, 'id' | 'name' | 'slug'> | null;
};

type SupabaseRecord<T> = { [Key in keyof T]: T[Key] } & Record<string, unknown>;

type TableDefinition<Row, Insert, Update> = {
  Row: SupabaseRecord<Row>;
  Insert: SupabaseRecord<Insert>;
  Update: SupabaseRecord<Update>;
  Relationships: [];
};

type GenericTableDefinition = TableDefinition<Record<string, unknown>, Record<string, unknown>, Record<string, unknown>>;

export type Database = {
  public: {
    Tables: {
      profiles: TableDefinition<Profile, Omit<Profile, 'created_at' | 'updated_at' | 'rating' | 'review_count' | 'role' | 'account_status' | 'warning_count' | 'featured_badge'>, Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at' | 'rating' | 'review_count' | 'role' | 'account_status' | 'warning_count' | 'featured_badge'>>>;
      categories: TableDefinition<Category, Omit<Category, 'id' | 'created_at' | 'updated_at'> & { id?: string }, Partial<Omit<Category, 'id' | 'created_at' | 'updated_at'>>>;
      products: TableDefinition<Product, Omit<Product, 'id' | 'created_at' | 'updated_at' | 'published_at' | 'status'> & { id?: string; published_at?: string | null; status?: ProductStatus }, Partial<Omit<Product, 'id' | 'seller_id' | 'created_at' | 'updated_at'>>>;
      orders: TableDefinition<Order, Omit<Order, 'id' | 'created_at' | 'updated_at' | 'stripe_checkout_session_id' | 'stripe_payment_intent_id' | 'tracking_number'> & { id?: string; stripe_checkout_session_id?: string | null; stripe_payment_intent_id?: string | null; tracking_number?: string | null }, Partial<Omit<Order, 'id' | 'created_at' | 'updated_at'>>>;
      messages: TableDefinition<Message, Omit<Message, 'id' | 'created_at' | 'updated_at' | 'read_at'> & { id?: string; read_at?: string | null }, Partial<Omit<Message, 'id' | 'created_at' | 'updated_at' | 'sender_id'>>>;
      reviews: TableDefinition<Review, Omit<Review, 'id' | 'created_at' | 'updated_at'> & { id?: string }, Partial<Omit<Review, 'id' | 'created_at' | 'updated_at' | 'reviewer_id'>>>;
      reports: TableDefinition<Report, Omit<Report, 'id' | 'created_at' | 'updated_at' | 'status' | 'assigned_to' | 'resolution_note' | 'resolved_at'> & { id?: string; status?: Report['status']; assigned_to?: string | null; resolution_note?: string | null; resolved_at?: string | null }, Partial<Omit<Report, 'id' | 'reporter_id' | 'created_at' | 'updated_at'>>>;
      moderation_logs: TableDefinition<ModerationLogRow, Omit<ModerationLogRow, 'id' | 'created_at' | 'metadata'> & { id?: string; metadata?: Record<string, unknown> }, never>;
      platform_settings: TableDefinition<PlatformSetting, Omit<PlatformSetting, 'created_at' | 'updated_at' | 'updated_by'> & { updated_by?: string | null }, Partial<Omit<PlatformSetting, 'setting_key' | 'created_at' | 'updated_at'>>>;
    } & Record<string, GenericTableDefinition>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      product_condition: ProductCondition;
      product_status: ProductStatus;
      order_status: OrderStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
