-- ==============================================================================
-- RESOLUÇÃO DO ALERTA DE SEGURANÇA E CRIAÇÃO DE ROLES (NÍVEIS DE ACESSO)
-- ==============================================================================

-- 1. RESOLVER O AVISO "Table publicly accessible" (Habilitar RLS)
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;

-- Limpar políticas antigas
DROP POLICY IF EXISTS "Allow all operations for everyone" ON clients;
DROP POLICY IF EXISTS "Allow all operations for everyone" ON products;
DROP POLICY IF EXISTS "Allow all operations for everyone" ON sales;
DROP POLICY IF EXISTS "Allow all operations for everyone" ON sale_items;

-- Criar políticas permitindo acesso apenas para quem fez Login (Authenticated)
CREATE POLICY "Permitir tudo para autenticados" ON clients FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir tudo para autenticados" ON products FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir tudo para autenticados" ON sales FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir tudo para autenticados" ON sale_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ==============================================================================

-- 2. CRIAR A ESTRUTURA PARA NÍVEIS DE ACESSO (SEM PERDER SEUS DADOS)
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'revendedor')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ativar segurança na nova tabela
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Todo usuário pode ler seu próprio perfil de acesso
CREATE POLICY "Usuários leem próprio perfil" ON user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Opcional (Se futuramente você quiser travar as tabelas também via Banco de Dados):
-- Exemplo de como garantir que apenas 'admin' exclua produtos. Em vez da política acima "Permitir tudo".
-- CREATE POLICY "Apenas admin deleta" ON products FOR DELETE TO authenticated USING ((SELECT role FROM user_roles WHERE user_id = auth.uid()) = 'admin');
