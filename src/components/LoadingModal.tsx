import React, { useState, useEffect } from 'react';
import { Check, Loader2, Brain, Sparkles, ChefHat } from 'lucide-react';

interface LoadingModalProps {
  isOpen: boolean;
  message?: string;
}

const steps = [
  { id: 1, text: '재료를 분석하고 있습니다...', icon: Brain, duration: 2000 },
  { id: 2, text: '인공지능이 최적의 레시피를 찾는 중입니다...', icon: Sparkles, duration: 4000 },
  { id: 3, text: '레시피를 맞춤 제작하고 있습니다...', icon: ChefHat, duration: 3000 },
  { id: 4, text: '거의 완성되었습니다!', icon: Check, duration: 0 },
];

export function LoadingModal({ isOpen, message = 'AI가 레시피를 찾고 있습니다...' }: LoadingModalProps) {
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 sm:p-8">
          <div className="text-center mb-6">
            <Loader2 className="w-16 h-16 sm:w-20 sm:h-20 text-primary animate-spin mx-auto mb-3" />
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">레시피 찾는 중</h3>
            <p className="text-sm text-gray-600">{message}</p>
          </div>

          {/* 프로그레스바 */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span className="font-medium">진행 상황</span>
              <span className="font-bold text-primary text-lg">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-primary via-orange-500 to-orange-600 h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* 단계별 체크리스트 */}
          <div className="space-y-3">
            {steps.map((step, index) => {
              const isCompleted = currentStep > index;
              const isActive = currentStep === index;
              const Icon = step.icon;

              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${
                    isActive ? 'bg-orange-50 border-2 border-orange-200' : ''
                  } ${isCompleted ? 'bg-green-50 border border-green-200' : 'border border-transparent'}`}
                >
                  <div
                    className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isCompleted
                        ? 'bg-green-500'
                        : isActive
                        ? 'bg-primary'
                        : 'bg-gray-200'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5 text-white" />
                    ) : isActive ? (
                      <Icon className="w-5 h-5 text-white animate-pulse" />
                    ) : (
                      <Icon className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  <span
                    className={`text-sm sm:text-base font-semibold ${
                      isCompleted
                        ? 'text-green-700'
                        : isActive
                        ? 'text-primary'
                        : 'text-gray-400'
                    }`}
                  >
                    {step.text}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-6 p-3 bg-blue-50 rounded-xl border border-blue-100">
            <p className="text-sm text-blue-800 text-center font-medium">
              💡 AI가 찾은 레시피는 자동으로 저장됩니다
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
