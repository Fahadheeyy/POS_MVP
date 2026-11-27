'use client';

import { useState, type FormEvent } from 'react';
import { approveRefund } from '@/app/operations/supervisor';
import { refreshOutletWorkspace, useAppStore } from '@/store';

interface SupervisorApprovalProps {
  orderId: string;
  onClose: () => void;
  actionTitle: string;
  actionDescription: string;
  cancelTicket?: boolean;
  externalPayment?: boolean;
}

export function ManagerPinModal({
  orderId, onClose, actionTitle, actionDescription, cancelTicket = false, externalPayment = false,
}: SupervisorApprovalProps) {
  const outletId = useAppStore((state) => state.connectedOutlet?.outletId);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
    setPending(true);
    setError('');
    try {
      const result = await approveRefund({
        orderId, cancelTicket,
        email: String(fields.get('email') ?? ''),
        password: String(fields.get('password') ?? ''),
        reason: String(fields.get('reason') ?? ''),
        reference: String(fields.get('reference') ?? ''),
      });
      if (result.error) { setError(result.error); return; }
      onClose();
      if (outletId) void refreshOutletWorkspace(outletId).catch(() => undefined);
    } catch {
      setError('Could not confirm that the refund was saved. Check the order before retrying.');
    } finally {
      setPending(false);
      const password = form.elements.namedItem('password');
      if (password instanceof HTMLInputElement) password.value = '';
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-gray-900/45 backdrop-blur-xs p-4">
      <form role="dialog" aria-modal="true" aria-labelledby="supervisor-approval" onSubmit={submit}
        className="tikkit-card grid w-full max-w-md max-h-[92dvh] overflow-y-auto gap-3 rounded-3xl p-5 sm:p-6">
        <h2 id="supervisor-approval" className="text-lg font-bold">{actionTitle}</h2>
        <p className="text-xs sm:text-sm text-brand-muted">{actionDescription}</p>
        <label className="grid gap-1 text-xs font-semibold">Supervisor email
          <input className="rounded-xl border p-2.5 text-sm" name="email" type="email" autoComplete="off" required />
        </label>
        <label className="grid gap-1 text-xs font-semibold">Supervisor password
          <input className="rounded-xl border p-2.5 text-sm" name="password" type="password" autoComplete="off" required />
        </label>
        <label className="grid gap-1 text-xs font-semibold">Refund reason
          <input className="rounded-xl border p-2.5 text-sm" name="reason" maxLength={500} required />
        </label>
        <label className="grid gap-1 text-xs font-semibold">Payment refund reference {externalPayment ? '' : '(card or UPI only)'}
          <input className="rounded-xl border p-2.5 text-sm" name="reference" maxLength={80} required={externalPayment} />
        </label>
        <p className="text-xs text-brand-muted">Return cash or complete the reversal on the payment terminal before recording the refund.</p>
        {error && <p role="alert" className="text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-xl p-2.5">{error}</p>}
        <div className="flex justify-end gap-2.5 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="px-4 py-2 rounded-xl border border-brand-rule bg-white/80 hover:bg-white text-xs font-semibold text-brand-ink"
          >
            Cancel
          </button>
          <button disabled={pending} className="rounded-xl bg-brand-ink hover:bg-black px-4 py-2 text-xs font-bold text-brand-paper disabled:opacity-50">
            {pending ? 'Recording…' : 'Approve and record refund'}
          </button>
        </div>
      </form>
    </div>
  );
}
