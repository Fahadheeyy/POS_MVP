'use client';
import { useEffect, useRef } from 'react';

export function useDialogFocus(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  const closeAction = useRef(close);
  useEffect(() => { closeAction.current = close; }, [close]);
  useEffect(() => {
    const dialog = ref.current;
    if (!open || !dialog) return;
    const previous = document.activeElement;
    const controls = () => Array.from(dialog.querySelectorAll<HTMLElement>(
      'button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]'
    )).filter(element => element.getClientRects().length);
    (controls()[0] ?? dialog).focus();
    const key = (event: KeyboardEvent) => {
      const dialogs = document.querySelectorAll('[role="dialog"][aria-modal="true"]');
      if (dialogs[dialogs.length-1] !== dialog) return;
      if (event.key === 'Escape') {
        event.preventDefault(); event.stopImmediatePropagation(); closeAction.current(); return;
      }
      if (event.key !== 'Tab') return;
      const items = controls();
      const next = event.shiftKey ? items.at(-1) : items[0];
      const edge = event.shiftKey ? items[0] : items.at(-1);
      if (document.activeElement === edge || !dialog.contains(document.activeElement)) {
        event.preventDefault(); (next ?? dialog).focus();
      }
    };
    document.addEventListener('keydown',key,true);
    return () => {
      document.removeEventListener('keydown',key,true);
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
    };
  }, [open]);
  return ref;
}
