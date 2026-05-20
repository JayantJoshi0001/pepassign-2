import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';

import { LoginForm } from '@/components/login-form';
import { AUTH_COOKIE_NAME } from '@/lib/constants';

export default async function LoginPage() {
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
            <p className="inline-block rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-700">
              Pepagora Assignment 2
            </p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight text-slate-900">
              Secure login for
              <span className="block text-cyan-700">your business dashboard</span>
            </h1>
            <p className="mt-4 text-slate-600">
              Sign in to continue onboarding, manage products, and talk to the backend Python
              service.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-semibold text-slate-900">Login</h2>
            <p className="mt-1 text-sm text-slate-600">
              Enter your credentials or create a new account first.
            </p>
            <div className="mt-5">
              <LoginForm />
            </div>
            <p className="mt-4 text-sm text-slate-600">
              No account yet?{' '}
              <Link href="/signup" className="font-semibold text-cyan-700 hover:underline">
                Sign up here
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
