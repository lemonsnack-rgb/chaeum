'use client';

import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto px-4 py-6">
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 text-center">
          <p className="text-red-600 mb-4">레시피를 찾을 수 없습니다.</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-primary text-white rounded-xl hover:bg-orange-600 transition-colors"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}
