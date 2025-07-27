-- Sweet Shop Management System Database Schema
-- Run these SQL commands in your Supabase SQL editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('customer', 'admin')),
  password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Sweets table
CREATE TABLE IF NOT EXISTS public.sweets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  description TEXT DEFAULT '',
  image_url TEXT DEFAULT NULL,
  ingredients TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Sales table for tracking daily sales
CREATE TABLE IF NOT EXISTS public.sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sweet_id UUID NOT NULL REFERENCES public.sweets(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
  total_price DECIMAL(10,2) NOT NULL CHECK (total_price >= 0),
  sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Stock History table for tracking inventory changes
CREATE TABLE IF NOT EXISTS public.stock_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sweet_id UUID NOT NULL REFERENCES public.sweets(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('restock', 'adjustment', 'sale')),
  quantity_change INTEGER NOT NULL,
  previous_quantity INTEGER NOT NULL,
  new_quantity INTEGER NOT NULL,
  notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_sweets_category ON public.sweets(category);
CREATE INDEX IF NOT EXISTS idx_sweets_name ON public.sweets(name);
CREATE INDEX IF NOT EXISTS idx_sweets_price ON public.sweets(price);
CREATE INDEX IF NOT EXISTS idx_sales_sweet_id ON public.sales(sweet_id);
CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON public.sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON public.sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_stock_history_sweet_id ON public.stock_history(sweet_id);
CREATE INDEX IF NOT EXISTS idx_stock_history_admin_id ON public.stock_history(admin_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sweets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_history ENABLE ROW LEVEL SECURITY;

-- Create simplified RLS policies for API testing
-- Users table policies
CREATE POLICY "Allow all operations on users" ON public.users
  FOR ALL USING (true) WITH CHECK (true);

-- Sweets table policies  
CREATE POLICY "Allow all operations on sweets" ON public.sweets
  FOR ALL USING (true) WITH CHECK (true);

-- Sales table policies
CREATE POLICY "Allow all operations on sales" ON public.sales
  FOR ALL USING (true) WITH CHECK (true);

-- Stock history table policies
CREATE POLICY "Allow all operations on stock_history" ON public.stock_history
  FOR ALL USING (true) WITH CHECK (true);

-- Insert sample data for testing
INSERT INTO public.users (name, email, role, password) VALUES 
('Admin User', 'admin@sweetshop.com', 'admin', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewGdVZP5y5rHjGOy'), -- password: admin123
('Customer User', 'customer@sweetshop.com', 'customer', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewGdVZP5y5rHjGOy') -- password: customer123
ON CONFLICT (email) DO NOTHING;

INSERT INTO public.sweets (name, category, price, quantity, description) VALUES 
('Milk Chocolate Bar', 'chocolate', 3.99, 50, 'Creamy milk chocolate bar'),
('Dark Chocolate Truffle', 'chocolate', 1.99, 30, 'Rich dark chocolate truffle'),
('Strawberry Gummy Bears', 'gummy', 2.49, 100, 'Sweet strawberry flavored gummy bears'),
('Sour Patch Kids', 'candy', 2.99, 75, 'Sour then sweet candy'),
('Chocolate Chip Cookies', 'dessert', 4.99, 25, 'Homemade chocolate chip cookies'),
('Vanilla Cupcake', 'dessert', 3.49, 40, 'Fluffy vanilla cupcake with frosting'),
('Peppermint Hard Candy', 'hard-candy', 1.49, 80, 'Refreshing peppermint hard candy'),
('Rainbow Lollipop', 'lollipop', 0.99, 120, 'Colorful rainbow flavored lollipop')
ON CONFLICT (name) DO NOTHING;

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_sweets_updated_at 
    BEFORE UPDATE ON public.sweets 
    FOR EACH ROW 
    EXECUTE PROCEDURE update_updated_at_column();

-- Create a view for sweet categories
CREATE OR REPLACE VIEW sweet_categories AS
SELECT 
    category,
    COUNT(*) as total_sweets,
    AVG(price) as average_price,
    SUM(quantity) as total_quantity
FROM public.sweets 
GROUP BY category
ORDER BY category;

-- Create a view for low stock alerts
CREATE OR REPLACE VIEW low_stock_sweets AS
SELECT 
    id,
    name,
    category,
    price,
    quantity,
    description
FROM public.sweets 
WHERE quantity < 10
ORDER BY quantity ASC;

-- Create a view for daily sales analytics
CREATE OR REPLACE VIEW daily_sales AS
SELECT 
    s.sale_date,
    COUNT(*) as total_transactions,
    SUM(s.quantity) as total_items_sold,
    SUM(s.total_price) as total_revenue,
    AVG(s.total_price) as average_order_value
FROM public.sales s
GROUP BY s.sale_date
ORDER BY s.sale_date DESC;

-- Create a view for top selling sweets
CREATE OR REPLACE VIEW top_selling_sweets AS
SELECT 
    sw.id,
    sw.name,
    sw.category,
    sw.price,
    COALESCE(SUM(s.quantity), 0) as total_sold,
    COALESCE(SUM(s.total_price), 0) as total_revenue
FROM public.sweets sw
LEFT JOIN public.sales s ON sw.id = s.sweet_id
GROUP BY sw.id, sw.name, sw.category, sw.price
ORDER BY total_sold DESC;

-- Create a view for monthly revenue
CREATE OR REPLACE VIEW monthly_revenue AS
SELECT 
    DATE_TRUNC('month', sale_date) as month,
    SUM(total_price) as revenue,
    COUNT(*) as transactions,
    SUM(quantity) as items_sold
FROM public.sales
GROUP BY DATE_TRUNC('month', sale_date)
ORDER BY month DESC;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

GRANT SELECT ON public.users TO anon;
GRANT ALL ON public.users TO authenticated;

GRANT SELECT ON public.sweets TO anon;
GRANT ALL ON public.sweets TO authenticated;

GRANT SELECT ON public.sales TO anon;
GRANT ALL ON public.sales TO authenticated;

GRANT SELECT ON public.stock_history TO anon;
GRANT ALL ON public.stock_history TO authenticated;

GRANT SELECT ON sweet_categories TO anon;
GRANT SELECT ON sweet_categories TO authenticated;

GRANT SELECT ON low_stock_sweets TO anon;
GRANT SELECT ON low_stock_sweets TO authenticated;

GRANT SELECT ON daily_sales TO anon;
GRANT SELECT ON daily_sales TO authenticated;

GRANT SELECT ON top_selling_sweets TO anon;
GRANT SELECT ON top_selling_sweets TO authenticated;

GRANT SELECT ON monthly_revenue TO anon;
GRANT SELECT ON monthly_revenue TO authenticated;
