'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProductRecord } from '@/lib/products';
import { apiPost } from '@/lib/api';

export default function RFQButton({ product }: { product: ProductRecord }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState('1');

  async function handleRequestForQuote() {
    setLoading(true);

    try {
      const message = `I would like to get a quotation for the product (quantity: ${quantity}).`;
      const response = await apiPost('/api/conversations', {
        sellerId: product.ownerUserId,
        productId: product.id,
        initialMessage: { body: message },
      });

      const conversationId =
        (response as { _id?: string; id?: string })._id ??
        (response as { id?: string }).id;

      if (conversationId) {
        router.push(`/chat?conversationId=${conversationId}`);
      } else {
        router.push('/chat');
      }
      router.refresh();
    } catch (err) {
      // if unauthorized, redirect to login
      router.push('/');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        min={1}
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
        className="w-20 rounded-lg border border-slate-200 px-2 py-1 text-sm"
      />
      <button
        onClick={handleRequestForQuote}
        disabled={loading}
        className="rounded-lg bg-amber-600 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
      >
        {loading ? 'Requesting...' : 'Request For Quotation'}
      </button>
    </div>
  );
}
