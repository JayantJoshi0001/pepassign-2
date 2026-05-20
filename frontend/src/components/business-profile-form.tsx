'use client';

import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';

import { MultiSelectInput } from './multi-select-input';

export interface BusinessAddressValues {
  street: string;
  landmark: string;
  city: string;
  district: string;
  state: string;
  country: string;
  pincode: string;
  latitude?: string;
  longitude?: string;
}

export interface BusinessProfileValues {
  businessName: string;
  businessAddress: BusinessAddressValues;
  businessDescription: string;
  contactNumber: string;
  businessCategory: string[];
  websiteUrl: string;
  taxId: string;
  logo: string;
}

const BUSINESS_CATEGORY_OPTIONS = [
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

const MAX_LOGO_SIZE_BYTES = 2 * 1024 * 1024;

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

interface BusinessProfileFormProps {
  values: BusinessProfileValues;
  onChange: (nextValues: BusinessProfileValues) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  loading?: boolean;
}

export function BusinessProfileForm({
  values,
  onChange,
  onSubmit,
  loading = false,
}: BusinessProfileFormProps) {
  const [logoError, setLogoError] = useState('');

  async function handleLogoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      setLogoError('');
      onChange({ ...values, logo: '' });
      return;
    }

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setLogoError('Please upload a JPG or PNG image.');
      event.target.value = '';
      return;
    }

    if (file.size > MAX_LOGO_SIZE_BYTES) {
      setLogoError('Logo must be 2 MB or smaller.');
      event.target.value = '';
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      setLogoError('');
      onChange({ ...values, logo: dataUrl });
    } catch (error) {
      setLogoError(error instanceof Error ? error.message : 'Unable to load the selected logo.');
      event.target.value = '';
    }
  }

  function updateAddress(partial: Partial<BusinessAddressValues>) {
    onChange({
      ...values,
      businessAddress: {
        ...values.businessAddress,
        ...partial,
      },
    });
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2 text-sm font-medium text-slate-700">
        <span>Business name</span>
        <input
          value={values.businessName}
          onChange={(event) => onChange({ ...values, businessName: event.target.value })}
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
          required
        />
      </div>

      <div className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
        <span>Business categories</span>
        <MultiSelectInput
          options={BUSINESS_CATEGORY_OPTIONS}
          selected={values.businessCategory}
          onChange={(selectedCategories) =>
            onChange({ ...values, businessCategory: selectedCategories })
          }
          placeholder="Click or type to select categories..."
          required
        />
      </div>

      <div className="space-y-4 rounded-2xl md:col-span-2">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-medium tracking-wide text-slate-600">
            Business Address
          </h3>
          <span className="text-xs text-slate-500">Structured address fields</span>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
            Street address
            <input
              value={values.businessAddress.street}
              onChange={(event) => updateAddress({ street: event.target.value })}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              required
            />
          </label>

          <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
            Landmark
            <input
              value={values.businessAddress.landmark}
              onChange={(event) => updateAddress({ landmark: event.target.value })}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              placeholder="Near bus stand, opposite mall, etc."
            />
          </label>

          <label className="space-y-2 text-sm font-medium text-slate-700">
            City
            <input
              value={values.businessAddress.city}
              onChange={(event) => updateAddress({ city: event.target.value })}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              required
            />
          </label>

          <label className="space-y-2 text-sm font-medium text-slate-700">
            District
            <input
              value={values.businessAddress.district}
              onChange={(event) => updateAddress({ district: event.target.value })}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              required
            />
          </label>

          <label className="space-y-2 text-sm font-medium text-slate-700">
            State
            <input
              value={values.businessAddress.state}
              onChange={(event) => updateAddress({ state: event.target.value })}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              required
            />
          </label>

          <label className="space-y-2 text-sm font-medium text-slate-700">
            Country / nationality
            <input
              value={values.businessAddress.country}
              onChange={(event) => updateAddress({ country: event.target.value })}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              required
            />
          </label>

          <label className="space-y-2 text-sm font-medium text-slate-700">
            Pincode
            <input
              value={values.businessAddress.pincode}
              onChange={(event) => updateAddress({ pincode: event.target.value })}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              required
            />
          </label>
        </div>
      </div>

      <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
        Business description
        <textarea
          value={values.businessDescription}
          onChange={(event) => onChange({ ...values, businessDescription: event.target.value })}
          rows={4}
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
          required
        />
      </label>

      <label className="space-y-2 text-sm font-medium text-slate-700">
        Contact number
        <input
          value={values.contactNumber}
          onChange={(event) => onChange({ ...values, contactNumber: event.target.value })}
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
          required
        />
      </label>

      <label className="space-y-2 text-sm font-medium text-slate-700">
        Website URL
        <input
          value={values.websiteUrl}
          onChange={(event) => onChange({ ...values, websiteUrl: event.target.value })}
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
          placeholder="https://your-business.com"
        />
      </label>

      <label className="space-y-2 text-sm font-medium text-slate-700">
        Tax ID
        <input
          value={values.taxId}
          onChange={(event) => onChange({ ...values, taxId: event.target.value })}
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
        />
      </label>

      <div className="space-y-3 md:col-span-2">
        <label className="space-y-2 text-sm font-medium text-slate-700">
          Business logo
          <input
            type="file"
            accept="image/png,image/jpeg"
            onChange={handleLogoChange}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition file:mr-4 file:rounded-lg file:border-0 file:bg-cyan-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-cyan-700 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
          />
        </label>

        {logoError ? <p className="text-sm text-rose-600">{logoError}</p> : null}

        {values.logo ? (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-4 py-3 text-sm font-medium text-slate-700">
              Logo preview
            </div>
            <div className="flex items-center gap-4 p-4">
              <img
                src={values.logo}
                alt="Selected business logo preview"
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

      <div className="md:col-span-2 flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-cyan-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Saving profile...' : 'Complete onboarding'}
        </button>
      </div>
    </form>
  );
}