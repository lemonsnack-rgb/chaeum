import { useState, useEffect } from 'react';
import { Camera, Edit3 } from 'lucide-react';
import { getHeroBackgroundImage } from '../lib/unsplashService';

interface HeroSectionProps {
  onCameraClick: () => void;
  onManualInputClick: () => void;
}

export function HeroSection({ onCameraClick, onManualInputClick }: HeroSectionProps) {
  const [backgroundImage, setBackgroundImage] = useState<string>('');
  const [imageLoading, setImageLoading] = useState(true);

  useEffect(() => {
    loadBackgroundImage();
  }, []);

  async function loadBackgroundImage() {
    try {
      const imageUrl = await getHeroBackgroundImage();
      setBackgroundImage(imageUrl);
    } catch (error) {
      console.error('Failed to load hero background:', error);
    } finally {
      setImageLoading(false);
    }
  }

  return (
    <section
      className="relative w-full h-[70vh] min-h-[500px] max-h-[700px] flex items-center justify-center overflow-hidden"
      style={{
        backgroundImage: backgroundImage
          ? `url(${backgroundImage})`
          : 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* 어두운 오버레이 */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px]"></div>

      {/* 콘텐츠 */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        {/* 메인 제목 */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight drop-shadow-2xl">
          냉장고 속 잠든 재료,
          <br />
          근사한 요리가 되다
        </h1>

        {/* 서브텍스트 */}
        <p className="text-lg md:text-xl text-white/90 mb-8 leading-relaxed drop-shadow-lg max-w-2xl mx-auto">
          오늘의냉장고 AI가 당신이 가진 식재료만으로 만들 수 있는 최적의 황금 레시피를 찾아드립니다.
        </p>

        {/* 액션 버튼 2개 */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          {/* 버튼 1: 영수증/냉장고 촬영 */}
          <button
            onClick={onCameraClick}
            className="w-full sm:w-auto px-8 py-4 bg-primary hover:bg-primary-dark text-white rounded-full font-bold text-lg shadow-2xl hover:shadow-3xl transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-3"
          >
            <Camera className="w-6 h-6" />
            영수증/냉장고 촬영
          </button>

          {/* 버튼 2: 재료 직접 입력 */}
          <button
            onClick={onManualInputClick}
            className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-gray-50 text-gray-900 rounded-full font-bold text-lg shadow-2xl hover:shadow-3xl transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-3"
          >
            <Edit3 className="w-6 h-6" />
            재료 직접 입력
          </button>
        </div>

        {/* 하단 힌트 */}
        <div className="mt-8 flex items-center justify-center gap-2 text-white/70 text-sm">
          <span className="inline-block w-2 h-2 bg-white/70 rounded-full animate-pulse"></span>
          <span>스크롤하여 더 많은 레시피 보기</span>
        </div>
      </div>

      {/* 로딩 인디케이터 (이미지 로딩 중) */}
      {imageLoading && (
        <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-primary flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </section>
  );
}
