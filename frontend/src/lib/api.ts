async function apiRequest<TResponse>(
  url: string,
  init: RequestInit,
): Promise<TResponse> {
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
    credentials: 'include',
  });

  const data = (await response.json().catch(() => ({}))) as TResponse & {
    message?: string;
  };

  if (!response.ok) {
    throw new Error(data.message ?? 'Request failed.');
  }

  return data;
}

export async function apiPost<TResponse>(
  url: string,
  body: object,
): Promise<TResponse> {
  return apiRequest<TResponse>(url, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function apiPatch<TResponse>(
  url: string,
  body: object,
): Promise<TResponse> {
  return apiRequest<TResponse>(url, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function apiDelete<TResponse>(url: string): Promise<TResponse> {
  return apiRequest<TResponse>(url, {
    method: 'DELETE',
  });
}

export async function apiGet<TResponse>(url: string): Promise<TResponse> {
  return apiRequest<TResponse>(url, {
    method: 'GET',
  });
}
