import { useState, useEffect } from 'react';
import { supabase, Ingredient } from '../lib/supabase';
import { classifyIngredient } from '../lib/gemini';

const STORAGE_KEY = 'fridge_ingredients';

export function useIngredients() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
    loadIngredients();
  }, []);

  async function checkAuth() {
    if (!supabase) {
      setIsAuthenticated(false);
      return;
    }
    const { data } = await supabase.auth.getSession();
    setIsAuthenticated(!!data.session);
  }

  async function loadIngredients() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setIngredients(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading ingredients:', error);
    } finally {
      setLoading(false);
    }
  }

  async function addIngredient(name: string, quantity: string = '') {
    try {
      const category = await classifyIngredient(name);
      const localIngredient: Ingredient = {
        id: crypto.randomUUID(),
        user_id: 'local',
        name,
        quantity,
        category,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const updated = [localIngredient, ...ingredients];
      setIngredients(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error adding ingredient:', error);
      throw error;
    }
  }

  async function updateIngredient(id: string, updates: Partial<Ingredient>) {
    try {
      const updated = ingredients.map(ing =>
        ing.id === id ? { ...ing, ...updates, updated_at: new Date().toISOString() } : ing
      );
      setIngredients(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error updating ingredient:', error);
      throw error;
    }
  }

  async function deleteIngredient(id: string) {
    try {
      const updated = ingredients.filter(ing => ing.id !== id);
      setIngredients(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error deleting ingredient:', error);
      throw error;
    }
  }

  async function addMultipleIngredients(names: string[]) {
    try {
      const newIngredients: Ingredient[] = [];

      for (const name of names) {
        const category = await classifyIngredient(name);
        newIngredients.push({
          id: crypto.randomUUID(),
          user_id: 'local',
          name,
          quantity: '',
          category,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      const updated = [...newIngredients, ...ingredients];
      setIngredients(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error adding multiple ingredients:', error);
      throw error;
    }
  }

  async function clearAllIngredients() {
    try {
      setIngredients([]);
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing ingredients:', error);
      throw error;
    }
  }

  return {
    ingredients,
    loading,
    isAuthenticated,
    addIngredient,
    updateIngredient,
    deleteIngredient,
    addMultipleIngredients,
    clearAllIngredients,
    refreshIngredients: loadIngredients,
  };
}
