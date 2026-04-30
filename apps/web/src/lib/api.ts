import { useAuthStore } from "./auth";
import { ApiError } from "@/types";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000") + "/v1";

function getRefreshToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|; )refreshToken=([^;]*)/);
  return match ? match[1] : null;
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) return null;

  const data = await res.json();
  const { accessToken, refreshToken: newRefresh } = data;
  useAuthStore.getState().setTokens(accessToken, newRefresh);
  return accessToken;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = useAuthStore.getState().accessToken;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  // On 401, try token refresh and retry once
  if (res.status === 401 && token) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers["Authorization"] = `Bearer ${newToken}`;
      res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers,
      });
    }
  }

  if (!res.ok) {
    let errorData: { error?: { code?: string; message?: string } } = {};
    try {
      errorData = await res.json();
    } catch {
      // non-JSON error response
    }
    throw new ApiError({
      code: errorData.error?.code || `HTTP_${res.status}`,
      message: errorData.error?.message || res.statusText,
    });
  }

  // Handle 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json();
}
