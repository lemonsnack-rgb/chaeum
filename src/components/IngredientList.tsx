import { Trash2, Edit2, Check, X } from 'lucide-react';
import { useState } from 'react';
import { Ingredient } from '../lib/supabase';

interface IngredientListProps {
  ingredients: Ingredient[];
  onUpdate: (id: string, updates: Partial<Ingredient>) => void;
  onDelete: (id: string) => void;
}

// 재료 이름을 기반으로 카테고리 자동 판단
function categorizeIngredient(name: string): { category: string; color: string } {
  const lowerName = name.toLowerCase();

  // 육류
  const meats = ['소고기', '돼지고기', '닭고기', '양고기', '오리고기', '삼겹살', '목살', '등심', '안심', '갈비', '베이컨', '햄', '소시지'];
  if (meats.some(meat => lowerName.includes(meat))) {
    return { category: '육류', color: 'bg-red-100 text-red-700' };
  }

  // 해산물
  const seafood = ['생선', '고등어', '삼치', '갈치', '연어', '참치', '새우', '오징어', '문어', '조개', '홍합', '굴', '게', '낙지', '멸치', '명태'];
  if (seafood.some(item => lowerName.includes(item))) {
    return { category: '해산물', color: 'bg-blue-100 text-blue-700' };
  }

  // 채소
  const vegetables = ['양파', '당근', '배추', '무', '감자', '고구마', '브로콜리', '양배추', '시금치', '상추', '깻잎', '파', '마늘', '생강', '호박', '가지', '오이', '토마토', '피망', '고추', '버섯'];
  if (vegetables.some(veg => lowerName.includes(veg))) {
    return { category: '채소류', color: 'bg-green-100 text-green-700' };
  }

  // 양념/소스
  const seasonings = ['간장', '된장', '고추장', '소금', '설탕', '식초', '참기름', '올리브유', '식용유', '후추', '고춧가루', '깨', '마요네즈', '케첩', '소스', '드레싱', '액젓', '굴소스', '조미료', '미림'];
  if (seasonings.some(item => lowerName.includes(item))) {
    return { category: '양념', color: 'bg-orange-100 text-orange-700' };
  }

  // 유제품
  const dairy = ['우유', '치즈', '버터', '요구르트', '생크림', '크림', '두유'];
  if (dairy.some(item => lowerName.includes(item))) {
    return { category: '유제품', color: 'bg-yellow-100 text-yellow-700' };
  }

  // 곡물/면
  const grains = ['쌀', '밀가루', '빵', '면', '파스타', '국수', '라면', '당면', '떡'];
  if (grains.some(item => lowerName.includes(item))) {
    return { category: '곡물', color: 'bg-amber-100 text-amber-700' };
  }

  // 기타
  return { category: '기타', color: 'bg-gray-100 text-gray-700' };
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
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                  placeholder="재료명"
                  autoFocus
                />
                <select
                  value={editQuantity}
                  onChange={(e) => setEditQuantity(e.target.value)}
                  className="w-24 px-2 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white text-xs"
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
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => saveEdit(ingredient.id)}
                  className="flex-1 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
                >
                  저장
                </button>
                <button
                  onClick={cancelEdit}
                  className="flex-1 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors text-sm font-medium"
                >
                  취소
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-gray-900 text-lg">{ingredient.name}</h4>
                  {(() => {
                    const { category, color } = categorizeIngredient(ingredient.name);
                    return (
                      <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${color}`}>
                        {category}
                      </span>
                    );
                  })()}
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
