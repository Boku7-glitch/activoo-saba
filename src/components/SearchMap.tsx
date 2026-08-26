import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import type { ClassRow } from "@/components/ClassCard";
import { classImage } from "@/lib/categories";
// აუცილებელია Leaflet-ის CSS სტილების იმპორტი
import "leaflet/dist/leaflet.css";

interface Props {
  classes: ClassRow[];
}

export function SearchMap({ classes }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const navigate = useNavigate();
  const [active, setActive] = useState<ClassRow | null>(null);

  // ლოკაციების ამოღება
  const points = classes
    .map((c) => {
      const s = c.schools as unknown as { lat?: number | null; lng?: number | null; name?: string } | null;
      return s?.lat != null && s?.lng != null ? { c, lat: s.lat, lng: s.lng } : null;
    })
    .filter(Boolean) as { c: ClassRow; lat: number; lng: number }[];

  // 1. რუკის ინიციალიზაცია (გაეშვება მხოლოდ ერთხელ)
  useEffect(() => {
    let isMounted = true;

    import("leaflet").then((L) => {
      if (!isMounted || !ref.current || mapInstanceRef.current) return;

      const map = L.map(ref.current, {
        center: [41.7151, 44.8271], // თბილისის კოორდინატები დეფოლტად
        zoom: 12,
        scrollWheelZoom: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      mapInstanceRef.current = map;

      // ვრწმუნდებით, რომ რუკა ბოლომდე იტვირთება კონტეინერში
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
  }, []);

  // 2. მარკერების განახლება ყოველ ჯერზე, როცა `classes` (ძებნის რეზულტატი) იცვლება
  useEffect(() => {
    // თუ რუკა ჯერ არ ჩატვირთულა, დაველოდოთ
    if (!mapInstanceRef.current) return;

    import("leaflet").then((L) => {
      const map = mapInstanceRef.current;

      // ძველი მარკერების წაშლა რუკიდან
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      if (points.length === 0) return;

      const bounds = L.latLngBounds([]);

      // ახალი მარკერების დამატება
      points.forEach(({ c, lat, lng }) => {
        const customIcon = L.divIcon({
          className: "bg-transparent border-none",
          html: `<div class="w-6 h-6 bg-purple-600 rounded-full border-2 border-white shadow-md cursor-pointer transition transform hover:scale-110 hover:bg-purple-500"></div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const m = L.marker([lat, lng], { icon: customIcon }).addTo(map);

        // მარკერზე დაჭერისას ვხსნით პოპაპ-ბარათს
        m.on("click", () => setActive(c));

        markersRef.current.push(m);
        bounds.extend([lat, lng]);
      });

      // რუკის ზუმის და ცენტრის გასწორება მარკერების მიხედვით
      if (points.length === 1) {
        map.setView(bounds.getCenter(), 15);
      } else {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
      }
    });
  }, [classes]); // React-ის წესით, მხოლოდ კლასების შეცვლისას ეშვება

  return (
    <div className="relative h-[calc(100vh-220px)] min-h-[400px] w-full overflow-hidden rounded-2xl border border-border bg-muted">

      {/* რუკის კონტეინერი (z-0 რომ პოპაპი ზემოდან მოექცეს) */}
      <div ref={ref} className="absolute inset-0 z-0" />

      {/* ლოკაციების არ არსებობისას გამოტანილი მესიჯი */}
      {points.length === 0 && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <div className="rounded-xl bg-background/90 px-4 py-2 text-xs font-medium text-muted-foreground shadow">
            ლოკაციები არ მოიძებნა
          </div>
        </div>
      )}

      {/* აქტიური კლასის პოპაპი მარკერზე დაჭერისას */}
      {active && (
        <button
          onClick={() => navigate({ to: "/class/$id", params: { id: active.id } })}
          className="absolute bottom-4 left-1/2 z-20 w-[90%] max-w-sm -translate-x-1/2 overflow-hidden rounded-2xl bg-background text-left shadow-elevated border border-border/50 transition hover:bg-surface-soft"
        >
          <div className="flex gap-3 p-3">
            <img
              src={classImage(active.category, active.image_url)}
              alt={active.title}
              className="h-16 w-16 rounded-xl object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-foreground">{active.title}</p>
              <p className="truncate text-xs text-muted-foreground">{active.schools?.name}</p>
              <p className="mt-1 text-xs font-semibold text-purple-600">
                {active.price_from > 0 ? `დან ${active.price_from} ₾` : "უფასო"}
              </p>
            </div>
          </div>
        </button>
      )}
    </div>
  );
}