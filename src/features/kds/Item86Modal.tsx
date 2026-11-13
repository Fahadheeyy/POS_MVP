import React, { useState } from 'react';
import { useAppStore } from '../../store';
import { Ban, CheckCircle2, Search, X, AlertTriangle } from 'lucide-react';
import { sounds } from '../../utils/audio';

interface Item86ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Item86Modal: React.FC<Item86ModalProps> = ({ isOpen, onClose }) => {
  const { products, quickToggle86Item } = useAppStore();
  const [stationFilter, setStationFilter] = useState<'All' | 'Grill' | 'Fry' | 'Cold' | 'Expo'>('All');
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filtered = products.filter((p) => {
    const matchesStation = stationFilter === 'All' || p.station === stationFilter;
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchesStation && matchesSearch;
  });

  const outOfStockCount = products.filter((p) => !p.isAvailable).length;

  const handleToggle = (id: string) => {
    sounds.playBump();
    quickToggle86Item(id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm animate-fadeIn p-4 select-none">
      <div className="bg-white rounded-3xl border border-gray-200 shadow-modal max-w-2xl w-full overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-secondaryRed-50 text-secondaryRed-600 flex items-center justify-center font-bold">
              <Ban size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-gray-900">Kitchen 86 / Line Availability</h3>
                {outOfStockCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-secondaryRed-100 text-secondaryRed-800 border border-secondaryRed-200">
                    {outOfStockCount} items 86'd
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500">
                Mark items out of stock directly from the kitchen line (instantly syncs to POS)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Filters & Search */}
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {(['All', 'Grill', 'Fry', 'Cold', 'Expo'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStationFilter(st)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  stationFilter === st
                    ? 'bg-gray-900 text-white shadow-subtle'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search dishes..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-gray-200 bg-white text-xs focus:outline-none focus:border-gray-400"
            />
          </div>
        </div>

        {/* Products Grid */}
        <div className="p-5 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-3 flex-1 min-h-[250px]">
          {filtered.map((product) => {
            const isAvailable = product.isAvailable;
            return (
              <div
                key={product.id}
                className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                  !isAvailable
                    ? 'border-secondaryRed-200 bg-secondaryRed-50/40'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 p-1 shrink-0 flex items-center justify-center">
                    <img src={product.image} alt={product.name} className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-gray-900 leading-tight">
                      {product.name}
                    </h4>
                    <span className="text-[10px] font-semibold text-gray-400 px-1.5 py-0.5 rounded bg-gray-100 inline-block mt-0.5">
                      {product.station}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggle(product.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    isAvailable
                      ? 'bg-secondaryGreen-50 text-secondaryGreen-700 border border-secondaryGreen-200 hover:bg-secondaryGreen-100'
                      : 'bg-secondaryRed-600 text-white shadow-subtle hover:bg-secondaryRed-700'
                  }`}
                >
                  {isAvailable ? (
                    <>
                      <CheckCircle2 size={13} />
                      <span>In Stock</span>
                    </>
                  ) : (
                    <>
                      <Ban size={13} />
                      <span>86'd (OOS)</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <p className="text-[11px] text-gray-500">
            Changes immediately take effect across all cashier terminals in real-time.
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-gray-900 hover:bg-gray-800 text-white shadow-subtle transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

