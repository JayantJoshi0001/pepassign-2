'use client';

import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';

import type { ProductFormValues } from '@/lib/products';

import { MultiSelectInput } from './multi-select-input';

const PRODUCT_CATEGORY_OPTIONS = [
  'Food',
  'Clothing',
  'Electronics',
  'Healthcare',
  'Education',
  'Services',
  'Beauty',
  'Automotive',
  'Retail',
  'Furniture',
  'Home & Living',
  'Travel',
  'Fitness',
  'Technology',
];

const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }

      reject(new Error('Unable to read the selected file.'));
    };

    reader.onerror = () => reject(new Error('Unable to read the selected file.'));
    reader.readAsDataURL(file);
  });
}

interface ProductFormProps {
  values: ProductFormValues;
  onChange: (nextValues: ProductFormValues) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  submitLabel: string;
  loading?: boolean;
  onCancel?: () => void;
  cancelLabel?: string;
}

export function ProductForm({
  values,
  onChange,
  onSubmit,
  submitLabel,
  loading = false,
  onCancel,
  cancelLabel = 'Cancel',
}: ProductFormProps) {
  const [imageError, setImageError] = useState('');

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      setImageError('');
      onChange({ ...values, imageUrl: '' });
      return;
    }

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setImageError('Please upload a JPG or PNG image.');
      event.target.value = '';
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setImageError('Image must be 2 MB or smaller.');
      event.target.value = '';
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      setImageError('');
      onChange({ ...values, imageUrl: dataUrl });
    } catch (error) {
      setImageError(error instanceof Error ? error.message : 'Unable to load the selected image.');
      event.target.value = '';
    }
  }

  function handleCategoryChange(selectedCategories: string[]) {
    onChange({ ...values, category: selectedCategories.join(', ') });
  }

  const selectedCategories = values.category
    .split(',')
    .map((category) => category.trim())
    .filter(Boolean);

  return (
    <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
      <label className="space-y-2 text-sm font-medium text-slate-700">
        Product name
        <input
          value={values.productName}
          onChange={(event) => onChange({ ...values, productName: event.target.value })}
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
          required
        />
      </label>

      <div className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
        <span>Product categories</span>
        <MultiSelectInput
          options={PRODUCT_CATEGORY_OPTIONS}
          selected={selectedCategories}
          onChange={handleCategoryChange}
          placeholder="Click or type to select categories..."
          required
        />
      </div>

      <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
        Description
        <textarea
          value={values.productDescription}
          onChange={(event) => onChange({ ...values, productDescription: event.target.value })}
          rows={4}
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
          required
        />
      </label>

      <label className="space-y-2 text-sm font-medium text-slate-700">
        Price
        <input
          type="number"
          min="0"
          step="0.01"
          value={values.price}
          onChange={(event) => onChange({ ...values, price: event.target.value })}
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
          required
        />
      </label>

      <label className="space-y-2 text-sm font-medium text-slate-700">
        Stock quantity
        <input
          type="number"
          min="0"
          step="1"
          value={values.stockQuantity}
          onChange={(event) => onChange({ ...values, stockQuantity: event.target.value })}
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
          required
        />
      </label>

      <div className="space-y-3 md:col-span-2">
        <label className="space-y-2 text-sm font-medium text-slate-700">
          Product image
          <input
            type="file"
            accept="image/png,image/jpeg"
            onChange={handleFileChange}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition file:mr-4 file:rounded-lg file:border-0 file:bg-cyan-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-cyan-700 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
          />
        </label>

        {imageError ? <p className="text-sm text-rose-600">{imageError}</p> : null}

        {values.imageUrl ? (
          <div className="overflow-hidden rounded-2xl border-none bg-white">
            <div className="border-none py-3 text-sm font-medium text-slate-700">
              Image preview
            </div>
            <div className="flex items-center gap-4 p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={values.imageUrl}
                alt="Selected product image preview"
                className="h-24 w-24 rounded-2xl border border-slate-200 object-cover"
              />
              <div className="space-y-1 text-sm text-slate-600">
                <p className="font-medium text-slate-900">Preview ready</p>
                <p>The uploaded image is stored as a base64 data URL before submission.</p>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="md:col-span-2 flex flex-wrap items-center justify-end gap-3">
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            {cancelLabel}
          </button>
        ) : null}
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
}