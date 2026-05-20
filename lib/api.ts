import { supabase } from '@/lib/supabase';

export interface Profile {
  id: string;
  email: string;
  role: 'admin' | 'vendedor';
  created_at?: string;
}

export const api = {
  // Profiles
  async getProfiles(): Promise<{data: Profile[], error: string | null}> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      return { data: data as Profile[] || [], error: error?.message || null };
    } catch (e: any) {
      return { data: [], error: e.message };
    }
  },
  
  async updateProfileRole(id: string, role: "admin" | "vendedor") {
    const { error } = await supabase
      .from("profiles")
      .update({ role })
      .eq("id", id);
    if (error) throw error;
  },
  
  // Vendas
  async getVendas(): Promise<{data: any[], error: string | null}> {
    try {
      const { data, error } = await supabase.from('vendas').select('*').order('created_at', { ascending: false }).limit(50);
      return { data: data || [], error: error?.message || null };
    } catch (e: any) {
      return { data: [], error: e.message };
    }
  },

  // Estoque (Produtos)
  async getProdutos(): Promise<{data: any[], error: string | null}> {
    try {
      const { data, error } = await supabase.from('produtos').select('*').order('created_at', { ascending: false }).limit(50);
      return { data: data || [], error: error?.message || null };
    } catch (e: any) {
      return { data: [], error: e.message };
    }
  },

  // Clientes
  async getClientes(): Promise<{data: any[], error: string | null}> {
    try {
      const { data, error } = await supabase.from('clientes').select('*').order('created_at', { ascending: false }).limit(50);
      return { data: data || [], error: error?.message || null };
    } catch (e: any) {
      return { data: [], error: e.message };
    }
  }
};
