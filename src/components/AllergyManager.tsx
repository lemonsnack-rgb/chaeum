import { X } from 'lucide-react';
import { useState } from 'react';

interface AllergyManagerProps {
  items: string[];
  onAdd: (item: string) => Promise<void>;
  onRemove: (item: string) => Promise<void>;
  title: string;
  placeholder: string;
  commonItems: string[];
  icon: React.ReactNode;
}

export function AllergyManager({
  items,
  onAdd,
  onRemove,
  title,
  placeholder,
  commonItems,
  icon,
}: AllergyManagerProps) {
  const [customItem, setCustomItem] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleToggle = async (item: string) => {
    console.log('[AllergyManager] handleToggle 호출됨:', item);
    console.log('[AllergyManager] 현재 items:', items);
    try {
      if (items.includes(item)) {
        console.log('[AllergyManager] 제거 시도:', item);
        await onRemove(item);
      } else {
        console.log('[AllergyManager] 추가 시도:', item);
        await onAdd(item);
      }
      console.log('[AllergyManager] 성공');
    } catch (error: any) {
      console.error('[AllergyManager] 에러 발생:', error);
      alert(error.message || '오류가 발생했습니다.');
    }
  };

  const handleAddCustom = async () => {
    const trimmed = customItem.trim();
    console.log('[AllergyManager] handleAddCustom 호출됨:', trimmed);
    if (!trimmed) {
      console.log('[AllergyManager] 빈 문자열, 종료');
      return;
    }

    setIsAdding(true);
    try {
      console.log('[AllergyManager] 커스텀 추가 시도:', trimmed);
      await onAdd(trimmed);
      setCustomItem('');
      console.log('[AllergyManager] 커스텀 추가 성공');
    } catch (error: any) {
      console.error('[AllergyManager] 커스텀 추가 에러:', error);
      alert(error.message || '추가 중 오류가 발생했습니다.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveItem = async (item: string) => {
    if (!confirm(`'${item}' 정보를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      await onRemove(item);
    } catch (error: any) {
      alert(error.message || '삭제 중 오류가 발생했습니다.');
    }
  };

  return (
    <section className="mb-4">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h4 className="text-sm font-bold text-gray-900">{title}</h4>
      </div>

      {/* 자주 찾는 항목 */}
      <div className="mb-3">
        <p className="text-xs font-semibold text-gray-600 mb-2">자주 찾는 항목</p>
        <div className="flex flex-wrap gap-2">
          {commonItems.map((item) => (
            <button
              key={item}
              onClick={() => handleToggle(item)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                items.includes(item)
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              #{item}
            </button>
          ))}
        </div>
      </div>

      {/* 직접 입력 */}
      <div className="mb-3">
        <p className="text-xs font-semibold text-gray-600 mb-2">직접 입력</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={customItem}
            onChange={(e) => setCustomItem(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddCustom()}
            placeholder={placeholder}
            disabled={isAdding}
            className="flex-1 min-w-0 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-xs disabled:opacity-50"
          />
          <button
            onClick={handleAddCustom}
            disabled={!customItem.trim() || isAdding}
            className="px-3 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap text-xs flex-shrink-0"
          >
            {isAdding ? '추가중...' : '추가'}
          </button>
        </div>
      </div>

      {/* 등록된 항목 */}
      {items.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-600 mb-2">등록된 항목</p>
          <div className="flex flex-wrap gap-2">
            {items.map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-700 rounded-full text-xs font-medium"
              >
                #{item}
                <button
                  onClick={() => handleRemoveItem(item)}
                  className="hover:bg-red-100 rounded-full p-0.5 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
