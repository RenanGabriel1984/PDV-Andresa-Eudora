-- Disable RLS for all tables to allow anonymous access
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE sales DISABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items DISABLE ROW LEVEL SECURITY;

-- Alternatively, if you want to keep RLS enabled but allow all operations for anon:
-- CREATE POLICY "Allow all operations for anon" ON clients FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "Allow all operations for anon" ON products FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "Allow all operations for anon" ON sales FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "Allow all operations for anon" ON sale_items FOR ALL USING (true) WITH CHECK (true);
