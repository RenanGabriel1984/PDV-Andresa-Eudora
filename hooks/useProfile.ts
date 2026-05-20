import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface Profile {
  id: string;
  email: string;
  role: 'admin' | 'vendedor';
  created_at: string;
}

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        const user = sessionData.session?.user;
        if (!user) {
          setLoadingProfile(false);
          return;
        }

        // Try to fetch existing profile
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          // If table doesn't exist yet, we will gracefully handle it
          // 42P01 is PostgreSQL code for undefined_table
          if (error.code === '42P01' || error.message.includes('not found') || error.message.includes('does not exist')) {
             setProfileError('TABLE_MISSING');
             // Default to admin so the owner can see the setup instructions
             setProfile({ id: user.id, email: user.email || '', role: 'admin', created_at: new Date().toISOString() });
          } else if (error.code === 'PGRST116') {
             // Profile doesn't exist, let's create it
             // First user is admin, others are vendedor
             const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
             const newRole = count === 0 ? 'admin' : 'vendedor';
             
             const newProfile = {
               id: user.id,
               email: user.email,
               role: newRole,
             };
             
             const { data: inserted, error: insertError } = await supabase
               .from('profiles')
               .insert([newProfile])
               .select()
               .single();
               
             if (insertError) throw insertError;
             setProfile(inserted as Profile);
          } else {
             throw error;
          }
        } else {
          setProfile(data as Profile);
        }
      } catch (err: any) {
        console.error('Error loading profile:', err);
        setProfileError(err.message);
      } finally {
        setLoadingProfile(false);
      }
    }

    loadProfile();
  }, []);

  return { profile, loadingProfile, profileError };
}
