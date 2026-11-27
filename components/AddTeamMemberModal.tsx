"use client";
import React, { useEffect, useState } from 'react';
import { Eye, EyeOff, X } from 'lucide-react';
import { createOutletStaffAction } from '@/app/operations/staff';
import { refreshOutletWorkspace, useAppStore } from '@/store';
import { Role } from '@/types';
import { sounds } from '@/utils/audio';

export interface AddTeamMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

const DEFAULT_TITLES: Record<'manager' | 'cashier' | 'kitchen', string> = {
  manager: 'Store Manager',
  cashier: 'Cashier',
  kitchen: 'Kitchen Staff',
};

export const AddTeamMemberModal: React.FC<AddTeamMemberModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const { connectedOutlet, addStaff } = useAppStore();
  const canManageManagers = connectedOutlet
    ? connectedOutlet.role === 'owner' || connectedOutlet.title === 'Platform Super Admin'
    : true;

  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'manager' | 'cashier' | 'kitchen'>('cashier');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [title, setTitle] = useState('Cashier');
  const [pin, setPin] = useState('1234');
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setFullName('');
    setRole('cashier');
    setTitle('Cashier');
    setEmail('');
    setPassword('');
    setShowPassword(false);
    setPin('1234');
    setErrorMessage('');
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRoleChange = (nextRole: 'manager' | 'cashier' | 'kitchen') => {
    setRole(nextRole);
    setTitle(DEFAULT_TITLES[nextRole]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    const cleanName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanTitle = title.trim() || DEFAULT_TITLES[role];
    const cleanPin = pin.replace(/\D/g, '').slice(0, 4);

    if (!cleanName) {
      setErrorMessage('Enter the staff member full name.');
      return;
    }
    if (cleanPin.length !== 4) {
      setErrorMessage('PIN must be 4 digits.');
      return;
    }

    setErrorMessage('');

    if (!connectedOutlet) {
      sounds.playSuccess();
      addStaff({
        name: cleanName,
        role: role as Role,
        title: cleanTitle,
        pin: cleanPin,
        email: cleanEmail,
        phone: '',
        avatarInitials:
          cleanName
            .split(/\s+/)
            .map((part) => part[0] || '')
            .join('')
            .slice(0, 2)
            .toUpperCase() || 'TM',
        active: true,
      });
      onCreated?.();
      onClose();
      return;
    }

    if (!cleanEmail || !password || password.length < 6) {
      setErrorMessage('Provide a work email and a password of at least 6 characters.');
      return;
    }

    setSaving(true);
    try {
      const res = await createOutletStaffAction({
        name: cleanName,
        email: cleanEmail,
        password,
        phone: '',
        title: cleanTitle,
        role,
        pin: cleanPin,
      });

      if (!res.success) {
        sounds.playError();
        setErrorMessage(res.error || 'Could not add team member.');
        return;
      }

      sounds.playSuccess();
      await refreshOutletWorkspace(connectedOutlet.outletId);
      onCreated?.();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4 select-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-team-member-title"
    >
      <div className="tikkit-card w-full max-w-[440px] rounded-3xl p-6 sm:p-7 max-h-[92dvh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 id="add-team-member-title" className="font-sans font-bold text-xl text-brand-ink">
            Add Team Member
          </h3>
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            aria-label="Close dialog"
            className="w-8 h-8 rounded-full border border-brand-rule bg-white/70 hover:bg-white flex items-center justify-center text-brand-ink transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3.5 text-sm">
          <div>
            <label htmlFor="team-member-name" className="tikkit-label block text-[11px] text-brand-ink mb-1.5">
              Full Name
            </label>
            <input
              id="team-member-name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Deepa Rao"
              className="w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium"
              required
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="team-member-role" className="tikkit-label block text-[11px] text-brand-ink mb-1.5">
              Role
            </label>
            <select
              id="team-member-role"
              value={role}
              onChange={(e) => handleRoleChange(e.target.value as 'manager' | 'cashier' | 'kitchen')}
              className="w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium"
            >
              {canManageManagers && <option value="manager">Store Manager</option>}
              <option value="cashier">Cashier</option>
              <option value="kitchen">Kitchen Staff</option>
            </select>
          </div>

          <div>
            <label htmlFor="team-member-email" className="tikkit-label block text-[11px] text-brand-ink mb-1.5">
              Email
            </label>
            <input
              id="team-member-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. deepa@outlet.com"
              className="w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium"
              required={!!connectedOutlet}
            />
          </div>

          <div>
            <label htmlFor="team-member-password" className="tikkit-label block text-[11px] text-brand-ink mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                id="team-member-password"
                type={showPassword ? 'text' : 'password'}
                minLength={connectedOutlet ? 6 : undefined}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border text-sm font-medium"
                required={!!connectedOutlet}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-ink"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="team-member-title" className="tikkit-label block text-[11px] text-brand-ink mb-1.5">
              Job Title
            </label>
            <input
              id="team-member-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Cashier"
              className="w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium"
              required
            />
          </div>

          <div>
            <label htmlFor="team-member-pin" className="tikkit-label block text-[11px] text-brand-ink mb-1.5">
              4-Digit PIN
            </label>
            <input
              id="team-member-pin"
              type="text"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="1234"
              className="w-full px-3.5 py-2.5 rounded-xl border font-mono font-bold text-sm tracking-wider"
              required
            />
          </div>

          {errorMessage && (
            <p role="alert" className="text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              {errorMessage}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-[#D9CFC0] bg-white/80 hover:bg-white text-xs font-semibold text-brand-ink transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-brand-ink hover:bg-black text-brand-paper text-xs font-bold shadow-[2px_3px_0px_#161412] active:translate-y-0.5 transition-all disabled:opacity-50"
            >
              {saving ? 'Creating…' : 'Create Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
