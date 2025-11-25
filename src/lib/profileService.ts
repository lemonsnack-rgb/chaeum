import { supabase } from './supabase';

export interface UserProfile {
  id: string;
  email: string;
  allergies: string[];
  dietary_preferences: string[];
  created_at: string;
  updated_at: string;
}

/**
 * 현재 로그인한 사용자의 프로필 조회
 */
export async function getUserProfile(): Promise<UserProfile | null> {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return null;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .maybeSingle();

  if (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }

  return data;
}

/**
 * 사용자 프로필 생성 또는 업데이트 (upsert)
 */
export async function ensureUserProfile(): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('User not authenticated');
  }

  const { error } = await supabase
    .from('profiles')
    .upsert({
      id: session.user.id,
      email: session.user.email,
      allergies: [],
      dietary_preferences: [],
    }, {
      onConflict: 'id',
      ignoreDuplicates: false,
    });

  if (error) {
    console.error('Error ensuring user profile:', error);
    throw error;
  }
}

/**
 * 알레르기 정보 조회
 */
export async function getUserAllergies(): Promise<string[]> {
  const profile = await getUserProfile();
  return profile?.allergies || [];
}

/**
 * 알레르기 추가
 */
export async function addAllergy(allergyName: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  const trimmed = allergyName.trim();
  if (!trimmed) {
    throw new Error('Allergy name cannot be empty');
  }

  const profile = await getUserProfile();
  if (!profile) {
    throw new Error('User profile not found');
  }

  const currentAllergies = profile.allergies || [];
  if (currentAllergies.includes(trimmed)) {
    throw new Error('This allergy is already registered');
  }

  const updatedAllergies = [...currentAllergies, trimmed];

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('User not authenticated');
  }

  const { error } = await supabase
    .from('profiles')
    .update({ allergies: updatedAllergies })
    .eq('id', session.user.id);

  if (error) {
    console.error('Error adding allergy:', error);
    throw error;
  }
}

/**
 * 알레르기 삭제
 */
export async function removeAllergy(allergyName: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  const profile = await getUserProfile();
  if (!profile) {
    throw new Error('User profile not found');
  }

  const updatedAllergies = (profile.allergies || []).filter(
    (a) => a !== allergyName
  );

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('User not authenticated');
  }

  const { error } = await supabase
    .from('profiles')
    .update({ allergies: updatedAllergies })
    .eq('id', session.user.id);

  if (error) {
    console.error('Error removing allergy:', error);
    throw error;
  }
}

/**
 * 편식 정보 조회
 */
export async function getUserDietaryPreferences(): Promise<string[]> {
  const profile = await getUserProfile();
  return profile?.dietary_preferences || [];
}

/**
 * 편식 추가
 */
export async function addDietaryPreference(prefName: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  const trimmed = prefName.trim();
  if (!trimmed) {
    throw new Error('Dietary preference name cannot be empty');
  }

  const profile = await getUserProfile();
  if (!profile) {
    throw new Error('User profile not found');
  }

  const currentPrefs = profile.dietary_preferences || [];
  if (currentPrefs.includes(trimmed)) {
    throw new Error('This dietary preference is already registered');
  }

  const updatedPrefs = [...currentPrefs, trimmed];

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('User not authenticated');
  }

  const { error } = await supabase
    .from('profiles')
    .update({ dietary_preferences: updatedPrefs })
    .eq('id', session.user.id);

  if (error) {
    console.error('Error adding dietary preference:', error);
    throw error;
  }
}

/**
 * 편식 삭제
 */
export async function removeDietaryPreference(prefName: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  const profile = await getUserProfile();
  if (!profile) {
    throw new Error('User profile not found');
  }

  const updatedPrefs = (profile.dietary_preferences || []).filter(
    (p) => p !== prefName
  );

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('User not authenticated');
  }

  const { error } = await supabase
    .from('profiles')
    .update({ dietary_preferences: updatedPrefs })
    .eq('id', session.user.id);

  if (error) {
    console.error('Error removing dietary preference:', error);
    throw error;
  }
}
