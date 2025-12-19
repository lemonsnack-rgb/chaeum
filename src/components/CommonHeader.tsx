import { Refrigerator, Search, Clock } from 'lucide-react';
import { RefObject } from 'react';

interface CommonHeaderProps {
  onSearchClick?: () => void;
  onRecentRecipeClick?: () => void;
  onLogoClick?: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  searchInputRef?: RefObject<HTMLInputElement>;
}

export function CommonHeader({
  onSearchClick,
  onRecentRecipeClick,
  onLogoClick,
  searchQuery = '',
  onSearchChange,
  searchInputRef
}: CommonHeaderProps) {
  const handleLogoClick = () => {
    if (onLogoClick) {
      onLogoClick();
    }
  };

  const handleSearchClick = () => {
    if (onSearchClick) {
      onSearchClick();
    }
  };

  const handleRecentClick = () => {
    if (onRecentRecipeClick) {
      onRecentRecipeClick();
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onSearchChange) {
      onSearchChange(e.target.value);
    }
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
        <button
          onClick={handleLogoClick}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity flex-shrink-0"
        >
          <Refrigerator className="w-7 h-7 text-primary" />
          <h1 className="text-lg font-bold text-gray-900 whitespace-nowrap">
            <span className="text-primary">오</span>늘의<span className="text-primary">냉</span>장고
          </h1>
        </button>

        {/* 검색창 - 입력 가능, 클릭 시 검색 탭으로 이동 */}
        {onSearchClick && (
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="레시피 검색..."
                value={searchQuery}
                onChange={handleSearchChange}
                onClick={handleSearchClick}
                className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 rounded-full border border-gray-200 focus:bg-white focus:border-primary focus:outline-none transition-colors"
              />
            </div>
          </div>
        )}

        {onRecentRecipeClick && (
          <button
            onClick={handleRecentClick}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
            aria-label="최근 본 레시피"
          >
            <Clock className="w-6 h-6 text-gray-700" />
          </button>
        )}
      </div>
    </header>
  );
}
