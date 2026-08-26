import { useEffect, useRef } from "react";
// აუცილებელია Leaflet-ის CSS სტილების იმპორტი, რომ რუკა არ დაიშალოს
import "leaflet/dist/leaflet.css";

export interface MapLocation {
  id?: string;
  providerId?: string; // პროვაიდერის/სკოლის ID (მაგ: "codekids-tbilisi")
  href?: string;       // ან პირდაპირი URL (მაგ: "/provider/codekids-tbilisi")
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
  zoom?: number;
  className?: string;
}

export function ClassLocationMap({
                                   center,
                                   location,
                                   locations = [],
                                   zoom = 14,
                                   className = "h-full w-full rounded-3xl overflow-hidden min-h-[300px]",
                                 }: ClassLocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  const allLocations: MapLocation[] = location ? [location] : locations;

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    if (!center && !location && locations.length === 0) return;

    let isMounted = true;

    const defaultCenter =
      center ||
      (location ? { lat: location.lat, lng: location.lng } : null) ||
      (locations.length > 0
        ? { lat: locations[0].lat, lng: locations[0].lng }
        : { lat: 41.7151, lng: 44.8271 });

    // "window is not defined" ერორის აცილება dynamic import-ით (მხოლოდ ბრაუზერში გაეშვება)
    import("leaflet").then((L) => {
      if (!isMounted || !mapRef.current || mapInstanceRef.current) return;

      const map = L.map(mapRef.current, {
        center: [defaultCenter.lat, defaultCenter.lng],
        zoom: zoom,
        scrollWheelZoom: false,
      });

      mapInstanceRef.current = map;

      // მკვეთრი და მკაფიო OpenStreetMap ფენის დამატება
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      // მარკერების დამატება
      allLocations.forEach((loc) => {
        const customIcon = L.divIcon({
          className: "bg-transparent border-none",
          html: loc.price
            ? `<div class="flex items-center justify-center rounded-full bg-purple-600 px-3 py-1.5 text-xs font-black text-white shadow-lg cursor-pointer transition transform hover:scale-110">${loc.price} ₾</div>`
            : `<div class="w-6 h-6 bg-purple-600 rounded-full border-2 border-white shadow-md"></div>`,
          iconSize: [40, 40],
          iconAnchor: [20, 20],
          popupAnchor: [0, -20],
        });

        const marker = L.marker([loc.lat, loc.lng], { icon: customIcon }).addTo(map);

        if (loc.title || loc.address) {
          // გამოვთვალოთ ლინკი: href -> providerId -> id
          const targetUrl =
            loc.href ||
            (loc.providerId ? `/provider/${loc.providerId}` : null) ||
            (loc.id ? `/provider/${loc.id}` : null);

          const titleHtml = targetUrl
            ? `<a href="${targetUrl}" style="font-size: 13px; font-weight: 800; color: #7c3aed; text-decoration: none; display: inline-block; transition: color 0.2s;" onmouseover="this.style.textDecoration='underline'" onmouseout="this.style.textDecoration='none'">${loc.title}</a>`
            : `<strong style="font-size: 13px; color: #111;">${loc.title}</strong>`;

          marker.bindPopup(`
            <div style="font-family: system-ui, sans-serif; padding: 2px;">
              ${loc.title ? titleHtml : ""}
              ${loc.address ? `<div style="font-size: 11px; color: #666; margin-top: 3px;">📍 ${loc.address}</div>` : ""}
            </div>
          `);
        }
      });

      // აიძულებს რუკას გადაითვალოს ზომა, რომ ბოლომდე შეავსოს ბლოკი და არ დარჩეს ნაწილობრივი
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
  }, [center, location, locations, zoom]);

  if (!center && !location && locations.length === 0) {
    return (
      <div className={`${className} flex items-center justify-center bg-muted/40`}>
        <span className="text-sm text-muted-foreground">ლოკაცია მითითებული არ არის</span>
      </div>
    );
  }

  return <div ref={mapRef} className={className} />;
}