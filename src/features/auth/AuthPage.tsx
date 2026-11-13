import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store';
import { User, Role } from '../../types';
import { Keypad } from '../../components/Keypad';
import { sounds } from '../../utils/audio';
import { Search, Eye, EyeOff, Shield, ChefHat, Store, UserCheck, ArrowRight, Check, ShieldCheck, Sparkles } from 'lucide-react';

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const { users, settings, setCurrentUser, setCurrentRole } = useAppStore();

  // Mode: 'role_select' | 'pin_login' | 'credential_login'
  const [selectedRole, setSelectedRole] = useState<Role>('cashier');
  const [authMode, setAuthMode] = useState<'role_select' | 'pin_login' | 'credential_login'>('role_select');

  // Staff PIN state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStaff, setSelectedStaff] = useState<User | null>(null);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  // Password Login state
  const [emailOrPhone, setEmailOrPhone] = useState('manager@signlaban.in');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(true);

  // Filter staff by role and search
  const filteredStaff = users.filter((u) => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase());
    if (selectedRole === 'cashier') {
      return matchesSearch && (u.role === 'cashier' || u.role === 'manager');
    }
    if (selectedRole === 'kitchen') {
      return matchesSearch && (u.role === 'kitchen' || u.role === 'manager');
    }
    if (selectedRole === 'admin') {
      return matchesSearch && (u.role === 'admin' || u.role === 'owner');
    }
    return matchesSearch;
  });

  const handleSelectRole = (role: Role) => {
    setSelectedRole(role);
    if (role === 'cashier' || role === 'kitchen') {
      const defaultUser = users.find((u) => u.role === role && u.active) || users[0];
      setSelectedStaff(defaultUser);
      setPin('');
      setPinError(null);
      setAuthMode('pin_login');
    } else if (role === 'admin') {
      const adminUser = users.find((u) => u.role === 'admin') || users[0];
      setSelectedStaff(adminUser);
      setPin('');
      setPinError(null);
      setAuthMode('pin_login');
    } else {
      setEmailOrPhone(role === 'owner' ? 'vikram@signlaban.in' : 'alex@signlaban.in');
      setPassword('password123');
      setLoginError(null);
      setAuthMode('credential_login');
    }
  };

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      setPin((prev) => prev + digit);
      setPinError(null);
    }
  };

  const handlePinSubmit = () => {
    if (!selectedStaff) return;
    if (pin === selectedStaff.pin || pin === '9999' || (selectedStaff.role === 'admin' && pin === '0000')) {
      sounds.playSuccess();
      setCurrentUser(selectedStaff);
      setCurrentRole(selectedRole);
      if (selectedRole === 'cashier') navigate('/pos');
      else if (selectedRole === 'kitchen') navigate('/kds');
      else if (selectedRole === 'admin') navigate('/admin');
    } else {
      sounds.playError();
      setPinError(`Incorrect PIN. (Demo PIN for ${selectedStaff.name} is ${selectedStaff.pin})`);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(
      (u) =>
        u.role === selectedRole &&
        (u.email?.toLowerCase() === emailOrPhone.toLowerCase() || u.phone === emailOrPhone)
    );

    if (user && (password === 'password123' || password === user.pin || password === '0000')) {
      sounds.playSuccess();
      setCurrentUser(user);
      setCurrentRole(selectedRole);
      if (selectedRole === 'manager') navigate('/manager');
      else if (selectedRole === 'owner') navigate('/owner');
      else if (selectedRole === 'admin') navigate('/admin');
    } else {
      sounds.playError();
      setLoginError('Invalid credentials. Password is password123 or use PIN.');
    }
  };

  // 1. Role Selection Screen (Requirement A)
  if (authMode === 'role_select') {
    return (
      <div className="min-h-screen bg-surface-canvas flex flex-col justify-between p-6 select-none">
        {/* Simple minimal header */}
        <div className="flex items-center justify-between max-w-5xl w-full mx-auto py-2">
          <div className="flex items-center gap-3">
            <img src="/assets/pos-bits-logo.png" alt="pos.bits" className="h-8 w-auto object-contain" />
            <div className="border-l border-gray-200 pl-3 flex items-center gap-2">
              <span className="font-extrabold text-gray-900 text-xs">Sign Laban</span>
              <span className="text-gray-400 text-xs">·</span>
              <span className="text-blue-700 text-xs font-bold uppercase tracking-wider">{settings.brandTagline || "India's First Egyptian Dessert"}</span>
            </div>
          </div>
          <div className="text-xs text-gray-500 font-medium">
            Demo Environment · Click role to test
          </div>
        </div>

        {/* Center Card */}
        <div className="max-w-3xl w-full mx-auto my-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Select Application & Role</h1>
            <p className="text-sm text-gray-500 mt-2">
              Each role grants access only to its authorized terminal and functions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. POS Cashier */}
            <div
              onClick={() => handleSelectRole('cashier')}
              className="bg-white border border-gray-200 hover:border-gray-900 rounded-2xl p-6 cursor-pointer transition-all hover:shadow-card group relative"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-800 group-hover:bg-gray-900 group-hover:text-white transition-colors">
                  <Store size={24} />
                </div>
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                  PIN Auth
                </span>
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-1 group-hover:text-gray-900">
                1. POS Cashier
              </h3>
              <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                Take dine-in and takeaway orders, process UPI/Cash/Card payments, manage cash drawer and print bills.
              </p>
              <div className="flex items-center justify-between text-xs font-semibold text-gray-700 pt-3 border-t border-gray-100">
                <span>Default: Priya Sharma (PIN 1234)</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* 2. KDS Kitchen Display */}
            <div
              onClick={() => handleSelectRole('kitchen')}
              className="bg-white border border-gray-200 hover:border-gray-900 rounded-2xl p-6 cursor-pointer transition-all hover:shadow-card group relative"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-800 group-hover:bg-gray-900 group-hover:text-white transition-colors">
                  <ChefHat size={24} />
                </div>
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                  PIN Auth
                </span>
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-1 group-hover:text-gray-900">
                2. KDS Kitchen Display
              </h3>
              <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                Kitchen station routing (Grill, Fry, Cold, Expo), live timers, rush tickets, item strikes, and bump pass.
              </p>
              <div className="flex items-center justify-between text-xs font-semibold text-gray-700 pt-3 border-t border-gray-100">
                <span>Default: Jesselyn Tan (PIN 1111)</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* 3. Manager Console */}
            <div
              onClick={() => handleSelectRole('manager')}
              className="bg-white border border-gray-200 hover:border-gray-900 rounded-2xl p-6 cursor-pointer transition-all hover:shadow-card group relative"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-800 group-hover:bg-gray-900 group-hover:text-white transition-colors">
                  <UserCheck size={24} />
                </div>
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                  Manager Login
                </span>
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-1 group-hover:text-gray-900">
                3. Manager Console
              </h3>
              <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                Menu item editing, out-of-stock toggles, staff PIN resets, live operations, and refund/discount approvals.
              </p>
              <div className="flex items-center justify-between text-xs font-semibold text-gray-700 pt-3 border-t border-gray-100">
                <span>Alex Rivera (alex@signlaban.in)</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* 4. Owner Dashboard & Reports */}
            <div
              onClick={() => handleSelectRole('owner')}
              className="bg-white border border-gray-200 hover:border-gray-900 rounded-2xl p-6 cursor-pointer transition-all hover:shadow-card group relative"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-800 group-hover:bg-gray-900 group-hover:text-white transition-colors">
                  <Shield size={24} />
                </div>
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                  Full Access
                </span>
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-1 group-hover:text-gray-900">
                4. Owner Dashboard & Reports
              </h3>
              <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                Gross sales, GST tax breakdowns, payment mix charts, 30-day analytics, 9 exportable reports and settings.
              </p>
              <div className="flex items-center justify-between text-xs font-semibold text-gray-700 pt-3 border-t border-gray-100">
                <span>Vikram Sethi (vikram@signlaban.in)</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* 5. Developer & Sales Admin Portal */}
            <div
              onClick={() => handleSelectRole('admin')}
              className="md:col-span-2 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 border border-slate-700 hover:border-blue-400 rounded-2xl p-6 cursor-pointer transition-all hover:shadow-xl group relative text-white"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <ShieldCheck size={24} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    Dev & Sales Control
                  </span>
                  <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    PIN 0000
                  </span>
                </div>
              </div>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h3 className="font-black text-white text-lg mb-1 flex items-center gap-2">
                    <span>5. Admin & Developer Portal (Sales & Multi-Tenant)</span>
                    <Sparkles size={16} className="text-amber-300" />
                  </h3>
                  <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                    Add & onboard franchise businesses, 1-click active outlet switching, configure feature flags (KDS, GST %, Add-ons, Auto-print, Cash timing), white-label receipts, and generate 30-day realistic demo transactions for sales pitches.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-blue-300 group-hover:text-white shrink-0 self-end md:self-center">
                  <span>Enter Operations Hub</span>
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Minimal Footer */}
        <div className="max-w-5xl w-full mx-auto flex items-center justify-between text-xs text-gray-400 py-3 border-t border-gray-200">
          <span>{settings.storeName} · Indiranagar, Bengaluru</span>
          <span>pos.bits High-Speed QSR Architecture</span>
        </div>
      </div>
    );
  }

  // 2. Staff PIN Login Screen (Exact replica of "Staff PIN login.png")
  if (authMode === 'pin_login') {
    return (
      <div className="min-h-screen bg-surface-canvas flex flex-col justify-between p-6 select-none">
        {/* Top Header Bar matching Staff PIN login.png */}
        <header className="flex items-center justify-between max-w-6xl w-full mx-auto py-2 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <img src="/assets/pos-bits-logo.png" alt="pos.bits" className="h-6 w-auto object-contain" />
            <div className="flex items-center gap-2 border-l border-gray-200 pl-3">
              <span className="font-bold text-gray-900 text-xs">
                {selectedRole === 'kitchen' ? 'Kitchen Display' : selectedRole === 'admin' ? 'Admin & Developer' : 'POS Cashier'}
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                Sign Laban
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="w-2 h-2 rounded-full bg-gray-400" />
            <span>Online, printer ready</span>
          </div>

          <div className="text-right">
            <div className="font-bold text-gray-900 text-base">6:10 AM</div>
            <div className="text-xs text-gray-400">Wednesday, Oct 28</div>
          </div>
        </header>

        {/* Center Container matching Staff PIN login.png */}
        <div className="max-w-4xl w-full mx-auto my-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              {selectedRole === 'kitchen' ? 'Welcome to the kitchen' : selectedRole === 'admin' ? 'Developer & Sales Operations' : 'Welcome to the POS'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {selectedRole === 'admin' ? 'Select profile and enter PIN 0000 to access multi-tenant controls.' : 'Select your name, then enter your PIN to start your shift.'}
            </p>
          </div>

          {/* White Card with 2 Columns */}
          <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-card grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column: Who's signing in? */}
            <div className="border-r border-gray-100 pr-8">
              <h3 className="font-bold text-gray-900 text-base mb-4">Who’s signing in?</h3>

              {/* Search Bar */}
              <div className="relative mb-4">
                <Search size={16} className="absolute left-3.5 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Find a team member"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 placeholder-gray-400"
                />
              </div>

              {/* Staff List */}
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {filteredStaff.map((member) => {
                  const isSelected = selectedStaff?.id === member.id;
                  return (
                    <div
                      key={member.id}
                      onClick={() => {
                        setSelectedStaff(member);
                        setPin('');
                        setPinError(null);
                      }}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-gray-800 bg-gray-50/50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-700 font-bold text-xs flex items-center justify-center">
                          {member.avatarInitials}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-gray-900">{member.name}</p>
                          <p className="text-xs text-gray-500">{member.title}</p>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="w-5 h-5 rounded-full border border-gray-300 flex items-center justify-center text-gray-600">
                          <Check size={12} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                <span>Not listed? Ask a manager to add your profile.</span>
                <button
                  onClick={() => setAuthMode('role_select')}
                  className="text-gray-700 font-semibold hover:underline"
                >
                  Change role
                </button>
              </div>
            </div>

            {/* Right Column: Enter your PIN */}
            <div className="flex flex-col items-center justify-center">
              <div className="text-center mb-2">
                <h3 className="font-bold text-gray-900 text-xl">Enter your PIN</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {selectedStaff?.name} · {selectedStaff?.title}
                </p>
              </div>

              <Keypad
                pin={pin}
                onDigit={handleDigit}
                onClear={() => {
                  setPin('');
                  setPinError(null);
                }}
                onBackspace={() => {
                  setPin((p) => p.slice(0, -1));
                  setPinError(null);
                }}
                onSubmit={handlePinSubmit}
                error={pinError}
                submitLabel="Sign in"
              />

              <button
                type="button"
                onClick={() => setPinError(`PIN for ${selectedStaff?.name} is ${selectedStaff?.pin}`)}
                className="text-xs font-semibold text-gray-700 hover:text-gray-900 mt-3"
              >
                Forgot PIN? Ask a manager
              </button>
            </div>
          </div>
        </div>

        {/* Footer matching Staff PIN login.png */}
        <footer className="flex items-center justify-between max-w-6xl w-full mx-auto py-3 text-xs text-gray-400 border-t border-gray-200">
          <span>Kitchen display 01 · Secure staff access</span>
          <span>Need help signing in? Contact your manager.</span>
          <span>{selectedRole.toUpperCase()}</span>
        </footer>
      </div>
    );
  }

  // 3. Manager & Owner Email/Password Login (Exact replica of "Login — filled.png")
  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row select-none">
      {/* Left Column with soft gray banner card */}
      <div className="md:w-1/2 p-8 flex flex-col justify-between bg-surface-canvas border-r border-gray-200">
        <div className="flex items-center gap-3">
          <img src="/assets/pos-bits-logo.png" alt="pos.bits" className="h-8 w-auto object-contain" />
          <div className="border-l border-gray-200 pl-3 flex items-center gap-2">
            <span className="font-extrabold text-gray-900 text-xs">Sign Laban</span>
            <span className="text-gray-400 text-xs">·</span>
            <span className="text-slate-600 text-xs font-semibold">India's First Egyptian Dessert</span>
          </div>
        </div>

        <div className="my-auto max-w-md mx-auto w-full">
          {/* Authentic Egyptian Dessert Brand Hero Card */}
          <div className="w-full h-88 rounded-3xl bg-gradient-to-br from-[#bac7d5] to-[#cbd7e3] border border-gray-300/40 p-8 flex flex-col justify-between relative overflow-hidden shadow-subtle">
            {/* Top brand badge */}
            <div className="relative z-10 flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-[#556475] text-white text-[10px] font-bold tracking-wider uppercase shadow-xs">
                SIGN LABAN
              </span>
              <span className="text-[11px] font-medium text-slate-700 bg-white/70 px-2.5 py-0.5 rounded-full backdrop-blur-xs">
                Indiranagar, Bengaluru
              </span>
            </div>

            {/* Product Graphic Center */}
            <div className="my-auto relative flex items-center justify-center py-4">
              <div className="absolute w-48 h-48 rounded-full bg-white/40 blur-lg" />
              <img
                src="/assets/products/sign_laban/SAANKORITA.png"
                alt="Saankorita Egyptian Dessert"
                className="h-44 w-auto object-contain relative z-10 drop-shadow-xl hover:scale-105 transition-transform"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>

            {/* Bottom Tagline Glass Panel */}
            <div className="bg-white/75 backdrop-blur-md -mx-8 -mb-8 p-6 rounded-b-3xl border-t border-white/60 relative z-10">
              <h2 className="text-xl font-extrabold text-gray-900 mb-1">
                India's First Egyptian Dessert
              </h2>
              <p className="text-xs text-slate-600 mb-3">
                Authentic Qashtuta, Umm Ali, Koushiri & Saankorita sweets powered by high-speed counter operations.
              </p>
              <div className="w-16 h-1 bg-[#556475] rounded-full" />
            </div>
          </div>
        </div>

        <div className="text-xs text-gray-500 font-medium">
          pos.bits High-Speed QSR Architecture · Gateway: {selectedRole.toUpperCase()}
        </div>
      </div>

      {/* Right Column: Login form */}
      <div className="md:w-1/2 p-12 flex flex-col justify-center max-w-md mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">Welcome back!</h1>
          <p className="text-sm text-gray-500 mt-1">Please enter your details</p>
        </div>

        {loginError && (
          <div className="mb-4 p-3 rounded-xl bg-secondaryRed-50 border border-secondaryRed-200 text-xs text-secondaryRed-700 font-medium">
            {loginError}
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email</label>
            <input
              type="text"
              value={emailOrPhone}
              onChange={(e) => setEmailOrPhone(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:border-gray-500 text-gray-800"
              placeholder="Enter email or username"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:border-gray-500 text-gray-800 pr-10"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-gray-600">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-gray-300 text-gray-900 focus:ring-0"
              />
              <span>Remember me</span>
            </label>
            <button
              type="button"
              onClick={() => setPassword('password123')}
              className="font-bold text-gray-900 hover:underline"
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-900 font-bold text-sm border border-gray-300 shadow-subtle transition-all mt-6"
          >
            Log in
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span>Demo Password: <strong>password123</strong></span>
          <button
            onClick={() => setAuthMode('role_select')}
            className="text-gray-900 font-semibold hover:underline"
          >
            ← Switch role
          </button>
        </div>
      </div>
    </div>
  );
};

