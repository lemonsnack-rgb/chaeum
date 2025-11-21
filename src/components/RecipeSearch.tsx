import { useState } from 'react';
import { Search, X } from 'lucide-react';

interface RecipeSearchProps {
  onSearch: (query: string) => void;
}

export function RecipeSearch({ onSearch }: RecipeSearchProps) {
  const [query, setQuery] = useState('');

  const handleSearch = (value: string) => {
    setQuery(value);
    onSearch(value);
  };

  const handleClear = () => {
    setQuery('');
    onSearch('');
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="레시피 제목, 재료, 태그로 검색..."
          className="w-full pl-12 pr-12 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-sm"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      {query && (
        <div className="mt-2 text-sm text-gray-600 px-1">
          '<span className="font-medium text-primary">{query}</span>' 검색 결과
        </div>
      )}
    </div>
  );
}
