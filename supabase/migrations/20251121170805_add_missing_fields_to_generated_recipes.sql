/*
  # Add missing fields to generated_recipes table

  1. Changes
    - Add `description` column to store recipe summary
    - Add `meta` jsonb column to store recipe metadata (difficulty, cooking_time_min, calories_per_serving, etc.)
    
  2. Purpose
    - Ensure all recipe data from Gemini API can be properly stored
    - Prevent NULL content by having proper fields for all data
*/

-- Add description column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'generated_recipes' AND column_name = 'description'
  ) THEN
    ALTER TABLE generated_recipes ADD COLUMN description text;
  END IF;
END $$;

-- Add meta column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'generated_recipes' AND column_name = 'meta'
  ) THEN
    ALTER TABLE generated_recipes ADD COLUMN meta jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;
