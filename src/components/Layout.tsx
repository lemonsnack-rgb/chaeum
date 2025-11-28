import { ReactNode } from 'react';
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
}

export function Layout({
  children,
  activeTab,
  onTabChange,
  onSearchClick,
  onRecentRecipeClick,
  onLogoClick,
  showBottomNav = true
}: LayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white pb-20">
      <CommonHeader
        onSearchClick={onSearchClick}
        onRecentRecipeClick={onRecentRecipeClick}
        onLogoClick={onLogoClick}
      />

      {children}

      {showBottomNav && activeTab && onTabChange && (
        <BottomNav activeTab={activeTab} onTabChange={onTabChange} />
      )}
    </div>
  );
}
