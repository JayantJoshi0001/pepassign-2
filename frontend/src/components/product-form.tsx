'use client';

import type { ChangeEvent, FormEvent } from 'react';

import type { ProductFormValues } from '@/lib/products';

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
  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      onChange({ ...values, imageUrl: String(reader.result ?? '') });
    };
    reader.readAsDataURL(file);
  }

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

      <label className="space-y-2 text-sm font-medium text-slate-700">
        Category
        <input
          value={values.category}
          onChange={(event) => onChange({ ...values, category: event.target.value })}
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
          required
        />
      </label>

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

      <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
        Image URL or data URL
        <input
          value={values.imageUrl}
          onChange={(event) => onChange({ ...values, imageUrl: event.target.value })}
          placeholder="https://... or a pasted data URL"
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
        />
      </label>

      <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
        Upload image file
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="w-full rounded-xl border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-600 outline-none transition file:mr-4 file:rounded-lg file:border-0 file:bg-cyan-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-cyan-700 hover:border-cyan-400"
        />
      </label>

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