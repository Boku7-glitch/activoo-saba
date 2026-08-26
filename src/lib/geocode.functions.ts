import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_maps";

export const geocodeAddress = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({ address: z.string().min(1).max(500) }).parse(input),
  )
  .handler(async ({ data }) => {
    const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
    const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
    if (!LOVABLE_API_KEY || !GOOGLE_MAPS_API_KEY) return geocodeWithFallback(data.address);

    try {
      const res = await fetch(
        `${GATEWAY_URL}/maps/api/geocode/json?address=${encodeURIComponent(data.address)}`,
        {
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "X-Connection-Api-Key": GOOGLE_MAPS_API_KEY,
          },
        },
      );
      const body = await res.json();
      if (!res.ok) return geocodeWithFallback(data.address);
      const r = body.results?.[0];
      if (!r) return geocodeWithFallback(data.address);
      return {
        address: r.formatted_address as string,
        lat: r.geometry.location.lat as number,
        lng: r.geometry.location.lng as number,
      };
    } catch {
      return geocodeWithFallback(data.address);
    }
  });

async function geocodeWithFallback(address: string) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=ge&q=${encodeURIComponent(address)}`,
    { headers: { "User-Agent": "activoo-admin-address-picker" } },
  );
  const [hit] = await res.json();
  if (!hit) return null;
  return {
    address: (hit.display_name as string) || address,
    lat: Number(hit.lat),
    lng: Number(hit.lon),
  };
}
