import { X, Sparkles, ChefHat, Users, Mail } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AboutModal({ isOpen, onClose }: AboutModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex items-center justify-between rounded-t-3xl">
          <h2 className="text-2xl font-bold text-gray-900">오늘의냉장고</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* 내용 */}
        <div className="p-6 space-y-6">
          {/* 서비스 소개 */}
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <ChefHat className="w-10 h-10 text-white" />
            </div>
            <p className="text-gray-700 leading-relaxed text-base">
              오늘의냉장고는<br />
              <span className="text-primary font-semibold">AI 기술</span>을 활용해서<br />
              냉장고를 분석하여<br />
              내가 가진 재료를 기반으로 레시피를 추천하고,<br />
              음식에 관한 정보를 나누고,<br />
              맛있는 일상을 이어가는 서비스입니다.
            </p>
          </div>

          {/* 주요 기능 */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 text-center mb-4">주요 기능</h3>

            <div className="bg-orange-50 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary rounded-lg">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">AI 레시피 추천</h4>
                  <p className="text-sm text-gray-600">
                    냉장고 재료 사진을 찍으면 AI가 자동으로 분석하여 맞춤 레시피를 제안합니다.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <ChefHat className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">레시피 검색 & 저장</h4>
                  <p className="text-sm text-gray-600">
                    다양한 레시피를 검색하고 마음에 드는 레시피를 저장하여 언제든 다시 볼 수 있습니다.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-500 rounded-lg">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">커뮤니티</h4>
                  <p className="text-sm text-gray-600">
                    레시피에 댓글을 달고 다른 사용자들과 요리 경험을 공유할 수 있습니다.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 연락처 */}
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <Mail className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-900 mb-1">광고/제휴문의</p>
            <a
              href="mailto:hello@oneulfridge.com"
              className="text-sm text-primary hover:underline"
            >
              hello@oneulfridge.com
            </a>
          </div>
        </div>

        {/* 닫기 버튼 */}
        <div className="p-6 pt-0">
          <button
            onClick={onClose}
            className="w-full py-3 bg-primary text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
