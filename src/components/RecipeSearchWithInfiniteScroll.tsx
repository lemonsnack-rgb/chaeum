import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, Loader2 } from 'lucide-react';
import { Recipe, searchPublicRecipesPaginated } from '../lib/recipeService';
import { RecipeList } from './RecipeList';
import { PopularKeywords } from './PopularKeywords';

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
  const [searchParams] = useSearchParams();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);

  const observerTarget = useRef<HTMLDivElement>(null);

  // URL 쿼리 파라미터에서 keyword 읽기
  useEffect(() => {
    const keywordFromUrl = searchParams.get('keyword');
    if (keywordFromUrl && keywordFromUrl !== searchQuery) {
      // URL에 keyword가 있으면 자동으로 검색 실행
      setSelectedKeyword(keywordFromUrl);
    }
  }, [searchParams]);

  // 실제 사용할 검색어: 키워드가 선택되어 있으면 키워드 우선, 아니면 외부 검색어
  // selectedKeyword가 null이 아니면(''도 포함) 키워드를 사용
  const effectiveSearchQuery = selectedKeyword !== null ? selectedKeyword : searchQuery;

  // 초기 로드
  useEffect(() => {
    loadRecipes(0, '');
  }, []);

  // 외부 검색어 변경 시 키워드 선택 해제 및 검색
  useEffect(() => {
    if (searchQuery) {
      setSelectedKeyword(null); // 검색어 입력 시 키워드 선택 해제
    }
    setPage(0);
    setRecipes([]);
    setHasMore(true);
    loadRecipes(0, searchQuery);
  }, [searchQuery]);

  // 선택된 키워드 변경 시 검색
  useEffect(() => {
    if (selectedKeyword) {
      setPage(0);
      setRecipes([]);
      setHasMore(true);
      loadRecipes(0, selectedKeyword);
    }
  }, [selectedKeyword]);

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
  }, [hasMore, loading, page, effectiveSearchQuery]);

  const handleKeywordClick = (keyword: string) => {
    if (selectedKeyword === keyword) {
      // 같은 키워드 클릭 시 선택 해제
      setSelectedKeyword(null);
      // 전체 레시피 다시 로드
      setPage(0);
      setRecipes([]);
      setHasMore(true);
      loadRecipes(0, '');
    } else {
      // 새 키워드 선택
      setSelectedKeyword(keyword);
    }
  };

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
      loadRecipes(nextPage, effectiveSearchQuery);
    }
  }, [loading, hasMore, page, effectiveSearchQuery]);

  return (
    <div className="space-y-4">
      {/* 인기 키워드 섹션 */}
      <PopularKeywords
        selectedKeyword={selectedKeyword}
        onKeywordClick={handleKeywordClick}
      />

      {/* 레시피 리스트 */}
      {isInitialLoad && loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : recipes.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl p-8">
          <p className="text-gray-500 mb-2">
            {effectiveSearchQuery
              ? `"${effectiveSearchQuery}"에 대한 검색 결과가 없습니다`
              : '검색 결과가 없습니다'
            }
          </p>
          {effectiveSearchQuery && (
            <p className="text-sm text-gray-400">다른 키워드로 검색해보세요</p>
          )}
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
