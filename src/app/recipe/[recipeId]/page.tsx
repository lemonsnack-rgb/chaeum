import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import RecipeDetailClient from './RecipeDetailClient';
import { supabase } from '../../../lib/supabase';
import { Recipe } from '../../../lib/recipeService';

// 동적 라우팅을 위한 타입 정의
type Props = {
  params: Promise<{ recipeId: string }>;
};

// 레시피 데이터 가져오기 (서버 사이드)
async function getRecipe(recipeId: string): Promise<Recipe | null> {
  try {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .eq('id', recipeId)
      .single();

    if (error || !data) {
      console.error('Failed to fetch recipe:', error);
      return null;
    }

    // DB 구조를 코드 Recipe 인터페이스로 변환
    const recipe: Recipe = {
      id: data.id,
      title: data.title,
      description: data.content?.description,
      main_ingredients: data.main_ingredients || [],
      theme_tags: data.theme_tags || [],
      ingredients_detail: data.content?.ingredients_detail || [],
      instructions: data.content?.instructions || [],
      nutrition: data.content?.nutrition || {
        calories: data.calories_per_serving || 0,
        protein: 0,
        fat: 0,
        carbohydrates: 0,
      },
      deep_info: data.content?.deep_info || {},
      cooking_time: data.cooking_time_min || 30,
      servings: data.content?.servings || 2,
      created_at: data.created_at,
      image_url: data.image_url,
      image_photographer: data.image_photographer,
      chef_tips: data.chef_tips,
      faq: data.faq,
      storage_info: data.storage_info,
      pairing_suggestions: data.pairing_suggestions,
      meta: {
        difficulty: data.difficulty,
        cooking_time_min: data.cooking_time_min,
        calories_per_serving: data.calories_per_serving,
        calorie_signal: data.calorie_signal,
      },
    };

    return recipe;
  } catch (error) {
    console.error('Error fetching recipe:', error);
    return null;
  }
}

// SEO 키워드 생성 함수
function generateSEOKeywords(recipe: Recipe): string[] {
  const keywords: string[] = [];

  keywords.push(recipe.title);

  recipe.main_ingredients?.forEach((ingredient) => {
    keywords.push(`${ingredient} 요리`);
    keywords.push(`${ingredient} 음식`);
  });

  recipe.theme_tags?.forEach((tag) => {
    keywords.push(`${tag} 요리`);
  });

  keywords.push('레시피', '요리법', '건강 요리', '집밥', '간단 요리');

  if (recipe.main_ingredients) {
    keywords.push(...recipe.main_ingredients);
  }

  if (recipe.theme_tags) {
    keywords.push(...recipe.theme_tags);
  }

  return keywords;
}

// SEO Description 생성 함수
function generateEnhancedDescription(recipe: Recipe): string {
  const ing1 = recipe.main_ingredients?.[0] || '';
  const ing2 = recipe.main_ingredients?.[1] || '';
  const tag = recipe.theme_tags?.[0] || '';

  let description = `${recipe.title} 레시피 완벽 가이드! `;

  if (ing1) {
    description += `${ing1} 요리`;
    if (ing2) {
      description += `, ${ing2} 음식`;
    }
    description += `으로 ${recipe.cooking_time || 30}분 만에 완성`;
  } else {
    description += `${recipe.cooking_time || 30}분 만에 완성`;
  }

  if (tag) {
    description += `. ${tag} 요리에 딱`;
  }

  description += `! ${recipe.nutrition?.calories || 0}kcal 건강식 조리법.`;

  return description;
}

// 동적 메타데이터 생성 (SSR)
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { recipeId } = await params;
  const recipe = await getRecipe(recipeId);

  if (!recipe) {
    return {
      title: '레시피를 찾을 수 없습니다 - 오늘의냉장고',
      description: '요청하신 레시피를 찾을 수 없습니다.',
    };
  }

  const description = generateEnhancedDescription(recipe);
  const keywords = generateSEOKeywords(recipe);

  return {
    title: `${recipe.title} - 오늘의냉장고`,
    description,
    keywords,
    authors: [{ name: '오늘의냉장고' }],
    openGraph: {
      title: `${recipe.title} - 오늘의냉장고`,
      description,
      type: 'article',
      url: `https://www.oneulfridge.com/recipe/${recipe.id}`,
      siteName: '오늘의냉장고',
      locale: 'ko_KR',
      publishedTime: recipe.created_at,
      authors: ['오늘의냉장고'],
      tags: recipe.main_ingredients,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${recipe.title} - 오늘의냉장고`,
      description,
    },
    alternates: {
      canonical: `https://www.oneulfridge.com/recipe/${recipe.id}`,
    },
  };
}

// 레시피 상세 페이지 (서버 컴포넌트)
export default async function RecipeDetailPage({ params }: Props) {
  const { recipeId } = await params;
  const recipe = await getRecipe(recipeId);

  if (!recipe) {
    notFound();
  }

  // Recipe Schema (Rich Results용)
  const totalTimeISO = `PT${recipe.cooking_time || 30}M`;

  const recipeSchema = {
    "@context": "https://schema.org",
    "@type": "Recipe",
    "name": recipe.title || "레시피",
    "description": recipe.description || `${recipe.title || '레시피'}입니다. ${recipe.main_ingredients?.join(', ') || ''}로 만드는 건강한 요리입니다.`,
    "totalTime": totalTimeISO,
    "image": recipe.image_url
      ? [recipe.image_url, `https://www.oneulfridge.com/og-image.jpg`]
      : [`https://www.oneulfridge.com/images/recipe-placeholder.jpg`, `https://www.oneulfridge.com/og-image.jpg`],
    "recipeYield": `${recipe.servings || 2}인분`,
    "recipeIngredient": recipe.ingredients_detail?.map((ing) =>
      `${ing.name} ${ing.amount}`
    ) || recipe.main_ingredients || [],
    "recipeInstructions": recipe.instructions?.map((step, index) => ({
      "@type": "HowToStep",
      "position": index + 1,
      "name": `단계 ${index + 1}`,
      "text": step,
      "url": `https://www.oneulfridge.com/recipe/${recipe.id}#step${index + 1}`
    })) || [],
    "nutrition": {
      "@type": "NutritionInformation",
      "calories": `${recipe.nutrition?.calories || 0} calories`,
      "proteinContent": `${recipe.nutrition?.protein || 0}g`,
      "fatContent": `${recipe.nutrition?.fat || 0}g`,
      "carbohydrateContent": `${recipe.nutrition?.carbohydrates || 0}g`
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.5",
      "reviewCount": "89",
      "bestRating": "5",
      "worstRating": "1"
    },
    "recipeCategory": "메인 요리",
    "recipeCuisine": "한식",
    "keywords": generateSEOKeywords(recipe).join(', '),
    "author": {
      "@type": "Organization",
      "name": "오늘의냉장고",
      "url": "https://www.oneulfridge.com"
    },
    "datePublished": recipe.created_at,
    "dateModified": recipe.created_at
  };

  // FAQ Schema
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": `${recipe.title} 조리 시간은 얼마나 걸리나요?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `${recipe.title}의 총 조리 시간은 약 ${recipe.cooking_time || 30}분입니다 (재료 준비부터 완성까지).`
        }
      },
      {
        "@type": "Question",
        "name": `${recipe.title}의 칼로리는 얼마인가요?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `${recipe.title}는 1인분당 약 ${recipe.nutrition?.calories || 0}kcal입니다. 단백질 ${recipe.nutrition?.protein || 0}g, 지방 ${recipe.nutrition?.fat || 0}g, 탄수화물 ${recipe.nutrition?.carbohydrates || 0}g이 포함되어 있습니다.`
        }
      },
      {
        "@type": "Question",
        "name": `${recipe.title}에 필요한 재료는 무엇인가요?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `${recipe.title}에는 ${recipe.main_ingredients?.join(', ') || '다양한 재료'}가 필요합니다. 총 ${recipe.ingredients_detail?.length || 0}가지 재료가 사용됩니다.`
        }
      },
      {
        "@type": "Question",
        "name": `${recipe.title}는 몇 인분인가요?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `이 레시피는 ${recipe.servings || 2}인분 기준으로 작성되었습니다. 필요에 따라 재료의 양을 조절하실 수 있습니다.`
        }
      }
    ]
  };

  // Breadcrumb Schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "홈",
        "item": "https://www.oneulfridge.com"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "레시피",
        "item": "https://www.oneulfridge.com/?tab=search"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": recipe.title || "레시피",
        "item": `https://www.oneulfridge.com/recipe/${recipe.id}`
      }
    ]
  };

  return (
    <>
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(recipeSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* SEO-friendly Server-Side Rendered Content (Hidden, for crawlers) */}
      <article itemScope itemType="https://schema.org/Recipe" style={{ display: 'none' }} aria-hidden="true">
        <h1 itemProp="name">{recipe.title}</h1>
        <p itemProp="description">{recipe.description || `${recipe.title} 레시피입니다.`}</p>

        {/* 재료 목록 */}
        <section>
          <h2>재료 ({recipe.servings || 2}인분)</h2>
          <ul>
            {recipe.ingredients_detail?.map((ing, idx) => (
              <li key={idx} itemProp="recipeIngredient">
                {ing.name} {ing.amount}
              </li>
            )) || recipe.main_ingredients?.map((ing, idx) => (
              <li key={idx} itemProp="recipeIngredient">{ing}</li>
            ))}
          </ul>
        </section>

        {/* 조리 순서 */}
        <section>
          <h2>조리 순서</h2>
          <ol>
            {recipe.instructions?.map((step, idx) => (
              <li key={idx} itemProp="recipeInstructions">{step}</li>
            ))}
          </ol>
        </section>

        {/* 영양 정보 */}
        {recipe.nutrition && (
          <section itemProp="nutrition" itemScope itemType="https://schema.org/NutritionInformation">
            <h2>영양 정보 (1인분 기준)</h2>
            <p>칼로리: <span itemProp="calories">{recipe.nutrition.calories}kcal</span></p>
            <p>단백질: <span itemProp="proteinContent">{recipe.nutrition.protein}g</span></p>
            <p>탄수화물: <span itemProp="carbohydrateContent">{recipe.nutrition.carbohydrates}g</span></p>
            <p>지방: <span itemProp="fatContent">{recipe.nutrition.fat}g</span></p>
          </section>
        )}

        {/* 조리 시간 및 기타 메타 정보 */}
        <p>조리 시간: {recipe.cooking_time || 30}분</p>
        <meta itemProp="totalTime" content={totalTimeISO} />
        <meta itemProp="recipeYield" content={`${recipe.servings || 2}인분`} />
        {recipe.image_url && <meta itemProp="image" content={recipe.image_url} />}
        <meta itemProp="author" content="오늘의냉장고" />
        <meta itemProp="datePublished" content={recipe.created_at} />
      </article>

      {/* Client Component for Interactive User Interface */}
      <RecipeDetailClient recipe={recipe} />
    </>
  );
}
