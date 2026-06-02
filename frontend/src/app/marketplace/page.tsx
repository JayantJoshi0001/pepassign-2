import { ProductCard } from '@/components/product-card';
import { ProductRecord } from '@/lib/products';
import RFQButton from '@/components/rfq-button';
import { getAuthToken, getBackendBaseUrl } from '@/lib/server-api';

async function loadCurrentUserId(): Promise<string | null> {
  const token = await getAuthToken();

  if (!token) {
    return null;
  }

  const response = await fetch(`${getBackendBaseUrl()}/users/me`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    return null;
  }

  const user = (await response.json()) as { id?: string };
  return user.id ?? null;
}

async function loadMarketplaceProducts(category?: string): Promise<ProductRecord[]> {
  const backendUrl = new URL(`${getBackendBaseUrl()}/marketplace/products`);

  if (category) {
    backendUrl.searchParams.set('category', category);
  }

  const response = await fetch(backendUrl.toString(), {
    method: 'GET',
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Unable to load marketplace products.');
  }

  return (await response.json()) as ProductRecord[];
}

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams?: Promise<{ category?: string }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const [currentUserId, products] = await Promise.all([
    loadCurrentUserId(),
    loadMarketplaceProducts(resolvedSearchParams?.category),
  ]);

  const visibleProducts = currentUserId
    ? products.filter((product) => product.ownerUserId !== currentUserId)
    : products;

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <section className="mx-auto max-w-7xl">
        <h1 className="mb-6 text-3xl font-semibold text-slate-900">Marketplace</h1>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visibleProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              actions={<RFQButton product={product} />}
            />
          ))}
        </div>

        {visibleProducts.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
            No marketplace products match your current filters.
          </div>
        ) : null}
      </section>
    </main>
  );
}
