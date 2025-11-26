-- Fix comments foreign key constraint to allow comments on recipes from any source

-- Drop the existing foreign key constraint
ALTER TABLE public.comments
DROP CONSTRAINT IF EXISTS comments_recipe_id_fkey;

-- Allow recipe_id to be any UUID without foreign key constraint
-- This allows commenting on both generated_recipes and user_recipes
-- Note: We don't add a new foreign key constraint because recipes can come from multiple tables
