interface KeywordItem {
  id: string;
  label: string;
  emoji: string;
  searchTerm: string;
  color: string;
}

const POPULAR_KEYWORDS: KeywordItem[] = [
  { id: 'easy', label: '간편식', emoji: '🔥', searchTerm: '간편식', color: 'bg-orange-100' },
  { id: 'diet', label: '다이어트', emoji: '💪', searchTerm: '다이어트', color: 'bg-blue-100' },
  { id: 'quick', label: '빠른요리', emoji: '⚡', searchTerm: '10분', color: 'bg-yellow-100' },
  { id: 'vegan', label: '채식', emoji: '🥗', searchTerm: '채식', color: 'bg-green-100' },
  { id: 'camping', label: '캠핑요리', emoji: '🏕️', searchTerm: '캠핑', color: 'bg-purple-100' },
  { id: 'snack', label: '술안주', emoji: '🍺', searchTerm: '술안주', color: 'bg-amber-100' },
];

interface PopularKeywordsProps {
  selectedKeyword: string | null;
  onKeywordClick: (searchTerm: string) => void;
}

export function PopularKeywords({
  selectedKeyword,
  onKeywordClick
}: PopularKeywordsProps) {
  return (
    <section className="mb-6 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
        <span className="text-base">🔥</span>
        인기 키워드로 빠르게 찾기
      </h3>

      {/* 3개씩 2줄 배치 */}
      <div className="grid grid-cols-3 gap-4">
        {POPULAR_KEYWORDS.map((keyword) => {
          const isSelected = selectedKeyword === keyword.searchTerm;

          return (
            <button
              key={keyword.id}
              onClick={() => onKeywordClick(keyword.searchTerm)}
              className={`
                flex flex-col items-center gap-2 p-3 rounded-xl
                transition-all hover:scale-105 active:scale-95
                ${isSelected
                  ? `${keyword.color} ring-2 ring-primary shadow-md`
                  : 'bg-gray-50 hover:bg-gray-100'
                }
              `}
            >
              {/* 원형 이모지 배경 */}
              <div
                className={`
                  w-14 h-14 rounded-full flex items-center justify-center text-2xl
                  transition-all
                  ${isSelected
                    ? 'bg-white shadow-sm scale-110'
                    : 'bg-white shadow-sm'
                  }
                `}
              >
                {keyword.emoji}
              </div>

              {/* 라벨 */}
              <span
                className={`
                  text-xs font-medium text-center leading-tight
                  ${isSelected ? 'text-gray-900' : 'text-gray-700'}
                `}
              >
                {keyword.label}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
