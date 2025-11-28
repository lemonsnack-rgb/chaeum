import { useState, useRef, useEffect } from 'react';
import { Plus } from 'lucide-react';

interface IngredientInputProps {
  onAdd: (name: string, quantity: string) => void;
  existingNames: string[];
}

const commonIngredients = [
  '감자', '고구마', '양파', '당근', '마늘', '대파', '파', '생강', '배추', '무',
  '상추', '깻잎', '시금치', '브로콜리', '토마토', '오이', '호박', '가지',
  '소고기', '돼지고기', '닭고기', '달걀', '우유', '치즈', '요구르트',
  '김치', '두부', '콩나물', '버섯', '사과', '배', '바나나', '귤', '딸기',
  '쌀', '라면', '식빵', '된장', '고추장', '간장', '참기름', '식용유',
];

export function IngredientInput({ onAdd, existingNames }: IngredientInputProps) {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (name.length > 0) {
      const filtered = commonIngredients.filter(
        item => item.includes(name) && !existingNames.includes(item)
      );
      setSuggestions(filtered.slice(0, 5));
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [name, existingNames]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onAdd(name.trim(), quantity.trim());
      setName('');
      setQuantity('');
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setName(suggestion);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="재료명 (예: 감자, 양파)"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />

            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-200 z-10 overflow-hidden">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full px-4 py-2 text-left hover:bg-orange-50 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>

          <select
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-24 px-2 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white text-sm"
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
              <option value="주먹만큼">주먹만큼</option>
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

          <button
            type="submit"
            className="px-4 bg-primary hover:bg-primary-dark text-white rounded-xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
