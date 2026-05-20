import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { ProductsGallery } from '@/components/products-gallery';
import { AUTH_COOKIE_NAME } from '@/lib/constants';

export default async function ProductsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    redirect('/');
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-50 px-4 py-10">
      <section className="mx-auto w-full max-w-7xl space-y-6">
        <div className="rounded-3xl border border-cyan-100 bg-white/90 p-6 shadow-xl backdrop-blur-sm">
          <p className="inline-block rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-700">
            Product catalog
          </p>
          <h1 className="mt-4 text-4xl font-semibold text-slate-900">Your products</h1>
          <p className="mt-3 max-w-3xl text-slate-600">
            Browse everything linked to your account in a responsive card layout.
          </p>
        </div>

        <ProductsGallery />
      </section>
    </main>
  );
}