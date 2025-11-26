import { X, ChefHat, Info } from 'lucide-react';
import { useState, useEffect } from 'react';

interface ServiceBannerProps {
  onShowMore: () => void;
}

export function ServiceBanner({ onShowMore }: ServiceBannerProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // localStorage에서 배너 닫기 상태 확인
    const bannerClosed = localStorage.getItem('serviceBannerClosed');
    if (bannerClosed === 'true') {
      setIsVisible(false);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem('serviceBannerClosed', 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-2xl p-4 mb-4 relative">
      {/* 닫기 버튼 */}
      <button
        onClick={handleClose}
        className="absolute top-3 right-3 p-1 hover:bg-orange-200 rounded-full transition-colors"
      >
        <X className="w-4 h-4 text-orange-700" />
      </button>

      {/* 내용 */}
      <div className="flex items-start gap-3 pr-6">
        <div className="p-2 bg-primary rounded-lg flex-shrink-0">
          <ChefHat className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-gray-900 mb-1">
            오늘의냉장고와 함께하세요!
          </h3>
          <p className="text-xs text-gray-700 leading-relaxed mb-2">
            AI가 냉장고 재료를 분석하여 맞춤 레시피를 추천합니다
          </p>
          <button
            onClick={onShowMore}
            className="flex items-center gap-1 text-xs text-primary font-semibold hover:underline"
          >
            <Info className="w-3.5 h-3.5" />
            자세히 보기
          </button>
        </div>
      </div>
    </div>
  );
}
