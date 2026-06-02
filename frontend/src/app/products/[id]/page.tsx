import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { AUTH_COOKIE_NAME } from '@/lib/constants';
import { getBackendBaseUrl } from '@/lib/server-api';
import type { ProductRecord } from '@/lib/products';

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    redirect('/');
  }

  const { id } = await params;
  console.log(`Loading product details for product ID: ${id}`);

  let product: ProductRecord | null = null;
  let error: string | null = null;

  try {
    const response = await fetch(`${getBackendBaseUrl()}/products/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      error = 'Product not found';
    } else {
      product = await response.json();
    }
  } catch (err) {
    error = 'Unable to load product details';
  }

  if (error || !product) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-slate-50 px-4 py-10">
        <section className="mx-auto w-full max-w-7xl space-y-6">
          <div className="rounded-3xl border border-cyan-100 bg-white/90 p-6 shadow-xl backdrop-blur-sm">
            <h1 className="text-4xl font-semibold text-slate-900">Product not found</h1>
            <p className="mt-3 text-slate-600">{error}</p>
           
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-50 px-4 py-10">
      <section className="mx-auto w-full max-w-5xl space-y-6">
       
        <div className="space-y-6 rounded-3xl border border-cyan-100 bg-white/90 p-6 shadow-xl backdrop-blur-sm">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Product Image */}
            <div className="flex items-center justify-center rounded-2xl ">
              {product.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.imageUrl}
                  alt={product.productName}
                  className="max-h-80 w-full rounded-2xl object-contain"
                />
              ) : (
                <div className="flex h-80 w-full items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-center text-sm font-medium text-slate-500">
                  No product image provided
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between gap-3">
                  <h1 className="text-4xl font-semibold text-slate-900">
                    {product.productName}
                  </h1>
                  <span className="rounded-full bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-700">
                    {product.category}
                  </span>
                </div>
                <p className="mt-4 text-sm text-slate-600">
                  Sold by: <span className="font-semibold text-slate-900">{product.ownerBusinessName}</span>
                </p>
              </div>

              <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <div>
                  <p className="text-sm text-slate-600">Price</p>
                  <p className="mt-1 text-3xl font-bold text-slate-900">
                    ${product.price.toFixed(2)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-600">Stock available</p>
                    <p className="mt-1 text-2xl font-semibold text-slate-900">
                      {product.stockQuantity}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Product ID</p>
                    <p className="mt-1 break-all font-mono text-sm text-slate-600">
                      {product.id}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 flex flex-row justify-between ">
                <div>
                  <p className="text-sm font-medium text-slate-600">Listed on</p>
                  <p className="mt-1 text-sm text-slate-900">
                    {new Date(product.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {product.updatedAt && (
                  <div>
                    <p className="text-sm font-medium text-slate-600">Last updated</p>
                    <p className="mt-1 text-sm text-slate-900">
                      {new Date(product.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-3 border-t border-slate-200 pt-6">
            <h2 className="text-xl font-semibold text-slate-900">About this product</h2>
            <p className="leading-relaxed text-slate-700">{product.productDescription}</p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3 border-t border-slate-200 pt-6">
            <Link
              href="/products"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Continue shopping
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
