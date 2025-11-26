-- Fix recipe_views foreign key constraint to allow viewing recipes from any source

-- Drop the existing foreign key constraint
ALTER TABLE public.recipe_views
DROP CONSTRAINT IF EXISTS recipe_views_recipe_id_fkey;

-- Allow recipe_id to be any UUID without foreign key constraint
-- This allows viewing both generated_recipes and user_recipes
-- Note: We don't add a new foreign key constraint because recipes can come from multiple tables

-- Optional: Add a check to ensure recipe exists in either table
-- (Commented out as it may cause performance issues)
-- CREATE OR REPLACE FUNCTION check_recipe_exists()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   IF NOT EXISTS (
--     SELECT 1 FROM generated_recipes WHERE id = NEW.recipe_id
--     UNION
--     SELECT 1 FROM user_recipes WHERE id = NEW.recipe_id
--   ) THEN
--     RAISE EXCEPTION 'Recipe does not exist';
--   END IF;
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;
--
-- CREATE TRIGGER ensure_recipe_exists
--   BEFORE INSERT OR UPDATE ON recipe_views
--   FOR EACH ROW
--   EXECUTE FUNCTION check_recipe_exists();
