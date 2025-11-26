import { Mail, Info } from 'lucide-react';
import { useState } from 'react';

interface FooterProps {
  onShowAbout: () => void;
}

export function Footer({ onShowAbout }: FooterProps) {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 py-4 mt-8">
      <div className="max-w-md mx-auto px-4">
        <div className="flex flex-col items-center gap-2 text-center">
          {/* 서비스 소개 링크 */}
          <button
            onClick={onShowAbout}
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-primary transition-colors"
          >
            <Info className="w-4 h-4" />
            <span>서비스 소개</span>
          </button>

          {/* 구분선 */}
          <div className="w-full border-t border-gray-200 my-1"></div>

          {/* 연락처 */}
          <a
            href="mailto:hello@oneulfridge.com"
            className="flex items-center gap-1.5 text-sm text-gray-700 hover:text-primary transition-colors"
          >
            <Mail className="w-4 h-4" />
            <span>광고/제휴문의: hello@oneulfridge.com</span>
          </a>

          {/* 저작권 */}
          <p className="text-xs text-gray-400 mt-1">
            © 2024 오늘의냉장고. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
