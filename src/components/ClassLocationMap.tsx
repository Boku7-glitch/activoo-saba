import { useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import "leaflet/dist/leaflet.css";

export interface MapLocation {
  id?: string;
  providerId?: string;
  href?: string;
  lat: number;
  lng: number;
  title?: string;
  address?: string;
  price?: number;
}

interface ClassLocationMapProps {
  center?: { lat: number; lng: number };
  location?: MapLocation;
  locations?: MapLocation[];
  lat?: number | null;
  lng?: number | null;
  title?: string;
  zoom?: number;
  className?: string;
}

export function ClassLocationMap({
  center,
  location,
  locations = [],
  lat,
  lng,
  title,
  zoom = 14,
  className = "h-full w-full rounded-2xl overflow-hidden min-h-[220px]",
}: ClassLocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const navigate = useNavigate();

  const resolvedLoc: MapLocation | null =
    location ||
    (lat != null && lng != null
      ? { lat, lng, title }
      : null);

  const allLocations: MapLocation[] = resolvedLoc
    ? [resolvedLoc]
    : locations.filter((l) => l.lat != null && l.lng != null);

  useEffect(() => {
    const container = mapRef.current;
    if (!container) return;

    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const link = target?.closest<HTMLAnchorElement>("a[data-school-link]");
      if (link) {
        const href = link.getAttribute("href") || link.getAttribute("data-href");
        if (href) {
          e.preventDefault();
          e.stopPropagation();
          navigate({ to: href as any });
        }
      }
    };

    container.addEventListener("click", handleGlobalClick);
    return () => {
      container.removeEventListener("click", handleGlobalClick);
    };
  }, [navigate]);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    if (!center && allLocations.length === 0) return;

    let isMounted = true;

    const defaultCenter =
      center ||
      (resolvedLoc ? { lat: resolvedLoc.lat, lng: resolvedLoc.lng } : null) ||
      (allLocations.length > 0
        ? { lat: allLocations[0].lat, lng: allLocations[0].lng }
        : { lat: 41.7151, lng: 44.8271 });

    import("leaflet").then((L) => {
      if (!isMounted || !mapRef.current || mapInstanceRef.current) return;

      const map = L.map(mapRef.current, {
        center: [defaultCenter.lat, defaultCenter.lng],
        zoom: zoom,
        scrollWheelZoom: false,
      });

      mapInstanceRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      allLocations.forEach((loc) => {
        const customIcon = L.divIcon({
          className: "bg-transparent border-none",
          html: loc.price
            ? `<div class="flex items-center justify-center rounded-full bg-primary px-3 py-1.5 text-xs font-black text-primary-foreground shadow-lg cursor-pointer transition transform hover:scale-110">${loc.price} ₾</div>`
            : `<div class="w-6 h-6 bg-primary rounded-full border-2 border-white shadow-md cursor-pointer transition transform hover:scale-110"></div>`,
          iconSize: [40, 40],
          iconAnchor: [20, 20],
          popupAnchor: [0, -20],
        });

        const marker = L.marker([loc.lat, loc.lng], { icon: customIcon }).addTo(map);

        if (loc.title || loc.address) {
          const targetUrl =
            loc.href ||
            (loc.providerId ? `/schools/${loc.providerId}` : null) ||
            (loc.id ? `/schools/${loc.id}` : null);

          const titleHtml = targetUrl
            ? `<a href="${targetUrl}" data-school-link="true" style="font-size: 14px; font-weight: 800; color: #7c3aed; text-decoration: underline; text-underline-offset: 3px; display: inline-block; cursor: pointer; line-height: 1.3;">${loc.title}</a>`
            : `<strong style="font-size: 13px; color: #111;">${loc.title}</strong>`;

          marker.bindPopup(`
            <div style="font-family: system-ui, -apple-system, sans-serif; padding: 4px; min-width: 120px;">
              ${loc.title ? `<div>${titleHtml}</div>` : ""}
              ${loc.address ? `<div style="font-size: 11px; color: #666; margin-top: 4px; font-weight: 500;">📍 ${loc.address}</div>` : ""}
            </div>
          `);

          if (allLocations.length === 1) {
            marker.openPopup();
          }
        }
      });

      setTimeout(() => {
        map.invalidateSize();
      }, 250);
    });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [center, resolvedLoc, allLocations, zoom]);

  if (!center && allLocations.length === 0) {
    return (
      <div className={`${className} flex items-center justify-center bg-muted/40`}>
        <span className="text-xs text-muted-foreground">Location not specified</span>
      </div>
    );
  }

  return <div ref={mapRef} className={className} />;
}
