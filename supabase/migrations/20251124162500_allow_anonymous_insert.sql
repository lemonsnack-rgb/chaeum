/*
  # Allow anonymous users to insert recipes

  1. Changes
    - Drop existing INSERT policy if exists
    - Create new policy that allows both authenticated and anonymous users to insert

  2. Purpose
    - Enable anonymous users to generate and save recipes to build the database
    - Maintain security while allowing public contributions
*/

-- Drop existing insert policy if it exists
DROP POLICY IF EXISTS "Users can insert their own recipes" ON generated_recipes;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON generated_recipes;
DROP POLICY IF EXISTS "Enable insert for users based on user_id" ON generated_recipes;

-- Create new policy that allows anyone (authenticated or anonymous) to insert
CREATE POLICY "Allow all inserts for recipe generation"
ON generated_recipes
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Keep existing SELECT policy for public access
DROP POLICY IF EXISTS "Enable read access for all users" ON generated_recipes;
CREATE POLICY "Enable read access for all users"
ON generated_recipes
FOR SELECT
TO anon, authenticated
USING (true);

-- Keep UPDATE policy for authenticated users only
DROP POLICY IF EXISTS "Users can update their own recipes" ON generated_recipes;
CREATE POLICY "Users can update their own recipes"
ON generated_recipes
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Keep DELETE policy for authenticated users only
DROP POLICY IF EXISTS "Users can delete their own recipes" ON generated_recipes;
CREATE POLICY "Users can delete their own recipes"
ON generated_recipes
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
