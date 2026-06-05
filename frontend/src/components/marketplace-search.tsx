'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface ProductSearchResult {
  id: string;
  productName: string;
  productDescription: string;
  price: number;
  category: string;
  imageUrl?: string;
  stockQuantity: number;
  ownerUserId: string;
  ownerBusinessName: string;
  createdAt: string;
  updatedAt: string;
}

interface SupplierSearchResult {
  id: string;
  businessName: string;
  businessDescription?: string;
  businessCategory?: string[];
  city?: string;
  country?: string;
  logo?: string;
  contactNumber?: string;
}

interface SearchResults {
  products: ProductSearchResult[];
  suppliers: SupplierSearchResult[];
}

export default function MarketplaceSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);

  // Close results when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults(null);
      setShowResults(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/marketplace/search?query=${encodeURIComponent(searchQuery)}`,
      );
      if (response.ok) {
        const data = (await response.json()) as SearchResults;
        setResults(data);
        setShowResults(true);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Search failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (value.trim().length > 0) {
      setIsLoading(true);
      debounceTimer.current = setTimeout(() => {
        performSearch(value);
      }, 300);
    } else {
      setResults(null);
      setShowResults(false);
      setIsLoading(false);
    }
  };

  const handleProductClick = (productId: string) => {
    setShowResults(false);
    setQuery('');
    // Navigate to product details or add to cart as needed
    router.push(`/marketplace?product=${productId}`);
  };

  const handleSupplierClick = (supplierId: string) => {
    setShowResults(false);
    setQuery('');
    // Navigate to supplier profile
    router.push(`/marketplace?supplier=${supplierId}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/marketplace?search=${encodeURIComponent(query)}`);
      setShowResults(false);
    }
  };

  const hasResults =
    results && (results.products.length > 0 || results.suppliers.length > 0);

  return (
    <div ref={searchContainerRef} className="relative w-full max-w-2xl">
      <form onSubmit={handleSearchSubmit} className="relative">
        <div className="relative flex items-center">
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            placeholder="Search products and suppliers..."
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 pr-10 text-sm shadow-sm transition-shadow focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {isLoading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-blue-500" />
            ) : (
              <svg
                className="h-5 w-5 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            )}
          </div>
        </div>

        {/* Search Results Dropdown */}
        {showResults && (
          <div className="absolute top-full left-0 right-0 z-50 mt-2 max-h-96 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
            {isLoading && results === null ? (
              <div className="p-4 text-center text-sm text-slate-500">
                Searching...
              </div>
            ) : hasResults ? (
              <>
                {/* Products Section */}
                {results.products.length > 0 && (
                  <div>
                    <div className="border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600">
                      Products ({results.products.length})
                    </div>
                    {results.products.slice(0, 5).map((product) => (
                      <button
                        key={product.id}
                        onClick={() => handleProductClick(product.id)}
                        className="flex w-full items-start gap-3 border-b border-slate-100 p-3 text-left transition-colors hover:bg-blue-50"
                      >
                        {product.imageUrl && (
                          <div className="h-12 w-12 shrink-0 overflow-hidden rounded bg-slate-100">
                            <img
                              src={product.imageUrl}
                              alt={product.productName}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-1 text-sm font-medium text-slate-900">
                            {product.productName}
                          </p>
                          <p className="line-clamp-1 text-xs text-slate-500">
                            {product.ownerBusinessName}
                          </p>
                          <p className="text-xs font-semibold text-blue-600">
                            ${product.price.toFixed(2)}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Suppliers Section */}
                {results.suppliers.length > 0 && (
                  <div>
                    <div className="border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600">
                      Suppliers ({results.suppliers.length})
                    </div>
                    {results.suppliers.slice(0, 5).map((supplier) => (
                      <button
                        key={supplier.id}
                        onClick={() => handleSupplierClick(supplier.id)}
                        className="flex w-full items-start gap-3 border-b border-slate-100 p-3 text-left transition-colors hover:bg-green-50"
                      >
                        {supplier.logo && (
                          <div className="h-12 w-12 shrink-0 overflow-hidden rounded bg-slate-100">
                            <img
                              src={supplier.logo}
                              alt={supplier.businessName}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-1 text-sm font-medium text-slate-900">
                            {supplier.businessName}
                          </p>
                          {supplier.city && supplier.country && (
                            <p className="line-clamp-1 text-xs text-slate-500">
                              {supplier.city}, {supplier.country}
                            </p>
                          )}
                          {supplier.businessCategory &&
                            supplier.businessCategory.length > 0 && (
                              <p className="line-clamp-1 text-xs text-slate-500">
                                {supplier.businessCategory.join(', ')}
                              </p>
                            )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* View All Link */}
                {(results.products.length > 5 ||
                  results.suppliers.length > 5) && (
                  <div className="border-t border-slate-200 bg-slate-50 p-3 text-center">
                    <button
                      onClick={handleSearchSubmit}
                      className="text-xs font-medium text-blue-600 hover:text-blue-700"
                    >
                      View all results →
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="p-4 text-center text-sm text-slate-500">
                No products or suppliers found
              </div>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
