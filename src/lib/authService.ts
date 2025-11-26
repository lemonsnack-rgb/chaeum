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

export async function getMyBookmarkedRecipes() {
  if (!supabase) {
    return [];
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return [];
  }

  const { data, error } = await supabase
    .from('user_recipes')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching bookmarked recipes:', error);
    return [];
  }

  // Convert to Recipe format
  return (data || []).map((dbRecipe: any) => ({
    id: dbRecipe.id,
    title: dbRecipe.title,
    description: '',
    main_ingredients: dbRecipe.main_ingredients || [],
    theme_tags: dbRecipe.theme_tags || [],
    ingredients_detail: dbRecipe.ingredients_detail || [],
    instructions: dbRecipe.instructions || [],
    meta: {},
    nutrition: dbRecipe.nutrition || { calories: 0, protein: 0, fat: 0, carbohydrates: 0 },
    deep_info: dbRecipe.deep_info || {},
    cooking_time: dbRecipe.cooking_time || 30,
    servings: dbRecipe.servings || 2,
    created_at: dbRecipe.created_at,
  }));
}

export async function isRecipeBookmarked(recipeId: string): Promise<boolean> {
  if (!supabase) {
    return false;
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return false;
  }

  console.log('[isRecipeBookmarked] 체크 시작:', recipeId);

  // Check in user_recipes table using original_recipe_id
  const { data: userRecipe, error: userRecipeError } = await supabase
    .from('user_recipes')
    .select('id, original_recipe_id')
    .eq('original_recipe_id', recipeId)
    .eq('user_id', session.user.id)
    .maybeSingle();

  console.log('[isRecipeBookmarked] original_recipe_id 체크:', { userRecipe, userRecipeError });

  if (!userRecipeError && userRecipe) {
    console.log('[isRecipeBookmarked] ✓ original_recipe_id로 찾음');
    return true;
  }

  // Also check if the recipe itself is from user_recipes (already saved)
  const { data: savedRecipe, error: savedRecipeError } = await supabase
    .from('user_recipes')
    .select('id, original_recipe_id')
    .eq('id', recipeId)
    .eq('user_id', session.user.id)
    .maybeSingle();

  console.log('[isRecipeBookmarked] id 체크:', { savedRecipe, savedRecipeError });

  if (!savedRecipeError && savedRecipe) {
    console.log('[isRecipeBookmarked] ✓ id로 찾음');
    return true;
  }

  console.log('[isRecipeBookmarked] ✗ 저장되지 않음');
  return false;
}
