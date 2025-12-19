import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase URL or Key is missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fetchRecipeIds() {
  console.log('📥 Fetching recipe IDs from Supabase...');

  const { data, error } = await supabase
    .from('generated_recipes')
    .select('id')
    .order('id', { ascending: true });

  if (error) {
    console.error('❌ Error fetching recipe IDs:', error);
    process.exit(1);
  }

  const recipeIds = data.map((recipe) => recipe.id);
  console.log(`✅ Found ${recipeIds.length} recipes`);

  // Write to a JSON file for the prerender script
  const fs = require('fs');
  const path = require('path');

  const outputPath = path.join(__dirname, 'recipe-ids.json');
  fs.writeFileSync(outputPath, JSON.stringify(recipeIds, null, 2));
  console.log(`💾 Saved recipe IDs to ${outputPath}`);

  return recipeIds;
}

fetchRecipeIds();
