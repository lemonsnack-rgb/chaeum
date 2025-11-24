/*
  # Add user_id column to generated_recipes table

  1. Changes
    - Add user_id column (UUID type, nullable to allow anonymous recipes)

  2. Purpose
    - Track which user created each recipe
    - Allow both authenticated and anonymous recipe creation
*/

-- Add user_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'generated_recipes' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE generated_recipes ADD COLUMN user_id uuid;
  END IF;
END $$;

-- Create index for faster queries by user_id
CREATE INDEX IF NOT EXISTS idx_generated_recipes_user_id ON generated_recipes(user_id);
