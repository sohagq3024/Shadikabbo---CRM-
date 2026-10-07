import React, { useState } from 'react';
import { ChevronDown, Sparkles, Check, Flame } from 'lucide-react';

export type QualityCategory = 'Normal' | 'Average' | 'Potential' | 'Very potential';

export const QUALITY_CATEGORIES: QualityCategory[] = [
  'Normal',
  'Average',
  'Potential',
  'Very potential',
];

export const getCategoryMeta = (cat?: string) => {
  const normalized = (cat || 'Normal').trim().toLowerCase();

  if (normalized === 'very potential' || normalized === 'very_potential') {
    return {
      label: 'Very potential',
      value: 'Very potential' as QualityCategory,
      badgeStyle: 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-1 ring-emerald-200/60',
      dotColor: 'bg-emerald-500',
      textColor: 'text-emerald-800',
      hoverStyle: 'hover:bg-emerald-100 hover:border-emerald-400',
      hasFlame: true,
    };
  }

  if (normalized === 'potential') {
    return {
      label: 'Potential',
      value: 'Potential' as QualityCategory,
      badgeStyle: 'bg-purple-50 text-purple-800 border-purple-300',
      dotColor: 'bg-purple-500',
      textColor: 'text-purple-800',
      hoverStyle: 'hover:bg-purple-100 hover:border-purple-400',
      hasFlame: false,
    };
  }

  if (normalized === 'average') {
    return {
      label: 'Average',
      value: 'Average' as QualityCategory,
      badgeStyle: 'bg-amber-50 text-amber-800 border-amber-300',
      dotColor: 'bg-amber-500',
      textColor: 'text-amber-800',
      hoverStyle: 'hover:bg-amber-100 hover:border-amber-400',
      hasFlame: false,
    };
  }

  // Default: Normal
  return {
    label: 'Normal',
    value: 'Normal' as QualityCategory,
    badgeStyle: 'bg-slate-100 text-slate-700 border-slate-300',
    dotColor: 'bg-slate-400',
    textColor: 'text-slate-700',
    hoverStyle: 'hover:bg-slate-200 hover:border-slate-400',
    hasFlame: false,
  };
};

export interface CategoryBadgeSelectorProps {
  category?: string;
  itemId: string;
  type: 'lead' | 'traffic';
  token: string;
  onCategoryChanged?: (newCategory: QualityCategory) => void;
  disabled?: boolean;
}

export const CategoryBadgeSelector: React.FC<CategoryBadgeSelectorProps> = ({
  category = 'Normal',
  itemId,
  type,
  token,
  onCategoryChanged,
  disabled = false,
}) => {
  const [currentCategory, setCurrentCategory] = useState<QualityCategory>(
    getCategoryMeta(category).value
  );
  const [isUpdating, setIsUpdating] = useState(false);

  // Sync if prop changes externally
  React.useEffect(() => {
    setCurrentCategory(getCategoryMeta(category).value);
  }, [category]);

  const meta = getCategoryMeta(currentCategory);

  const handleSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value as QualityCategory;
    if (selected === currentCategory) return;

    setCurrentCategory(selected);
    setIsUpdating(true);

    try {
      const endpoint = type === 'lead' ? `/api/leads/${itemId}/category` : `/api/traffic/${itemId}/category`;
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ category: selected }),
      });

      if (!response.ok) {
        throw new Error('Failed to update category');
      }

      if (onCategoryChanged) {
        onCategoryChanged(selected);
      }
    } catch (err) {
      console.error('Category update failed:', err);
      // Revert on failure
      setCurrentCategory(getCategoryMeta(category).value);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all cursor-pointer shadow-2xs ${meta.badgeStyle} ${meta.hoverStyle} ${
          isUpdating ? 'opacity-60 animate-pulse' : ''
        }`}
        title="Click to change candidate category"
      >
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${meta.dotColor}`} />
        <span className="truncate max-w-[85px]">{meta.label}</span>
        {meta.hasFlame && <Flame className="w-2.5 h-2.5 text-emerald-600 fill-emerald-500 shrink-0" />}
        <ChevronDown className="w-2.5 h-2.5 opacity-60 shrink-0" />
      </div>

      {/* Transparent native select overlay for frictionless accessibility and instant mobile/touch compatibility */}
      <select
        value={currentCategory}
        onChange={handleSelect}
        disabled={disabled || isUpdating}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-xs"
        title="Select Quality Category"
      >
        {QUALITY_CATEGORIES.map((cat) => (
          <option key={cat} value={cat}>
            {cat}
          </option>
        ))}
      </select>
    </div>
  );
};
