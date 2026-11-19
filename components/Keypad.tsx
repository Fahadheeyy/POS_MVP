import React from 'react';
import { Delete } from 'lucide-react';

interface KeypadProps {
  pin: string;
  onDigit: (digit: string) => void;
  onClear: () => void;
  onBackspace: () => void;
  onSubmit: () => void;
  error?: string | null;
  submitLabel?: string;
  maxDigits?: number;
}

export const Keypad: React.FC<KeypadProps> = ({
  pin,
  onDigit,
  onClear,
  onBackspace,
  onSubmit,
  error,
  submitLabel = 'Sign in',
  maxDigits = 4,
}) => {
  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  return (
    <div className="w-full max-w-xs mx-auto select-none">
      {/* 4 Digit Boxes */}
      <div className="flex justify-center gap-3 mb-4">
        {Array.from({ length: maxDigits }).map((_, idx) => (
          <div
            key={idx}
            className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-all ${
              error
                ? 'border-secondaryRed-400 bg-secondaryRed-50 text-secondaryRed-700'
                : pin.length > idx
                ? 'border-gray-800 bg-gray-50'
                : 'border-gray-200 bg-white'
            }`}
          >
            {pin.length > idx && (
              <div
                className={`w-3.5 h-3.5 rounded-full ${
                  error ? 'bg-secondaryRed-500' : 'bg-gray-800'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {error ? (
        <p className="text-xs text-secondaryRed-600 text-center font-medium mb-3 min-h-[16px] animate-shake">
          {error}
        </p>
      ) : (
        <p className="text-xs text-gray-400 text-center font-normal mb-3 min-h-[16px]">
          Use your {maxDigits}-digit staff PIN.
        </p>
      )}

      {/* Keypad Grid 3x4 */}
      <div className="grid grid-cols-3 gap-2.5 mb-4">
        {digits.map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => onDigit(num)}
            className="h-14 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 active:bg-gray-100 text-xl font-bold text-gray-800 flex items-center justify-center transition-colors shadow-subtle"
          >
            {num}
          </button>
        ))}

        {/* Bottom row: Clear, 0, Backspace */}
        <button
          type="button"
          onClick={onClear}
          className="h-14 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 active:bg-gray-100 text-sm font-semibold text-gray-600 flex items-center justify-center transition-colors shadow-subtle"
        >
          Clear
        </button>

        <button
          type="button"
          onClick={() => onDigit('0')}
          className="h-14 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 active:bg-gray-100 text-xl font-bold text-gray-800 flex items-center justify-center transition-colors shadow-subtle"
        >
          0
        </button>

        <button
          type="button"
          onClick={onBackspace}
          className="h-14 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-600 flex items-center justify-center transition-colors shadow-subtle"
        >
          <Delete size={20} />
        </button>
      </div>

      {/* Submit Button */}
      <button
        type="button"
        onClick={onSubmit}
        disabled={pin.length < maxDigits}
        className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all shadow-subtle ${
          pin.length >= maxDigits
            ? 'bg-gray-900 hover:bg-gray-800 text-white cursor-pointer'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
        }`}
      >
        {submitLabel}
      </button>
    </div>
  );
};

