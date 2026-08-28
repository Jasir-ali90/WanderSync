/** Google Maps JS API: lazy key discovery + one-time script injection. */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { api } from "@/lib/api";

type EnvLike = { VITE_GOOGLE_MAPS_API_KEY?: string };

function envKey(): string | null {
  try {
    const env = (import.meta as unknown as { env?: EnvLike }).env ?? {};
    return env.VITE_GOOGLE_MAPS_API_KEY || null;
  } catch {
    return null;
  }
}

let discoveredKey: string | null | undefined;
let loaderPromise: Promise<any> | null = null;

/**
 * Resolve the browser Maps key: Vite env var first, then the backend's
 * public-config endpoint (`MAPS_API_KEY` in backend .env).
 */
export async function getGoogleMapsKey(): Promise<string | null> {
  if (discoveredKey !== undefined) return discoveredKey;
  const local = envKey();
  if (local) {
    discoveredKey = local;
    return local;
  }
  try {
    const config = await api.get<{ google_maps_key?: string; features?: { google_maps?: boolean } }>(
      "/config/public/",
    );
    discoveredKey =
      config.features?.google_maps && config.google_maps_key ? config.google_maps_key : null;
  } catch {
    discoveredKey = null;
  }
  return discoveredKey;
}

export function loadGoogleMaps(key: string): Promise<any> {
  if (!loaderPromise) {
    loaderPromise = new Promise((resolve, reject) => {
      const g = (window as unknown as Record<string, any>).google;
      if (g?.maps) {
        resolve(g);
        return;
      }
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=weekly&libraries=marker`;
      script.async = true;
      script.onload = () => resolve((window as unknown as Record<string, any>).google);
      script.onerror = () => {
        loaderPromise = null;
        reject(new Error("Google Maps failed to load"));
      };
      document.head.appendChild(script);
    });
  }
  return loaderPromise;
}

declare global {
  interface Window {
    google?: any;
  }
}
