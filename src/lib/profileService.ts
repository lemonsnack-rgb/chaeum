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

  // 프로필이 없으면 자동 생성
  console.log('[profileService] ensureUserProfile 호출');
  await ensureUserProfile();
  console.log('[profileService] ensureUserProfile 완료');

  console.log('[profileService] getUserProfile 호출');
  const profile = await getUserProfile();
  console.log('[profileService] 프로필 조회 결과:', profile);

  if (!profile) {
    console.error('[profileService] 프로필 조회 실패');
    throw new Error('Failed to create or retrieve user profile');
  }

  const currentAllergies = profile.allergies || [];
  console.log('[profileService] 현재 알레르기:', currentAllergies);

  if (currentAllergies.includes(trimmed)) {
    console.warn('[profileService] 중복된 알레르기:', trimmed);
    throw new Error('이미 등록된 알레르기입니다');
  }

  const updatedAllergies = [...currentAllergies, trimmed];
  console.log('[profileService] 업데이트할 알레르기:', updatedAllergies);

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    console.error('[profileService] 세션 없음');
    throw new Error('로그인이 필요합니다');
  }
  console.log('[profileService] 세션 확인됨:', session.user.id);

  console.log('[profileService] profiles 테이블 업데이트 시도');
  const { error } = await supabase
    .from('profiles')
    .update({ allergies: updatedAllergies })
    .eq('id', session.user.id);

  if (error) {
    console.error('[profileService] 업데이트 에러:', error);
    throw new Error('알레르기 정보 추가 중 오류가 발생했습니다');
  }

  console.log('[profileService] addAllergy 완료');
}

/**
 * 알레르기 삭제
 */
export async function removeAllergy(allergyName: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  // 프로필이 없으면 자동 생성
  await ensureUserProfile();

  const profile = await getUserProfile();
  if (!profile) {
    throw new Error('Failed to create or retrieve user profile');
  }

  const updatedAllergies = (profile.allergies || []).filter(
    (a) => a !== allergyName
  );

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('로그인이 필요합니다');
  }

  const { error } = await supabase
    .from('profiles')
    .update({ allergies: updatedAllergies })
    .eq('id', session.user.id);

  if (error) {
    console.error('Error removing allergy:', error);
    throw new Error('알레르기 정보 삭제 중 오류가 발생했습니다');
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

  // 프로필이 없으면 자동 생성
  await ensureUserProfile();

  const profile = await getUserProfile();
  if (!profile) {
    throw new Error('Failed to create or retrieve user profile');
  }

  const currentPrefs = profile.dietary_preferences || [];
  if (currentPrefs.includes(trimmed)) {
    throw new Error('이미 등록된 편식 정보입니다');
  }

  const updatedPrefs = [...currentPrefs, trimmed];

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('로그인이 필요합니다');
  }

  const { error } = await supabase
    .from('profiles')
    .update({ dietary_preferences: updatedPrefs })
    .eq('id', session.user.id);

  if (error) {
    console.error('Error adding dietary preference:', error);
    throw new Error('편식 정보 추가 중 오류가 발생했습니다');
  }
}

/**
 * 편식 삭제
 */
export async function removeDietaryPreference(prefName: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  // 프로필이 없으면 자동 생성
  await ensureUserProfile();

  const profile = await getUserProfile();
  if (!profile) {
    throw new Error('Failed to create or retrieve user profile');
  }

  const updatedPrefs = (profile.dietary_preferences || []).filter(
    (p) => p !== prefName
  );

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('로그인이 필요합니다');
  }

  const { error } = await supabase
    .from('profiles')
    .update({ dietary_preferences: updatedPrefs })
    .eq('id', session.user.id);

  if (error) {
    console.error('Error removing dietary preference:', error);
    throw new Error('편식 정보 삭제 중 오류가 발생했습니다');
  }
}
