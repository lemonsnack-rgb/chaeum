/*
  # Add missing fields to generated_recipes table

  1. Changes
    - Add individual columns for recipe metadata (difficulty, cooking_time_min, calories_per_serving, calorie_signal, cooking_time)
    - Add content jsonb column to store full recipe data

  2. Purpose
    - Ensure all recipe data from Gemini API can be properly stored
    - Allow efficient querying on key fields like calories and difficulty
*/

-- Add difficulty column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'generated_recipes' AND column_name = 'difficulty'
  ) THEN
    ALTER TABLE generated_recipes ADD COLUMN difficulty text DEFAULT '중급';
  END IF;
END $$;

-- Add cooking_time_min column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'generated_recipes' AND column_name = 'cooking_time_min'
  ) THEN
    ALTER TABLE generated_recipes ADD COLUMN cooking_time_min integer DEFAULT 30;
  END IF;
END $$;

-- Add cooking_time column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'generated_recipes' AND column_name = 'cooking_time'
  ) THEN
    ALTER TABLE generated_recipes ADD COLUMN cooking_time text DEFAULT '30분';
  END IF;
END $$;

-- Add calories_per_serving column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'generated_recipes' AND column_name = 'calories_per_serving'
  ) THEN
    ALTER TABLE generated_recipes ADD COLUMN calories_per_serving integer DEFAULT 0;
  END IF;
END $$;

-- Add calorie_signal column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'generated_recipes' AND column_name = 'calorie_signal'
  ) THEN
    ALTER TABLE generated_recipes ADD COLUMN calorie_signal text DEFAULT '🟢';
  END IF;
END $$;

-- Add content column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'generated_recipes' AND column_name = 'content'
  ) THEN
    ALTER TABLE generated_recipes ADD COLUMN content jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;
