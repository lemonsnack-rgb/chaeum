import { useState } from 'react';
import { Mail, X, Loader2 } from 'lucide-react';
import { signInWithMagicLink } from '../lib/authService';

interface AuthModalProps {
  onClose: () => void;
}

export function AuthModal({ onClose }: AuthModalProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      alert('이메일을 입력해주세요.');
      return;
    }

    try {
      setIsLoading(true);
      await signInWithMagicLink(email);
      setEmailSent(true);
    } catch (error: any) {
      console.error('Login error:', error);
      alert(error.message || '로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        {!emailSent ? (
          <>
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
              이메일로 로그인
            </h2>
            <p className="text-sm text-gray-600 text-center mb-6">
              비밀번호 없이 매직 링크로 간편하게 로그인하세요
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이메일 주소
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  disabled={isLoading}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary text-white rounded-xl py-3 font-semibold hover:bg-primary-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    전송 중...
                  </>
                ) : (
                  <>
                    <Mail className="w-5 h-5" />
                    매직 링크 받기
                  </>
                )}
              </button>
            </form>

            <p className="text-xs text-gray-500 text-center mt-4">
              로그인 링크를 이메일로 전송해드립니다.
              <br />
              링크를 클릭하면 자동으로 로그인됩니다.
            </p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
              이메일을 확인하세요!
            </h2>
            <p className="text-sm text-gray-600 text-center mb-6">
              <span className="font-medium text-primary">{email}</span>
              <br />
              로 로그인 링크를 전송했습니다.
              <br />
              이메일의 링크를 클릭하여 로그인하세요.
            </p>

            <button
              onClick={onClose}
              className="w-full bg-gray-100 text-gray-700 rounded-xl py-3 font-semibold hover:bg-gray-200 transition-all"
            >
              닫기
            </button>

            <button
              onClick={() => {
                setEmailSent(false);
                setEmail('');
              }}
              className="w-full mt-3 text-sm text-primary hover:underline"
            >
              다른 이메일로 다시 시도
            </button>
          </>
        )}
      </div>
    </div>
  );
}
