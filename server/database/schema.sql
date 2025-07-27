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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_sweets_category ON public.sweets(category);
CREATE INDEX IF NOT EXISTS idx_sweets_name ON public.sweets(name);
CREATE INDEX IF NOT EXISTS idx_sweets_price ON public.sweets(price);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sweets ENABLE ROW LEVEL SECURITY;

-- Create simplified RLS policies for API testing
-- Users table policies
CREATE POLICY "Allow all operations on users" ON public.users
  FOR ALL USING (true) WITH CHECK (true);

-- Sweets table policies  
CREATE POLICY "Allow all operations on sweets" ON public.sweets
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

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

GRANT SELECT ON public.users TO anon;
GRANT ALL ON public.users TO authenticated;

GRANT SELECT ON public.sweets TO anon;
GRANT ALL ON public.sweets TO authenticated;

GRANT SELECT ON sweet_categories TO anon;
GRANT SELECT ON sweet_categories TO authenticated;

GRANT SELECT ON low_stock_sweets TO anon;
GRANT SELECT ON low_stock_sweets TO authenticated;
