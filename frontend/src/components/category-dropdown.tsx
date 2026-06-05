'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { List } from 'lucide-react';

const CATEGORIES = [
  'Apparel & Fashion',
  'Automotive & Transport',
  'Construction',
  'Electronics & Electrical',
  'Food & Agriculture',
  'Health & Personal Care',
  'Home & Lifestyle',
  'Industrial Equipment & Machinery',
  'Office Supplies & Equipment',
  'Packaging & Printing',
  'Raw Materials & Chemicals',
  'Services & Support',
  'Sports & Entertainment',
  'Tools & Hardware',
];

export default function CategoryDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  function handleCategoryClick(category: string) {
    setOpen(false);
    router.push(`/marketplace?category=${encodeURIComponent(category)}`);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
      >
        <List size={18} />
        <span className="hidden md:inline">All categories</span>
      </button>

      {open ? (
        <div className="absolute left-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900">
            Browse categories
          </div>
          <div className="max-h-80 overflow-y-auto px-2 py-2">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => handleCategoryClick(category)}
                className="flex w-full items-center rounded-2xl px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
              >
                {category}
              </button>
            ))}
          </div>
          <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 text-sm">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                router.push('/marketplace');
              }}
              className="w-full rounded-2xl bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
            >
              View all marketplace
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
