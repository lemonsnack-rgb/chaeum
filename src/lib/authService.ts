import { supabase } from './supabase';

export async function signInWithMagicLink(email: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: window.location.origin,
    },
  });

  if (error) {
    throw error;
  }
}

export async function signOut(): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}

export async function getCurrentUser() {
  if (!supabase) {
    return null;
  }

  const { data: { session } } = await supabase.auth.getSession();
  return session?.user || null;
}

export async function getUserProfile() {
  if (!supabase) {
    return null;
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .maybeSingle();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  if (!data) {
    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert([{
        id: session.user.id,
        allergies: [],
        dietary_preferences: [],
      }])
      .select()
      .single();

    if (insertError) {
      console.error('Error creating profile:', insertError);
      return null;
    }

    return newProfile;
  }

  return data;
}

export async function updateUserProfile(updates: {
  allergies?: string[];
  dietary_preferences?: string[];
}): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('User must be logged in');
  }

  const { error } = await supabase
    .from('profiles')
    .upsert({
      id: session.user.id,
      ...updates,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    throw error;
  }
}
