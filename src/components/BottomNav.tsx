import { Home, RefrigeratorIcon, Heart, User } from 'lucide-react';

export type Tab = 'home' | 'fridge' | 'search' | 'my-recipes' | 'profile';

interface BottomNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
      <div className="max-w-md mx-auto px-4 py-2.5">
        <div className="flex items-center justify-around">
          <button
            onClick={() => onTabChange('home')}
            className={`flex flex-col items-center gap-0.5 py-1.5 px-2 transition-colors ${
              activeTab === 'home' ? 'text-primary' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-xs font-medium">홈</span>
          </button>
          <button
            onClick={() => onTabChange('fridge')}
            className={`flex flex-col items-center gap-0.5 py-1.5 px-2 transition-colors ${
              activeTab === 'fridge' ? 'text-primary' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <RefrigeratorIcon className="w-5 h-5" />
            <span className="text-xs font-medium">내 냉장고</span>
          </button>
          <button
            onClick={() => onTabChange('my-recipes')}
            className={`flex flex-col items-center gap-0.5 py-1.5 px-2 transition-colors ${
              activeTab === 'my-recipes' ? 'text-primary' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Heart className="w-5 h-5" />
            <span className="text-xs font-medium">찜한 레시피</span>
          </button>
          <button
            onClick={() => onTabChange('profile')}
            className={`flex flex-col items-center gap-0.5 py-1.5 px-2 transition-colors ${
              activeTab === 'profile' ? 'text-primary' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <User className="w-5 h-5" />
            <span className="text-xs font-medium">내 정보</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
