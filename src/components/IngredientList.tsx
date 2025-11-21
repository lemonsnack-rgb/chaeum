import { Trash2, Edit2, Check, X } from 'lucide-react';
import { useState } from 'react';
import { Ingredient } from '../lib/supabase';

interface IngredientListProps {
  ingredients: Ingredient[];
  onUpdate: (id: string, updates: Partial<Ingredient>) => void;
  onDelete: (id: string) => void;
}

export function IngredientList({ ingredients, onUpdate, onDelete }: IngredientListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editQuantity, setEditQuantity] = useState('');

  const startEdit = (ingredient: Ingredient) => {
    if (confirm(`'${ingredient.name}' 재료를 수정하시겠습니까?`)) {
      setEditingId(ingredient.id);
      setEditName(ingredient.name);
      setEditQuantity(ingredient.quantity);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditQuantity('');
  };

  const saveEdit = async (id: string) => {
    if (confirm('수정 내용을 저장하시겠습니까?')) {
      await onUpdate(id, { name: editName, quantity: editQuantity });
      cancelEdit();
    }
  };

  if (ingredients.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
        <div className="text-center py-8">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">🥬</span>
          </div>
          <p className="text-gray-500 mb-2 font-medium">아직 등록된 식재료가 없어요</p>
          <p className="text-sm text-gray-400">위 버튼으로 식재료를 등록해보세요</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {ingredients.map((ingredient) => (
        <div
          key={ingredient.id}
          className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all"
        >
          {editingId === ingredient.id ? (
            <div className="flex gap-3 items-center">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="재료명"
                autoFocus
              />
              <select
                value={editQuantity}
                onChange={(e) => setEditQuantity(e.target.value)}
                className="w-28 px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white text-sm"
              >
                <option value="">수량</option>
                <optgroup label="개수">
                  <option value="1개">1개</option>
                  <option value="2개">2개</option>
                  <option value="3개">3개</option>
                  <option value="4개">4개</option>
                  <option value="5개">5개</option>
                </optgroup>
                <optgroup label="중량">
                  <option value="주멱만큼">주멱만큼</option>
                  <option value="손바닥만큼">손바닥만큼</option>
                  <option value="100g">약 100g</option>
                  <option value="200g">약 200g</option>
                  <option value="300g">약 300g</option>
                  <option value="500g">약 500g</option>
                </optgroup>
                <optgroup label="기타">
                  <option value="적당량">적당량</option>
                  <option value="조금">조금</option>
                  <option value="많이">많이</option>
                </optgroup>
              </select>
              <div className="flex gap-2">
                <button
                  onClick={() => saveEdit(ingredient.id)}
                  className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={cancelEdit}
                  className="p-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-gray-900 text-lg">{ingredient.name}</h4>
                  {ingredient.category && (
                    <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                      ingredient.category === '주재료'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {ingredient.category}
                    </span>
                  )}
                </div>
              </div>
              <div className="w-20 text-center">
                {ingredient.quantity ? (
                  <span className="text-sm text-gray-600 font-medium">
                    {ingredient.quantity}
                  </span>
                ) : (
                  <span className="text-xs text-gray-400">-</span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => startEdit(ingredient)}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`'${ingredient.name}' 재료를 삭제하시겠습니까?`)) {
                      onDelete(ingredient.id);
                    }
                  }}
                  className="p-2 text-primary hover:bg-orange-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
