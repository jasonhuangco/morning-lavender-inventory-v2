import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Product, Category } from '../../types';

interface ProductCardProps {
  product: Product;
  categories: Category[];
  quantity: number;
  shouldOrder: boolean;
  onQuantityChange: (quantity: number) => void;
  onOrderToggle: (shouldOrder: boolean) => void;
}

export default function ProductCard({
  product,
  categories,
  quantity,
  shouldOrder,
  onQuantityChange,
  onOrderToggle
}: ProductCardProps) {
  const [localQuantity, setLocalQuantity] = useState(quantity);

  const productCategory = product.category_id ? 
    categories.find(c => c.id === product.category_id) : null;

  const isBelowThreshold = localQuantity < product.minimum_threshold;
  const isCheckboxOnly = product.checkbox_only;

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity < 0) return;
    setLocalQuantity(newQuantity);
    onQuantityChange(newQuantity);
    
    // Let the parent component (InventoryPage) handle the auto-checking logic
  };

  const handleIncrement = () => {
    handleQuantityChange(localQuantity + 1);
  };

  const handleDecrement = () => {
    if (localQuantity > 0) {
      handleQuantityChange(localQuantity - 1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    handleQuantityChange(value);
  };

  return (
    <div className={`bg-white rounded-lg border p-4 ${isBelowThreshold && !isCheckboxOnly ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}>
      {/* Header Row: Product Name and Alert Triangle */}
      <div className="flex items-start justify-between mb-1">
        <h3 className="font-semibold text-gray-900 text-lg leading-tight">
          {product.name}
        </h3>
        {isBelowThreshold && !isCheckboxOnly && (
          <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
        )}
      </div>

      {/* Category Tag and Controls Row */}
      <div className="flex items-start justify-between mb-2">
        {/* Category Tag */}
        {productCategory && (
          <div>
            <span
              className="inline-flex items-center px-2 py-1 rounded text-xs font-medium text-white"
              style={{
                backgroundColor: productCategory.color || '#6b7280'
              }}
            >
              {productCategory.name}
            </span>
          </div>
        )}

        {/* Right side: Quantity Controls */}
        <div className="flex flex-col items-end space-y-2">
          {/* Quantity Controls */}
          {!isCheckboxOnly ? (
            <div className="flex items-center space-x-2">
              <button
                onClick={handleDecrement}
                className="bg-red-600 hover:bg-red-700 text-white rounded-lg w-12 h-12 flex items-center justify-center text-xl font-bold"
                disabled={localQuantity <= 0}
              >
                −
              </button>
              
              <input
                type="number"
                value={localQuantity}
                onChange={handleInputChange}
                className="w-20 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg h-12 bg-white focus:border-primary-500 focus:outline-none"
                min="0"
              />
              
              <button
                onClick={handleIncrement}
                className="bg-green-600 hover:bg-green-700 text-white rounded-lg w-12 h-12 flex items-center justify-center text-xl font-bold"
              >
                +
              </button>
            </div>
          ) : (
            <div className="text-sm text-gray-600">
              Checkbox only
            </div>
          )}
        </div>
      </div>

      {/* Minimum, Current Values and Order Checkbox - All in one row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <div>
            <span className="text-sm text-gray-600">Minimum: </span>
            <span className="font-semibold">{product.minimum_threshold} {product.unit}</span>
          </div>
          {!isCheckboxOnly && (
            <div>
              <span className="text-sm text-gray-600">Current: </span>
              <span className={`font-semibold ${isBelowThreshold ? 'text-red-600' : 'text-gray-900'}`}>
                {localQuantity} {product.unit}
              </span>
            </div>
          )}
        </div>

        {/* Order Checkbox - Now truly inline with min/current */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={shouldOrder}
            onChange={(e) => onOrderToggle(e.target.checked)}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label className="text-sm text-gray-700 cursor-pointer">
            Order this item
          </label>
        </div>
      </div>
    </div>
  );
}
