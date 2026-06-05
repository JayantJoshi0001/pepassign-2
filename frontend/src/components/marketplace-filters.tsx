'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const MAX_PRICE = 1000;
const MAX_QUANTITY = 1000;

export default function MarketplaceFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [brand, setBrand] = useState(searchParams.get('brand') ?? '');
  const [city, setCity] = useState(searchParams.get('city') ?? '');
  const [country, setCountry] = useState(searchParams.get('country') ?? '');
  const [minPrice, setMinPrice] = useState(
    searchParams.get('minPrice') ?? '0',
  );
  const [maxPrice, setMaxPrice] = useState(
    searchParams.get('maxPrice') ?? String(MAX_PRICE),
  );
  const [minQuantity, setMinQuantity] = useState(
    searchParams.get('minQuantity') ?? '0',
  );
  const [maxQuantity, setMaxQuantity] = useState(
    searchParams.get('maxQuantity') ?? String(MAX_QUANTITY),
  );

  function applyFilters(e?: React.FormEvent) {
    e?.preventDefault();
    const params = new URLSearchParams();

    const existingCategory = searchParams.get('category');
    if (existingCategory) params.set('category', existingCategory);

    if (brand.trim()) params.set('brand', brand.trim());
    if (city.trim()) params.set('city', city.trim());
    if (country.trim()) params.set('country', country.trim());
    if (Number(minPrice) > 0) params.set('minPrice', minPrice);
    if (Number(maxPrice) < MAX_PRICE) params.set('maxPrice', maxPrice);
    if (Number(minQuantity) > 0) params.set('minQuantity', minQuantity);
    if (Number(maxQuantity) < MAX_QUANTITY) params.set('maxQuantity', maxQuantity);

    router.push(`/marketplace?${params.toString()}`);
  }

  function clearFilters() {
    const params = new URLSearchParams();
    const existingCategory = searchParams.get('category');
    if (existingCategory) params.set('category', existingCategory);

    setBrand('');
    setCity('');
    setCountry('');
    setMinPrice('0');
    setMaxPrice(String(MAX_PRICE));
    setMinQuantity('0');
    setMaxQuantity(String(MAX_QUANTITY));

    router.push(`/marketplace?${params.toString()}`);
  }

  return (
    <form onSubmit={applyFilters} className="space-y-4">
      <div>
        <h3 className="mb-2 text-sm font-semibold">Business / Brand</h3>
        <input
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          placeholder="Brand or company name"
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold">Location</h3>
        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="City"
          className="w-full rounded-md border px-3 py-2 text-sm mb-2"
        />
        <input
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          placeholder="Country"
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold">Price</h3>
        <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
          <span>${minPrice}</span>
          <span>${maxPrice}</span>
        </div>
        <div className="relative h-10">
          <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-slate-200" />
          <div
            className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-slate-900"
            style={{
              left: `${(Number(minPrice) / MAX_PRICE) * 100}%`,
              right: `${100 - (Number(maxPrice) / MAX_PRICE) * 100}%`,
            }}
          />
          <input
            type="range"
            min="0"
            max={MAX_PRICE}
            value={minPrice}
            onChange={(e) => {
              const next = Number(e.target.value);
              const currentMax = Number(maxPrice);
              setMinPrice(String(Math.min(next, currentMax)));
            }}
            className="absolute inset-0 h-10 w-full appearance-none bg-transparent"
          />
          <input
            type="range"
            min="0"
            max={MAX_PRICE}
            value={maxPrice}
            onChange={(e) => {
              const next = Number(e.target.value);
              const currentMin = Number(minPrice);
              setMaxPrice(String(Math.max(next, currentMin)));
            }}
            className="absolute inset-0 h-10 w-full appearance-none bg-transparent"
          />
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold">Quantity</h3>
        <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
          <span>{minQuantity}</span>
          <span>{maxQuantity}</span>
        </div>
        <div className="relative h-10">
          <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-slate-200" />
          <div
            className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-slate-900"
            style={{
              left: `${(Number(minQuantity) / MAX_QUANTITY) * 100}%`,
              right: `${100 - (Number(maxQuantity) / MAX_QUANTITY) * 100}%`,
            }}
          />
          <input
            type="range"
            min="0"
            max={MAX_QUANTITY}
            value={minQuantity}
            onChange={(e) => {
              const next = Number(e.target.value);
              const currentMax = Number(maxQuantity);
              setMinQuantity(String(Math.min(next, currentMax)));
            }}
            className="absolute inset-0 h-10 w-full appearance-none bg-transparent"
          />
          <input
            type="range"
            min="0"
            max={MAX_QUANTITY}
            value={maxQuantity}
            onChange={(e) => {
              const next = Number(e.target.value);
              const currentMin = Number(minQuantity);
              setMaxQuantity(String(Math.max(next, currentMin)));
            }}
            className="absolute inset-0 h-10 w-full appearance-none bg-transparent"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button type="submit" className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white">
          Apply
        </button>
        <button type="button" onClick={clearFilters} className="rounded-md border px-3 py-2 text-sm">
          Clear
        </button>
      </div>
    </form>
  );
}
