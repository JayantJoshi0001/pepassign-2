export async function apiPost<TResponse>(
  url: string,
  body: Record<string, unknown>,
): Promise<TResponse> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(body),
  });

  const data = (await response.json().catch(() => ({}))) as TResponse & {
    message?: string;
  };

  if (!response.ok) {
    throw new Error(data.message ?? 'Request failed.');
  }

  return data;
}
