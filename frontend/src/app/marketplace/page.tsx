import { ProductCard } from '@/components/product-card';
import { ProductRecord } from '@/lib/products';
import RFQButton from '@/components/rfq-button';
import { getAuthToken, getBackendBaseUrl } from '@/lib/server-api';
import MarketplaceFilters from '@/components/marketplace-filters';
import MarketplaceSearch from '@/components/marketplace-search';

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

async function loadMarketplaceProducts(filters?: Record<string, string | undefined>): Promise<ProductRecord[]> {
  const backendUrl = new URL(`${getBackendBaseUrl()}/marketplace/products`);

  if (!filters) filters = {};

  for (const key of [
    'category',
    'minPrice',
    'maxPrice',
    'brand',
    'city',
    'country',
    'minQuantity',
    'maxQuantity',
  ]) {
    const v = filters[key];
    if (v) backendUrl.searchParams.set(key, v);
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
  searchParams?: Record<string, string | undefined> | Promise<Record<string, string | undefined>>;
}) {
  const filters = searchParams ? await searchParams : undefined;
  let currentUserId: string | null = null;
  let products: ProductRecord[] = [];
  let productsLoadError = false;

  try {
    [currentUserId, products] = await Promise.all([
      loadCurrentUserId(),
      loadMarketplaceProducts(filters),
    ]);
  } catch (err) {
    // Backend unreachable or other fetch error — avoid crashing the entire page.
    // Log server-side and show a friendly message to the user.
    console.error('Marketplace products load failed:', err);
    productsLoadError = true;
    currentUserId = await loadCurrentUserId().catch(() => null);
    products = [];
  }

  const visibleProducts = currentUserId
    ? products.filter((product) => product.ownerUserId !== currentUserId)
    : products;

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <section className="mx-auto max-w-8xl">
        <h1 className="mb-6 text-3xl font-semibold text-slate-900">Marketplace</h1>

        <div className="mb-6 flex justify-center">
          <MarketplaceSearch />
        </div>

        {productsLoadError ? (
          <div className="mb-6 rounded-2xl border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-800">
            Unable to load marketplace products right now — the backend may be offline.
            Try starting the backend (see project README) and reload the page.
          </div>
        ) : null}

        <div className="flex gap-6">
          <aside className="w-72">
            <div className="sticky top-6">
              <MarketplaceFilters />
            </div>
          </aside>

          <div className="flex-1">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {visibleProducts.map((product, index) => (
                <ProductCard
                  key={
                    product.id ||
                    `${product.productName}-${product.price}-${product.stockQuantity}-${index}`
                  }
                  product={product}
                  actions={<RFQButton product={product} />}
                />
              ))}
            </div>
          </div>
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
