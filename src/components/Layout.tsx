import { ReactNode, useRef, useEffect } from 'react';
import { CommonHeader } from './CommonHeader';
import { BottomNav, Tab } from './BottomNav';

interface LayoutProps {
  children: ReactNode;
  activeTab?: Tab;
  onTabChange?: (tab: Tab) => void;
  onSearchClick?: () => void;
  onRecentRecipeClick?: () => void;
  onLogoClick?: () => void;
  showBottomNav?: boolean;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export function Layout({
  children,
  activeTab,
  onTabChange,
  onSearchClick,
  onRecentRecipeClick,
  onLogoClick,
  showBottomNav = true,
  searchQuery = '',
  onSearchChange
}: LayoutProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);

  // 검색 탭으로 이동 시 자동 포커스
  useEffect(() => {
    if (activeTab === 'search' && searchInputRef.current) {
      // 약간의 지연을 줘서 DOM이 완전히 렌더링된 후 포커스
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white pb-20">
      <CommonHeader
        onSearchClick={onSearchClick}
        onRecentRecipeClick={onRecentRecipeClick}
        onLogoClick={onLogoClick}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        searchInputRef={searchInputRef}
      />

      {children}

      {showBottomNav && activeTab && onTabChange && (
        <BottomNav activeTab={activeTab} onTabChange={onTabChange} />
      )}
    </div>
  );
}
