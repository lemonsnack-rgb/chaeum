import { Routes, Route } from 'react-router-dom';
import App from './App';
import { RecipeDetailPage } from './pages/RecipeDetailPage';

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/recipe/:recipeId" element={<RecipeDetailPage />} />
    </Routes>
  );
}
