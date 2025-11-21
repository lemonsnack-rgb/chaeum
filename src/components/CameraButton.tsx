import { Camera, Loader2 } from 'lucide-react';
import { useState, useRef } from 'react';
import { extractIngredientsFromImage } from '../lib/gemini';

interface CameraButtonProps {
  onIngredientsExtracted: (ingredients: string[]) => void;
}

export function CameraButton({ onIngredientsExtracted }: CameraButtonProps) {
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setProcessing(true);
      const ingredients = await extractIngredientsFromImage(file);
      onIngredientsExtracted(ingredients);
    } catch (error) {
      console.error('Error processing image:', error);
      alert('이미지 처리 중 오류가 발생했습니다. Gemini API 키를 확인해주세요.');
    } finally {
      setProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
        disabled={processing}
      />
      <button
        onClick={handleClick}
        disabled={processing}
        className="w-full bg-gradient-to-br from-primary to-primary-dark rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="flex items-center justify-between">
          <div className="text-left">
            <h2 className="text-white text-2xl font-bold mb-2">
              {processing ? '이미지 분석 중...' : '냉장고/영수증 촬영'}
            </h2>
            <p className="text-orange-100 text-sm">
              {processing ? 'AI가 식재료를 찾고 있어요' : '사진 한 장으로 간편하게 등록!'}
            </p>
          </div>
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
            {processing ? (
              <Loader2 className="w-10 h-10 text-white animate-spin" />
            ) : (
              <Camera className="w-10 h-10 text-white" />
            )}
          </div>
        </div>
      </button>
    </>
  );
}
