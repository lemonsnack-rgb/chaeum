import { useState } from 'react';
import { RefreshCw, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { InventoryAnalysis as InventoryAnalysisType } from '../types/inventory';

interface InventoryAnalysisProps {
  ingredients: Array<{ name: string }>;
  onAnalyze: () => Promise<void>;
  analysis: InventoryAnalysisType | null;
  analyzing: boolean;
  needsUpdate: boolean;
}

export function InventoryAnalysis({
  ingredients,
  onAnalyze,
  analysis,
  analyzing,
  needsUpdate
}: InventoryAnalysisProps) {
  const [expanded, setExpanded] = useState(true);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sufficient':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'low':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'empty':
        return 'text-gray-500 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sufficient':
        return '✅';
      case 'low':
        return '⚠️';
      case 'empty':
        return '⚠️';
      default:
        return '';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'sufficient':
        return '충분';
      case 'low':
        return '부족';
      case 'empty':
        return '없음';
      default:
        return '';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    return `${days}일 전`;
  };

  // 재료가 3개 미만이면 간단한 메시지만 표시
  if (ingredients.length < 3) {
    return (
      <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-gray-900">🗂️ 냉장고 재료 분석</h3>
        </div>
        <div className="text-center py-8 text-gray-500">
          <p className="mb-2">재료가 부족해요</p>
          <p className="text-sm">3개 이상의 재료를 추가하면 AI 분석을 받을 수 있어요</p>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold text-gray-900">🗂️ 냉장고 재료 분석</h3>
          {needsUpdate && (
            <span className="px-2 py-1 bg-orange-100 text-orange-600 text-xs rounded-full font-medium animate-pulse">
              재분석 권장
            </span>
          )}
        </div>
        <button
          onClick={onAnalyze}
          disabled={analyzing}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
            needsUpdate
              ? 'bg-orange-500 text-white hover:bg-orange-600'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {analyzing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              분석 중...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              {analysis ? '다시 분석' : '분석하기'}
            </>
          )}
        </button>
      </div>

      {analyzing ? (
        <div className="text-center py-12">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-3" />
          <p className="text-gray-600 font-medium">AI가 냉장고 재료를 분석하고 있습니다...</p>
        </div>
      ) : analysis ? (
        <>
          {/* 카테고리 요약 */}
          <div className="space-y-2 mb-4">
            {analysis.categories.map((category) => (
              <div
                key={category.name}
                className={`flex items-center justify-between p-3 rounded-xl border ${getStatusColor(
                  category.status
                )}`}
              >
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-xl">{category.icon}</span>
                  <span className="font-semibold">
                    {category.name} ({category.items.length})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden" style={{ width: '60px' }}>
                    <div
                      className={`h-full ${
                        category.status === 'sufficient'
                          ? 'bg-green-500'
                          : category.status === 'low'
                          ? 'bg-orange-500'
                          : 'bg-gray-400'
                      }`}
                      style={{
                        width: `${category.status === 'sufficient' ? 100 : category.status === 'low' ? 50 : 0}%`
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium w-12 text-right">
                    {getStatusIcon(category.status)} {getStatusText(category.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* 재료 상세 (토글 가능) */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-center gap-2 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                재료 목록 접기
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                재료 목록 보기
              </>
            )}
          </button>

          {expanded && (
            <div className="space-y-3 mb-4 pt-2 border-t border-gray-200">
              {analysis.categories
                .filter((cat) => cat.items.length > 0)
                .map((category) => (
                  <div key={category.name} className="bg-gray-50 rounded-lg p-3">
                    <div className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <span>{category.icon}</span>
                      <span>{category.name}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {category.items.map((item, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-sm text-gray-700"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* AI 추천 */}
          {analysis.suggestions.length > 0 && (
            <>
              <div className="border-t border-gray-200 pt-4 mb-3">
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span>💡</span>
                  AI 추천
                </h4>
              </div>

              <div className="space-y-3">
                {analysis.suggestions.map((suggestion, idx) => (
                  <div key={idx} className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="font-semibold text-gray-900 mb-2">
                      {suggestion.category}이(가) {suggestion.reason === '단백질 균형을 위해' ? '없어요' : '부족해요'}
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <span className="text-blue-600 font-medium whitespace-nowrap">→ 추천:</span>
                      <span className="text-gray-700">{suggestion.items.join(', ')}</span>
                    </div>
                    <div className="text-xs text-gray-600 mt-1 ml-5">{suggestion.reason}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* 마지막 분석 시간 */}
          <div className="mt-4 text-xs text-gray-500 text-center">
            📅 {formatTimestamp(analysis.analyzedAt)} 분석
          </div>
        </>
      ) : (
        <div className="text-center py-8">
          <div className="text-6xl mb-3">📊</div>
          <p className="text-gray-600 mb-2">버튼을 눌러 냉장고 재료를</p>
          <p className="text-gray-600 mb-4">카테고리별로 분석해보세요</p>
          <ul className="text-sm text-gray-500 space-y-1">
            <li>• 어떤 재료가 있는지</li>
            <li>• 어떤 재료가 부족한지</li>
            <li>• 추천 재료 제안</li>
          </ul>
        </div>
      )}
    </section>
  );
}
