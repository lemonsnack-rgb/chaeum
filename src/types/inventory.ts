export interface InventoryCategory {
  name: string;
  icon: string;
  items: string[];
  status: 'sufficient' | 'low' | 'empty';
}

export interface InventorySuggestion {
  category: string;
  items: string[];
  reason: string;
}

export interface InventoryAnalysis {
  categories: InventoryCategory[];
  suggestions: InventorySuggestion[];
  analyzedAt: number;
  ingredientSnapshot: string[];
}
