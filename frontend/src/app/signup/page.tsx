import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';

import { SignupForm } from '@/components/signup-form';
import { AUTH_COOKIE_NAME } from '@/lib/constants';

export default async function SignupPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (token) {
    redirect('/dashboard');
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-50 px-4 py-10">
      <section className="relative mx-auto flex min-h-[80vh] w-full max-w-5xl items-center justify-center">
        <div className="grid w-full gap-6 rounded-3xl border border-cyan-100 bg-white/90 p-6 shadow-xl backdrop-blur-sm md:grid-cols-2 md:p-10">
          <div>
            <p className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Create your account
            </p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight text-slate-900">
              Sign up for
              <span className="block text-cyan-700">the protected dashboard</span>
            </h1>
            <p className="mt-4 text-slate-600">
              Create a username and password that will be stored in the backend database.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-semibold text-slate-900">Sign up</h2>
            <p className="mt-1 text-sm text-slate-600">Create your account to continue.</p>
            <div className="mt-5">
              <SignupForm />
            </div>
            <p className="mt-4 text-sm text-slate-600">
              Already have an account?{' '}
              <Link href="/" className="font-semibold text-cyan-700 hover:underline">
                Back to login
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
