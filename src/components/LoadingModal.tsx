import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingModalProps {
  isOpen: boolean;
  message?: string;
}

export function LoadingModal({ isOpen, message = '레시피를 생성하는 중입니다...' }: LoadingModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 text-center">
        <Loader2 className="w-16 h-16 text-emerald-600 animate-spin mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">잠시만 기다려주세요</h3>
        <p className="text-gray-600">{message}</p>
        <p className="text-sm text-gray-500 mt-4">
          AI가 맞춤 레시피를 만들고 있습니다. 최대 30초 정도 소요될 수 있습니다.
        </p>
      </div>
    </div>
  );
}
