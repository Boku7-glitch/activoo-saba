/// <reference types="google.maps" />
import { useEffect, useState } from "react";
import { getGoogleMapsBrowserConfig } from "@/lib/google-maps.functions";

const STATIC_BROWSER_KEY = (
  import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY ||
  import.meta.env.VITE_GOOGLE_MAPS_BROWSER_KEY ||
  ""
) as string;
const STATIC_TRACKING_ID = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID as string | undefined;

declare global {
  interface Window {
    google?: typeof google;
    __activooMapsCallback?: () => void;
    __activooMapsLoaded?: boolean;
  }
}

let loadPromise: Promise<typeof google> | null = null;

async function loadGoogleMaps(): Promise<typeof google> {
  if (typeof window === "undefined") return Promise.reject(new Error("ssr"));
  if (window.google?.maps) return Promise.resolve(window.google);
  if (loadPromise) return loadPromise;

  const config = await getGoogleMapsBrowserConfig();
  const browserKey = (config.browserKey || STATIC_BROWSER_KEY).trim();
  const trackingId = (config.trackingId || STATIC_TRACKING_ID || "").trim();
  if (!browserKey) return Promise.reject(new Error("Missing Google Maps browser key"));

  loadPromise = new Promise((resolve, reject) => {
    window.__activooMapsCallback = () => {
      window.__activooMapsLoaded = true;
      if (window.google?.maps) resolve(window.google);
      else reject(new Error("Maps API failed to initialise"));
    };
    const existingScript = document.querySelector<HTMLScriptElement>('script[data-activoo-google-maps="true"]');
    if (existingScript) {
      if (window.google?.maps) resolve(window.google);
      return;
    }
    const script = document.createElement("script");
    script.dataset.activooGoogleMaps = "true";
    const params = new URLSearchParams({
      key: browserKey,
      loading: "async",
      callback: "__activooMapsCallback",
      libraries: "places",
      v: "weekly",
    });
    if (trackingId) params.set("channel", trackingId);
    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    script.async = true;
    script.defer = true;
    script.onerror = () => reject(new Error("Failed to load Google Maps script"));
    document.head.appendChild(script);
  });
  return loadPromise;
}

export function useGoogleMaps() {
  const [ready, setReady] = useState<boolean>(!!(typeof window !== "undefined" && window.google?.maps));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ready) return;
    let alive = true;
    loadGoogleMaps()
      .then(() => { if (alive) setReady(true); })
      .catch((e) => { if (alive) setError(e.message ?? "Map error"); });
    return () => { alive = false; };
  }, [ready]);

  return { ready, error };
}
