import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { BusinessProfileOnboardingForm } from '@/components/business-profile-onboarding-form';
import { AUTH_COOKIE_NAME } from '@/lib/constants';

export default async function BusinessSignupPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    redirect('/');
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-50 px-4 py-10">
      <section className="relative mx-auto flex min-h-[80vh] w-full max-w-5xl items-center justify-center">
        <div className="w-full gap-6 rounded-3xl flex flex-col bg-white/90 shadow-xl backdrop-blur-sm md:grid-cols-2 md:p-10">
          <div>
            <p className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Step 2 of 2
            </p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight text-slate-900">
              Complete your
              <span className="block text-cyan-700">business onboarding</span>
            </h1>
            <p className="mt-4 text-slate-600">
              Your account is already active. Add business details so you can access the dashboard
              and manage products.
            </p>
          </div>

          <div className="rounded-2xl  bg-white ">
            <h2 className="text-xl font-semibold text-slate-900">Business details</h2>
            <p className="mt-1 text-sm text-slate-600">
              Fill in the information your customers will see.
            </p>
            <div className="mt-5">
              <BusinessProfileOnboardingForm />
            </div>
            <p className="mt-4 text-sm text-slate-600">
              Not ready yet?{' '}
              <Link href="/" className="font-semibold text-cyan-700 hover:underline">
                Return to login
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
