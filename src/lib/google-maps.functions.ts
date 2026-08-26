import { createServerFn } from "@tanstack/react-start";

export const getGoogleMapsBrowserConfig = createServerFn({ method: "GET" }).handler(async () => ({
  browserKey:
    process.env.GOOGLE_MAPS_BROWSER_KEY ||
    process.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY ||
    process.env.VITE_GOOGLE_MAPS_BROWSER_KEY ||
    "",
  trackingId:
    process.env.GOOGLE_MAPS_TRACKING_ID ||
    process.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID ||
    "",
}));