"use client"

import { createAuthClient } from "better-auth/react"
import { useEffect, useState } from "react"

// Token separation:
// - better-auth bearer token (used only for better-auth endpoints)
const BETTER_AUTH_TOKEN_KEY = "better_auth_token"
// - app API bearer token (used by our custom API routes; stored in MongoDB `Session` collection)
const API_BEARER_TOKEN_KEY = "bearer_token"

function isLikelyUuid(value: string) {
  // Our API tokens are randomUUID() -> 36 chars including hyphens
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
}

function getBetterAuthToken(): string {
  if (typeof window === "undefined") return ""

  const current = localStorage.getItem(BETTER_AUTH_TOKEN_KEY)
  if (current) return current

  // Migration (legacy bug): we used to store better-auth token inside `bearer_token`.
  const legacy = localStorage.getItem(API_BEARER_TOKEN_KEY)
  if (legacy && legacy.length > 0 && !isLikelyUuid(legacy)) {
    localStorage.setItem(BETTER_AUTH_TOKEN_KEY, legacy)
    return legacy
  }

  return ""
}

export const authClient = createAuthClient({
  baseURL: typeof window !== "undefined" ? window.location.origin : process.env.NEXT_PUBLIC_SITE_URL,
  fetchOptions: {
    auth: {
      type: "Bearer",
      token: () => getBetterAuthToken(),
    },
    onSuccess: (ctx) => {
      // better-auth may refresh its bearer token via `set-auth-token`
      const authToken = ctx.response.headers.get("set-auth-token")
      if (authToken && typeof window !== "undefined") {
        localStorage.setItem(BETTER_AUTH_TOKEN_KEY, authToken)
      }
    },
  },
})

export const logout = async () => {
  if (typeof window === "undefined") return;
  
  try {
    await authClient.signOut({
      fetchOptions: {
        auth: {
          type: "Bearer",
          token: getBetterAuthToken(),
        },
      },
    });
  } catch (error) {
    console.error("Sign out error:", error);
  } finally {
    // Clear tokens
    localStorage.removeItem(BETTER_AUTH_TOKEN_KEY);
    localStorage.removeItem(API_BEARER_TOKEN_KEY);
    
    // Clear cookies manually as a fallback
    if (typeof document !== "undefined") {
      const cookies = document.cookie.split(";");
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
      }
    }
    
    // Hard refresh to clear any in-memory state
    window.location.replace("/");
  }
};

type SessionData = ReturnType<typeof authClient.useSession>

async function syncApiBearerToken(hasUser: boolean) {
  if (typeof window === "undefined") return

  // If signed out, clear any stale API token.
  if (!hasUser) {
    localStorage.removeItem(API_BEARER_TOKEN_KEY)
    return
  }

  try {
    const betterAuthToken = getBetterAuthToken()

    const tokenRes = await fetch("/api/auth/get-token", {
      credentials: "include",
      // If the app is running token-only (no cookies), this allows `/api/auth/get-token`
      // to still resolve the better-auth session.
      headers: betterAuthToken ? { Authorization: `Bearer ${betterAuthToken}` } : undefined,
    })

    if (!tokenRes.ok) return

    const data = await tokenRes.json().catch(() => null)
    const token = data?.token
    if (typeof token === "string" && token.length > 0) {
      localStorage.setItem(API_BEARER_TOKEN_KEY, token)
    }
  } catch {
    // ignore
  }
}

export function useSession(): SessionData {
  const [session, setSession] = useState<any>(null)
  const [isPending, setIsPending] = useState(true)
  const [error, setError] = useState<any>(null)

  const fetchSession = async () => {
    try {
      const res = await authClient.getSession({
        fetchOptions: {
          auth: {
            type: "Bearer",
            token: getBetterAuthToken(),
          },
        },
      })

      setSession(res.data)
      setError(null)

      await syncApiBearerToken(Boolean(res.data?.user))
    } catch (err) {
      setSession(null)
      setError(err)
      await syncApiBearerToken(false)
    } finally {
      setIsPending(false)
    }
  }

  const refetch = () => {
    setIsPending(true)
    setError(null)
    fetchSession()
  }

  useEffect(() => {
    fetchSession()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { data: session, isPending, error, refetch }
}
