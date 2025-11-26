-- Add nickname column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS nickname TEXT;

-- Function to generate random nickname
CREATE OR REPLACE FUNCTION public.generate_random_nickname()
RETURNS TEXT AS $$
DECLARE
  prefixes TEXT[] := ARRAY['냠냠', '맛있는', '요리하는', '먹보', '꿀맛', '든든한', '신나는', '행복한', '즐거운', '건강한'];
  suffixes TEXT[] := ARRAY['요정', '천사', '마법사', '셰프', '왕자', '공주', '달인', '고수', '장인', '대장'];
  random_number TEXT;
  result TEXT;
BEGIN
  random_number := lpad((floor(random() * 10000)::int)::text, 4, '0');
  result := prefixes[1 + floor(random() * array_length(prefixes, 1))] ||
            suffixes[1 + floor(random() * array_length(suffixes, 1))] ||
            random_number;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Update existing profiles without nickname to have random nickname
UPDATE public.profiles
SET nickname = generate_random_nickname()
WHERE nickname IS NULL OR nickname = '';

-- Trigger function to auto-generate nickname on profile creation
CREATE OR REPLACE FUNCTION public.auto_generate_nickname()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.nickname IS NULL OR NEW.nickname = '' THEN
    NEW.nickname := generate_random_nickname();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new profiles
DROP TRIGGER IF EXISTS trigger_auto_generate_nickname ON public.profiles;
CREATE TRIGGER trigger_auto_generate_nickname
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_nickname();
