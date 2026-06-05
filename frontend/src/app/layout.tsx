import type { Metadata } from 'next';
import Link from 'next/link';
import { Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import { Home, MessageCircle, ShoppingCart } from 'lucide-react';

import './globals.css';
import CategoryDropdown from '@/components/category-dropdown';
import { ToastProvider } from '@/components/ui/toaster';

const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin'],
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Pepagora Assignment 2',
  description: 'Next.js + NestJS + FastAPI authentication and messaging flow',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ToastProvider>
          <header className="w-full bg-white border-b border-slate-200">
            <div className="mx-auto flex max-w-9xl items-center justify-between px-6 py-3">
              <div className="flex items-center gap-10">
                <Link href="/" className="text-lg font-semibold">
                  Pepagora
                </Link>
                <CategoryDropdown />
              </div>
              <nav className="flex items-center gap-4">
                <Link href="/dashboard" className="flex items-center gap-1 text-slate-700 hover:text-slate-900">
                  <Home size={18} />
                  <span className="hidden md:inline">Dashboard</span>
                </Link>
                <Link
                  href="/chat"
                  className="flex items-center gap-1 text-slate-700 hover:text-slate-900"
                >
                  <MessageCircle size={18} />
                  <span className="hidden md:inline">Chat</span>
                </Link>
                <Link
                  href="/marketplace"
                  className="flex items-center gap-1 text-slate-700 hover:text-slate-900"
                >
                  <ShoppingCart size={18} />
                  <span className="hidden md:inline">Marketplace</span>
                </Link>
              </nav>
            </div>
          </header>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
