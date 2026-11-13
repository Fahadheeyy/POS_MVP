import React, { useState } from 'react';
import { useAppStore } from '../../store';
import { MessageSquare, X, Check } from 'lucide-react';
import { CartItem } from '../../types';

interface SpecialInstructionsModalProps {
  item: CartItem | null;
  isOpen: boolean;
  onClose: () => void;
}

const QUICK_TAGS = [
  'No Onion/Garlic (Jain)',
  'Less Spicy',
  'Extra Spicy 🔥',
  'Extra Crispy',
  'Pack Separately',
  'No Ice in Drink',
  'Sauce on Side',
  'Well Toasted Bun',
];

export const SpecialInstructionsModal: React.FC<SpecialInstructionsModalProps> = ({
  item,
  isOpen,
  onClose,
}) => {
  const { updateCartItemSpecialInstructions } = useAppStore();
  const [instructions, setInstructions] = useState(item?.specialInstructions || '');

  React.useEffect(() => {
    if (item) {
      setInstructions(item.specialInstructions || '');
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const handleTagToggle = (tag: string) => {
    if (instructions.includes(tag)) {
      setInstructions(
        instructions
          .split(', ')
          .filter((t) => t !== tag)
          .join(', ')
      );
    } else {
      setInstructions(instructions ? `${instructions}, ${tag}` : tag);
    }
  };

  const handleSave = () => {
    updateCartItemSpecialInstructions(item.cartItemId, instructions);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm animate-fadeIn p-4 select-none">
      <div className="bg-white rounded-3xl border border-gray-200 shadow-modal max-w-md w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
              <MessageSquare size={16} />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-gray-900">Kitchen Instructions</h3>
              <p className="text-xs text-gray-500">For {item.product.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2">
              Quick Suggestions
            </label>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_TAGS.map((tag) => {
                const isActive = instructions.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleTagToggle(tag)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-slate-800 text-white shadow-subtle'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200/60'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Custom Kitchen Note
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. Extra pistachio drizzle, separate golden spoons, cold packing..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-xs focus:outline-none focus:border-gray-400"
              rows={3}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              setInstructions('');
              updateCartItemSpecialInstructions(item.cartItemId, '');
              onClose();
            }}
            className="px-3 py-2 text-xs font-semibold text-secondaryRed-600 hover:underline"
          >
            Clear Note
          </button>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-gray-900 hover:bg-gray-800 text-white shadow-subtle transition-colors flex items-center gap-1.5"
            >
              <Check size={14} />
              <span>Save Instruction</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

