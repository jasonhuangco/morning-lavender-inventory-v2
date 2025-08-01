import { Tag } from 'lucide-react';
import { Category } from '../../types';

interface CategoryFilterProps {
  categories: Category[];
  selectedCategories: string[];
  onCategoryChange: (selectedCategories: string[]) => void;
}

export default function CategoryFilter({
  categories,
  selectedCategories,
  onCategoryChange
}: CategoryFilterProps) {
  const toggleCategory = (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      onCategoryChange(selectedCategories.filter(id => id !== categoryId));
    } else {
      onCategoryChange([...selectedCategories, categoryId]);
    }
  };

  const clearAll = () => {
    onCategoryChange([]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Tag className="h-4 w-4 mr-2 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filter by Category</span>
        </div>
        
        {selectedCategories.length > 0 && (
          <button
            onClick={clearAll}
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            Clear all
          </button>
        )}
      </div>
      
      <div className="flex flex-wrap gap-2">
        {categories.map(category => {
          const isSelected = selectedCategories.includes(category.id);
          return (
            <button
              key={category.id}
              onClick={() => toggleCategory(category.id)}
              className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium border transition-colors ${
                isSelected
                  ? 'border-primary-200 text-primary-700 bg-primary-50'
                  : 'border-gray-200 text-gray-700 bg-white hover:bg-gray-50'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full mr-2"
                style={{ backgroundColor: category.color || '#6b7280' }}
              />
              {category.name}
            </button>
          );
        })}
      </div>
      
      {categories.length === 0 && (
        <p className="text-sm text-gray-500">No categories available</p>
      )}
    </div>
  );
}
