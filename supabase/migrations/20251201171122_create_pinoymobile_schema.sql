/*
  # PinoyMobile.com Admin Panel Database Schema

  ## Overview
  Complete database structure for managing mobile phones, specifications, prices, 
  brands, blogs, comparisons, and administrative features.

  ## 1. New Tables

  ### `brands`
  - `id` (uuid, primary key) - Unique brand identifier
  - `name` (text, unique) - Brand name (e.g., "Samsung", "Apple")
  - `slug` (text, unique) - URL-friendly slug
  - `logo_url` (text, nullable) - Brand logo image URL
  - `description` (text, nullable) - Brand description
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `phones`
  - `id` (uuid, primary key) - Unique phone identifier
  - `brand_id` (uuid, foreign key) - Reference to brands table
  - `model_name` (text) - Phone model name
  - `slug` (text, unique) - URL-friendly slug
  - `release_date` (date, nullable) - Phone release date
  - `release_year` (integer, nullable) - Release year
  - `main_image_url` (text, nullable) - Main product image
  - `is_published` (boolean) - Publication status
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `phone_images`
  - `id` (uuid, primary key) - Unique image identifier
  - `phone_id` (uuid, foreign key) - Reference to phones table
  - `image_url` (text) - Image URL in storage
  - `display_order` (integer) - Order for gallery display
  - `created_at` (timestamptz) - Creation timestamp

  ### `specifications`
  - `id` (uuid, primary key) - Unique specification identifier
  - `phone_id` (uuid, foreign key) - Reference to phones table
  - `category` (text) - Spec category (e.g., "Display", "Camera", "Battery")
  - `spec_key` (text) - Specification key (e.g., "screen_size", "resolution")
  - `spec_value` (text) - Specification value
  - `display_order` (integer) - Order for display
  - `source` (text) - Data source ("api" or "manual")
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `prices`
  - `id` (uuid, primary key) - Unique price identifier
  - `phone_id` (uuid, foreign key) - Reference to phones table
  - `region` (text) - Region/country (e.g., "Philippines")
  - `currency` (text) - Currency code (e.g., "PHP", "USD")
  - `amount` (decimal) - Price amount
  - `promo_note` (text, nullable) - Optional promotional note
  - `is_current` (boolean) - Current active price flag
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `price_history`
  - `id` (uuid, primary key) - Unique history entry identifier
  - `phone_id` (uuid, foreign key) - Reference to phones table
  - `region` (text) - Region/country
  - `currency` (text) - Currency code
  - `old_amount` (decimal, nullable) - Previous price
  - `new_amount` (decimal) - New price
  - `changed_by` (uuid, nullable) - User who made the change
  - `created_at` (timestamptz) - Change timestamp

  ### `comparisons`
  - `id` (uuid, primary key) - Unique comparison identifier
  - `title` (text) - Comparison title
  - `slug` (text, unique) - URL-friendly slug
  - `custom_notes` (text, nullable) - Custom comparison notes
  - `is_published` (boolean) - Publication status
  - `created_by` (uuid, nullable) - User who created comparison
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `comparison_phones`
  - `id` (uuid, primary key) - Unique entry identifier
  - `comparison_id` (uuid, foreign key) - Reference to comparisons table
  - `phone_id` (uuid, foreign key) - Reference to phones table
  - `display_order` (integer) - Order in comparison

  ### `articles`
  - `id` (uuid, primary key) - Unique article identifier
  - `title` (text) - Article title
  - `slug` (text, unique) - URL-friendly slug
  - `content` (text) - Article content (markdown)
  - `excerpt` (text, nullable) - Short excerpt
  - `featured_image_url` (text, nullable) - Featured image URL
  - `type` (text) - Article type ("blog", "news", "review")
  - `is_published` (boolean) - Publication status
  - `author_id` (uuid, nullable) - Author user ID
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `api_import_logs`
  - `id` (uuid, primary key) - Unique log identifier
  - `phone_id` (uuid, foreign key, nullable) - Reference to phones table
  - `api_source` (text) - API source name
  - `status` (text) - Import status ("success", "error", "partial")
  - `message` (text, nullable) - Status message or error details
  - `imported_by` (uuid, nullable) - User who initiated import
  - `created_at` (timestamptz) - Import timestamp

  ### `user_roles`
  - `id` (uuid, primary key) - Unique role assignment identifier
  - `user_id` (uuid, unique) - Reference to auth.users
  - `role` (text) - User role ("admin", "editor", "viewer")
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## 2. Security

  All tables have Row Level Security (RLS) enabled with appropriate policies:
  - Authenticated users can read all data
  - Admins have full access (insert, update, delete)
  - Editors can create and update (but not delete)
  - Viewers can only read

  ## 3. Indexes

  Created indexes on frequently queried columns:
  - Foreign keys
  - Slug fields
  - Published status flags
  - Timestamps for sorting

  ## 4. Triggers

  Automatic `updated_at` timestamp updates for relevant tables.
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Brands Table
CREATE TABLE IF NOT EXISTS brands (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text UNIQUE NOT NULL,
  slug text UNIQUE NOT NULL,
  logo_url text,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Phones Table
CREATE TABLE IF NOT EXISTS phones (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id uuid REFERENCES brands(id) ON DELETE CASCADE NOT NULL,
  model_name text NOT NULL,
  slug text UNIQUE NOT NULL,
  release_date date,
  release_year integer,
  main_image_url text,
  is_published boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Phone Images Table
CREATE TABLE IF NOT EXISTS phone_images (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone_id uuid REFERENCES phones(id) ON DELETE CASCADE NOT NULL,
  image_url text NOT NULL,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Specifications Table
CREATE TABLE IF NOT EXISTS specifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone_id uuid REFERENCES phones(id) ON DELETE CASCADE NOT NULL,
  category text NOT NULL,
  spec_key text NOT NULL,
  spec_value text NOT NULL,
  display_order integer DEFAULT 0,
  source text DEFAULT 'manual',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Prices Table
CREATE TABLE IF NOT EXISTS prices (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone_id uuid REFERENCES phones(id) ON DELETE CASCADE NOT NULL,
  region text NOT NULL,
  currency text NOT NULL,
  amount decimal(10, 2) NOT NULL,
  promo_note text,
  is_current boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Price History Table
CREATE TABLE IF NOT EXISTS price_history (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone_id uuid REFERENCES phones(id) ON DELETE CASCADE NOT NULL,
  region text NOT NULL,
  currency text NOT NULL,
  old_amount decimal(10, 2),
  new_amount decimal(10, 2) NOT NULL,
  changed_by uuid,
  created_at timestamptz DEFAULT now()
);

-- Comparisons Table
CREATE TABLE IF NOT EXISTS comparisons (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  custom_notes text,
  is_published boolean DEFAULT false,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Comparison Phones Junction Table
CREATE TABLE IF NOT EXISTS comparison_phones (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  comparison_id uuid REFERENCES comparisons(id) ON DELETE CASCADE NOT NULL,
  phone_id uuid REFERENCES phones(id) ON DELETE CASCADE NOT NULL,
  display_order integer DEFAULT 0,
  UNIQUE(comparison_id, phone_id)
);

-- Articles Table (Blogs & News)
CREATE TABLE IF NOT EXISTS articles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  content text NOT NULL,
  excerpt text,
  featured_image_url text,
  type text NOT NULL CHECK (type IN ('blog', 'news', 'review')),
  is_published boolean DEFAULT false,
  author_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- API Import Logs Table
CREATE TABLE IF NOT EXISTS api_import_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone_id uuid REFERENCES phones(id) ON DELETE SET NULL,
  api_source text NOT NULL,
  status text NOT NULL CHECK (status IN ('success', 'error', 'partial')),
  message text,
  imported_by uuid,
  created_at timestamptz DEFAULT now()
);

-- User Roles Table
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'editor', 'viewer')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create Indexes
CREATE INDEX IF NOT EXISTS idx_phones_brand_id ON phones(brand_id);
CREATE INDEX IF NOT EXISTS idx_phones_slug ON phones(slug);
CREATE INDEX IF NOT EXISTS idx_phones_published ON phones(is_published);
CREATE INDEX IF NOT EXISTS idx_phone_images_phone_id ON phone_images(phone_id);
CREATE INDEX IF NOT EXISTS idx_specifications_phone_id ON specifications(phone_id);
CREATE INDEX IF NOT EXISTS idx_prices_phone_id ON prices(phone_id);
CREATE INDEX IF NOT EXISTS idx_prices_current ON prices(is_current);
CREATE INDEX IF NOT EXISTS idx_price_history_phone_id ON price_history(phone_id);
CREATE INDEX IF NOT EXISTS idx_comparison_phones_comparison_id ON comparison_phones(comparison_id);
CREATE INDEX IF NOT EXISTS idx_comparison_phones_phone_id ON comparison_phones(phone_id);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_type ON articles(type);
CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(is_published);
CREATE INDEX IF NOT EXISTS idx_api_import_logs_phone_id ON api_import_logs(phone_id);

-- Enable Row Level Security
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE phones ENABLE ROW LEVEL SECURITY;
ALTER TABLE phone_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE specifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE comparison_phones ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_import_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Helper function to check user role
CREATE OR REPLACE FUNCTION get_user_role(user_uuid uuid)
RETURNS text AS $$
  SELECT role FROM user_roles WHERE user_id = user_uuid;
$$ LANGUAGE sql SECURITY DEFINER;

-- RLS Policies for brands
CREATE POLICY "Anyone can view brands"
  ON brands FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert brands"
  ON brands FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins and editors can update brands"
  ON brands FOR UPDATE
  TO authenticated
  USING (get_user_role(auth.uid()) IN ('admin', 'editor'))
  WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'editor'));

CREATE POLICY "Admins can delete brands"
  ON brands FOR DELETE
  TO authenticated
  USING (get_user_role(auth.uid()) = 'admin');

-- RLS Policies for phones
CREATE POLICY "Anyone can view phones"
  ON phones FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and editors can insert phones"
  ON phones FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'editor'));

CREATE POLICY "Admins and editors can update phones"
  ON phones FOR UPDATE
  TO authenticated
  USING (get_user_role(auth.uid()) IN ('admin', 'editor'))
  WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'editor'));

CREATE POLICY "Admins can delete phones"
  ON phones FOR DELETE
  TO authenticated
  USING (get_user_role(auth.uid()) = 'admin');

-- RLS Policies for phone_images
CREATE POLICY "Anyone can view phone images"
  ON phone_images FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and editors can insert phone images"
  ON phone_images FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'editor'));

CREATE POLICY "Admins and editors can update phone images"
  ON phone_images FOR UPDATE
  TO authenticated
  USING (get_user_role(auth.uid()) IN ('admin', 'editor'))
  WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'editor'));

CREATE POLICY "Admins can delete phone images"
  ON phone_images FOR DELETE
  TO authenticated
  USING (get_user_role(auth.uid()) = 'admin');

-- RLS Policies for specifications
CREATE POLICY "Anyone can view specifications"
  ON specifications FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and editors can insert specifications"
  ON specifications FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'editor'));

CREATE POLICY "Admins and editors can update specifications"
  ON specifications FOR UPDATE
  TO authenticated
  USING (get_user_role(auth.uid()) IN ('admin', 'editor'))
  WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'editor'));

CREATE POLICY "Admins can delete specifications"
  ON specifications FOR DELETE
  TO authenticated
  USING (get_user_role(auth.uid()) = 'admin');

-- RLS Policies for prices
CREATE POLICY "Anyone can view prices"
  ON prices FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and editors can insert prices"
  ON prices FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'editor'));

CREATE POLICY "Admins and editors can update prices"
  ON prices FOR UPDATE
  TO authenticated
  USING (get_user_role(auth.uid()) IN ('admin', 'editor'))
  WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'editor'));

CREATE POLICY "Admins can delete prices"
  ON prices FOR DELETE
  TO authenticated
  USING (get_user_role(auth.uid()) = 'admin');

-- RLS Policies for price_history
CREATE POLICY "Anyone can view price history"
  ON price_history FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and editors can insert price history"
  ON price_history FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'editor'));

-- RLS Policies for comparisons
CREATE POLICY "Anyone can view comparisons"
  ON comparisons FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and editors can insert comparisons"
  ON comparisons FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'editor'));

CREATE POLICY "Admins and editors can update comparisons"
  ON comparisons FOR UPDATE
  TO authenticated
  USING (get_user_role(auth.uid()) IN ('admin', 'editor'))
  WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'editor'));

CREATE POLICY "Admins can delete comparisons"
  ON comparisons FOR DELETE
  TO authenticated
  USING (get_user_role(auth.uid()) = 'admin');

-- RLS Policies for comparison_phones
CREATE POLICY "Anyone can view comparison phones"
  ON comparison_phones FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and editors can insert comparison phones"
  ON comparison_phones FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'editor'));

CREATE POLICY "Admins and editors can update comparison phones"
  ON comparison_phones FOR UPDATE
  TO authenticated
  USING (get_user_role(auth.uid()) IN ('admin', 'editor'))
  WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'editor'));

CREATE POLICY "Admins can delete comparison phones"
  ON comparison_phones FOR DELETE
  TO authenticated
  USING (get_user_role(auth.uid()) = 'admin');

-- RLS Policies for articles
CREATE POLICY "Anyone can view articles"
  ON articles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and editors can insert articles"
  ON articles FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'editor'));

CREATE POLICY "Admins and editors can update articles"
  ON articles FOR UPDATE
  TO authenticated
  USING (get_user_role(auth.uid()) IN ('admin', 'editor'))
  WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'editor'));

CREATE POLICY "Admins can delete articles"
  ON articles FOR DELETE
  TO authenticated
  USING (get_user_role(auth.uid()) = 'admin');

-- RLS Policies for api_import_logs
CREATE POLICY "Anyone can view api import logs"
  ON api_import_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and editors can insert api import logs"
  ON api_import_logs FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'editor'));

-- RLS Policies for user_roles
CREATE POLICY "Anyone can view user roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert user roles"
  ON user_roles FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can update user roles"
  ON user_roles FOR UPDATE
  TO authenticated
  USING (get_user_role(auth.uid()) = 'admin')
  WITH CHECK (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can delete user roles"
  ON user_roles FOR DELETE
  TO authenticated
  USING (get_user_role(auth.uid()) = 'admin');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_brands_updated_at BEFORE UPDATE ON brands
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_phones_updated_at BEFORE UPDATE ON phones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_specifications_updated_at BEFORE UPDATE ON specifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prices_updated_at BEFORE UPDATE ON prices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comparisons_updated_at BEFORE UPDATE ON comparisons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_roles_updated_at BEFORE UPDATE ON user_roles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically log price changes
CREATE OR REPLACE FUNCTION log_price_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.amount != NEW.amount) THEN
    INSERT INTO price_history (phone_id, region, currency, old_amount, new_amount, changed_by)
    VALUES (NEW.phone_id, NEW.region, NEW.currency, OLD.amount, NEW.amount, auth.uid());
  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO price_history (phone_id, region, currency, old_amount, new_amount, changed_by)
    VALUES (NEW.phone_id, NEW.region, NEW.currency, NULL, NEW.amount, auth.uid());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for price history logging
CREATE TRIGGER log_price_changes
  AFTER INSERT OR UPDATE ON prices
  FOR EACH ROW
  EXECUTE FUNCTION log_price_change();