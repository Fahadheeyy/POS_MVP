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
    <div className="fixed inset-0 z-50 grid place-items-center bg-gray-900/40 p-4">
      <form role="dialog" aria-modal="true" aria-labelledby="supervisor-approval" onSubmit={submit}
        className="grid w-full max-w-md gap-3 rounded-2xl bg-white p-6 shadow-xl">
        <h2 id="supervisor-approval" className="text-lg font-bold">{actionTitle}</h2>
        <p className="text-sm text-gray-600">{actionDescription}</p>
        <label className="grid gap-1 text-sm">Supervisor email
          <input className="rounded border p-2" name="email" type="email" autoComplete="off" required />
        </label>
        <label className="grid gap-1 text-sm">Supervisor password
          <input className="rounded border p-2" name="password" type="password" autoComplete="off" required />
        </label>
        <label className="grid gap-1 text-sm">Refund reason
          <input className="rounded border p-2" name="reason" maxLength={500} required />
        </label>
        <label className="grid gap-1 text-sm">Payment refund reference {externalPayment ? '' : '(card or UPI only)'}
          <input className="rounded border p-2" name="reference" maxLength={80} required={externalPayment} />
        </label>
        <p className="text-xs text-gray-600">Return cash or complete the reversal on the payment terminal before recording the refund.</p>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} disabled={pending}>Cancel</button>
          <button disabled={pending} className="rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-50">
            {pending ? 'Recording…' : 'Approve and record refund'}
          </button>
        </div>
      </form>
    </div>
  );
}
