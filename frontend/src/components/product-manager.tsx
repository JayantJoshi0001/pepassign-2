'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { FormEvent, JSX } from 'react';

import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api';
import {
  emptyProductFormValues,
  type ProductFormValues,
  type ProductRecord,
} from '@/lib/products';

import { ProductCard } from './product-card';
import { ProductForm } from './product-form';


interface ProductManagerProps {
  compact?: boolean;
}

export function ProductManager({ compact = false }: ProductManagerProps) {
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [formValues, setFormValues] = useState<ProductFormValues>(emptyProductFormValues);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  

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
  }, []);

  function resetForm() {
    setEditingProductId(null);
    setFormValues(emptyProductFormValues);
  }

  function openCreateModal() {
    resetForm();
    setError('');
    setSuccess('');
    setFormModalOpen(true);
  }

  function startEditing(product: ProductRecord) {
    setEditingProductId(product.id);
    setFormValues({
      productName: product.productName,
      productDescription: product.productDescription,
      price: String(product.price),
      category: product.category,
      imageUrl: product.imageUrl ?? '',
      stockQuantity: String(product.stockQuantity),
    });
    setError('');
    setSuccess('');
    setFormModalOpen(true);
  }

  function closeFormModal() {
    setFormModalOpen(false);
    resetForm();
    setError('');
  }

  async function handleDelete(productId: string) {
    setError('');
    setSuccess('');

    try {
      await apiDelete(`/api/products/${productId}`);
      setProducts((current) => current.filter((product) => product.id !== productId));
      if (editingProductId === productId) {
        resetForm();
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
      } else {
        const createdProduct = await apiPost<ProductRecord>('/api/products', payload);
        setProducts((current) => [createdProduct, ...current]);
        setSuccess('Product added successfully.');
      }

      closeFormModal();
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
                      startEditing(product);
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
    <section className={compact ? 'space-y-6' : 'space-y-8'}>
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

        <div className="space-y-4 rounded-2xl">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-semibold text-slate-900">Your products</h3>
            <p className="text-sm text-slate-600">Only products owned by your account appear here.</p>
          </div>
          <div>
            <button
              type="button"
              onClick={openCreateModal}
              className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700"
            >
              Add product
            </button>
          </div>
        </div>

        {productsContent}
      </div>

      {formModalOpen ? (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          onClick={closeFormModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-form-title"
            className="w-full max-w-3xl rounded-2xl border border-cyan-100 bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="product-form-title" className="text-2xl font-semibold text-slate-900">
                  {editingProductId ? 'Edit product' : 'Add product'}
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  Fill in the product details and save them to your catalog.
                </p>
              </div>

              <button
                type="button"
                onClick={closeFormModal}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Close
              </button>
            </div>

            <div className="mt-6">
              <ProductForm
                values={formValues}
                onChange={setFormValues}
                onSubmit={handleSubmit}
                submitLabel={editingProductId ? 'Update product' : 'Add product'}
                loading={saving}
                onCancel={closeFormModal}
              />
            </div>
          </div>
        </div>
      ) : null}
      </div>
    </section>
  );
}