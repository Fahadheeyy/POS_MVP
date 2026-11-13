import React from 'react';
import { ChefHat, X, Flame, Clock, Scale, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { RECIPE_SPECS } from '../../data/seedData';
import { RecipeSpec } from '../../types';

interface RecipeSpecModalProps {
  productId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const RecipeSpecModal: React.FC<RecipeSpecModalProps> = ({ productId, isOpen, onClose }) => {
  if (!isOpen || !productId) return null;

  // Find recipe spec or fallback to first
  const spec =
    RECIPE_SPECS.find((r) => r.productId === productId) ||
    RECIPE_SPECS.find((r) => r.productName.toLowerCase().includes(productId.toLowerCase())) ||
    RECIPE_SPECS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm animate-fadeIn p-4 select-none">
      <div className="bg-white rounded-3xl border border-gray-200 shadow-modal max-w-xl w-full overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold">
              <ChefHat size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-gray-900">{spec.productName}</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                  {spec.station} Station
                </span>
              </div>
              <p className="text-xs text-gray-500">Standard operating kitchen recipe & assembly spec</p>
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
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Critical Cooking Specs */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <Clock size={16} />
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase block">Target Prep</span>
                <span className="text-xs font-black text-gray-900">{spec.prepTimeSecs}s</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <Flame size={16} />
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase block">Temp</span>
                <span className="text-xs font-black text-gray-900">{spec.cookTemp || 'Ambient'}</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <Scale size={16} />
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase block">Portion</span>
                <span className="text-xs font-black text-gray-900">
                  {spec.pattyWeightGrams ? `${spec.pattyWeightGrams}g` : 'Standard'}
                </span>
              </div>
            </div>
          </div>

          {/* Allergen Warning */}
          <div className="p-3 rounded-2xl bg-secondaryRed-50/60 border border-secondaryRed-200/60 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-secondaryRed-800 font-semibold">
              <ShieldAlert size={15} className="text-secondaryRed-600 shrink-0" />
              <span>Contains Allergens:</span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {spec.allergens.map((alg) => (
                <span
                  key={alg}
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-secondaryRed-700 border border-secondaryRed-200"
                >
                  {alg}
                </span>
              ))}
            </div>
          </div>

          {/* Step-by-Step Assembly Guide */}
          <div>
            <h4 className="font-extrabold text-xs text-gray-900 mb-2.5 uppercase tracking-wider">
              Step-by-Step Line Assembly
            </h4>
            <div className="space-y-2">
              {spec.assemblySteps.map((step, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-gray-200 bg-white flex items-start gap-3 shadow-subtle"
                >
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <p className="text-xs text-gray-700 font-medium leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-gray-900 hover:bg-gray-800 text-white shadow-subtle transition-colors"
          >
            Got It (Close)
          </button>
        </div>
      </div>
    </div>
  );
};

