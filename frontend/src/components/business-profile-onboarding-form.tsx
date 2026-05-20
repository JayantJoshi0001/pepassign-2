'use client';

import { useRouter } from 'next/navigation';
import type { FormEvent } from 'react';
import { useState } from 'react';

import { apiPatch } from '@/lib/api';

import { BusinessProfileForm, type BusinessProfileValues } from './business-profile-form';

const initialValues: BusinessProfileValues = {
  businessName: '',
  businessAddress: {
    street: '',
    landmark: '',
    city: '',
    district: '',
    state: '',
    country: '',
    pincode: '',
    latitude: '',
    longitude: '',
  },
  businessDescription: '',
  contactNumber: '',
  businessCategory: [],
  websiteUrl: '',
  taxId: '',
  logo: '',
};

export function BusinessProfileOnboardingForm() {
  const router = useRouter();
  const [values, setValues] = useState<BusinessProfileValues>(initialValues);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await apiPatch<{
        onboardingComplete: boolean;
      }>('/api/users/me', values);

      if (response.onboardingComplete) {
        router.push('/dashboard');
        router.refresh();
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to complete your profile right now.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <BusinessProfileForm
        values={values}
        onChange={setValues}
        onSubmit={handleSubmit}
        loading={loading}
      />
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
    </div>
  );
}