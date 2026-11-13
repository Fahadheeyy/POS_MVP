import React, { useState } from 'react';
import { Product, AddOnItem, SelectedAddOn } from '../../types';
import { useAppStore } from '../../store';
import { formatINR } from '../../utils/formatters';
import { sounds } from '../../utils/audio';
import { X, Plus, Minus, Check } from 'lucide-react';

interface ProductCustomizationModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ProductCustomizationModal: React.FC<ProductCustomizationModalProps> = ({
  product,
  isOpen,
  onClose,
}) => {
  const { addOnGroups, addToCart } = useAppStore();
  const [quantity, setQuantity] = useState(1);
  const [selectedAddOns, setSelectedAddOns] = useState<SelectedAddOn[]>([]);

  if (!isOpen || !product) return null;

  // Find relevant add-on groups for this product
  const relevantGroups = addOnGroups.filter((g) =>
    product.addOnGroupIds?.includes(g.id)
  );

  const toggleAddOn = (group: typeof relevantGroups[0], item: AddOnItem) => {
    const isAlreadySelected = selectedAddOns.some(
      (a) => a.groupId === group.id && a.item.id === item.id
    );

    if (isAlreadySelected) {
      setSelectedAddOns((prev) =>
        prev.filter((a) => !(a.groupId === group.id && a.item.id === item.id))
      );
    } else {
      // Check group maxSelect limit
      const currentInGroup = selectedAddOns.filter((a) => a.groupId === group.id);
      if (currentInGroup.length >= group.maxSelect) {
        // Replace oldest in group if single-select
        if (group.maxSelect === 1) {
          setSelectedAddOns((prev) => [
            ...prev.filter((a) => a.groupId !== group.id),
            { groupId: group.id, groupName: group.name, item },
          ]);
          return;
        }
        return;
      }
      setSelectedAddOns((prev) => [
        ...prev,
        { groupId: group.id, groupName: group.name, item },
      ]);
    }
  };

  const addOnTotal = selectedAddOns.reduce((sum, a) => sum + a.item.price, 0);
  const unitPrice = product.price + addOnTotal;
  const totalPrice = unitPrice * quantity;

  const handleAddToCart = () => {
    sounds.playSuccess();
    addToCart(product, quantity, selectedAddOns);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm animate-fadeIn p-4 select-none">
      <div className="bg-white border border-gray-200 rounded-3xl w-full max-w-3xl overflow-hidden shadow-modal flex flex-col md:flex-row relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/80 border border-gray-200 text-gray-400 hover:text-gray-700 flex items-center justify-center transition-colors"
        >
          <X size={18} />
        </button>

        {/* Left Side: Product Picture as in "Menu — Beast Style details.png" */}
        <div className="md:w-1/2 p-6 flex flex-col justify-center items-center bg-gray-50/50 border-r border-gray-100 relative">
          <div className="w-56 h-56 rounded-2xl bg-white border border-gray-200/80 p-4 shadow-subtle flex items-center justify-center overflow-hidden">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-contain hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                e.currentTarget.src = '/assets/placeholder-dessert.svg';
              }}
            />
          </div>
        </div>

        {/* Right Side: Options and Customization */}
        <div className="md:w-1/2 p-6 flex flex-col justify-between">
          <div>
            <div className="mb-3">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">{product.name}</h2>
              <div className="text-lg font-extrabold text-gray-900 mt-0.5">
                {formatINR(product.price)}
              </div>
            </div>

            <p className="text-xs text-gray-500 leading-relaxed mb-4">
              {product.description}
            </p>

            {/* Add-ons groups */}
            <div className="space-y-4 max-h-56 overflow-y-auto pr-1 border-t border-gray-100 pt-3">
              {relevantGroups.length === 0 ? (
                <div className="py-6 text-center text-xs text-gray-400 bg-gray-50 rounded-2xl">
                  No extra add-ons configured for this item. Proceed to add directly.
                </div>
              ) : (
                relevantGroups.map((group) => (
                <div key={group.id}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                      {group.name}
                    </span>
                    <span className="text-[11px] text-gray-400">
                      {group.maxSelect > 1 ? `Up to ${group.maxSelect}` : 'Select 1'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {group.items.map((item) => {
                      const isChecked = selectedAddOns.some(
                        (a) => a.groupId === group.id && a.item.id === item.id
                      );
                      return (
                        <div
                          key={item.id}
                          onClick={() => toggleAddOn(group, item)}
                          className={`p-2 rounded-xl border text-center cursor-pointer transition-all flex flex-col items-center justify-center relative ${
                            isChecked
                              ? 'border-gray-900 bg-gray-50/70'
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                        >
                          {isChecked && (
                            <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-gray-900 text-white flex items-center justify-center text-[10px]">
                              <Check size={10} strokeWidth={3} />
                            </div>
                          )}
                          <div className="w-8 h-8 rounded-full bg-gray-100 p-1 mb-1.5 flex items-center justify-center">
                            <img
                              src={item.image || '/assets/placeholder-dessert.svg'}
                              alt={item.name}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                e.currentTarget.src = '/assets/placeholder-dessert.svg';
                              }}
                            />
                          </div>
                          <span className="text-[11px] font-semibold text-gray-800 leading-tight">
                            {item.name}
                          </span>
                          <span className="text-[10px] text-gray-500 mt-0.5">
                            {item.price === 0 ? 'Free' : `+${formatINR(item.price)}`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )))}
            </div>
          </div>

          {/* Stepper + Add to Cart Bottom Bar matching Menu — Beast Style details.png */}
          <div className="pt-4 border-t border-gray-100 flex items-center gap-3 mt-4">
            <div className="flex items-center border border-gray-200 rounded-full p-1 bg-white">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition-colors"
              >
                <Minus size={14} />
              </button>
              <span className="w-8 text-center text-sm font-bold text-gray-900">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              className="flex-1 py-3 px-4 rounded-2xl bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs shadow-subtle flex items-center justify-between transition-colors"
            >
              <span>Add to Cart</span>
              <span>{formatINR(totalPrice)}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

