import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { Lock, ArrowLeft, UserCheck } from 'lucide-react';

interface AccessDeniedProps {
  requiredRole: string;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({ requiredRole }) => {
  const navigate = useNavigate();
  const { currentUser, currentRole, setCurrentRole } = useAppStore();

  const handleSwitchToRequired = () => {
    setCurrentRole(requiredRole as any);
    if (requiredRole === 'owner') navigate('/owner');
    else if (requiredRole === 'manager') navigate('/manager');
    else if (requiredRole === 'cashier') navigate('/pos');
    else if (requiredRole === 'kitchen') navigate('/kds');
  };

  const handleReturnToOwnApp = () => {
    if (currentRole === 'cashier') navigate('/pos');
    else if (currentRole === 'kitchen') navigate('/kds');
    else if (currentRole === 'manager') navigate('/manager');
    else if (currentRole === 'owner') navigate('/owner');
    else navigate('/login');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6 bg-surface-canvas">
      <div className="bg-white border border-gray-200 rounded-2xl p-8 max-w-md w-full text-center shadow-card">
        <div className="w-14 h-14 rounded-full bg-secondaryRed-50 text-secondaryRed-600 flex items-center justify-center mx-auto mb-4 border border-secondaryRed-100">
          <Lock size={26} />
        </div>

        <h2 className="text-xl font-bold text-gray-900 mb-1">Access Restricted</h2>
        <p className="text-xs text-gray-500 mb-6 leading-relaxed">
          This area is restricted to <span className="font-semibold text-gray-800 capitalize">{requiredRole}</span> roles.
          Your active session is signed in as <span className="font-semibold text-gray-800">{currentUser?.name}</span> ({currentRole}).
        </p>

        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-left mb-6 text-xs text-gray-600">
          <p className="font-semibold text-gray-800 mb-1">Role Permissions:</p>
          <ul className="list-disc list-inside space-y-0.5 text-gray-500">
            <li>Cashier: POS, Today's Orders, Shift open/close</li>
            <li>Kitchen: KDS Kitchen Display only</li>
            <li>Manager: Menu, Staff, Approvals, Operations</li>
            <li>Owner: Financial dashboards, Reports, System Settings</li>
          </ul>
        </div>

        <div className="space-y-2.5">
          <button
            onClick={handleSwitchToRequired}
            className="w-full py-2.5 px-4 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors shadow-subtle"
          >
            <UserCheck size={14} />
            Switch role to {requiredRole.toUpperCase()}
          </button>
          <button
            onClick={handleReturnToOwnApp}
            className="w-full py-2.5 px-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-semibold text-xs flex items-center justify-center gap-2 transition-colors shadow-subtle"
          >
            <ArrowLeft size={14} />
            Back to my active app ({currentRole})
          </button>
        </div>
      </div>
    </div>
  );
};

