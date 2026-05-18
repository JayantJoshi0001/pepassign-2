import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { DashboardClient } from '@/components/dashboard-client';
import { AUTH_COOKIE_NAME } from '@/lib/constants';

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    redirect('/');
  }

  const username = cookieStore.get('pepassign_username')?.value ?? 'User';

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-50 px-4 py-10">
      <div className="relative mx-auto flex min-h-[80vh] items-start justify-center pt-8">
        <DashboardClient username={username} />
      </div>
    </main>
  );
}
