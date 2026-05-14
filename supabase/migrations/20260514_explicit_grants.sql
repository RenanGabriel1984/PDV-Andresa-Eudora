-- Garante acessos explícitos as tabelas atuais para que a API consiga manipulá-las sem RLS
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clients TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clients TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clients TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sale_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sale_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sale_items TO service_role;

-- Além disso, aplica esta mesma regra para qualquer NOVA tabela que for criada futuramente
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO service_role;
