import { Camera, Edit3 } from 'lucide-react';

interface HeroSectionProps {
  onCameraClick: () => void;
  onManualInputClick: () => void;
}

export function HeroSection({ onCameraClick, onManualInputClick }: HeroSectionProps) {
  return (
    <section
      className="relative w-full h-[70vh] min-h-[500px] max-h-[700px] flex items-center justify-center overflow-hidden bg-gradient-to-br from-orange-50 via-white to-amber-50"
    >
      {/* 어두운 오버레이 */}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,107,0,0.08)_1px,transparent_1px),linear-gradient(180deg,rgba(255,107,0,0.08)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white to-transparent"></div>

      {/* 콘텐츠 */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        {/* 메인 제목 */}
        <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-primary shadow-sm border border-orange-100 mb-5">
          <span className="h-2 w-2 rounded-full bg-primary"></span>
          AI 레시피 추천
        </div>

        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-950 mb-4 leading-tight">
          냉장고 속 잠든 재료,
          <br />
          근사한 요리가 되다
        </h1>

        {/* 서브텍스트 */}
        <p className="text-lg md:text-xl text-gray-700 mb-8 leading-relaxed max-w-2xl mx-auto">
          오늘의냉장고 AI가 당신이 가진 식재료만으로 만들 수 있는 최적의 황금 레시피를 찾아드립니다.
        </p>

        {/* 액션 버튼 2개 */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          {/* 버튼 1: 영수증/냉장고 촬영 */}
          <button
            onClick={onCameraClick}
            className="w-full sm:w-auto px-8 py-4 bg-primary hover:bg-primary-dark text-white rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-3"
          >
            <Camera className="w-6 h-6" />
            영수증/냉장고 촬영
          </button>

          {/* 버튼 2: 재료 직접 입력 */}
          <button
            onClick={onManualInputClick}
            className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-gray-50 text-gray-900 rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-3 border border-gray-100"
          >
            <Edit3 className="w-6 h-6" />
            재료 직접 입력
          </button>
        </div>

        {/* 하단 힌트 */}
        <div className="mt-8 flex items-center justify-center gap-2 text-gray-500 text-sm">
          <span className="inline-block w-2 h-2 bg-primary rounded-full animate-pulse"></span>
          <span>스크롤하여 더 많은 레시피 보기</span>
        </div>
      </div>

    </section>
  );
}
