CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  sku TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  name_en TEXT NOT NULL,
  name_vi TEXT NOT NULL,
  description_en TEXT DEFAULT '',
  description_vi TEXT DEFAULT '',
  condition TEXT DEFAULT 'new',
  compatibility TEXT DEFAULT '[]',
  price_vnd INTEGER NOT NULL DEFAULT 0,
  price_usd REAL DEFAULT 0,
  price_inr INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'available',
  featured INTEGER NOT NULL DEFAULT 0,
  image_url TEXT DEFAULT '',
  image_key TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS inventory (
  product_id TEXT PRIMARY KEY,
  stock INTEGER NOT NULL DEFAULT 0,
  reserved INTEGER NOT NULL DEFAULT 0,
  location TEXT DEFAULT 'Vietnam',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT DEFAULT '',
  channel TEXT DEFAULT 'inquiry',
  address TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  currency TEXT DEFAULT 'VND',
  total_amount INTEGER DEFAULT 0,
  payment_status TEXT DEFAULT 'pending',
  order_status TEXT DEFAULT 'new',
  payment_provider TEXT DEFAULT '',
  provider_ref TEXT DEFAULT '',
  items TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
