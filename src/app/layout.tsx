import type { Metadata } from 'next';
import '../index.css';

export const metadata: Metadata = {
  title: '오늘의냉장고 - AI 맞춤 레시피 추천 | 냉장고 재료로 요리 찾기',
  description: '냉장고 재료로 만들 수 있는 레시피를 AI가 추천! 남은 재료 요리, 간편식 레시피, 건강 요리법을 찾아보세요. 사진 촬영만으로 재료 자동 인식, 무료 레시피 검색 서비스.',
  keywords: ['레시피 추천', '냉장고 재료 요리', 'AI 레시피', '남은 재료 요리', '간편 요리', '건강 레시피'],
  openGraph: {
    type: 'website',
    url: 'https://www.oneulfridge.com/',
    title: '오늘의냉장고 - AI 맞춤 레시피 추천',
    description: '냉장고 재료로 만들 수 있는 레시피를 AI가 추천! 남은 재료로 간편하게 요리하세요.',
    siteName: '오늘의냉장고',
  },
  twitter: {
    card: 'summary_large_image',
    title: '오늘의냉장고 - AI 맞춤 레시피 추천',
    description: '냉장고 재료로 만들 수 있는 레시피를 AI가 추천!',
  },
  other: {
    'google-adsense-account': 'ca-pub-5670799937813810',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <link rel="icon" type="image/svg+xml" href="/vite.svg" />
        <link rel="canonical" href="https://www.oneulfridge.com/" />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5670799937813810"
          crossOrigin="anonymous"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
