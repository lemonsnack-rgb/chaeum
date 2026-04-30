import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import RecipeDetailClient from './RecipeDetailClient';
import { supabase } from '../../../lib/supabase';
import { Recipe, databaseToRecipe } from '../../../lib/recipeService';

// 동적 라우팅을 위한 타입 정의
type Props = {
  params: Promise<{ recipeId: string }>;
};

// 레시피 데이터 가져오기 (서버 사이드)
async function getRecipe(recipeId: string): Promise<Recipe | null> {
  try {
    const { data, error } = await supabase
      .from('generated_recipes')
      .select('*')
      .eq('id', recipeId)
      .maybeSingle();

    if (error || !data) {
      console.error('Failed to fetch recipe:', error);
      return null;
    }

    // DB 구조를 코드 Recipe 인터페이스로 변환
    return databaseToRecipe(data);
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
      card: 'summary',
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* Client Component for Interactive User Interface */}
      <RecipeDetailClient recipe={recipe} />
    </>
  );
}
