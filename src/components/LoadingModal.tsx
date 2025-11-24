import React, { useState, useEffect } from 'react';
import { Check, Loader2 } from 'lucide-react';

interface LoadingModalProps {
  isOpen: boolean;
  message?: string;
}

const steps = [
  { id: 1, text: '재료 분석 중...', duration: 3000 },
  { id: 2, text: 'AI 레시피 생성 중...', duration: 8000 },
  { id: 3, text: '영양 정보 계산 중...', duration: 4000 },
  { id: 4, text: '데이터베이스 저장 중...', duration: 2000 },
];

export function LoadingModal({ isOpen, message = '레시피를 생성하는 중입니다...' }: LoadingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0);
      setProgress(0);
      return;
    }

    // 단계별 진행
    const stepTimers: NodeJS.Timeout[] = [];
    let accumulatedTime = 0;

    steps.forEach((step, index) => {
      const timer = setTimeout(() => {
        setCurrentStep(index + 1);
      }, accumulatedTime);
      stepTimers.push(timer);
      accumulatedTime += step.duration;
    });

    // 프로그레스바 애니메이션
    const totalDuration = steps.reduce((sum, step) => sum + step.duration, 0);
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 100;
        return Math.min(prev + (100 / totalDuration) * 100, 100);
      });
    }, 100);

    return () => {
      stepTimers.forEach(clearTimeout);
      clearInterval(progressInterval);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
        <div className="text-center mb-6">
          <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">레시피 생성 중</h3>
          <p className="text-sm text-gray-600">{message}</p>
        </div>

        {/* 프로그레스바 */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>진행 상황</span>
            <span className="font-semibold text-primary">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-primary to-orange-500 h-2.5 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* 단계별 체크리스트 */}
        <div className="space-y-3">
          {steps.map((step, index) => {
            const isCompleted = currentStep > index;
            const isActive = currentStep === index;

            return (
              <div
                key={step.id}
                className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                  isActive ? 'bg-orange-50 border border-orange-200' : ''
                } ${isCompleted ? 'bg-green-50' : ''}`}
              >
                <div
                  className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                    isCompleted
                      ? 'bg-green-500'
                      : isActive
                      ? 'bg-primary'
                      : 'bg-gray-200'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4 text-white" />
                  ) : isActive ? (
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  ) : (
                    <div className="w-2 h-2 bg-gray-400 rounded-full" />
                  )}
                </div>
                <span
                  className={`text-sm font-medium ${
                    isCompleted
                      ? 'text-green-700'
                      : isActive
                      ? 'text-primary'
                      : 'text-gray-500'
                  }`}
                >
                  {step.text}
                </span>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-gray-500 text-center mt-6">
          잠시만 기다려주세요. 최대 30초 정도 소요됩니다.
        </p>
      </div>
    </div>
  );
}
