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
 * 알레르기 정보 조회 (RPC 함수 사용 - 캐싱 완전 우회)
 */
export async function getUserAllergies(): Promise<string[]> {
  if (!supabase) {
    return [];
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return [];
  }

  // RPC 함수 사용 (서버 사이드 실행 - 클라이언트 캐싱 우회)
  const { data, error } = await supabase.rpc('get_current_user_profile');

  if (error) {
    console.error('[getUserAllergies] RPC 에러:', error);
    return [];
  }

  const profile = data?.[0];
  console.log('[getUserAllergies] RPC 조회된 프로필:', profile);
  return profile?.allergies || [];
}

/**
 * 알레르기 추가 (RPC 함수 사용 - 캐싱 완전 우회)
 */
export async function addAllergy(allergyName: string): Promise<string[]> {
  console.log('[profileService] addAllergy 시작:', allergyName);

  if (!supabase) {
    console.error('[profileService] Supabase not configured');
    throw new Error('Supabase not configured');
  }

  const trimmed = allergyName.trim();
  if (!trimmed) {
    console.error('[profileService] Empty allergy name');
    throw new Error('Allergy name cannot be empty');
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    console.error('[profileService] 세션 없음');
    throw new Error('로그인이 필요합니다');
  }

  // 프로필이 없으면 자동 생성
  await ensureUserProfile();

  // RPC 함수 호출 (서버 사이드 실행)
  const { data: updatedAllergies, error } = await supabase.rpc('add_user_allergy', {
    allergy_name: trimmed
  });

  if (error) {
    console.error('[profileService] RPC 에러:', error);
    throw new Error(error.message || '알레르기 정보 추가 중 오류가 발생했습니다');
  }

  console.log('[profileService] RPC 성공, 반환값:', updatedAllergies);
  return updatedAllergies || [];
}

/**
 * 알레르기 삭제 (RPC 함수 사용 - 캐싱 완전 우회)
 */
export async function removeAllergy(allergyName: string): Promise<string[]> {
  console.log('[profileService] removeAllergy 시작:', allergyName);

  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('로그인이 필요합니다');
  }

  // RPC 함수 호출 (서버 사이드 실행)
  const { data: updatedAllergies, error } = await supabase.rpc('remove_user_allergy', {
    allergy_name: allergyName
  });

  if (error) {
    console.error('[profileService] RPC 에러:', error);
    throw new Error('알레르기 정보 삭제 중 오류가 발생했습니다');
  }

  console.log('[profileService] RPC 성공, 반환값:', updatedAllergies);
  return updatedAllergies || [];
}

/**
 * 편식 정보 조회 (RPC 함수 사용 - 캐싱 완전 우회)
 */
export async function getUserDietaryPreferences(): Promise<string[]> {
  if (!supabase) {
    return [];
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return [];
  }

  // RPC 함수 사용 (서버 사이드 실행 - 클라이언트 캐싱 우회)
  const { data, error } = await supabase.rpc('get_current_user_profile');

  if (error) {
    console.error('[getUserDietaryPreferences] RPC 에러:', error);
    return [];
  }

  const profile = data?.[0];
  console.log('[getUserDietaryPreferences] RPC 조회된 프로필:', profile);
  return profile?.dietary_preferences || [];
}

/**
 * 편식 추가 (RPC 함수 사용 - 캐싱 완전 우회)
 */
export async function addDietaryPreference(prefName: string): Promise<string[]> {
  console.log('[profileService] addDietaryPreference 시작:', prefName);

  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  const trimmed = prefName.trim();
  if (!trimmed) {
    throw new Error('Dietary preference name cannot be empty');
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('로그인이 필요합니다');
  }

  // 프로필이 없으면 자동 생성
  await ensureUserProfile();

  // RPC 함수 호출 (서버 사이드 실행)
  const { data: updatedPrefs, error } = await supabase.rpc('add_user_dietary_preference', {
    pref_name: trimmed
  });

  if (error) {
    console.error('[profileService] RPC 에러:', error);
    throw new Error(error.message || '편식 정보 추가 중 오류가 발생했습니다');
  }

  console.log('[profileService] RPC 성공, 반환값:', updatedPrefs);
  return updatedPrefs || [];
}

/**
 * 편식 삭제 (RPC 함수 사용 - 캐싱 완전 우회)
 */
export async function removeDietaryPreference(prefName: string): Promise<string[]> {
  console.log('[profileService] removeDietaryPreference 시작:', prefName);

  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('로그인이 필요합니다');
  }

  // RPC 함수 호출 (서버 사이드 실행)
  const { data: updatedPrefs, error } = await supabase.rpc('remove_user_dietary_preference', {
    pref_name: prefName
  });

  if (error) {
    console.error('[profileService] RPC 에러:', error);
    throw new Error('편식 정보 삭제 중 오류가 발생했습니다');
  }

  console.log('[profileService] RPC 성공, 반환값:', updatedPrefs);
  return updatedPrefs || [];
}
