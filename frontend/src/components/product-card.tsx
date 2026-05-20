import type { ReactNode } from 'react';

import type { ProductRecord } from '@/lib/products';

interface ProductCardProps {
  product: ProductRecord;
  actions?: ReactNode;
}

export function ProductCard({ product, actions }: ProductCardProps) {
  const shortDescription =
    product.productDescription.length > 120
      ? `${product.productDescription.slice(0, 120).trim()}...`
      : product.productDescription;

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="h-44 bg-gradient-to-br from-cyan-100 via-white to-emerald-100">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.productName}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-4 text-center text-sm font-medium text-slate-500">
            No product image provided
          </div>
        )}
      </div>

      <div className="space-y-3 p-5">
        <div>
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-lg font-semibold text-slate-900">{product.productName}</h3>
            <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
              {product.category}
            </span>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600">{shortDescription}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
          <span className="font-semibold text-slate-900">${product.price.toFixed(2)}</span>
          <span>Stock: {product.stockQuantity}</span>
          <span>{product.ownerBusinessName}</span>
        </div>

        {actions ? <div className="pt-2">{actions}</div> : null}
      </div>
    </article>
  );
}