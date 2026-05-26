'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { FormEvent, JSX } from 'react';

import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from '@/lib/api';
import {
  emptyProductFormValues,
  type ProductFormValues,
  type ProductRecord,
} from '@/lib/products';

import { ProductCard } from './product-card';
import { ProductForm } from './product-form';

interface ProductDraftRecord {
  data: ProductFormValues;
}

function toFormValues(values?: Partial<ProductFormValues>): ProductFormValues {
  return {
    productName: values?.productName ?? '',
    productDescription: values?.productDescription ?? '',
    price: values?.price ?? '',
    category: values?.category ?? '',
    imageUrl: values?.imageUrl ?? '',
    stockQuantity: values?.stockQuantity ?? '',
  };
}

function hasProductValues(values: ProductFormValues) {
  return Object.values(values).some((value) => value.trim().length > 0);
}

function draftQuery(scope: 'create' | 'edit', productId?: string) {
  const searchParams = new URLSearchParams({ scope });

  if (productId) {
    searchParams.set('productId', productId);
  }

  return searchParams.toString();
}

export function ProductManager() {
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [formValues, setFormValues] = useState<ProductFormValues>(emptyProductFormValues);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [enhancingImage, setEnhancingImage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [draftLoading, setDraftLoading] = useState(false);
  const [createDraftValues, setCreateDraftValues] = useState<ProductFormValues | null>(null);
  const [clearedEmptyCreateDraft, setClearedEmptyCreateDraft] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function loadCreateDraft() {
    const draft = await apiGet<ProductDraftRecord | null>(
      `/api/product-drafts?${draftQuery('create')}`,
    );

    const nextDraft = draft ? toFormValues(draft.data) : null;
    setCreateDraftValues(nextDraft);
    return nextDraft;
  }

  async function loadProducts() {
    setLoading(true);
    setError('');

    try {
      const response = await apiGet<ProductRecord[]>('/api/products');
      setProducts(response);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : 'Unable to load products.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadProducts();
    void loadCreateDraft();
  }, []);

  function clearFormState() {
    setEditingProductId(null);
    setFormValues(emptyProductFormValues);
    setFormVisible(false);
    setClearedEmptyCreateDraft(false);
    setEnhancingImage(false);
  }

  async function openCreateForm() {
    setDraftLoading(true);
    setError('');
    setSuccess('');

    try {
      if (createDraftValues) {
        setFormValues(createDraftValues);
      } else {
        const loadedDraft = await loadCreateDraft();
        setFormValues(loadedDraft ?? emptyProductFormValues);
      }

      setEditingProductId(null);
      setClearedEmptyCreateDraft(false);
      setFormVisible(true);
    } finally {
      setDraftLoading(false);
    }
  }

  async function startEditing(product: ProductRecord) {
    setDraftLoading(true);
    setError('');
    setSuccess('');

    try {
      const draft = await apiGet<ProductDraftRecord | null>(
        `/api/product-drafts?${draftQuery('edit', product.id)}`,
      );

      setEditingProductId(product.id);
      setClearedEmptyCreateDraft(false);
      setFormValues(
        draft
          ? toFormValues(draft.data)
          : {
              productName: product.productName,
              productDescription: product.productDescription,
              price: String(product.price),
              category: product.category,
              imageUrl: product.imageUrl ?? '',
              stockQuantity: String(product.stockQuantity),
            },
      );
      setFormVisible(true);
    } finally {
      setDraftLoading(false);
    }
  }

  function closeForm() {
    clearFormState();
    setError('');
  }

  async function clearDraft(scope: 'create' | 'edit', productId?: string) {
    await apiDelete(`/api/product-drafts?${draftQuery(scope, productId)}`);

    if (scope === 'create') {
      setCreateDraftValues(null);
    }
  }

  useEffect(() => {
    if (!formVisible) {
      return;
    }

    const scope = editingProductId ? 'edit' : 'create';
    const productId = editingProductId ?? undefined;
    const hasDraft = hasProductValues(formValues);

    const timeout = window.setTimeout(() => {
      if (scope === 'create' && !hasDraft) {
        if (!clearedEmptyCreateDraft) {
          void clearDraft('create');
          setClearedEmptyCreateDraft(true);
        }
        return;
      }

      void apiPut('/api/product-drafts', {
        scope,
        productId,
        data: formValues,
      })
        .then((draft) => {
          if (scope === 'create') {
            setCreateDraftValues(toFormValues((draft as ProductDraftRecord).data));
          }
        })
        .catch(() => undefined);
    }, 1500);

    return () => window.clearTimeout(timeout);
  }, [clearedEmptyCreateDraft, editingProductId, formVisible, formValues]);

  function handleFormChange(nextValues: ProductFormValues) {
    setFormValues(nextValues);

    if (hasProductValues(nextValues)) {
      setClearedEmptyCreateDraft(false);
    }
  }

  async function handleDelete(productId: string) {
    setError('');
    setSuccess('');

    try {
      await apiDelete(`/api/products/${productId}`);
      setProducts((current) => current.filter((product) => product.id !== productId));
      if (editingProductId === productId) {
        clearFormState();
      }
      setSuccess('Product deleted successfully.');
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : 'Unable to delete product.',
      );
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');

    const payload = {
      productName: formValues.productName.trim(),
      productDescription: formValues.productDescription.trim(),
      price: Number(formValues.price),
      category: formValues.category.trim(),
      imageUrl: formValues.imageUrl.trim(),
      stockQuantity: Number(formValues.stockQuantity),
    };

    if (!payload.productName || !payload.productDescription || !payload.category) {
      setError('Please complete all required product fields.');
      return;
    }

    setSaving(true);

    try {
      if (editingProductId) {
        const updatedProduct = await apiPatch<ProductRecord>(
          `/api/products/${editingProductId}`,
          payload,
        );
        setProducts((current) =>
          current.map((product) => (product.id === editingProductId ? updatedProduct : product)),
        );
        setSuccess('Product updated successfully.');
        await clearDraft('edit', editingProductId);
      } else {
        const createdProduct = await apiPost<ProductRecord>('/api/products', payload);
        setProducts((current) => [createdProduct, ...current]);
        setSuccess('Product added successfully.');
        await clearDraft('create');
      }

      clearFormState();
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : 'Unable to save the product.',
      );
    } finally {
      setSaving(false);
    }
  }

  let productsContent: JSX.Element | null = null;
  if (loading) {
    productsContent = (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
        Loading products...
      </div>
    );
  } else if (products.length === 0) {
    productsContent = (
      <div className="space-y-4 rounded-2xl border border-dashed border-slate-300 bg-white/70 p-8 text-center text-sm text-slate-600">
        <p>No products yet. Add your first product to start selling.</p>
      </div>
    );
  } else {
    productsContent = (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/products/${product.id}`}
            className="transition hover:opacity-90"
          >
            <ProductCard
              product={product}
              actions={
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      void startEditing(product);
                    }}
                    className="rounded-lg border border-cyan-200 px-3 py-2 text-xs font-semibold text-cyan-700 transition hover:bg-cyan-50"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      void handleDelete(product.id);
                    }}
                    className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
                  >
                    Delete
                  </button>
                </div>
              }
            />
          </Link>
        ))}
      </div>
    );
  }

  return (
    <section className="space-y-8">
      <div className="space-y-4">
        {error ? (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </p>
        ) : null}

        {success ? (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-semibold text-slate-900">Your products</h3>
            <p className="text-sm text-slate-600">
              Only products owned by your account appear here.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Back to dashboard
            </Link>
            <button
              type="button"
              onClick={() => void openCreateForm()}
              disabled={draftLoading}
              className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {draftLoading ? 'Loading draft...' : 'Add product'}
            </button>
          </div>
        </div>

        {formVisible ? (
          <div className="rounded-3xl border border-cyan-100 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">
                  {editingProductId ? 'Edit product' : 'Add product'}
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  Your changes save automatically after 1.5 seconds of inactivity.
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Close
              </button>
            </div>

            <div className="mt-6">
              <ProductForm
                values={formValues}
                onChange={handleFormChange}
                onSubmit={handleSubmit}
                submitLabel={editingProductId ? 'Update product' : 'Add product'}
                loading={saving}
                enhancingImage={enhancingImage}
                onEnhancingImageChange={setEnhancingImage}
                onCancel={closeForm}
              />
            </div>
          </div>
        ) : null}

        {productsContent}
      </div>
    </section>
  );
}