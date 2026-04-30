import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';
import { join } from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

const SITE_URL = 'https://www.oneulfridge.com';

interface SitemapUrl {
  loc: string;
  lastmod: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
}

/**
 * sitemap.xml 생성 함수
 */
async function generateSitemap() {
  console.log('🚀 Sitemap 생성 시작...\n');

  const urls: SitemapUrl[] = [];

  // 1. 정적 페이지 추가
  console.log('📄 정적 페이지 추가 중...');
  urls.push({
    loc: SITE_URL,
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'daily',
    priority: 1.0,
  });

  urls.push({
    loc: `${SITE_URL}/?tab=search`,
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'daily',
    priority: 0.9,
  });

  urls.push({
    loc: `${SITE_URL}/?tab=recipes`,
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'daily',
    priority: 0.8,
  });

  console.log(`  ✅ 정적 페이지 ${urls.length}개 추가\n`);

  if (!supabase) {
    console.warn('⚠️ Supabase 환경 변수가 없어 정적 URL만 포함한 sitemap을 생성합니다.');
    writeSitemap(urls);
    return;
  }

  // 2. 데이터베이스에서 모든 레시피 가져오기 (페이지네이션)
  console.log('🍳 레시피 데이터 가져오는 중...');

  let allRecipes: any[] = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data: recipes, error } = await supabase
      .from('generated_recipes')
      .select('id, created_at')
      .order('created_at', { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) {
      console.error('❌ 레시피 데이터 가져오기 실패:', error);
      process.exit(1);
    }

    if (!recipes || recipes.length === 0) {
      hasMore = false;
    } else {
      allRecipes = allRecipes.concat(recipes);
      console.log(`  📄 페이지 ${page + 1}: ${recipes.length}개 (누적: ${allRecipes.length}개)`);
      page++;
      hasMore = recipes.length === pageSize;
    }
  }

  if (allRecipes.length === 0) {
    console.warn('⚠️ 레시피가 없습니다. 정적 페이지만 sitemap에 포함됩니다.');
  } else {
    console.log(`  ✅ 총 ${allRecipes.length}개 레시피 발견\n`);

    // 3. 레시피 페이지 URL 추가
    console.log('📝 레시피 URL 생성 중...');
    for (const recipe of allRecipes) {
      urls.push({
        loc: `${SITE_URL}/recipe/${recipe.id}`,
        lastmod: new Date(recipe.created_at).toISOString().split('T')[0],
        changefreq: 'weekly',
        priority: 0.7,
      });
    }
    console.log(`  ✅ 레시피 URL ${allRecipes.length}개 추가\n`);
  }

  writeSitemap(urls);
}

function writeSitemap(urls: SitemapUrl[]) {
  // 4. sitemap.xml 생성
  console.log('🔨 sitemap.xml 파일 생성 중...');
  const xml = generateSitemapXml(urls);

  // 5. public 디렉토리에 저장
  const outputPath = join(process.cwd(), 'public', 'sitemap.xml');
  writeFileSync(outputPath, xml, 'utf-8');

  console.log(`✅ Sitemap 생성 완료!`);
  console.log(`📁 저장 위치: ${outputPath}`);
  console.log(`📊 총 URL 개수: ${urls.length}`);
  console.log(`  - 정적 페이지: 3개`);
  console.log(`  - 레시피 페이지: ${urls.length - 3}개\n`);
  console.log(`🌐 배포 후 접근 가능한 URL: ${SITE_URL}/sitemap.xml\n`);
}

/**
 * sitemap.xml XML 문자열 생성
 */
function generateSitemapXml(urls: SitemapUrl[]): string {
  const urlEntries = urls
    .map(
      (url) => `
  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`
    )
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urlEntries}
</urlset>`;
}

// 스크립트 실행
generateSitemap()
  .then(() => {
    console.log('✅ 완료!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  });
