'use client';

import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { useDialogFocus } from '@/hooks/useDialogFocus';
import { supabase } from '@/lib/supabase/client';
import { useAppStore } from '@/store';
import { sounds } from '@/utils/audio';
import type { AddOnGroup, Category, Product } from '@/types';

export const DEFAULT_PRODUCT_IMAGE = '/assets/coffee/cappuccino.webp';
const IMAGE_EXTENSIONS: Readonly<Record<string, string>> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};
const MAX_PRICE = 100_000_000;
const fieldClass = 'w-full px-3 py-2 rounded-xl border border-gray-200 bg-white';

function readLocalImage(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read the image. Select it again.'));
    reader.readAsDataURL(file);
  });
}

interface ProductEditorProps {
  product?: Product;
  categories: Category[];
  addOnGroups: AddOnGroup[];
  outletId?: string;
  onClose: () => void;
}

export function ProductEditor({ product, categories, addOnGroups, outletId, onClose }: ProductEditorProps) {
  const id = useId();
  const [name, setName] = useState(product?.name ?? '');
  const [price, setPrice] = useState(product ? String(product.price) : '249');
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? '');
  const [station, setStation] = useState<Product['station']>(product?.station ?? 'Cold');
  const [description, setDescription] = useState(product?.description ?? '');
  const [groupIds, setGroupIds] = useState(product?.addOnGroupIds ?? []);
  const [discountPercent, setDiscountPercent] = useState(product?.discountPercent ?? 0);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [imageError, setImageError] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const submitting = useRef(false);
  const uploaded = useRef<{ file: File; url: string } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const options = categories.filter((category) => category.slug !== 'all');
  const selectedCategory = options.some((category) => category.id === categoryId) ? categoryId : options[0]?.id ?? '';
  const imageLimit = outletId ? 5 * 1024 * 1024 : 256 * 1024;
  const close = () => { if (!submitting.current) onClose(); };
  const dialog = useDialogFocus(true, close);

  useEffect(() => {
    if (!file) {
      setPreview('');
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function selectImage(selected: File | null) {
    setError('');
    setImageError('');
    setFile(null);
    uploaded.current = null;
    if (!selected) return;
    if (!Object.hasOwn(IMAGE_EXTENSIONS, selected.type) || !selected.size || selected.size > imageLimit) {
      setImageError(outletId ? 'Select a JPEG, PNG or WebP image up to 5 MB.' : 'Select a JPEG, PNG or WebP image up to 256 KB in demo mode.');
      return;
    }
    setFile(selected);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current || imageError) return;
    if (!name.trim() || !selectedCategory || !price.trim() || !Number.isFinite(Number(price)) || Number(price) < 0 || Number(price) > MAX_PRICE) {
      setError('Enter an item name, an available category and a valid price.');
      return;
    }

    submitting.current = true;
    setSaving(true);
    setError('');
    try {
      let image = product?.image || DEFAULT_PRODUCT_IMAGE;
      if (file) {
        // Confirm the image can be decoded before storing it.
        if (!preview) throw new Error('Wait for the image preview, then try again.');
        const imageCheck = new Image();
        imageCheck.src = preview;
        await imageCheck.decode().catch(() => {
          throw new Error('Could not read this image. Choose another file.');
        });
        if (!outletId) {
          image = await readLocalImage(file);
        } else if (uploaded.current?.file === file) {
          image = uploaded.current.url;
        } else {
          const path = outletId + '/' + crypto.randomUUID() + '.' + IMAGE_EXTENSIONS[file.type];
          const bucket = supabase.storage.from('product-images');
          const { error: uploadError } = await bucket.upload(path, file, { contentType: file.type });
          if (uploadError) throw new Error('Image upload failed. ' + uploadError.message);
          image = bucket.getPublicUrl(path).data.publicUrl;
          uploaded.current = { file, url: image };
        }
      }
      const store = useAppStore.getState();
      if (store.connectedOutlet?.outletId !== outletId) throw new Error('The active outlet changed. Reopen the product editor.');
      const details = {
        name: name.trim(), price: Number(price), categoryId: selectedCategory, station,
        description: description.trim(), image, addOnGroupIds: groupIds,
      };
      const saved = product
        ? await store.updateProduct(product.id, { ...details, ...(!outletId && { discountPercent }) })
        : await store.addProduct({ ...details, isAvailable: true });
      if (saved === false) throw new Error(useAppStore.getState().operationalError || 'Could not save the product.');
      sounds.playSuccess();
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Could not save the product.');
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  }

  return (
    <div ref={dialog} role="dialog" aria-modal="true" aria-labelledby={id} tabIndex={-1} className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
      <div className="bg-white border border-gray-200 rounded-3xl w-full max-w-lg p-6 shadow-modal max-h-[90vh] overflow-y-auto">
        <h3 id={id} className="font-bold text-gray-900 text-base mb-4">{product ? 'Edit ' + product.name : 'Add Menu Item'}</h3>
        <form onSubmit={save} className="text-xs">
          <fieldset disabled={saving} className="space-y-4">
            <label className="block font-semibold text-gray-700">
              Item Name
              <input className={fieldClass} value={name} onChange={(event) => setName(event.target.value)} required />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block font-semibold text-gray-700">
                Price (₹)
                <input className={fieldClass} type="number" min="0" max={MAX_PRICE} step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} required />
              </label>
              <label className="block font-semibold text-gray-700">
                Category
                <select className={fieldClass} value={selectedCategory} onChange={(event) => setCategoryId(event.target.value)} required>
                  {!options.length && <option value="">No categories available</option>}
                  {options.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </select>
              </label>
            </div>
            <label className="block font-semibold text-gray-700">
              Kitchen Station
              <select className={fieldClass} value={station} onChange={(event) => setStation(event.target.value as Product['station'])}>
                <option value="Cold">Cold Station</option>
                <option value="Expo">Expo Pass</option>
                <option value="Grill">Grill Station</option>
                <option value="Fry">Fry Station</option>
              </select>
            </label>
            <label className="block font-semibold text-gray-700">
              Description
              <textarea className={fieldClass} value={description} onChange={(event) => setDescription(event.target.value)} rows={2} />
            </label>
            <div className="flex items-center gap-3">
              <img key={preview || product?.image} src={preview || product?.image || DEFAULT_PRODUCT_IMAGE} alt="Product image preview" className="w-16 h-16 rounded-xl border object-cover" onError={(event) => {
                if (preview) setImageError('Could not read this image. Choose another file.');
                if (event.currentTarget.getAttribute('src') !== DEFAULT_PRODUCT_IMAGE) event.currentTarget.src = DEFAULT_PRODUCT_IMAGE;
              }} />
              <div className="min-w-0 flex-1">
                <label className="block font-semibold text-gray-700">
                  Product Image
                  <input ref={fileInput} type="file" className={fieldClass} accept={Object.keys(IMAGE_EXTENSIONS).join(',')} onChange={(event) => selectImage(event.target.files?.[0] ?? null)} />
                </label>
                <p className="mt-1 text-gray-500">JPEG, PNG or WebP up to {outletId ? '5 MB' : '256 KB'}.</p>
                {(file || imageError) && <button type="button" className="mt-1 font-semibold underline" onClick={() => {
                  if (fileInput.current) fileInput.current.value = '';
                  selectImage(null);
                }}>Clear selected image</button>}
              </div>
            </div>
            {addOnGroups.length > 0 && (
              <fieldset className="space-y-2 max-h-36 overflow-y-auto p-2.5 bg-gray-50 border border-gray-200 rounded-2xl">
                <legend className="font-bold text-gray-800">Applicable Add-on Categories</legend>
                {addOnGroups.map((group) => (
                  <label key={group.id} className="flex items-center gap-2 font-semibold">
                    <input type="checkbox" checked={groupIds.includes(group.id)} onChange={(event) => {
                      setGroupIds(event.target.checked ? [...groupIds, group.id] : groupIds.filter((id) => id !== group.id));
                    }} />
                    {group.name}
                  </label>
                ))}
              </fieldset>
            )}
            {product && !outletId && (
              <label className="block font-semibold text-gray-700">
                Discount % Tag
                <input className={fieldClass} type="number" min="0" max="100" value={discountPercent} onChange={(event) => setDiscountPercent(Number(event.target.value))} />
              </label>
            )}
            {(imageError || error) && <p role="alert" className="font-semibold text-red-700">{imageError || error}</p>}
            <div className="flex gap-2 pt-3">
              <button type="button" onClick={close} className="flex-1 py-2 rounded-xl border border-gray-200 font-semibold text-gray-700 disabled:opacity-50">Cancel</button>
              <button type="submit" disabled={saving || Boolean(imageError) || !selectedCategory} className="flex-1 py-2 rounded-xl bg-gray-900 text-white font-bold disabled:opacity-50">
                {saving ? 'Saving…' : product ? 'Save Changes' : 'Create Product'}
              </button>
            </div>
          </fieldset>
        </form>
      </div>
    </div>
  );
}
