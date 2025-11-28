import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Recipe, searchPublicRecipesPaginated } from '../lib/recipeService';
import { RecipeList } from './RecipeList';

interface RecipeSearchWithInfiniteScrollProps {
  onRecipeClick: (recipe: Recipe) => void;
  userIngredients?: string[];
  searchQuery: string; // 외부에서 검색어를 받음
}

export function RecipeSearchWithInfiniteScroll({
  onRecipeClick,
  userIngredients = [],
  searchQuery
}: RecipeSearchWithInfiniteScrollProps) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const observerTarget = useRef<HTMLDivElement>(null);

  // 초기 로드
  useEffect(() => {
    loadRecipes(0, '');
  }, []);

  // 검색어 변경 시 처음부터 다시 로드
  useEffect(() => {
    setPage(0);
    setRecipes([]);
    setHasMore(true);
    loadRecipes(0, searchQuery);
  }, [searchQuery]);

  // Intersection Observer 설정
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, page, searchQuery]);

  const loadRecipes = async (pageNum: number, query: string) => {
    setLoading(true);
    try {
      const newRecipes = await searchPublicRecipesPaginated(query, pageNum, 20);

      if (pageNum === 0) {
        setRecipes(newRecipes);
        setIsInitialLoad(false);
      } else {
        setRecipes(prev => [...prev, ...newRecipes]);
      }

      // 20개 미만이 반환되면 더 이상 데이터가 없음
      if (newRecipes.length < 20) {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Failed to load recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadRecipes(nextPage, searchQuery);
    }
  }, [loading, hasMore, page, searchQuery]);

  return (
    <div className="space-y-4">
      {/* 레시피 리스트 */}
      {isInitialLoad && loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : recipes.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">검색 결과가 없습니다</p>
        </div>
      ) : (
        <>
          <RecipeList
            recipes={recipes}
            onSelectRecipe={onRecipeClick}
          />

          {/* 무한 스크롤 트리거 & 로딩 인디케이터 */}
          <div ref={observerTarget} className="py-4 flex justify-center">
            {loading && (
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            )}
            {!hasMore && recipes.length > 0 && (
              <p className="text-sm text-gray-500">모든 레시피를 불러왔습니다</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
