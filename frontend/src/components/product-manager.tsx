'use client';

import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';

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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    void loadProducts();
  }, []);

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

  function resetForm() {
    setEditingProductId(null);
    setFormValues(emptyProductFormValues);
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
    setSuccess('');
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

      resetForm();
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : 'Unable to save the product.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className={compact ? 'space-y-6' : 'space-y-8'}>
      <div className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">
              {editingProductId ? 'Edit product' : 'Add product'}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Manage your business catalog from a single place.
            </p>
          </div>
          {editingProductId ? (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Cancel edit
            </button>
          ) : null}
        </div>

        <div className="mt-6">
          <ProductForm
            values={formValues}
            onChange={setFormValues}
            onSubmit={handleSubmit}
            submitLabel={editingProductId ? 'Update product' : 'Add product'}
            loading={saving}
            onCancel={editingProductId ? resetForm : undefined}
          />
        </div>

        {error ? (
          <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </p>
        ) : null}

        {success ? (
          <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </p>
        ) : null}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-semibold text-slate-900">Your products</h3>
            <p className="text-sm text-slate-600">Only products owned by your account appear here.</p>
          </div>
          <button
            type="button"
            onClick={() => void loadProducts()}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
            Loading products...
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-8 text-center text-sm text-slate-600">
            No products yet. Add your first product to start selling.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                actions={
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEditing(product)}
                      className="rounded-lg border border-cyan-200 px-3 py-2 text-xs font-semibold text-cyan-700 transition hover:bg-cyan-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(product.id)}
                      className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
                    >
                      Delete
                    </button>
                  </div>
                }
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}