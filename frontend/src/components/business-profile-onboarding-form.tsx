'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { FormEvent } from 'react';

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

const BUSINESS_PROFILE_DRAFT_KEY = 'pepassign.business-profile.draft';

export function BusinessProfileOnboardingForm() {
  const router = useRouter();
  const [values, setValues] = useState<BusinessProfileValues>(initialValues);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const storedDraft = window.localStorage.getItem(BUSINESS_PROFILE_DRAFT_KEY);

      if (storedDraft) {
        try {
          const parsedDraft = JSON.parse(storedDraft) as BusinessProfileValues;
          setValues({
            ...initialValues,
            ...parsedDraft,
            businessAddress: {
              ...initialValues.businessAddress,
              ...(parsedDraft.businessAddress ?? {}),
            },
          });
        } catch {
          window.localStorage.removeItem(BUSINESS_PROFILE_DRAFT_KEY);
        }
      }

      setHydrated(true);
    }, 0);

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== BUSINESS_PROFILE_DRAFT_KEY) {
        return;
      }

      if (!event.newValue) {
        setValues(initialValues);
        return;
      }

      try {
        const parsedDraft = JSON.parse(event.newValue) as BusinessProfileValues;
        setValues({
          ...initialValues,
          ...parsedDraft,
          businessAddress: {
            ...initialValues.businessAddress,
            ...(parsedDraft.businessAddress ?? {}),
          },
        });
      } catch {
        window.localStorage.removeItem(BUSINESS_PROFILE_DRAFT_KEY);
      }
    };

    window.addEventListener('storage', handleStorage);

    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    const hasDraft =
      values.businessName.trim().length > 0 ||
      values.businessDescription.trim().length > 0 ||
      values.contactNumber.trim().length > 0 ||
      values.websiteUrl.trim().length > 0 ||
      values.taxId.trim().length > 0 ||
      values.logo.trim().length > 0 ||
      values.businessCategory.length > 0 ||
      Object.values(values.businessAddress).some(
        (fieldValue) => typeof fieldValue === 'string' && fieldValue.trim().length > 0,
      );

    const timeout = window.setTimeout(() => {
      if (!hasDraft) {
        window.localStorage.removeItem(BUSINESS_PROFILE_DRAFT_KEY);
        return;
      }

      window.localStorage.setItem(BUSINESS_PROFILE_DRAFT_KEY, JSON.stringify(values));
    }, 1500);

    return () => window.clearTimeout(timeout);
  }, [hydrated, values]);

  function clearDraft() {
    window.localStorage.removeItem(BUSINESS_PROFILE_DRAFT_KEY);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await apiPatch<{
        onboardingComplete: boolean;
      }>('/api/users/me', values);

      if (response.onboardingComplete) {
        clearDraft();
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