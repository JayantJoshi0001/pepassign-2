import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';

import { ProductManager } from '@/components/product-manager';
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
        <div className="flex flex-wrap items-end justify-between gap-4 rounded-3xl border border-cyan-100 bg-white/90 p-6 shadow-xl backdrop-blur-sm">
          <div>
            <p className="inline-block rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-700">
              Product catalog
            </p>
            <h1 className="mt-4 text-4xl font-semibold text-slate-900">
              Manage your products and drafts
            </h1>
            <p className="mt-3 max-w-2xl text-slate-600">
              Product drafts save automatically after a short pause and reappear when you return
              to this page.
            </p>
          </div>
        </div>

        <ProductManager />
      </section>
    </main>
  );
}