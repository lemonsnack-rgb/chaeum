'use client';

import { Suspense } from 'react';
import App from '../App';

function AppWrapper() {
  return <App />;
}

export default function Page() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <AppWrapper />
    </Suspense>
  );
}
