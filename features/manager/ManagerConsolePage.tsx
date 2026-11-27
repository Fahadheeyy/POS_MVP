"use client";
import { DEFAULT_PRODUCT_IMAGE, ProductEditor } from './ProductEditor';
import { AddTeamMemberModal } from '@/components/AddTeamMemberModal';
import { supabase } from '@/lib/supabase/client';
import React, { useState } from 'react';
import { refreshOutletWorkspace, useAppStore } from '../../store';
import { Product, User, Role, Station, ApprovalRequest } from '../../types';
import { Header } from '../../components/Header';
import { formatINR, formatTime, formatDate } from '../../utils/formatters';
import { sounds } from '../../utils/audio';
import {
  Utensils,
  Users,
  CheckSquare,
  Activity,
  Plus,
  Edit2,
  Lock,
  Search,
  Check,
  X,
  AlertTriangle,
  Clock,
  UserCheck,
  Sparkles,
  Trash2,
  Layers,
} from 'lucide-react';

export const ManagerConsolePage: React.FC = () => {
  const {
    products,
    categories,
    addOnGroups,
    users,
    orders,
    tickets,
    approvals,
    settings,
    currentShift,
    toggleProductAvailability,
    addAddOnItemToGroup,
    updateAddOnItem,
    deleteAddOnItem,
    toggleAddOnItemStock,
    addAddOnGroup,
    updateAddOnGroups,
    addStaff,
    updateStaff,
    resetStaffPin,
    toggleStaffStatus,
    resolveApproval,
    currentUser,
    connectedOutlet,
  } = useAppStore();

  const [staffError,setStaffError] = useState('');
  const [activeTab, setActiveTab] = useState<'menu' | 'staff' | 'approvals' | 'operations'>('menu');

  // Menu Management State
  const [menuSubTab, setMenuSubTab] = useState<'dishes' | 'addons'>('dishes');
  const [menuSearch, setMenuSearch] = useState('');
  const [addOnSearch, setAddOnSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showAddAddOnModal, setShowAddAddOnModal] = useState(false);
  const [showAddGroupModal, setShowAddGroupModal] = useState(false);
  const [selectedAddOnGroupTarget, setSelectedAddOnGroupTarget] = useState<string>(addOnGroups[0]?.id ?? '');
  const [newAddOnName, setNewAddOnName] = useState('');
  const [newAddOnPrice, setNewAddOnPrice] = useState('50');
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupMin, setNewGroupMin] = useState('0');
  const [newGroupMax, setNewGroupMax] = useState('3');
  const [savingAddOn, setSavingAddOn] = useState(false);
  const [addOnError, setAddOnError] = useState('');

  // Staff Management State
  const [staffSearch, setStaffSearch] = useState('');
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [pinResetStaff, setPinResetStaff] = useState<User | null>(null);
  const [newPinValue, setNewPinValue] = useState('');
  const canManageManagers = connectedOutlet
    ? connectedOutlet.role === 'owner' || connectedOutlet.title === 'Platform Super Admin'
    : true;

  // 1. Menu Filter
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(menuSearch.toLowerCase());
    const matchesCat = selectedCategory === 'all' || p.categoryId === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleCreateAddOnItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingAddOn) return;
    setAddOnError('');
    if (!newAddOnName.trim() || !addOnGroups.some((group) => group.id === selectedAddOnGroupTarget)) {
      setAddOnError('Choose an add-on category and enter an item name.');
      return;
    }
    setSavingAddOn(true);
    const saved = await addAddOnItemToGroup(selectedAddOnGroupTarget, {
      name: newAddOnName.trim(),
      price: Number(newAddOnPrice),
      image: DEFAULT_PRODUCT_IMAGE,
      isDefault: false,
      isAvailable: true,
    });
    setSavingAddOn(false);
    if (saved === false) {
      setAddOnError(useAppStore.getState().operationalError || 'Could not save the add-on.');
      return;
    }
    sounds.playSuccess();
    setNewAddOnName('');
    setNewAddOnPrice('50');
    setShowAddAddOnModal(false);
  };

  const handleCreateAddOnGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingAddOn) return;
    setAddOnError('');
    const min = Number(newGroupMin);
    const max = Number(newGroupMax);
    if (!newGroupName.trim() || !Number.isInteger(min) || !Number.isInteger(max) || min < 0 || max < Math.max(1, min) || max > 30) {
      setAddOnError('Enter a category name and set a maximum at least as high as the minimum.');
      return;
    }
    setSavingAddOn(true);
    const saved = await addAddOnGroup({
      name: newGroupName.trim(),
      minSelect: min,
      maxSelect: max,
      items: [],
    });
    setSavingAddOn(false);
    if (saved === false) {
      setAddOnError(useAppStore.getState().operationalError || 'Could not save the add-on category.');
      return;
    }
    sounds.playSuccess();
    setNewGroupName('');
    setNewGroupMin('0');
    setNewGroupMax('3');
    setShowAddGroupModal(false);
  };

  const handleConfirmPinReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinResetStaff && newPinValue.length === 4) {
      sounds.playSuccess();
      resetStaffPin(pinResetStaff.id, newPinValue);
      setPinResetStaff(null);
      setNewPinValue('');
    }
  };

  return (
    <div className="min-h-screen bg-surface-canvas flex flex-col select-none">
      <Header title="Manager Console" subtitle="Operations, Menu & Staff Administration">
        {/* Navigation Tabs */}
        <div className="flex items-center bg-gray-100 rounded-full p-0.5 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveTab('menu')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all ${
              activeTab === 'menu' ? 'bg-white text-gray-900 shadow-subtle font-bold' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Utensils size={13} />
            <span>Menu & Pricing</span>
          </button>
          <button
            onClick={() => setActiveTab('staff')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all ${
              activeTab === 'staff' ? 'bg-white text-gray-900 shadow-subtle font-bold' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Users size={13} />
            <span>Staff</span>
          </button>
          {!connectedOutlet && <><button
            onClick={() => setActiveTab('approvals')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all relative ${
              activeTab === 'approvals' ? 'bg-white text-gray-900 shadow-subtle font-bold' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <CheckSquare size={13} />
            <span>Approvals</span>
            {approvals.filter((a) => a.status === 'pending').length > 0 && (
              <span className="w-4 h-4 rounded-full bg-secondaryRed-500 text-white text-[10px] flex items-center justify-center font-bold">
                {approvals.filter((a) => a.status === 'pending').length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('operations')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all ${
              activeTab === 'operations' ? 'bg-white text-gray-900 shadow-subtle font-bold' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Activity size={13} />
            <span>Live Operations</span>
          </button></>}
        </div>
      </Header>

      <div className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* TAB 1: MENU MANAGEMENT */}
        {activeTab === 'menu' && (
          <div className="space-y-6">
            {/* Menu Sub-Tab Switcher: Dishes vs Add-ons */}
            <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
              <button
                type="button"
                onClick={() => setMenuSubTab('dishes')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  menuSubTab === 'dishes'
                    ? 'bg-gray-900 text-white shadow-subtle'
                    : 'bg-white text-gray-600 hover:text-gray-900 border border-gray-200'
                }`}
              >
                <Utensils size={14} />
                <span>Dishes & Products ({products.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setMenuSubTab('addons')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  menuSubTab === 'addons'
                    ? 'bg-gray-900 text-white shadow-subtle'
                    : 'bg-white text-gray-600 hover:text-gray-900 border border-gray-200'
                }`}
              >
                <Sparkles size={14} />
                <span>
                  Add-on Categories & Modifiers (
                  {addOnGroups.reduce((acc, g) => acc + g.items.length, 0)})
                </span>
              </button>
            </div>

            {menuSubTab === 'dishes' ? (
              <>
                {/* Menu Header + Search & Add Product */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="relative w-64">
                      <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
                      <input
                        type="text"
                        value={menuSearch}
                        onChange={(e) => setMenuSearch(e.target.value)}
                        placeholder="Search dishes..."
                        className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-gray-200 bg-white text-xs focus:outline-none"
                      />
                    </div>

                    <div className="flex gap-1 bg-gray-100 rounded-full p-0.5 text-xs font-semibold">
                      <button
                        onClick={() => setSelectedCategory('all')}
                        className={`px-3 py-1 rounded-full capitalize ${
                          selectedCategory === 'all' ? 'bg-white text-gray-900 shadow-subtle' : 'text-gray-500'
                        }`}
                      >
                        All
                      </button>
                      {categories.filter((c) => c.slug !== 'all').map((c) => (
                        <button
                          key={c.id}
                          onClick={() => setSelectedCategory(c.id)}
                          className={`px-3 py-1 rounded-full capitalize ${
                            selectedCategory === c.id ? 'bg-white text-gray-900 shadow-subtle' : 'text-gray-500'
                          }`}
                        >
                          {c.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => setShowAddProductModal(true)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold shadow-subtle transition-colors"
                  >
                    <Plus size={14} />
                    <span>Add Product</span>
                  </button>
                </div>

                {/* Products Table */}
                <div className="bg-white border border-gray-200 rounded-3xl overflow-x-auto shadow-card">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50/70 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="px-6 py-3.5">Dish</th>
                        <th className="px-6 py-3.5">Category</th>
                        <th className="px-6 py-3.5">Station</th>
                        <th className="px-6 py-3.5">Price</th>
                        <th className="px-6 py-3.5 text-center">Available / In Stock</th>
                        <th className="px-6 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                      {filteredProducts.map((prod) => (
                        <tr key={prod.id} className="hover:bg-gray-50/70 transition-colors">
                          <td className="px-6 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-gray-50 p-1 border border-gray-200/80 shrink-0 flex items-center justify-center">
                                <img key={prod.image} src={prod.image || DEFAULT_PRODUCT_IMAGE} alt={prod.name} className="w-full h-full object-contain" onError={(event) => {
                                  if (event.currentTarget.getAttribute('src') !== DEFAULT_PRODUCT_IMAGE) event.currentTarget.src = DEFAULT_PRODUCT_IMAGE;
                                }} />
                              </div>
                              <div>
                                <p className="font-bold text-gray-900">{prod.name}</p>
                                <p className="text-[11px] text-gray-400 line-clamp-1">{prod.description}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-3.5 text-gray-600">
                            {categories.find((c) => c.id === prod.categoryId)?.name || 'Category'}
                          </td>
                          <td className="px-6 py-3.5">
                            <span className="px-2 py-0.5 rounded-md bg-gray-100 font-semibold text-gray-700 text-[10px]">
                              {prod.station}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 font-bold text-gray-900">
                            {formatINR(prod.price)}
                          </td>
                          <td className="px-6 py-3.5 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                sounds.playSuccess();
                                toggleProductAvailability(prod.id);
                              }}
                              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                                prod.isAvailable
                                  ? 'bg-secondaryGreen-50 text-secondaryGreen-700 border border-secondaryGreen-200'
                                  : 'bg-secondaryRed-50 text-secondaryRed-700 border border-secondaryRed-200'
                              }`}
                            >
                              {prod.isAvailable ? 'In Stock (Live)' : 'Out of Stock'}
                            </button>
                          </td>
                          <td className="px-6 py-3.5 text-right">
                            <button
                              aria-label={'Edit ' + prod.name}
                              onClick={() => setEditingProduct(prod)}
                              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-600"
                            >
                              <Edit2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              /* DEDICATED SPACE FOR ADD-ONS */
              <div className="space-y-6">
                {/* Add-ons Header & Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="relative w-72">
                      <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
                      <input
                        type="text"
                        value={addOnSearch}
                        onChange={(e) => setAddOnSearch(e.target.value)}
                        placeholder="Search add-on toppings, drizzles..."
                        className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-gray-200 bg-white text-xs focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => { setAddOnError(''); setShowAddGroupModal(true); }}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold shadow-subtle transition-colors"
                    >
                      <Layers size={14} />
                      <span>+ New Add-on Category</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAddOnError('');
                        setSelectedAddOnGroupTarget(addOnGroups[0]?.id ?? '');
                        setShowAddAddOnModal(true);
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold shadow-subtle transition-colors"
                    >
                      <Plus size={14} />
                      <span>+ Add Modifier Item</span>
                    </button>
                  </div>
                </div>

                {/* Add-on Groups List */}
                <div className="space-y-5">
                  {addOnGroups.map((group) => {
                    const filteredItems = group.items.filter((it) =>
                      it.name.toLowerCase().includes(addOnSearch.toLowerCase())
                    );
                    const associatedProductsCount = products.filter((p) =>
                      p.addOnGroupIds?.includes(group.id)
                    ).length;

                    return (
                      <div
                        key={group.id}
                        className="bg-white border border-gray-200 rounded-3xl p-5 shadow-card space-y-4"
                      >
                        {/* Group Header */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-gray-100">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-800 border border-amber-200/60 flex items-center justify-center font-bold">
                              <Sparkles size={18} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-extrabold text-sm text-gray-900">
                                  {group.name}
                                </h4>
                                <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[10px] font-semibold">
                                  Min: {group.minSelect} · Max: {group.maxSelect}
                                </span>
                              </div>
                              <p className="text-xs text-gray-400 mt-0.5">
                                Active on {associatedProductsCount} dishes across POS
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setAddOnError('');
                              setSelectedAddOnGroupTarget(group.id);
                              setShowAddAddOnModal(true);
                            }}
                            className="text-xs font-bold text-gray-700 hover:text-gray-900 px-3 py-1.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 flex items-center gap-1"
                          >
                            <Plus size={13} />
                            <span>Add Item</span>
                          </button>
                        </div>

                        {/* Items in this group */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {filteredItems.map((item) => (
                            <div
                              key={item.id}
                              className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                                item.isAvailable === false
                                  ? 'bg-gray-50/60 border-gray-200 opacity-60'
                                  : 'bg-white border-gray-200/90 hover:border-gray-300 shadow-xs'
                              }`}
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">
                                <div className="w-10 h-10 rounded-xl bg-gray-50 p-1 border border-gray-200 shrink-0 flex items-center justify-center overflow-hidden">
                                  <img
                                    src={item.image || '/assets/coffee/cappuccino.webp'}
                                    alt={item.name}
                                    className="w-full h-full object-contain"
                                    onError={(e) => {
                                      e.currentTarget.src = '/assets/coffee/cappuccino.webp';
                                    }}
                                  />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="font-bold text-xs text-gray-900 truncate">
                                    {item.name}
                                  </p>
                                  <p className="text-xs font-black text-emerald-700 mt-0.5 font-mono">
                                    {formatINR(item.price)}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    sounds.playSuccess();
                                    toggleAddOnItemStock(group.id, item.id);
                                  }}
                                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                                    item.isAvailable !== false
                                      ? 'bg-secondaryGreen-50 text-secondaryGreen-700 border border-secondaryGreen-200'
                                      : 'bg-secondaryRed-50 text-secondaryRed-700 border border-secondaryRed-200'
                                  }`}
                                  title="Toggle availability"
                                >
                                  {item.isAvailable !== false ? 'In Stock' : 'Out'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (confirm(`Remove "${item.name}" from this category?`)) {
                                      deleteAddOnItem(group.id, item.id);
                                      sounds.playClick();
                                    }
                                  }}
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-secondaryRed-600 hover:bg-secondaryRed-50 transition-colors"
                                  title="Delete modifier"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: STAFF & PIN RESET */}
        {activeTab === 'staff' && (
          <div className="space-y-6">
            {staffError && <p role="alert" className="text-xs font-semibold text-red-700">{staffError}</p>}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="relative w-72">
                <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  value={staffSearch}
                  onChange={(e) => setStaffSearch(e.target.value)}
                  placeholder="Search staff members..."
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-gray-200 bg-white text-xs focus:outline-none"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  setStaffError('');
                  setShowAddStaffModal(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold shadow-subtle transition-colors"
              >
                <Plus size={14} />
                <span>Add Staff</span>
              </button>
            </div>

            <div className="bg-white border border-gray-200 rounded-3xl overflow-x-auto shadow-card">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50/70 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-6 py-3.5">Staff Member</th>
                    <th className="px-6 py-3.5">Role</th>
                    {!connectedOutlet && <th className="px-6 py-3.5">PIN</th>}
                    <th className="px-6 py-3.5">Contact</th>
                    <th className="px-6 py-3.5 text-center">Status</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                  {users
                    .filter((u) => u.name.toLowerCase().includes(staffSearch.toLowerCase()))
                    .map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gray-800 text-white font-bold text-xs flex items-center justify-center">
                              {user.avatarInitials}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900">{user.name}</p>
                              <p className="text-[11px] text-gray-400">{user.title}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-3.5">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-700">
                            {user.role}
                          </span>
                        </td>
                        {!connectedOutlet && <td className="px-6 py-3.5 font-mono font-bold text-gray-900">••••</td>}
                        <td className="px-6 py-3.5 text-gray-500">
                          {user.email || user.phone || '—'}
                        </td>
                        <td className="px-6 py-3.5 text-center">
                          <button
                            type="button"
                            disabled={
                              !!connectedOutlet &&
                              (!user.active ||
                                (canManageManagers
                                  ? !['manager', 'cashier', 'kitchen'].includes(user.role)
                                  : !['cashier', 'kitchen'].includes(user.role)))
                            }
                            onClick={async () => {
                              if (!connectedOutlet) return toggleStaffStatus(user.id);
                              if (!window.confirm('Disable ' + user.name + ' at this outlet?')) return;
                              const { error } = await supabase.rpc('disable_outlet_staff', {
                                p_outlet: connectedOutlet.outletId,
                                p_staff: user.id,
                              });
                              if (error) {
                                setStaffError('Could not disable this staff assignment.');
                              } else {
                                setStaffError('');
                                await refreshOutletWorkspace(connectedOutlet.outletId);
                              }
                            }}
                            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                              user.active
                                ? 'bg-secondaryGreen-50 text-secondaryGreen-700 border border-secondaryGreen-200'
                                : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            {user.active ? 'Active' : 'Deactivated'}
                          </button>
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          {!connectedOutlet && <button
                            onClick={() => {
                              setPinResetStaff(user);
                              setNewPinValue('');
                            }}
                            className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-xs font-semibold text-gray-700 inline-flex items-center gap-1.5"
                          >
                            <Lock size={12} />
                            Reset PIN
                          </button>}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: APPROVALS QUEUE */}
        {activeTab === 'approvals' && (
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-gray-900 text-lg">Cashier Authorizations Queue</h3>
              <p className="text-xs text-gray-400">
                Live queue for refund requests, order voids, and discount overrides.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-3xl overflow-x-auto shadow-card">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50/70 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-6 py-3.5">Type</th>
                    <th className="px-6 py-3.5">Order</th>
                    <th className="px-6 py-3.5">Amount</th>
                    <th className="px-6 py-3.5">Reason</th>
                    <th className="px-6 py-3.5">Requested By</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                  {approvals.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                        No pending approvals in queue.
                      </td>
                    </tr>
                  ) : (
                    approvals.map((app) => (
                      <tr key={app.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="px-6 py-3.5">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-secondaryRed-50 text-secondaryRed-700">
                            {app.type}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 font-bold text-gray-900">{app.orderNumber}</td>
                        <td className="px-6 py-3.5 font-extrabold text-gray-900">
                          {formatINR(app.amount)}
                        </td>
                        <td className="px-6 py-3.5 text-gray-600 max-w-xs">{app.reason}</td>
                        <td className="px-6 py-3.5 text-gray-500">
                          <p className="font-semibold text-gray-800">{app.requestedBy}</p>
                          <p className="text-[10px]">{formatTime(app.requestedAt)}</p>
                        </td>
                        <td className="px-6 py-3.5">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                              app.status === 'approved'
                                ? 'bg-secondaryGreen-50 text-secondaryGreen-700'
                                : app.status === 'rejected'
                                ? 'bg-gray-100 text-gray-600'
                                : 'bg-accent-50 text-accent-700 animate-pulse'
                            }`}
                          >
                            {app.status}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-center">
                          {app.status === 'pending' ? (
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => {
                                  sounds.playSuccess();
                                  resolveApproval(app.id, 'approved', currentUser?.name || 'Alex Manager');
                                }}
                                className="px-3 py-1 rounded-lg bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => {
                                  sounds.playError();
                                  resolveApproval(app.id, 'rejected', currentUser?.name || 'Alex Manager');
                                }}
                                className="px-3 py-1 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-700 font-semibold text-xs"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">Reviewed by {app.reviewedBy}</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: LIVE OPERATIONS */}
        {activeTab === 'operations' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-subtle">
                <span className="text-xs text-gray-400 font-semibold block mb-1">Open Kitchen Tickets</span>
                <span className="text-3xl font-black text-gray-900">
                  {tickets.filter((t) => t.status !== 'bumped').length}
                </span>
                <span className="text-[11px] text-gray-400 mt-1 block">Live at stations</span>
              </div>

              <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-subtle">
                <span className="text-xs text-gray-400 font-semibold block mb-1">Average Ticket Time</span>
                <span className="text-3xl font-black text-gray-900 font-mono">08:42</span>
                <span className="text-[11px] text-secondaryGreen-700 font-semibold mt-1 block">
                  Within 12m target
                </span>
              </div>

              <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-subtle">
                <span className="text-xs text-gray-400 font-semibold block mb-1">Late Tickets (&gt;15m)</span>
                <span className="text-3xl font-black text-secondaryRed-600">1</span>
                <span className="text-[11px] text-secondaryRed-600 font-medium mt-1 block">
                  #329 Table 4 (Grill)
                </span>
              </div>

              <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-subtle">
                <span className="text-xs text-gray-400 font-semibold block mb-1">Kitchen On-Time Rate</span>
                <span className="text-3xl font-black text-gray-900">91%</span>
                <span className="text-[11px] text-gray-400 mt-1 block">Shift compliance</span>
              </div>
            </div>

            {/* Station Load Breakdown */}
            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-card">
              <h3 className="font-bold text-gray-900 text-base mb-4">Current Station Workload</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { station: 'Grill Station', portions: 8, lead: 'Marcus Chen', load: 'Moderate' },
                  { station: 'Fry Station', portions: 9, lead: 'Priya Sharma', load: 'Heavy' },
                  { station: 'Cold Station', portions: 3, lead: 'Jesselyn Tan', load: 'Light' },
                  { station: 'Expo / Pass', portions: 2, lead: 'Alex Rivera', load: 'Optimal' },
                ].map((s) => (
                  <div key={s.station} className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                    <p className="font-bold text-sm text-gray-900">{s.station}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Staff: {s.lead}</p>
                    <div className="mt-3 flex items-center justify-between text-xs">
                      <span className="font-black text-xl text-gray-900">{s.portions}</span>
                      <span className="px-2 py-0.5 rounded-full bg-white border border-gray-200 font-bold text-[10px]">
                        {s.load}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {(showAddProductModal || editingProduct) && (
        <ProductEditor
          key={`${connectedOutlet?.outletId ?? 'demo'}:${editingProduct?.id ?? 'new'}`}
          product={editingProduct ?? undefined}
          categories={categories}
          addOnGroups={addOnGroups}
          outletId={connectedOutlet?.outletId}
          onClose={() => {
            setShowAddProductModal(false);
            setEditingProduct(null);
          }}
        />
      )}

      {/* Reset Staff PIN Modal */}
      {pinResetStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4 select-none">
          <div className="bg-white border border-gray-200 rounded-3xl w-full max-w-sm p-6 shadow-modal">
            <h3 className="font-bold text-gray-900 text-base mb-2">
              Reset PIN for {pinResetStaff.name}
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Enter a new 4-digit PIN for staff authentication.
            </p>
            <form onSubmit={handleConfirmPinReset}>
              <input
                type="text"
                maxLength={4}
                value={newPinValue}
                onChange={(e) => setNewPinValue(e.target.value.replace(/\D/g, ''))}
                placeholder="e.g. 5555"
                className="w-full px-3 py-2 text-center text-xl font-bold tracking-widest rounded-xl border border-gray-200 mb-4 focus:outline-none"
                required
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPinResetStaff(null)}
                  className="flex-1 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={newPinValue.length !== 4}
                  className="flex-1 py-2 rounded-xl bg-gray-900 text-white text-xs font-bold disabled:opacity-50"
                >
                  Confirm PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      <AddTeamMemberModal
        isOpen={showAddStaffModal}
        onClose={() => setShowAddStaffModal(false)}
      />

      {/* Modal: Add New Modifier Item */}
      {showAddAddOnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4 select-none">
          <div className="bg-white border border-gray-200 rounded-3xl w-full max-w-md p-6 shadow-modal">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 text-base">Add New Modifier Item</h3>
              <button
                type="button"
                disabled={savingAddOn}
                onClick={() => setShowAddAddOnModal(false)}
                className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600"
              >
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleCreateAddOnItem} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Target Category / Group</label>
                <select
                  required
                  value={selectedAddOnGroupTarget}
                  onChange={(e) => setSelectedAddOnGroupTarget(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white"
                >
                  {!addOnGroups.length && <option value="">Create an add-on category first</option>}
                  {addOnGroups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Add-on Item Name</label>
                <input
                  type="text"
                  value={newAddOnName}
                  onChange={(e) => setNewAddOnName(e.target.value)}
                  placeholder="e.g. Belgian Dark Chocolate Drizzle"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Additional Price (₹)</label>
                <input
                  type="number"
                  min="0" max="100000000" step="0.01"
                  value={newAddOnPrice}
                  onChange={(e) => setNewAddOnPrice(e.target.value)}
                  placeholder="50"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 font-bold"
                  required
                />
              </div>

              {addOnError && <p role="alert" className="font-semibold text-red-700">{addOnError}</p>}
              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  disabled={savingAddOn}
                  onClick={() => setShowAddAddOnModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 font-semibold text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAddOn}
                  className="flex-1 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-bold disabled:opacity-50"
                >
                  {savingAddOn ? 'Saving…' : 'Save Add-on Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create New Add-On Category / Group */}
      {showAddGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4 select-none">
          <div className="bg-white border border-gray-200 rounded-3xl w-full max-w-md p-6 shadow-modal">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 text-base">New Add-on Category</h3>
              <button
                type="button"
                disabled={savingAddOn}
                onClick={() => setShowAddGroupModal(false)}
                className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600"
              >
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleCreateAddOnGroup} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Category Name</label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="e.g. Cheese & Cream Drizzles"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none"
                  required
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Min Selection</label>
                  <input
                    type="number"
                    min="0" max="30" required
                    value={newGroupMin}
                    onChange={(e) => setNewGroupMin(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200"
                  />
                  <p className="text-[10px] text-gray-400 mt-0.5">0 for optional</p>
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Max Selection</label>
                  <input
                    type="number"
                    min={Math.max(1, Number(newGroupMin))} max="30" required
                    value={newGroupMax}
                    onChange={(e) => setNewGroupMax(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200"
                  />
                  <p className="text-[10px] text-gray-400 mt-0.5">Max allowed choices</p>
                </div>
              </div>

              {addOnError && <p role="alert" className="font-semibold text-red-700">{addOnError}</p>}
              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  disabled={savingAddOn}
                  onClick={() => setShowAddGroupModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 font-semibold text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAddOn}
                  className="flex-1 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-bold disabled:opacity-50"
                >
                  {savingAddOn ? 'Saving…' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

