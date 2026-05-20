import { supabase } from '@/lib/supabase';

export interface Profile {
  id: string;
  email: string;
  role: 'admin' | 'vendedor';
  created_at?: string;
}

export const api = {
  // Profiles
  async getProfiles(): Promise<Profile[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.warn("Profiles table might not exist or permission denied. Returning mock/blank.", error);
        return [];
      }
      return data as Profile[];
    } catch (e) {
      console.error(e);
      return [];
    }
  },
  
  async updateProfileRole(id: string, role: "admin" | "vendedor"): Promise<void> {
    const { error } = await supabase
      .from("profiles")
      .update({ role })
      .eq("id", id);
    if (error) throw error;
  },
  
  // Safe mock abstractions for generic items (Estoque, Vendas, etc) 
  // to ensure UI renders properly if DB schema is different
  async ping() {
    return true;
  }
};
