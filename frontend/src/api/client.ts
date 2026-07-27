// Empty means same-origin: the dev server proxies /api to the backend, which
// keeps requests on whatever host the app was loaded from. Set VITE_API_URL
// only to point at a backend on a different origin.
const API_BASE_URL = import.meta.env.VITE_API_URL ?? "";

export const apiBaseUrl = API_BASE_URL;

async function request<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    {
      // "include" rather than the same-origin default: the session cookie
      // must still be sent if VITE_API_URL ever points at a different
      // origin than the page (the backend's CORS config allows this).
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers ?? {}),
      },
      ...options,
    }
  );

  if (!response.ok) {
    const text = await response.text();
    let message = "";

    try {
      message = (JSON.parse(text) as { message?: string }).message ?? "";
    } catch {
      // Not JSON; fall back to the raw text below.
    }

    throw new Error(
      message || text || `Request failed (${response.status})`
    );
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const api = {
  get<T>(endpoint: string) {
    return request<T>(endpoint);
  },

  post<T>(endpoint: string, body?: unknown) {
    return request<T>(endpoint, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  put<T>(endpoint: string, body?: unknown) {
    return request<T>(endpoint, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  delete<T>(endpoint: string) {
    return request<T>(endpoint, {
      method: "DELETE",
    });
  },
};
