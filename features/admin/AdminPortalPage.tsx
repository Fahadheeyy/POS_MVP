"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useNavigate } from '@/lib/navigation';
import { useAppStore } from '../../store';
import { BusinessTenant } from '../../types';
import { Header } from '../../components/Header';
import { formatINR } from '../../utils/formatters';
import { sounds } from '../../utils/audio';
import {
  onboardOwnerAndOutletAction,
  addOutletToTenantAction,
  updateOutletConfigAction,
  deleteOutletAction,
  seedDemoOrdersAction,
  switchAdminOutletAction,
} from '@/app/admin/actions';
import {
  Building2,
  Plus,
  Check,
  CheckCircle2,
  Sliders,
  Receipt,
  Download,
  Trash2,
  Edit3,
  ExternalLink,
  ShieldCheck,
  Layers,
  Sparkles,
  Volume2,
  Search,
  Store,
  ChefHat,
  MonitorCheck,
  BarChart3,
  Wifi,
  Printer,
  X,
  CreditCard,
  QrCode,
  Banknote,
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Key,
  Percent,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';

const INDIAN_STATES = [
  { code: '29', name: 'Karnataka' },
  { code: '27', name: 'Maharashtra' },
  { code: '07', name: 'Delhi' },
  { code: '33', name: 'Tamil Nadu' },
  { code: '36', name: 'Telangana' },
  { code: '09', name: 'Uttar Pradesh' },
  { code: '19', name: 'West Bengal' },
  { code: '24', name: 'Gujarat' },
  { code: '32', name: 'Kerala' },
  { code: '06', name: 'Haryana' },
  { code: '08', name: 'Rajasthan' },
  { code: '23', name: 'Madhya Pradesh' },
  { code: '03', name: 'Punjab' },
  { code: '37', name: 'Andhra Pradesh' },
  { code: '21', name: 'Odisha' },
  { code: '10', name: 'Bihar' },
  { code: '30', name: 'Goa' },
  { code: '18', name: 'Assam' },
  { code: '02', name: 'Himachal Pradesh' },
  { code: '05', name: 'Uttarakhand' },
  { code: '01', name: 'Jammu & Kashmir' },
  { code: '04', name: 'Chandigarh' },
];

export interface AdminWorkspaceBusiness extends BusinessTenant {
  tenantId?: string;
  code?: string;
  ownerProfileId?: string | null;
  orderCount?: number;
  gmv?: number;
}

export interface AdminWorkspaceProps {
  mode?: 'supabase' | 'demo';
  initialBusinesses?: AdminWorkspaceBusiness[];
  initialStats?: {
    totalGmv: number;
    totalOrders: number;
    totalTickets: number;
    totalProducts: number;
  };
  initialActiveOutletId?: string;
  adminUser?: {
    id: string;
    name: string;
    email: string;
    avatarInitials: string;
    title: string;
  };
  states?: Array<{ code: string; name: string }>;
}

type ModalMode = 'add_owner' | 'add_outlet' | 'edit_outlet';
type WizardStep = 'owner' | 'brand' | 'plan' | 'tax' | 'operations';

const PLAN_OPTIONS = [
  {
    tier: 'starter' as const,
    name: 'Basic Plan',
    price: '₹1,499',
    bullets: ['1 outlet · 3 staff', 'Counter billing & POS', 'End-of-day sales reports'],
  },
  {
    tier: 'growth' as const,
    name: 'Pro Plan',
    price: '₹3,999',
    bullets: ['Up to 5 outlets · 15 staff', 'Kitchen Display System', 'Loyalty & coupons'],
  },
  {
    tier: 'enterprise' as const,
    name: 'Custom Plan',
    price: '₹7,999',
    bullets: ['Unlimited outlets & staff', 'Delivery integrations', 'Custom domain & API access'],
  },
];

export const AdminPortalPage: React.FC<AdminWorkspaceProps> = ({
  mode = 'demo',
  initialBusinesses,
  initialStats,
  initialActiveOutletId,
  adminUser,
  states,
}) => {
  const router = useRouter();
  const navigate = useNavigate();
  const store = useAppStore();

  const isSupabase = mode === 'supabase';
  const stateOptions = states && states.length > 0 ? states : INDIAN_STATES;

  const [cloudBusinesses, setCloudBusinesses] = useState<AdminWorkspaceBusiness[]>(initialBusinesses ?? []);
  const [cloudActiveId, setCloudActiveId] = useState<string>(
    initialActiveOutletId || initialBusinesses?.[0]?.id || ''
  );

  useEffect(() => {
    if (isSupabase && initialBusinesses) {
      setCloudBusinesses(initialBusinesses);
    }
  }, [isSupabase, initialBusinesses]);

  useEffect(() => {
    if (isSupabase && adminUser) {
      const currentActive = cloudBusinesses.find((b) => b.id === cloudActiveId) || cloudBusinesses[0];
      useAppStore.setState((prev) => ({
        ...prev,
        currentRole: 'admin',
        currentUser: {
          id: adminUser.id,
          name: adminUser.name,
          email: adminUser.email,
          phone: '',
          role: 'admin',
          pin: '',
          avatarInitials: adminUser.avatarInitials,
          title: adminUser.title,
          active: true,
        },
        settings: currentActive
          ? { ...prev.settings, storeName: currentActive.name }
          : prev.settings,
      }));
    }
  }, [isSupabase, adminUser, cloudActiveId, cloudBusinesses]);

  const businesses: AdminWorkspaceBusiness[] = isSupabase ? cloudBusinesses : store.businesses;
  const activeBusinessId = isSupabase ? cloudActiveId : store.activeBusinessId;

  const [activeTab, setActiveTab] = useState<'businesses' | 'features' | 'telemetry'>('businesses');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTier, setFilterTier] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('add_owner');
  const [modalStep, setModalStep] = useState<WizardStep>('owner');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [editingBusiness, setEditingBusiness] = useState<AdminWorkspaceBusiness | null>(null);
  const [targetTenantForBranch, setTargetTenantForBranch] = useState<{
    tenantId: string;
    ownerProfileId?: string | null;
    ownerName: string;
    brandName: string;
    category: string;
    tagline: string;
    planTier: 'trial' | 'starter' | 'growth' | 'enterprise';
    gstin: string;
    legalEntityName: string;
  } | null>(null);
  const [selectedBusinessForCustomization, setSelectedBusinessForCustomization] = useState<string>(
    activeBusinessId || businesses[0]?.id || ''
  );
  const [notification, setNotification] = useState<string | null>(null);

  // Modal Form State
  const [formName, setFormName] = useState('');
  const [formBrandName, setFormBrandName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formTagline, setFormTagline] = useState('');
  const [formCategory, setFormCategory] = useState('Specialty Coffee');
  const [formAddress, setFormAddress] = useState('');
  const [formCity, setFormCity] = useState('Bengaluru');
  const [formPincode, setFormPincode] = useState('560034');
  const [formPhone, setFormPhone] = useState('+91 98450 12345');
  const [formEmail, setFormEmail] = useState('contact@outlet.in');
  const [formPlanTier, setFormPlanTier] = useState<'trial' | 'starter' | 'growth' | 'enterprise'>('growth');
  const [formThemeColor, setFormThemeColor] = useState('#FF4F1A');

  const [formOwnerName, setFormOwnerName] = useState('');
  const [formOwnerEmail, setFormOwnerEmail] = useState('');
  const [formOwnerPassword, setFormOwnerPassword] = useState('');
  const [formOwnerPhone, setFormOwnerPhone] = useState('');
  const [formOwnerPin, setFormOwnerPin] = useState('8888');

  const [formLegalEntityName, setFormLegalEntityName] = useState('');
  const [formStateCode, setFormStateCode] = useState('29');
  const [formStateName, setFormStateName] = useState('Karnataka');
  const [formGstin, setFormGstin] = useState('29AABCS1429B1Z2');
  const [formFssai, setFormFssai] = useState('11223344556677');
  const [formGstEnabled, setFormGstEnabled] = useState(true);
  const [formGstRate, setFormGstRate] = useState(5);
  const [formIsCompositionScheme, setFormIsCompositionScheme] = useState(false);
  const [formServiceChargePercent, setFormServiceChargePercent] = useState(0);

  const [formKdsEnabled, setFormKdsEnabled] = useState(true);
  const [formKdsTargetMinutes, setFormKdsTargetMinutes] = useState(7);
  const [formTableManagement, setFormTableManagement] = useState(true);
  const [formTableCount, setFormTableCount] = useState(16);
  const [formAddOnsEnabled, setFormAddOnsEnabled] = useState(true);
  const [formAutoPrint, setFormAutoPrint] = useState(true);
  const [formCashTiming, setFormCashTiming] = useState<'before' | 'after'>('before');
  const [formEnabledCash, setFormEnabledCash] = useState(true);
  const [formEnabledUpi, setFormEnabledUpi] = useState(true);
  const [formEnabledCard, setFormEnabledCard] = useState(true);
  const [formUpiVpaId, setFormUpiVpaId] = useState('');
  const [formReceiptHeader, setFormReceiptHeader] = useState('');
  const [formReceiptFooter, setFormReceiptFooter] = useState('');
  const [formWifiPassword, setFormWifiPassword] = useState('GuestWiFi2026');

  const triggerToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const activeTenant = businesses.find((b) => b.id === activeBusinessId) || businesses[0];
  const targetTenant = businesses.find((b) => b.id === selectedBusinessForCustomization) || activeTenant;

  const filteredBusinesses = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return businesses.filter((b) => {
      const matchesSearch =
        !q ||
        b.name.toLowerCase().includes(q) ||
        b.brandName.toLowerCase().includes(q) ||
        b.address.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q) ||
        (b.ownerEmail && b.ownerEmail.toLowerCase().includes(q)) ||
        (b.ownerName && b.ownerName.toLowerCase().includes(q));
      const matchesTier = filterTier === 'all' || b.planTier === filterTier;
      return matchesSearch && matchesTier;
    });
  }, [businesses, searchTerm, filterTier]);

  // Group filtered outlets by owner / tenant so each owner row displays cleanly
  const ownerGroups = useMemo(() => {
    const map = new Map<
      string,
      {
        key: string;
        ownerName: string;
        ownerEmail: string;
        ownerProfileId?: string | null;
        tenantId: string;
        outlets: AdminWorkspaceBusiness[];
      }
    >();

    for (const biz of filteredBusinesses) {
      const tenantId = biz.tenantId || biz.id;
      const ownerName = biz.ownerName || `${biz.brandName} Owner`;
      const ownerEmail = biz.ownerEmail || biz.email;
      const groupKey = biz.ownerProfileId || `${ownerName}::${tenantId}`;
      const existing = map.get(groupKey);
      if (existing) {
        existing.outlets.push(biz);
      } else {
        map.set(groupKey, {
          key: groupKey,
          ownerName,
          ownerEmail,
          ownerProfileId: biz.ownerProfileId,
          tenantId,
          outlets: [biz],
        });
      }
    }
    return Array.from(map.values());
  }, [filteredBusinesses]);

  const totalRevenue = isSupabase
    ? (initialStats?.totalGmv ?? 0)
    : store.orders.reduce((acc, o) => acc + (o.total || 0), 0);
  const totalOrders = isSupabase ? (initialStats?.totalOrders ?? 0) : store.orders.length;
  const totalTickets = isSupabase ? (initialStats?.totalTickets ?? 0) : store.tickets.length;
  const totalProducts = isSupabase ? (initialStats?.totalProducts ?? 0) : store.products.length;

  const resetFormDefaults = (overrides?: Partial<{
    ownerName: string;
    ownerEmail: string;
    ownerPhone: string;
    brandName: string;
    category: string;
    tagline: string;
    planTier: 'trial' | 'starter' | 'growth' | 'enterprise';
    gstin: string;
    legalEntityName: string;
  }>) => {
    setModalError(null);
    setFormName('');
    setFormBrandName(overrides?.brandName ?? '');
    setFormSlug('');
    setFormTagline(overrides?.tagline ?? '');
    setFormCategory(overrides?.category ?? 'Specialty Coffee');
    setFormAddress('');
    setFormCity('Bengaluru');
    setFormPincode('560034');
    setFormPhone('+91 98450 12345');
    setFormEmail('contact@outlet.in');
    setFormPlanTier(overrides?.planTier ?? 'growth');
    setFormThemeColor('#FF4F1A');

    setFormOwnerName(overrides?.ownerName ?? '');
    setFormOwnerEmail(overrides?.ownerEmail ?? '');
    setFormOwnerPassword('');
    setFormOwnerPhone(overrides?.ownerPhone ?? '');
    setFormOwnerPin('8888');

    setFormLegalEntityName(overrides?.legalEntityName ?? '');
    setFormStateCode('29');
    setFormStateName('Karnataka');
    setFormGstin(overrides?.gstin ?? '29AABCS1429B1Z2');
    setFormFssai('11223344556677');
    setFormGstEnabled(true);
    setFormGstRate(5);
    setFormIsCompositionScheme(false);
    setFormServiceChargePercent(0);

    setFormKdsEnabled(true);
    setFormKdsTargetMinutes(7);
    setFormTableManagement(true);
    setFormTableCount(16);
    setFormAddOnsEnabled(true);
    setFormAutoPrint(true);
    setFormCashTiming('before');
    setFormEnabledCash(true);
    setFormEnabledUpi(true);
    setFormEnabledCard(true);
    setFormUpiVpaId('');
    setFormReceiptHeader('');
    setFormReceiptFooter('Thank you for dining with us!');
    setFormWifiPassword('GuestWiFi2026');
  };

  const handleOpenAddOwnerModal = () => {
    resetFormDefaults();
    setEditingBusiness(null);
    setTargetTenantForBranch(null);
    setModalMode('add_owner');
    setModalStep('owner');
    setShowAddModal(true);
  };

  const handleOpenAddOutletModal = (group: {
    ownerName: string;
    ownerEmail: string;
    ownerProfileId?: string | null;
    tenantId: string;
    outlets: AdminWorkspaceBusiness[];
  }) => {
    const sample = group.outlets[0];
    resetFormDefaults({
      ownerName: group.ownerName,
      ownerEmail: group.ownerEmail,
      brandName: sample?.brandName || '',
      category: sample?.category || 'Specialty Coffee',
      tagline: sample?.tagline || '',
      planTier: sample?.planTier || 'growth',
      gstin: sample?.gstin || '29AABCS1429B1Z2',
      legalEntityName: sample?.legalEntityName || sample?.brandName || '',
    });
    setEditingBusiness(null);
    setTargetTenantForBranch({
      tenantId: group.tenantId,
      ownerProfileId: group.ownerProfileId,
      ownerName: group.ownerName,
      brandName: sample?.brandName || '',
      category: sample?.category || 'QSR',
      tagline: sample?.tagline || '',
      planTier: sample?.planTier || 'growth',
      gstin: sample?.gstin || '',
      legalEntityName: sample?.legalEntityName || '',
    });
    setModalMode('add_outlet');
    setModalStep('brand');
    setShowAddModal(true);
  };

  const handleEditBusinessModal = (biz: AdminWorkspaceBusiness) => {
    setModalError(null);
    setFormName(biz.name);
    setFormBrandName(biz.brandName);
    setFormSlug(biz.slug);
    setFormTagline(biz.tagline || '');
    setFormCategory(biz.category);
    setFormAddress(biz.address);
    setFormCity(biz.city || 'Bengaluru');
    setFormPincode(biz.pincode || '560034');
    setFormPhone(biz.phone);
    setFormEmail(biz.email);
    setFormPlanTier(biz.planTier);
    setFormThemeColor(biz.themeColor || '#FF4F1A');

    setFormOwnerName(biz.ownerName || 'Franchise Owner');
    setFormOwnerEmail(biz.ownerEmail || biz.email);
    setFormOwnerPassword('');
    setFormOwnerPhone(biz.ownerPhone || biz.phone);
    setFormOwnerPin(biz.ownerPin || '8888');

    setFormLegalEntityName(biz.legalEntityName || biz.brandName);
    setFormStateCode(biz.stateCode || '29');
    setFormStateName(biz.stateName || 'Karnataka');
    setFormGstin(biz.gstin);
    setFormFssai(biz.fssai);
    setFormGstEnabled(biz.features.gstEnabled);
    setFormGstRate(biz.features.gstRate);
    setFormIsCompositionScheme(!!biz.isCompositionScheme);
    setFormServiceChargePercent(biz.serviceChargePercent || 0);

    setFormKdsEnabled(biz.features.kdsEnabled);
    setFormKdsTargetMinutes(biz.kdsTargetMinutes || 7);
    setFormTableManagement(biz.features.tableManagement);
    setFormTableCount(biz.tableCount || 16);
    setFormAddOnsEnabled(biz.features.addOnsEnabled);
    setFormAutoPrint(biz.features.autoPrintReceipt);
    setFormCashTiming(biz.features.cashTiming);
    setFormEnabledCash(biz.features.enabledPayments?.cash ?? true);
    setFormEnabledUpi(biz.features.enabledPayments?.upi ?? true);
    setFormEnabledCard(biz.features.enabledPayments?.card ?? true);
    setFormUpiVpaId(biz.upiVpaId || `${biz.slug}@okicici`);
    setFormReceiptHeader(biz.features.receiptHeader || `*** ${biz.name.toUpperCase()} ***`);
    setFormReceiptFooter(biz.features.receiptFooter || 'Thank you for dining with us!');
    setFormWifiPassword(biz.features.wifiPassword || '');

    setEditingBusiness(biz);
    setTargetTenantForBranch(null);
    setModalMode('edit_outlet');
    setModalStep('brand');
    setShowAddModal(true);
  };

  const stepsForMode: Array<{ id: WizardStep; label: string }> =
    modalMode === 'add_owner'
      ? [
          { id: 'owner', label: '1. Owner & Login Credentials' },
          { id: 'brand', label: '2. First Outlet & Brand' },
          { id: 'plan', label: '3. Plan Selection' },
          { id: 'tax', label: '4. GST & Legal Profile' },
          { id: 'operations', label: '5. Operations & Hardware' },
        ]
      : [
          { id: 'brand', label: '1. Outlet & Brand' },
          { id: 'plan', label: '2. Plan Selection' },
          { id: 'tax', label: '3. GST & Legal Profile' },
          { id: 'operations', label: '4. Operations & Hardware' },
        ];

  const currentStepIdx = stepsForMode.findIndex((s) => s.id === modalStep);
  const progressPct = ((currentStepIdx + 1) / stepsForMode.length) * 100;

  const canAdvanceFromStep = () => {
    if (modalStep === 'owner') {
      return Boolean(formOwnerName.trim() && formOwnerEmail.trim() && formOwnerPassword.length >= 6);
    }
    if (modalStep === 'brand') {
      return Boolean(formName.trim() && formBrandName.trim() && formAddress.trim());
    }
    return true;
  };

  const handleSaveBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    if (!formName.trim() || !formBrandName.trim()) {
      setModalError('Outlet name and brand name are required.');
      setModalStep('brand');
      return;
    }

    const commonPayload = {
      name: formName.trim(),
      brandName: formBrandName.trim(),
      slug: formSlug.trim() || formName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      tagline: formTagline.trim(),
      category: formCategory.trim() || 'QSR',
      address: formAddress.trim() || '12th Main Rd',
      city: formCity.trim() || 'Bengaluru',
      pincode: formPincode.trim() || '560034',
      phone: formPhone.trim() || '+91 98450 12345',
      email: formEmail.trim() || 'contact@outlet.in',
      planTier: formPlanTier,
      themeColor: formThemeColor,
      stateCode: formStateCode,
      legalEntityName: formLegalEntityName.trim() || formBrandName.trim(),
      gstin: formGstin.trim().toUpperCase(),
      fssai: formFssai.trim(),
      serviceChargePercent: Number(formServiceChargePercent) || 0,
      isCompositionScheme: formIsCompositionScheme,
      tableCount: Number(formTableCount) || 16,
      kdsTargetMinutes: Number(formKdsTargetMinutes) || 7,
      upiVpaId: formUpiVpaId.trim(),
      ownerPin: formOwnerPin || '8888',
      features: {
        kdsEnabled: formKdsEnabled,
        gstEnabled: formGstEnabled,
        gstRate: formGstRate,
        addOnsEnabled: formAddOnsEnabled,
        autoPrintReceipt: formAutoPrint,
        cashTiming: formCashTiming,
        tableManagement: formTableManagement,
        receiptHeader: formReceiptHeader,
        receiptFooter: formReceiptFooter,
        wifiPassword: formWifiPassword,
        enabledPayments: {
          cash: formEnabledCash,
          upi: formEnabledUpi,
          card: formEnabledCard,
        },
      },
    };

    if (!isSupabase) {
      if (editingBusiness) {
        store.updateBusiness(editingBusiness.id, {
          ...commonPayload,
          stateName: formStateName,
          ownerName: formOwnerName,
          ownerEmail: formOwnerEmail,
          ownerPhone: formOwnerPhone,
          features: { ...editingBusiness.features, ...commonPayload.features },
        });
        triggerToast(`Updated ${formName}`);
      } else {
        store.addBusiness({
          ...commonPayload,
          stateName: formStateName,
          currency: 'INR',
          currencySymbol: '₹',
          status: 'active',
          renewalDate: '2027-11-12',
          ownerName: formOwnerName || targetTenantForBranch?.ownerName || 'Franchise Owner',
          ownerEmail: formOwnerEmail || formEmail,
          ownerPassword: formOwnerPassword || 'password123',
          ownerPhone: formOwnerPhone || formPhone,
          features: { ...commonPayload.features, loyaltyEnabled: true },
        });
        triggerToast(`Added outlet ${formName}`);
      }
      setShowAddModal(false);
      return;
    }

    setIsSubmitting(true);
    try {
      if (modalMode === 'edit_outlet' && editingBusiness) {
        const res = await updateOutletConfigAction(editingBusiness.id, commonPayload);
        if (!res.success) {
          setModalError(res.error || 'Could not update outlet.');
          setIsSubmitting(false);
          return;
        }
        triggerToast(`Updated configuration for ${formName}`);
      } else if (modalMode === 'add_outlet' && targetTenantForBranch) {
        const res = await addOutletToTenantAction({
          ...commonPayload,
          tenantId: targetTenantForBranch.tenantId,
          ownerProfileId: targetTenantForBranch.ownerProfileId,
        });
        if (!res.success) {
          setModalError(res.error || 'Could not add outlet.');
          setIsSubmitting(false);
          return;
        }
        triggerToast(`Added branch ${formName} under ${targetTenantForBranch.ownerName}`);
      } else {
        const res = await onboardOwnerAndOutletAction({
          ...commonPayload,
          ownerName: formOwnerName.trim(),
          ownerPhone: formOwnerPhone.trim(),
          ownerEmail: formOwnerEmail.trim(),
          ownerPassword: formOwnerPassword,
        });
        if (!res.success) {
          setModalError(res.error || 'Could not onboard owner & outlet.');
          setIsSubmitting(false);
          return;
        }
        triggerToast(`Onboarded ${formName}! ${formOwnerEmail} can now sign in at /login.`);
      }

      sounds.playSuccess();
      setShowAddModal(false);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  const persistFeaturePatch = async (biz: AdminWorkspaceBusiness, patch: Record<string, unknown>, message: string) => {
    if (!isSupabase) {
      store.updateBusiness(biz.id, patch as Partial<BusinessTenant>);
      triggerToast(message);
      return;
    }
    setCloudBusinesses((prev) =>
      prev.map((item) => (item.id === biz.id ? ({ ...item, ...patch } as AdminWorkspaceBusiness) : item))
    );
    const res = await updateOutletConfigAction(biz.id, patch);
    if (!res.success) {
      triggerToast(`Save failed: ${res.error}`);
      router.refresh();
      return;
    }
    triggerToast(message);
    router.refresh();
  };

  const handleFeatureToggle = (key: keyof BusinessTenant['features'], value: unknown) => {
    if (!targetTenant) return;
    const updatedFeatures = { ...targetTenant.features, [key]: value };
    void persistFeaturePatch(targetTenant, { features: updatedFeatures }, `Updated ${String(key)} for ${targetTenant.name}`);
  };

  const handlePaymentToggle = (method: 'cash' | 'upi' | 'card') => {
    if (!targetTenant) return;
    const currentPayments = targetTenant.features.enabledPayments || { cash: true, upi: true, card: true };
    const updatedPayments = { ...currentPayments, [method]: !currentPayments[method] };
    handleFeatureToggle('enabledPayments', updatedPayments);
  };

  const handleSwitchOutlet = async (biz: AdminWorkspaceBusiness, goOwner = false) => {
    if (!isSupabase) {
      if (goOwner) {
        const res = store.launchAsOwner(biz.id);
        sounds.playSuccess();
        navigate(res.targetRoute || '/owner');
      } else {
        store.switchActiveBusiness(biz.id);
        sounds.playSuccess();
        triggerToast(`Switched active outlet to ${biz.name}`);
      }
      return;
    }

    const res = await switchAdminOutletAction(biz.id);
    if (!res.success) {
      triggerToast(res.error || 'Unable to switch outlet.');
      return;
    }
    sounds.playSuccess();
    setCloudActiveId(biz.id);
    if (goOwner) {
      window.location.assign('/owner');
    } else {
      triggerToast(`Active outlet set to ${biz.name}`);
      router.refresh();
    }
  };

  const handleSeedDemoData = async (bizId: string, name: string) => {
    if (!isSupabase) {
      store.seedSalesDemoData(bizId);
      sounds.playSuccess();
      triggerToast(`Seeded sales demo transactions for ${name}!`);
      return;
    }
    const res = await seedDemoOrdersAction(bizId);
    if (!res.success) {
      triggerToast(res.error || 'Failed to seed demo orders.');
      return;
    }
    sounds.playSuccess();
    triggerToast(`Seeded ${res.count ?? 5} live demo orders & GST invoices for ${name}!`);
    router.refresh();
  };

  const handleDeleteOutlet = async (biz: AdminWorkspaceBusiness) => {
    if (!window.confirm(`Archive outlet "${biz.name}"? Historical invoices are preserved.`)) return;
    if (!isSupabase) {
      store.deleteBusiness(biz.id);
      triggerToast(`Removed ${biz.name}`);
      return;
    }
    const res = await deleteOutletAction(biz.id);
    if (!res.success) {
      triggerToast(res.error || 'Could not archive outlet.');
      return;
    }
    triggerToast(`Archived ${biz.name}`);
    router.refresh();
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(businesses, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `tikkit_tenants_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    triggerToast('Exported tenants JSON');
  };

  const planBadgeClass = (tier: string) => {
    if (tier === 'enterprise') return 'bg-[#EFE6FD] text-[#5B21B6] border border-[#D8C5FA]';
    if (tier === 'growth') return 'bg-[#FDECE6] text-[#B93815] border border-[#F5C6B5]';
    if (tier === 'starter') return 'bg-[#E1F7F3] text-[#0F6E61] border border-[#AEE5DC]';
    return 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]';
  };

  return (
    <div className="min-h-screen bg-[#F3EEE6] flex flex-col select-none">
      <Header title="Developer & Sales Admin" subtitle="Multi-Tenant Platform Control Center" />

      {notification && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:bottom-6 sm:right-6 z-50 bg-[#161412] text-[#FFF4E0] px-4 sm:px-5 py-3 rounded-2xl border-2 border-[#FF4F1A] shadow-[4px_4px_0_0_#161412] flex items-center gap-3">
          <CheckCircle2 size={18} className="text-[#FFC72C] shrink-0" />
          <span className="text-xs font-semibold">{notification}</span>
        </div>
      )}

      <main className="max-w-7xl w-full mx-auto px-3.5 sm:px-4 md:px-6 py-4 sm:py-6 flex-1 flex flex-col gap-5">
        {/* Top Tab Navigation + GMV KPIs */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto max-w-full no-scrollbar whitespace-nowrap pb-1">
            <button
              type="button"
              onClick={() => setActiveTab('businesses')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'businesses'
                  ? 'bg-[#FFC72C] text-[#161412] border-2 border-[#161412] shadow-[2px_2px_0_0_#161412]'
                  : 'text-[#5E554C] hover:text-[#161412] hover:bg-[#FFF4E0]'
              }`}
            >
              <Building2 size={15} />
              <span>Client Businesses & Outlets ({businesses.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('features')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'features'
                  ? 'bg-[#FFC72C] text-[#161412] border-2 border-[#161412] shadow-[2px_2px_0_0_#161412]'
                  : 'text-[#5E554C] hover:text-[#161412] hover:bg-[#FFF4E0]'
              }`}
            >
              <Sliders size={15} />
              <span>Feature Flags & White-Labeling</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('telemetry')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'telemetry'
                  ? 'bg-[#FFC72C] text-[#161412] border-2 border-[#161412] shadow-[2px_2px_0_0_#161412]'
                  : 'text-[#5E554C] hover:text-[#161412] hover:bg-[#FFF4E0]'
              }`}
            >
              <MonitorCheck size={15} />
              <span>Diagnostics & Sales Demo Mock Engine</span>
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-3 text-xs text-[#5E554C]">
            <span>
              Platform GMV: <strong className="text-[#161412] font-extrabold">{formatINR(totalRevenue)}</strong>
            </span>
            <span>·</span>
            <span>
              Total Orders: <strong className="text-[#161412] font-extrabold">{totalOrders}</strong>
            </span>
          </div>
        </div>

        {/* TAB 1: CLIENT BUSINESSES & OUTLETS */}
        {activeTab === 'businesses' && (
          <div className="space-y-5">
            {/* Search, Filter & Add Owner Bar */}
            <div className="bg-[#FFF4E0] border-2 border-[#161412] rounded-2xl shadow-[4px_4px_0_0_#161412] p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto flex-1 max-w-lg">
                <div className="relative flex-1">
                  <Search size={15} className="absolute left-3.5 top-3 text-[#5E554C]" />
                  <input
                    type="text"
                    placeholder="Search brand, outlet name, address, or category..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-xl border-2 border-[#161412] bg-[#FFF4E0] text-xs font-medium text-[#161412]"
                  />
                </div>
                <select
                  value={filterTier}
                  onChange={(e) => setFilterTier(e.target.value)}
                  className="px-3 py-2 rounded-xl border-2 border-[#161412] text-xs font-bold text-[#161412] bg-[#FFF4E0]"
                >
                  <option value="all">All Tiers</option>
                  <option value="trial">Trial</option>
                  <option value="starter">Starter</option>
                  <option value="growth">Growth</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={handleExportJson}
                  className="px-3.5 py-2 rounded-xl border border-[#D9CFC0] bg-[#FAF1E4] hover:bg-[#F3E6D4] text-[#161412] text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Download size={14} />
                  <span>Export JSON</span>
                </button>
                <button
                  type="button"
                  onClick={handleOpenAddOwnerModal}
                  className="px-4 py-2 rounded-xl bg-[#FF4F1A] hover:bg-[#FF6333] text-[#161412] border-2 border-[#161412] shadow-[3px_3px_0_0_#161412] text-xs font-extrabold flex items-center gap-1.5 transition-transform active:translate-x-[1px] active:translate-y-[1px]"
                >
                  <Plus size={15} />
                  <span>Add Owner</span>
                </button>
              </div>
            </div>

            {ownerGroups.length === 0 && (
              <div className="bg-[#FFF4E0] border-2 border-[#161412] rounded-2xl p-8 text-center text-sm text-[#5E554C]">
                No outlets match your filter. Click <strong>+ Add Owner</strong> to onboard a business.
              </div>
            )}

            {/* Owner Grouped Outlet Sections */}
            {ownerGroups.map((group) => (
              <section key={group.key} className="space-y-3">
                {/* Owner Strip Header */}
                <div className="bg-[#FAF1E4] border border-[#E2D6C3] rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs">
                    <User size={14} className="text-[#5E554C]" />
                    <span className="font-extrabold text-[#161412]">{group.ownerName}</span>
                    <span className="text-[#C8BCA9]">|</span>
                    <span className="text-[#5E554C] font-medium">
                      {group.outlets.length} outlet{group.outlets.length === 1 ? '' : 's'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => navigate(`/admin/tenants/${group.tenantId}`)}
                      className="px-3 py-1 rounded-lg border border-[#D9CFC0] bg-[#FFF4E0] hover:bg-[#F5E9D6] text-xs font-semibold text-[#161412] transition-colors"
                    >
                      View Details
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenAddOutletModal(group)}
                      className="px-3 py-1 rounded-lg border border-[#D9CFC0] bg-[#FFF4E0] hover:bg-[#F5E9D6] text-xs font-semibold text-[#161412] flex items-center gap-1 transition-colors"
                    >
                      <Plus size={13} />
                      <span>Add Outlet</span>
                    </button>
                  </div>
                </div>

                {/* 2-Column Outlet Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {group.outlets.map((biz) => {
                    const isActive = biz.id === activeBusinessId;
                    return (
                      <article
                        key={biz.id}
                        className={`bg-[#FFF4E0] rounded-2xl border-2 p-5 transition-all flex flex-col justify-between ${
                          isActive
                            ? 'border-[#161412] shadow-[4px_4px_0_0_#161412]'
                            : 'border-[#161412] shadow-[4px_4px_0_0_#161412]'
                        }`}
                      >
                        <div>
                          {/* Top Row */}
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center text-white font-black text-sm border border-[#161412]/20"
                                style={{ backgroundColor: biz.themeColor || '#3B4252' }}
                              >
                                {biz.brandName.substring(0, 2).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="font-extrabold text-sm text-[#161412] leading-snug truncate">
                                    {biz.name}
                                  </h3>
                                  {isActive && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FDECE6] text-[#B33A14] border border-[#F2C3B3] flex items-center gap-1">
                                      <Check size={10} /> Active Outlet
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-[#5E554C] mt-0.5 truncate">
                                  {biz.category} · Slug: <code className="font-mono text-[#161412]">{biz.slug}</code>
                                </p>
                              </div>
                            </div>

                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider shrink-0 ${planBadgeClass(
                                biz.planTier
                              )}`}
                            >
                              {biz.planTier}
                            </span>
                          </div>

                          {/* Metadata Box */}
                          <div className="bg-[#F7EFE2] rounded-xl p-3.5 border border-[#E6DBC8] text-[11px] text-[#5E554C] space-y-1.5 mb-4">
                            <p className="line-clamp-1">
                              📍 <strong className="text-[#161412]">Address:</strong> {biz.address}
                              {biz.city ? ` · ${biz.city}` : ''}
                            </p>
                            <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#E6DBC8]/70">
                              <span>
                                State: <strong className="text-[#161412]">[{biz.stateCode || '29'}] {biz.stateName || 'Karnataka'}</strong>
                              </span>
                              <span>
                                GSTIN: <code className="font-mono font-bold text-[#161412]">{biz.gstin || 'Unregistered'}</code>
                              </span>
                            </div>
                            {biz.tagline && (
                              <p className="text-[11px] text-[#7B7065] italic pt-1 border-t border-[#E6DBC8]/70">
                                &ldquo;{biz.tagline}&rdquo;
                              </p>
                            )}
                          </div>

                          {/* Feature Pills */}
                          <div className="flex items-center gap-1.5 flex-wrap mb-4 text-[11px]">
                            <span
                              className={`px-2.5 py-0.5 rounded-md font-semibold ${
                                biz.features.kdsEnabled
                                  ? 'bg-[#DCF5E7] text-[#176942]'
                                  : 'bg-[#E9E2D6] text-[#7B7065] line-through'
                              }`}
                            >
                              KDS ({biz.kdsTargetMinutes || 7}m)
                            </span>
                            <span
                              className={`px-2.5 py-0.5 rounded-md font-semibold ${
                                biz.features.gstEnabled
                                  ? 'bg-[#FDECE6] text-[#B33A14]'
                                  : 'bg-[#E9E2D6] text-[#7B7065]'
                              }`}
                            >
                              GST ({biz.features.gstRate}%)
                            </span>
                            <span
                              className={`px-2.5 py-0.5 rounded-md font-semibold ${
                                biz.features.tableManagement
                                  ? 'bg-[#EFE6FD] text-[#5B21B6]'
                                  : 'bg-[#EAE4DA] text-[#5E554C]'
                              }`}
                            >
                              {biz.features.tableManagement ? `${biz.tableCount || 16} Tables` : 'Counter Only'}
                            </span>
                            <span
                              className={`px-2.5 py-0.5 rounded-md font-semibold ${
                                biz.features.autoPrintReceipt
                                  ? 'bg-[#FDF2D0] text-[#7A5200]'
                                  : 'bg-[#EAE4DA] text-[#5E554C]'
                              }`}
                            >
                              Auto-Print
                            </span>
                            <span className="px-2.5 py-0.5 rounded-md font-semibold bg-[#EAE4DA] text-[#5E554C]">
                              Cash: {biz.features.cashTiming === 'before' ? 'Pay-First (QSR)' : 'Pay-Later'}
                            </span>
                          </div>
                        </div>

                        {/* Card Footer Actions */}
                        <div className="pt-3 border-t border-[#E6DBC8] flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              type="button"
                              onClick={() => void handleSwitchOutlet(biz, true)}
                              className="px-3 py-1.5 rounded-xl bg-[#FF4F1A] hover:bg-[#FF6333] text-[#161412] border-2 border-[#161412] shadow-[2px_2px_0_0_#161412] text-xs font-extrabold flex items-center gap-1.5 transition-all"
                              title={`Open Owner Dashboard for ${biz.name}`}
                            >
                              <ExternalLink size={13} />
                              <span>Launch as Owner</span>
                            </button>

                            {!isActive ? (
                              <button
                                type="button"
                                onClick={() => void handleSwitchOutlet(biz, false)}
                                className="px-3 py-1.5 rounded-xl bg-[#161412] hover:bg-[#2A2622] text-[#FFF4E0] text-xs font-bold flex items-center gap-1.5 transition-all"
                              >
                                <CheckCircle2 size={13} />
                                <span>Switch Outlet</span>
                              </button>
                            ) : (
                              <span className="px-3 py-1.5 rounded-xl bg-[#DCF5E7] text-[#176942] text-xs font-bold flex items-center gap-1">
                                <Check size={13} /> Active
                              </span>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedBusinessForCustomization(biz.id);
                                setActiveTab('features');
                              }}
                              className="px-2.5 py-1.5 rounded-xl border border-[#D9CFC0] bg-[#FAF1E4] hover:bg-[#F1E4D1] text-[#161412] text-xs font-semibold flex items-center gap-1 transition-colors"
                            >
                              <Sliders size={12} />
                              <span>Customise</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => void handleSeedDemoData(biz.id, biz.name)}
                              className="px-2.5 py-1.5 rounded-xl bg-[#FDF2D0] hover:bg-[#FCE8B2] text-[#7A5200] border border-[#F0D999] text-xs font-semibold flex items-center gap-1 transition-colors"
                            >
                              <Sparkles size={12} />
                              <span>Seed Demo</span>
                            </button>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleEditBusinessModal(biz)}
                              className="p-1.5 rounded-lg text-[#5E554C] hover:text-[#161412] hover:bg-[#F3E6D4] transition-colors"
                              title="Edit outlet details"
                            >
                              <Edit3 size={14} />
                            </button>
                            {businesses.length > 1 && (
                              <button
                                type="button"
                                onClick={() => void handleDeleteOutlet(biz)}
                                className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                                title="Archive outlet"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* TAB 2: FEATURE FLAGS & WHITE-LABELING */}
        {activeTab === 'features' && targetTenant && (
          <div className="space-y-6">
            <div className="bg-[#FFF4E0] border-2 border-[#161412] rounded-2xl shadow-[4px_4px_0_0_#161412] p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-[#5E554C] uppercase tracking-wider">Customising Outlet:</span>
                <select
                  value={selectedBusinessForCustomization}
                  onChange={(e) => setSelectedBusinessForCustomization(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border-2 border-[#161412] text-xs font-bold text-[#161412] bg-[#FFF4E0]"
                >
                  {businesses.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.brandName}) {b.id === activeBusinessId ? '★ Active' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {selectedBusinessForCustomization !== activeBusinessId && (
                <button
                  type="button"
                  onClick={() => void handleSwitchOutlet(targetTenant, false)}
                  className="px-3.5 py-1.5 rounded-xl bg-[#161412] text-[#FFF4E0] text-xs font-bold"
                >
                  Make Active Terminal
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-[#FFF4E0] rounded-2xl border-2 border-[#161412] shadow-[4px_4px_0_0_#161412] p-6 space-y-5">
                  <div className="border-b border-[#E6DBC8] pb-3">
                    <h3 className="font-extrabold text-sm text-[#161412]">Developer Feature Flags</h3>
                    <p className="text-xs text-[#5E554C]">Toggle operational modules for {targetTenant.name}</p>
                  </div>

                  <div className="divide-y divide-[#E6DBC8] space-y-4">
                    <div className="flex items-center justify-between pt-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <ChefHat size={16} />
                          <span className="text-xs font-bold text-[#161412]">Kitchen Display System (KDS)</span>
                        </div>
                        <p className="text-[11px] text-[#5E554C] mt-0.5">
                          Route orders to kitchen touch screens with bump timers.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleFeatureToggle('kdsEnabled', !targetTenant.features.kdsEnabled)}
                        className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                          targetTenant.features.kdsEnabled ? 'bg-emerald-600' : 'bg-gray-300'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-white transition-transform ${
                            targetTenant.features.kdsEnabled ? 'translate-x-6' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <Receipt size={16} />
                          <span className="text-xs font-bold text-[#161412]">Indian GST Tax Engine</span>
                        </div>
                        <p className="text-[11px] text-[#5E554C] mt-0.5">
                          Compute CGST + SGST split on receipts, reports, and tax audits.
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {targetTenant.features.gstEnabled && (
                          <select
                            value={targetTenant.features.gstRate}
                            onChange={(e) => handleFeatureToggle('gstRate', Number(e.target.value))}
                            className="text-xs border-2 border-[#161412] rounded-lg px-2 py-1 font-semibold bg-[#FFF4E0]"
                          >
                            <option value={5}>5% (Composite QSR)</option>
                            <option value={12}>12% (Standard)</option>
                            <option value={18}>18% (AC / Lounge)</option>
                          </select>
                        )}
                        <button
                          type="button"
                          onClick={() => handleFeatureToggle('gstEnabled', !targetTenant.features.gstEnabled)}
                          className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                            targetTenant.features.gstEnabled ? 'bg-emerald-600' : 'bg-gray-300'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-full bg-white transition-transform ${
                              targetTenant.features.gstEnabled ? 'translate-x-6' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <Layers size={16} />
                          <span className="text-xs font-bold text-[#161412]">Product Add-ons & Modifiers Engine</span>
                        </div>
                        <p className="text-[11px] text-[#5E554C] mt-0.5">
                          Prompt cashier for milk options, extra shots, and preparation on tap.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleFeatureToggle('addOnsEnabled', !targetTenant.features.addOnsEnabled)}
                        className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                          targetTenant.features.addOnsEnabled ? 'bg-emerald-600' : 'bg-gray-300'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-white transition-transform ${
                            targetTenant.features.addOnsEnabled ? 'translate-x-6' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <Printer size={16} />
                          <span className="text-xs font-bold text-[#161412]">Auto-Print Thermal Receipt</span>
                        </div>
                        <p className="text-[11px] text-[#5E554C] mt-0.5">
                          Trigger thermal receipt immediately on successful checkout.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleFeatureToggle('autoPrintReceipt', !targetTenant.features.autoPrintReceipt)}
                        className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                          targetTenant.features.autoPrintReceipt ? 'bg-emerald-600' : 'bg-gray-300'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-white transition-transform ${
                            targetTenant.features.autoPrintReceipt ? 'translate-x-6' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="pt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <CreditCard size={16} />
                        <span className="text-xs font-bold text-[#161412]">Accepted Payment Tenders</span>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <button
                          type="button"
                          onClick={() => handlePaymentToggle('cash')}
                          className={`p-3 rounded-xl border-2 flex items-center justify-between text-xs font-bold ${
                            targetTenant.features.enabledPayments?.cash
                              ? 'border-[#161412] bg-[#DCF5E7] text-[#176942]'
                              : 'border-[#D9CFC0] text-[#5E554C] opacity-60'
                          }`}
                        >
                          <span className="flex items-center gap-2"><Banknote size={14} /> Cash</span>
                          {targetTenant.features.enabledPayments?.cash && <Check size={14} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePaymentToggle('upi')}
                          className={`p-3 rounded-xl border-2 flex items-center justify-between text-xs font-bold ${
                            targetTenant.features.enabledPayments?.upi
                              ? 'border-[#161412] bg-[#E1F7F3] text-[#0F6E61]'
                              : 'border-[#D9CFC0] text-[#5E554C] opacity-60'
                          }`}
                        >
                          <span className="flex items-center gap-2"><QrCode size={14} /> UPI QR</span>
                          {targetTenant.features.enabledPayments?.upi && <Check size={14} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePaymentToggle('card')}
                          className={`p-3 rounded-xl border-2 flex items-center justify-between text-xs font-bold ${
                            targetTenant.features.enabledPayments?.card
                              ? 'border-[#161412] bg-[#EFE6FD] text-[#5B21B6]'
                              : 'border-[#D9CFC0] text-[#5E554C] opacity-60'
                          }`}
                        >
                          <span className="flex items-center gap-2"><CreditCard size={14} /> Card</span>
                          {targetTenant.features.enabledPayments?.card && <Check size={14} />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* White Labeling */}
                <div className="bg-[#FFF4E0] rounded-2xl border-2 border-[#161412] shadow-[4px_4px_0_0_#161412] p-6 space-y-4">
                  <div className="border-b border-[#E6DBC8] pb-3">
                    <h3 className="font-extrabold text-sm text-[#161412]">White-Labeling & Receipt Branding</h3>
                    <p className="text-xs text-[#5E554C]">Customize receipt headers, greetings, and store guest Wi-Fi</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#161412] mb-1">Receipt Header Greeting</label>
                      <input
                        type="text"
                        defaultValue={targetTenant.features.receiptHeader || ''}
                        onBlur={(e) => {
                          if (e.target.value !== (targetTenant.features.receiptHeader || '')) {
                            handleFeatureToggle('receiptHeader', e.target.value);
                          }
                        }}
                        className="w-full px-3 py-2 rounded-xl border-2 border-[#161412] text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#161412] mb-1">Receipt Footer Message</label>
                      <input
                        type="text"
                        defaultValue={targetTenant.features.receiptFooter || ''}
                        onBlur={(e) => {
                          if (e.target.value !== (targetTenant.features.receiptFooter || '')) {
                            handleFeatureToggle('receiptFooter', e.target.value);
                          }
                        }}
                        className="w-full px-3 py-2 rounded-xl border-2 border-[#161412] text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#161412] mb-1">Guest Wi-Fi Password</label>
                      <input
                        type="text"
                        defaultValue={targetTenant.features.wifiPassword || ''}
                        onBlur={(e) => {
                          if (e.target.value !== (targetTenant.features.wifiPassword || '')) {
                            handleFeatureToggle('wifiPassword', e.target.value);
                          }
                        }}
                        className="w-full px-3 py-2 rounded-xl border-2 border-[#161412] text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#161412] mb-1">Brand Theme Accent</label>
                      <div className="flex items-center gap-2 pt-1">
                        {['#FF4F1A', '#161412', '#2563eb', '#e11d48', '#d97706', '#059669', '#7c3aed'].map((color) => (
                          <button
                            type="button"
                            key={color}
                            onClick={() => void persistFeaturePatch(targetTenant, { themeColor: color }, 'Updated brand theme color')}
                            className={`w-7 h-7 rounded-full border-2 transition-transform ${
                              targetTenant.themeColor === color ? 'border-[#161412] scale-110' : 'border-transparent'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Thermal Preview */}
              <div>
                <div className="bg-[#FFF4E0] rounded-2xl border-2 border-[#161412] shadow-[4px_4px_0_0_#161412] p-5 sticky top-20">
                  <div className="flex items-center justify-between border-b border-[#E6DBC8] pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <Receipt size={16} />
                      <h4 className="font-extrabold text-xs uppercase tracking-wider">Thermal Receipt Preview</h4>
                    </div>
                  </div>
                  <div className="bg-white border border-[#D9CFC0] rounded-xl p-4 font-mono text-[#161412] text-[11px] space-y-2">
                    <div className="text-center space-y-0.5">
                      <p className="font-bold text-sm">{targetTenant.brandName.toUpperCase()}</p>
                      <p className="text-[10px] text-[#5E554C]">{targetTenant.tagline}</p>
                      <p className="text-[9px] text-[#5E554C]">{targetTenant.address}</p>
                      {targetTenant.gstin && <p className="text-[9px] text-[#5E554C]">GSTIN: {targetTenant.gstin}</p>}
                      {targetTenant.features.receiptHeader && (
                        <p className="text-[10px] font-bold pt-1">{targetTenant.features.receiptHeader}</p>
                      )}
                    </div>
                    <div className="border-t border-dashed border-gray-400 my-2" />
                    <div className="flex justify-between font-bold text-[10px]">
                      <span>2x Cappuccino</span>
                      <span>₹380.00</span>
                    </div>
                    <div className="flex justify-between font-bold text-[10px]">
                      <span>1x Butter Croissant</span>
                      <span>₹165.00</span>
                    </div>
                    <div className="border-t border-dashed border-gray-400 my-2" />
                    <div className="flex justify-between text-[10px]">
                      <span>Subtotal</span>
                      <span>₹545.00</span>
                    </div>
                    {targetTenant.features.gstEnabled && (
                      <div className="flex justify-between text-[10px]">
                        <span>GST ({targetTenant.features.gstRate}%)</span>
                        <span>₹{((545 * targetTenant.features.gstRate) / 100).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-xs pt-1 border-t border-gray-300">
                      <span>TOTAL</span>
                      <span>
                        ₹
                        {(
                          545 +
                          (targetTenant.features.gstEnabled ? (545 * targetTenant.features.gstRate) / 100 : 0)
                        ).toFixed(2)}
                      </span>
                    </div>
                    <div className="border-t border-dashed border-gray-400 my-2" />
                    <div className="text-center text-[9px] text-[#5E554C] space-y-1">
                      {targetTenant.features.wifiPassword && (
                        <p>Guest Wi-Fi: <strong>{targetTenant.features.wifiPassword}</strong></p>
                      )}
                      <p>{targetTenant.features.receiptFooter || 'Thank you for visiting!'}</p>
                      <p>Powered by TIKKIT QSR Core</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: DIAGNOSTICS & SALES DEMO ENGINE */}
        {activeTab === 'telemetry' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-[#FFF4E0] p-5 rounded-2xl border-2 border-[#161412] shadow-[4px_4px_0_0_#161412]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#5E554C] uppercase">Registered Outlets</span>
                  <Building2 size={16} className="text-[#FF4F1A]" />
                </div>
                <div className="text-2xl font-black text-[#161412]">{businesses.length}</div>
                <p className="text-[11px] text-[#5E554C] mt-1">Active multi-tenant branches</p>
              </div>
              <div className="bg-[#FFF4E0] p-5 rounded-2xl border-2 border-[#161412] shadow-[4px_4px_0_0_#161412]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#5E554C] uppercase">Total Orders</span>
                  <Receipt size={16} className="text-emerald-600" />
                </div>
                <div className="text-2xl font-black text-[#161412]">{totalOrders}</div>
                <p className="text-[11px] text-[#5E554C] mt-1">Database-committed sales</p>
              </div>
              <div className="bg-[#FFF4E0] p-5 rounded-2xl border-2 border-[#161412] shadow-[4px_4px_0_0_#161412]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#5E554C] uppercase">Active KDS Queue</span>
                  <ChefHat size={16} className="text-amber-600" />
                </div>
                <div className="text-2xl font-black text-[#161412]">{totalTickets}</div>
                <p className="text-[11px] text-[#5E554C] mt-1">Pending / preparing / ready</p>
              </div>
              <div className="bg-[#FFF4E0] p-5 rounded-2xl border-2 border-[#161412] shadow-[4px_4px_0_0_#161412]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#5E554C] uppercase">Active Menu SKUs</span>
                  <Layers size={16} className="text-purple-600" />
                </div>
                <div className="text-2xl font-black text-[#161412]">{totalProducts}</div>
                <p className="text-[11px] text-[#5E554C] mt-1">Catalog items across outlets</p>
              </div>
            </div>

            <div className="bg-[#FFF4E0] rounded-2xl border-2 border-[#161412] shadow-[4px_4px_0_0_#161412] p-6 space-y-6">
              <div>
                <h3 className="font-extrabold text-sm text-[#161412]">Quick App Launchers & Diagnostics</h3>
                <p className="text-xs text-[#5E554C] mt-0.5">
                  Jump directly into the active outlet ({activeTenant?.name}) or test hardware alerts
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => activeTenant && void handleSwitchOutlet(activeTenant, true)}
                  className="px-4 py-2 rounded-xl bg-[#FF4F1A] border-2 border-[#161412] shadow-[2px_2px_0_0_#161412] text-xs font-extrabold flex items-center gap-2"
                >
                  <BarChart3 size={14} /> Open Owner Dashboard
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/pos')}
                  className="px-4 py-2 rounded-xl bg-[#FFC72C] border-2 border-[#161412] shadow-[2px_2px_0_0_#161412] text-xs font-extrabold flex items-center gap-2"
                >
                  <Store size={14} /> Open Counter POS
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/kds')}
                  className="px-4 py-2 rounded-xl bg-[#161412] text-[#FFF4E0] text-xs font-extrabold flex items-center gap-2"
                >
                  <ChefHat size={14} /> Open KDS
                </button>
              </div>

              {!isSupabase ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-xl border border-[#D9CFC0] bg-[#FAF1E4] flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <Wifi size={18} />
                      <div>
                        <p className="font-bold text-xs">Network Simulation</p>
                        <p className="text-[11px] text-[#5E554C]">
                          {store.settings.isSimulatedOffline ? 'Offline simulated' : 'Connected online'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={store.toggleOfflineSimulated}
                      className="px-3 py-1.5 rounded-xl border border-[#161412] bg-[#FFF4E0] text-xs font-bold"
                    >
                      {store.settings.isSimulatedOffline ? 'Reconnect' : 'Simulate Offline'}
                    </button>
                  </div>

                  <div className="p-4 rounded-xl border border-[#D9CFC0] bg-[#FAF1E4] flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <Printer size={18} />
                      <div>
                        <p className="font-bold text-xs">Thermal Printer Simulation</p>
                        <p className="text-[11px] text-[#5E554C]">
                          {store.settings.isSimulatedPrinterDown ? 'Printer jammed' : 'Printer ready'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={store.togglePrinterSimulated}
                      className="px-3 py-1.5 rounded-xl border border-[#161412] bg-[#FFF4E0] text-xs font-bold"
                    >
                      {store.settings.isSimulatedPrinterDown ? 'Restore Printer' : 'Simulate Jam'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-xl border border-[#D9CFC0] bg-[#FAF1E4] flex items-center justify-between gap-2">
                    <div>
                      <p className="font-bold text-xs">Live Outlet Orders &amp; Refunds</p>
                      <p className="text-[11px] text-[#5E554C]">Inspect today&apos;s Cloud-persisted transactions</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate('/orders')}
                      className="px-3 py-1.5 rounded-xl border border-[#161412] bg-[#FFF4E0] text-xs font-bold shrink-0"
                    >
                      Open Orders
                    </button>
                  </div>

                  <div className="p-4 rounded-xl border border-[#D9CFC0] bg-[#FAF1E4] flex items-center justify-between gap-2">
                    <div>
                      <p className="font-bold text-xs">Store Tax &amp; Receipt Preferences</p>
                      <p className="text-[11px] text-[#5E554C]">Manage GST rate, UPI VPA, and printer settings</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate('/settings')}
                      className="px-3 py-1.5 rounded-xl border border-[#161412] bg-[#FFF4E0] text-xs font-bold shrink-0"
                    >
                      Open Settings
                    </button>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-[#E6DBC8] flex items-center gap-3 flex-wrap">
                <Volume2 size={15} />
                <button
                  type="button"
                  onClick={() => sounds.playNewTicket()}
                  className="px-3 py-1.5 rounded-lg border border-[#D9CFC0] bg-[#FAF1E4] text-xs font-semibold"
                >
                  KDS Chime
                </button>
                <button
                  type="button"
                  onClick={() => sounds.playSuccess()}
                  className="px-3 py-1.5 rounded-lg border border-[#D9CFC0] bg-[#FAF1E4] text-xs font-semibold"
                >
                  Payment Success
                </button>
                <button
                  type="button"
                  onClick={() => sounds.playError()}
                  className="px-3 py-1.5 rounded-lg border border-[#D9CFC0] bg-[#FAF1E4] text-xs font-semibold"
                >
                  Error Alert
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MULTI-STEP ADD OWNER / ADD OUTLET / EDIT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFF4E0] rounded-3xl max-w-3xl w-full p-6 shadow-[8px_8px_0_0_#161412] border-2 border-[#161412] max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FDECE6] border border-[#F2C3B3] text-[#B33A14] flex items-center justify-center">
                  <Building2 size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-[#161412]">
                    {modalMode === 'add_owner'
                      ? 'Add Owner & First Outlet'
                      : modalMode === 'add_outlet'
                      ? 'Add Outlet'
                      : `Configure Outlet: ${editingBusiness?.name}`}
                  </h3>
                  <p className="text-[11px] text-[#5E554C]">
                    {modalMode === 'add_owner'
                      ? 'Create one outlet now. Add more from the owner row after saving.'
                      : modalMode === 'add_outlet'
                      ? `Owner: ${targetTenantForBranch?.ownerName}`
                      : 'Update outlet branding, Indian GST, and operations configuration.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-[#5E554C] hover:text-[#161412] rounded-lg"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Step Tabs + Progress Bar */}
            <div className="mb-4">
              <div className="flex items-center gap-2 overflow-x-auto pb-2.5">
                {stepsForMode.map((st) => {
                  const active = modalStep === st.id;
                  return (
                    <button
                      type="button"
                      key={st.id}
                      onClick={() => setModalStep(st.id)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                        active
                          ? 'bg-[#FFC72C] text-[#161412]'
                          : 'text-[#5E554C] hover:text-[#161412]'
                      }`}
                    >
                      {st.label}
                    </button>
                  );
                })}
              </div>
              <div className="h-1 w-full bg-[#E6DBC8] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#B9AA96] transition-all duration-200"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            {modalError && (
              <div role="alert" className="mb-3 p-3 rounded-xl bg-rose-50 border border-rose-300 text-xs font-semibold text-rose-800">
                {modalError}
              </div>
            )}

            <form onSubmit={(e) => void handleSaveBusiness(e)} className="flex-1 overflow-y-auto pr-1 space-y-4">
              {/* STEP 1 (ADD OWNER): OWNER & LOGIN CREDENTIALS */}
              {modalStep === 'owner' && (
                <div className="space-y-4">
                  <div className="bg-[#FFF0E6] border border-[#F5C6AA] rounded-2xl p-4 flex items-start gap-3">
                    <ShieldCheck size={18} className="text-[#B33A14] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-extrabold text-xs text-[#7C2D12]">Full Owner Control & Instant Authentication</h4>
                      <p className="text-[11px] text-[#9A3412] mt-0.5 leading-relaxed">
                        These credentials are immediately registered in the system. The owner can sign in at <strong>/login</strong> using this email and password to access their outlet analytics, reports, settings, and POS terminal.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-mono text-xs font-bold text-[#161412] mb-1">Owner Full Name *</label>
                      <div className="relative">
                        <User size={14} className="absolute left-3.5 top-3 text-[#5E554C]" />
                        <input
                          type="text"
                          required
                          value={formOwnerName}
                          onChange={(e) => setFormOwnerName(e.target.value)}
                          placeholder="Arun Kumar"
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl border-2 border-[#161412] bg-[#FFF4E0] text-xs font-semibold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-mono text-xs font-bold text-[#161412] mb-1">Owner Phone / Mobile Number</label>
                      <div className="relative">
                        <Phone size={14} className="absolute left-3.5 top-3 text-[#5E554C]" />
                        <input
                          type="text"
                          value={formOwnerPhone}
                          onChange={(e) => setFormOwnerPhone(e.target.value)}
                          placeholder="+91 98450 77889"
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl border-2 border-[#161412] bg-[#FFF4E0] text-xs font-semibold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-mono text-xs font-bold text-[#161412] mb-1">Owner Work Email (Used for /login) *</label>
                      <div className="relative">
                        <Mail size={14} className="absolute left-3.5 top-3 text-[#5E554C]" />
                        <input
                          type="email"
                          required
                          value={formOwnerEmail}
                          onChange={(e) => setFormOwnerEmail(e.target.value)}
                          placeholder="owner.whitefield@daybreak.test"
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl border-2 border-[#161412] bg-[#FFF4E0] text-xs font-mono font-semibold"
                        />
                      </div>
                      <p className="text-[10px] text-[#5E554C] mt-1">This is the email address used to log into TIKKIT.</p>
                    </div>

                    <div>
                      <label className="block font-mono text-xs font-bold text-[#161412] mb-1">Owner Password (Used for /login) *</label>
                      <div className="relative">
                        <Lock size={14} className="absolute left-3.5 top-3 text-[#5E554C]" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          minLength={6}
                          value={formOwnerPassword}
                          onChange={(e) => setFormOwnerPassword(e.target.value)}
                          placeholder="••••••••••••"
                          className="w-full pl-9 pr-10 py-2.5 rounded-xl border-2 border-[#161412] bg-[#FFF4E0] text-xs font-semibold"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-2.5 text-[#5E554C]"
                        >
                          {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                      <p className="text-[10px] text-[#5E554C] mt-1">Minimum 6 characters for this franchise owner.</p>
                    </div>

                    <div>
                      <label className="block font-mono text-xs font-bold text-[#161412] mb-1">Terminal Supervisor PIN (4 Digits) *</label>
                      <div className="relative">
                        <Key size={14} className="absolute left-3.5 top-3 text-[#5E554C]" />
                        <input
                          type="text"
                          maxLength={4}
                          required
                          value={formOwnerPin}
                          onChange={(e) => setFormOwnerPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                          placeholder="8888"
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl border-2 border-[#161412] bg-[#FFF4E0] text-xs font-mono font-bold"
                        />
                      </div>
                      <p className="text-[10px] text-[#5E554C] mt-1">Used for POS manager overrides (discounts, refunds, voids).</p>
                    </div>

                    <div className="bg-[#FAF1E4] border border-[#D9CFC0] rounded-xl p-3 flex flex-col justify-center">
                      <span className="text-[11px] font-bold text-[#161412]">Account Role</span>
                      <span className="text-xs font-extrabold text-[#B33A14] mt-0.5">Franchise Owner (Full Access)</span>
                      <p className="text-[10px] text-[#5E554C] mt-1">Has full permissions over sales, GST reports, inventory & staff.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP: OUTLET & BRAND */}
              {modalStep === 'brand' && (
                <div className="space-y-4">
                  <div className="bg-[#FAF1E4] border border-[#D9CFC0] rounded-2xl p-3 text-xs text-[#5E554C]">
                    Define the customer-facing brand, outlet location, and concept.
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-mono text-xs font-bold text-[#161412] mb-1">Outlet / Unit Name *</label>
                      <input
                        type="text"
                        required
                        value={formName}
                        onChange={(e) => {
                          const v = e.target.value;
                          setFormName(v);
                          if (!editingBusiness && !formSlug) {
                            setFormSlug(v.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
                          }
                        }}
                        placeholder="e.g. Daybreak Coffee Whitefield"
                        className="w-full px-3 py-2 rounded-xl border-2 border-[#161412] text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block font-mono text-xs font-bold text-[#161412] mb-1">Brand Name *</label>
                      <input
                        type="text"
                        required
                        value={formBrandName}
                        onChange={(e) => setFormBrandName(e.target.value)}
                        placeholder="Daybreak Coffee"
                        className="w-full px-3 py-2 rounded-xl border-2 border-[#161412] text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block font-mono text-xs font-bold text-[#161412] mb-1">URL Identifier / Slug</label>
                      <input
                        type="text"
                        value={formSlug}
                        onChange={(e) => setFormSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                        placeholder="daybreak-whitefield"
                        className="w-full px-3 py-2 rounded-xl border-2 border-[#161412] text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-mono text-xs font-bold text-[#161412] mb-1">Concept / Category</label>
                      <input
                        type="text"
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value)}
                        placeholder="Specialty Coffee"
                        className="w-full px-3 py-2 rounded-xl border-2 border-[#161412] text-xs"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block font-mono text-xs font-bold text-[#161412] mb-1">Brand Tagline</label>
                      <input
                        type="text"
                        value={formTagline}
                        onChange={(e) => setFormTagline(e.target.value)}
                        placeholder="Specialty coffee & bakery"
                        className="w-full px-3 py-2 rounded-xl border-2 border-[#161412] text-xs"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block font-mono text-xs font-bold text-[#161412] mb-1">Store Street Address *</label>
                      <input
                        type="text"
                        required
                        value={formAddress}
                        onChange={(e) => setFormAddress(e.target.value)}
                        placeholder="e.g. VR Mall, Level 3, ITPL Main Rd, Whitefield"
                        className="w-full px-3 py-2 rounded-xl border-2 border-[#161412] text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-mono text-xs font-bold text-[#161412] mb-1">City</label>
                      <input
                        type="text"
                        value={formCity}
                        onChange={(e) => setFormCity(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border-2 border-[#161412] text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-mono text-xs font-bold text-[#161412] mb-1">Pincode</label>
                      <input
                        type="text"
                        value={formPincode}
                        onChange={(e) => setFormPincode(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border-2 border-[#161412] text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-mono text-xs font-bold text-[#161412] mb-1">Store Phone</label>
                      <input
                        type="text"
                        value={formPhone}
                        onChange={(e) => setFormPhone(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border-2 border-[#161412] text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-mono text-xs font-bold text-[#161412] mb-1">Support / Contact Email</label>
                      <input
                        type="email"
                        value={formEmail}
                        onChange={(e) => setFormEmail(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border-2 border-[#161412] text-xs"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block font-mono text-xs font-bold text-[#161412] mb-1">Brand Theme Accent Color</label>
                      <div className="flex items-center gap-2 pt-1">
                        {['#FF4F1A', '#161412', '#0F6E61', '#2563eb', '#e11d48', '#d97706', '#7c3aed'].map((color) => (
                          <button
                            type="button"
                            key={color}
                            onClick={() => setFormThemeColor(color)}
                            className={`w-7 h-7 rounded-full border-2 transition-transform ${
                              formThemeColor === color ? 'border-[#161412] scale-110' : 'border-transparent'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP: PLAN SELECTION */}
              {modalStep === 'plan' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-2">
                  {PLAN_OPTIONS.map((plan) => {
                    const selected = formPlanTier === plan.tier;
                    return (
                      <button
                        type="button"
                        key={plan.tier}
                        onClick={() => setFormPlanTier(plan.tier)}
                        className={`text-left rounded-2xl p-5 border-2 transition-all flex flex-col justify-between ${
                          selected
                            ? 'border-[#161412] bg-[#FFFDF8] shadow-[4px_4px_0_0_#FF4F1A]'
                            : 'border-[#D9CFC0] bg-[#FAF1E4] hover:border-[#161412]'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-extrabold text-sm text-[#161412]">{plan.name}</span>
                            {selected && <CheckCircle2 size={16} className="text-[#FF4F1A]" />}
                          </div>
                          <div className="flex items-baseline gap-1 pb-4 border-b border-[#E6DBC8]">
                            <span className="font-mono text-2xl font-black text-[#161412]">{plan.price}</span>
                            <span className="text-xs text-[#5E554C]">/ mo</span>
                          </div>
                          <ul className="mt-4 space-y-2 text-xs text-[#5E554C]">
                            {plan.bullets.map((b) => (
                              <li key={b} className="flex items-start gap-2">
                                <span className="mt-1.5 w-1 h-1 rounded-full bg-[#161412] shrink-0" />
                                <span>{b}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* STEP: GST & LEGAL PROFILE */}
              {modalStep === 'tax' && (
                <div className="space-y-4">
                  <div className="bg-[#FAF1E4] border border-[#D9CFC0] rounded-2xl p-3 text-xs text-[#5E554C]">
                    Indian GST Compliance engine automatically calculates CGST + SGST or IGST based on this state profile.
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-mono text-xs font-bold text-[#161412] mb-1">State & GST State Code *</label>
                      <select
                        value={formStateCode}
                        onChange={(e) => {
                          const code = e.target.value;
                          setFormStateCode(code);
                          const st = stateOptions.find((s) => s.code === code);
                          if (st) setFormStateName(st.name);
                        }}
                        className="w-full px-3 py-2 rounded-xl border-2 border-[#161412] text-xs font-semibold"
                      >
                        {stateOptions.map((st) => (
                          <option key={st.code} value={st.code}>
                            [{st.code}] {st.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block font-mono text-xs font-bold text-[#161412] mb-1">Legal Entity / Registered Company Name</label>
                      <input
                        type="text"
                        value={formLegalEntityName}
                        onChange={(e) => setFormLegalEntityName(e.target.value)}
                        placeholder="Daybreak Hospitality Pvt Ltd"
                        className="w-full px-3 py-2 rounded-xl border-2 border-[#161412] text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block font-mono text-xs font-bold text-[#161412] mb-1">GSTIN (15 Alphanumeric Characters)</label>
                      <input
                        type="text"
                        maxLength={15}
                        value={formGstin}
                        onChange={(e) => setFormGstin(e.target.value.toUpperCase())}
                        className="w-full px-3 py-2 rounded-xl border-2 border-[#161412] text-xs font-mono font-bold"
                      />
                      <p className="text-[10px] text-[#5E554C] mt-1">First 2 digits should match State Code ({formStateCode}).</p>
                    </div>
                    <div>
                      <label className="block font-mono text-xs font-bold text-[#161412] mb-1">FSSAI License (14 Digits)</label>
                      <input
                        type="text"
                        maxLength={14}
                        value={formFssai}
                        onChange={(e) => setFormFssai(e.target.value.replace(/[^0-9]/g, ''))}
                        className="w-full px-3 py-2 rounded-xl border-2 border-[#161412] text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-mono text-xs font-bold text-[#161412] mb-1">Applicable GST Rate</label>
                      <select
                        value={formGstRate}
                        onChange={(e) => {
                          const rate = Number(e.target.value);
                          setFormGstRate(rate);
                          setFormGstEnabled(rate > 0);
                        }}
                        className="w-full px-3 py-2 rounded-xl border-2 border-[#161412] text-xs font-semibold"
                      >
                        <option value={5}>5% (Composite QSR without ITC · 2.5% CGST + 2.5% SGST)</option>
                        <option value={12}>12% (Standard Food Service)</option>
                        <option value={18}>18% (AC / Hotel Lounge · 9% CGST + 9% SGST)</option>
                        <option value={0}>0% (Exempt)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-mono text-xs font-bold text-[#161412] mb-1">Service Charge (%) (Optional)</label>
                      <div className="relative">
                        <input
                          type="number"
                          min={0}
                          max={15}
                          value={formServiceChargePercent}
                          onChange={(e) => setFormServiceChargePercent(Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-xl border-2 border-[#161412] text-xs font-semibold"
                        />
                        <Percent size={14} className="absolute right-3 top-2.5 text-[#5E554C]" />
                      </div>
                    </div>
                    <label className="sm:col-span-2 flex items-center justify-between p-3.5 bg-[#FAF1E4] border border-[#D9CFC0] rounded-xl cursor-pointer">
                      <div>
                        <span className="text-xs font-bold text-[#161412]">Composition Scheme Restaurant</span>
                        <p className="text-[11px] text-[#5E554C]">Enable if outlet operates under Section 10 GST composition scheme.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={formIsCompositionScheme}
                        onChange={(e) => setFormIsCompositionScheme(e.target.checked)}
                        className="w-4 h-4"
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* STEP: OPERATIONS & HARDWARE */}
              {modalStep === 'operations' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-mono text-xs font-bold text-[#161412] mb-1">Cash Payment Timing</label>
                      <select
                        value={formCashTiming}
                        onChange={(e) => setFormCashTiming(e.target.value as 'before' | 'after')}
                        className="w-full px-3 py-2 rounded-xl border-2 border-[#161412] text-xs font-semibold"
                      >
                        <option value="before">Pay-First Counter (Fast QSR Standard)</option>
                        <option value="after">Pay-After-Dining (Sit-down Table Service)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-mono text-xs font-bold text-[#161412] mb-1">UPI Merchant VPA ID</label>
                      <input
                        type="text"
                        value={formUpiVpaId}
                        onChange={(e) => setFormUpiVpaId(e.target.value)}
                        placeholder="daybreak.outlet@okhdfcbank"
                        className="w-full px-3 py-2 rounded-xl border-2 border-[#161412] text-xs font-mono font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block font-mono text-xs font-bold text-[#161412] mb-1">Table Management & Count</label>
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-2 text-xs font-semibold bg-[#FAF1E4] px-3 py-2 rounded-xl border border-[#D9CFC0]">
                          <input
                            type="checkbox"
                            checked={formTableManagement}
                            onChange={(e) => setFormTableManagement(e.target.checked)}
                          />
                          <span>Dine-In Tables</span>
                        </label>
                        {formTableManagement && (
                          <input
                            type="number"
                            min={1}
                            max={100}
                            value={formTableCount}
                            onChange={(e) => setFormTableCount(Number(e.target.value))}
                            className="w-24 px-3 py-2 rounded-xl border-2 border-[#161412] text-xs font-bold"
                          />
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block font-mono text-xs font-bold text-[#161412] mb-1">KDS Screen & Target Time</label>
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-2 text-xs font-semibold bg-[#FAF1E4] px-3 py-2 rounded-xl border border-[#D9CFC0]">
                          <input
                            type="checkbox"
                            checked={formKdsEnabled}
                            onChange={(e) => setFormKdsEnabled(e.target.checked)}
                          />
                          <span>KDS Enabled</span>
                        </label>
                        {formKdsEnabled && (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min={1}
                              max={60}
                              value={formKdsTargetMinutes}
                              onChange={(e) => setFormKdsTargetMinutes(Number(e.target.value))}
                              className="w-20 px-3 py-2 rounded-xl border-2 border-[#161412] text-xs font-bold"
                            />
                            <span className="text-xs font-semibold text-[#5E554C]">mins</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block font-mono text-xs font-bold text-[#161412] mb-1">Accepted Payment Modes</label>
                      <div className="grid grid-cols-3 gap-2">
                        <label className="flex items-center gap-2 bg-[#FAF1E4] p-2.5 rounded-xl border border-[#D9CFC0] cursor-pointer text-xs font-semibold">
                          <input type="checkbox" checked={formEnabledCash} onChange={(e) => setFormEnabledCash(e.target.checked)} />
                          <span>Cash Currency</span>
                        </label>
                        <label className="flex items-center gap-2 bg-[#FAF1E4] p-2.5 rounded-xl border border-[#D9CFC0] cursor-pointer text-xs font-semibold">
                          <input type="checkbox" checked={formEnabledUpi} onChange={(e) => setFormEnabledUpi(e.target.checked)} />
                          <span>UPI QR Code</span>
                        </label>
                        <label className="flex items-center gap-2 bg-[#FAF1E4] p-2.5 rounded-xl border border-[#D9CFC0] cursor-pointer text-xs font-semibold">
                          <input type="checkbox" checked={formEnabledCard} onChange={(e) => setFormEnabledCard(e.target.checked)} />
                          <span>Card / EDC POS</span>
                        </label>
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block font-mono text-xs font-bold text-[#161412] mb-1">Thermal Receipt Header Text</label>
                      <textarea
                        rows={2}
                        value={formReceiptHeader}
                        onChange={(e) => setFormReceiptHeader(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border-2 border-[#161412] text-xs font-mono"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block font-mono text-xs font-bold text-[#161412] mb-1">Thermal Receipt Footer Message</label>
                      <textarea
                        rows={2}
                        value={formReceiptFooter}
                        onChange={(e) => setFormReceiptFooter(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border-2 border-[#161412] text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-mono text-xs font-bold text-[#161412] mb-1">Guest Wi-Fi Password</label>
                      <input
                        type="text"
                        value={formWifiPassword}
                        onChange={(e) => setFormWifiPassword(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border-2 border-[#161412] text-xs"
                      />
                    </div>

                    <label className="flex items-center justify-between p-3 bg-[#FAF1E4] border border-[#D9CFC0] rounded-xl cursor-pointer">
                      <div>
                        <span className="text-xs font-bold text-[#161412]">Auto-Print Thermal Receipt</span>
                        <p className="text-[10px] text-[#5E554C]">Print receipt automatically on payment approval.</p>
                      </div>
                      <input type="checkbox" checked={formAutoPrint} onChange={(e) => setFormAutoPrint(e.target.checked)} />
                    </label>
                  </div>
                </div>
              )}

              {/* Footer Controls */}
              <div className="pt-4 border-t border-[#E6DBC8] flex items-center justify-between gap-3">
                <div>
                  {currentStepIdx > 0 && (
                    <button
                      type="button"
                      onClick={() => setModalStep(stepsForMode[currentStepIdx - 1].id)}
                      className="px-4 py-2 rounded-xl border border-[#D9CFC0] bg-[#FAF1E4] text-xs font-bold text-[#161412] flex items-center gap-1.5"
                    >
                      <ArrowLeft size={13} /> Back
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl border border-[#D9CFC0] bg-[#FAF1E4] text-xs font-semibold text-[#5E554C]"
                  >
                    Cancel
                  </button>

                  {currentStepIdx < stepsForMode.length - 1 ? (
                    <button
                      type="button"
                      disabled={!canAdvanceFromStep()}
                      onClick={() => setModalStep(stepsForMode[currentStepIdx + 1].id)}
                      className="px-5 py-2 rounded-xl bg-[#FF4F1A] border-2 border-[#161412] shadow-[2px_2px_0_0_#161412] text-xs font-extrabold text-[#161412] flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <span>Next: {stepsForMode[currentStepIdx + 1].label.replace(/^\d+\.\s*/, '')}</span>
                      <ArrowRight size={13} />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2 rounded-xl bg-[#FF4F1A] border-2 border-[#161412] shadow-[2px_2px_0_0_#161412] text-xs font-extrabold text-[#161412] flex items-center gap-1.5 disabled:opacity-60"
                    >
                      <CheckCircle2 size={14} />
                      <span>
                        {isSubmitting
                          ? 'Saving...'
                          : modalMode === 'edit_outlet'
                          ? 'Save Outlet Configuration'
                          : modalMode === 'add_outlet'
                          ? 'Create Outlet'
                          : 'Create Owner & Outlet'}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
