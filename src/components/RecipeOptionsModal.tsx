import { X, Users, Tag } from 'lucide-react';
import { useState } from 'react';

interface RecipeOptionsModalProps {
  onClose: () => void;
  onGenerate: (servings: number, theme: string) => void;
}

const POPULAR_THEMES = ['한식', '양식', '다이어트식', '비올 때', '파티'];

export function RecipeOptionsModal({ onClose, onGenerate }: RecipeOptionsModalProps) {
  const [servings, setServings] = useState(2);
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  const [customTheme, setCustomTheme] = useState('');

  const handleThemeToggle = (theme: string) => {
    setSelectedThemes(prev =>
      prev.includes(theme)
        ? prev.filter(t => t !== theme)
        : [...prev, theme]
    );
  };

  const handleAddCustomTheme = () => {
    const trimmed = customTheme.trim();
    if (trimmed && !selectedThemes.includes(trimmed)) {
      setSelectedThemes(prev => [...prev, trimmed]);
      setCustomTheme('');
    }
  };

  const handleRemoveTheme = (theme: string) => {
    setSelectedThemes(prev => prev.filter(t => t !== theme));
  };

  const handleGenerate = () => {
    const themeString = selectedThemes.length > 0 ? selectedThemes.join(', ') : '';
    onGenerate(servings, themeString);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-br from-primary to-primary-dark p-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold text-white">어떤 레시피를 찾나요?</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
          <p className="text-orange-100 text-sm">원하는 옵션을 선택하고 레시피를 찾아보세요</p>
        </div>

        <div className="p-6 space-y-6">
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-bold text-gray-900">몇 명이 드실 건가요?</h3>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setServings(Math.max(1, servings - 1))}
                className="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold text-xl text-gray-700 transition-colors"
              >
                −
              </button>
              <div className="flex-1 text-center">
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={servings}
                  onChange={(e) => setServings(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                  className="w-24 text-3xl font-bold text-primary text-center bg-orange-50 rounded-xl py-2 border-2 border-orange-200 focus:border-primary focus:outline-none"
                />
                <p className="text-sm text-gray-600 mt-1">인분</p>
              </div>
              <button
                onClick={() => setServings(Math.min(10, servings + 1))}
                className="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold text-xl text-gray-700 transition-colors"
              >
                +
              </button>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-4">
              <Tag className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-bold text-gray-900">어떤 분위기에서 드실 건가요?</h3>
            </div>

            <div className="mb-4">
              <p className="text-sm font-semibold text-gray-700 mb-2">자주 찾는 테마</p>
              <div className="flex flex-wrap gap-2">
                {POPULAR_THEMES.map((theme) => (
                  <button
                    key={theme}
                    onClick={() => handleThemeToggle(theme)}
                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                      selectedThemes.includes(theme)
                        ? 'bg-primary text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    #{theme}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm font-semibold text-gray-700 mb-2">테마 직접 입력</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customTheme}
                  onChange={(e) => setCustomTheme(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddCustomTheme()}
                  placeholder="예: 간편식, 건강식, 해장"
                  className="flex-1 min-w-0 px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-primary focus:outline-none text-sm"
                />
                <button
                  onClick={handleAddCustomTheme}
                  disabled={!customTheme.trim()}
                  className="px-3 py-2 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap text-sm flex-shrink-0"
                >
                  추가
                </button>
              </div>
            </div>

            {selectedThemes.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">선택된 테마</p>
                <div className="flex flex-wrap gap-2">
                  {selectedThemes.map((theme) => (
                    <span
                      key={theme}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-primary rounded-full text-sm font-medium"
                    >
                      #{theme}
                      <button
                        onClick={() => handleRemoveTheme(theme)}
                        className="hover:bg-orange-200 rounded-full p-0.5 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>

        <div className="p-6 pt-0">
          <button
            onClick={handleGenerate}
            className="w-full bg-primary hover:bg-primary-dark text-white rounded-2xl py-4 px-6 font-bold text-lg transition-all shadow-lg hover:shadow-xl"
          >
            레시피 찾기
          </button>
        </div>
      </div>
    </div>
  );
}
