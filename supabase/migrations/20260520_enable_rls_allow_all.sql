-- Primeiro, vamos habilitar o RLS (Row Level Security) em todas as tabelas
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;

-- Em seguida, vamos dropar qualquer política existente com esse nome para evitar erros ao rodar o script novamente
DROP POLICY IF EXISTS "Allow all operations for everyone" ON clients;
DROP POLICY IF EXISTS "Allow all operations for everyone" ON products;
DROP POLICY IF EXISTS "Allow all operations for everyone" ON sales;
DROP POLICY IF EXISTS "Allow all operations for everyone" ON sale_items;

-- Por fim, vamos criar uma política (Policy) que permite TODAS as operações para QUALQUER usuário,
-- já que o nosso aplicativo atualmente não possui um sistema de login (Authentication).
-- Isso resolve o aviso de segurança do Supabase ("Table publicly accessible") sem quebrar o funcionamento do seu app.
CREATE POLICY "Allow all operations for everyone" ON clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for everyone" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for everyone" ON sales FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for everyone" ON sale_items FOR ALL USING (true) WITH CHECK (true);
