import { useEffect, useRef, useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import "leaflet/dist/leaflet.css";
import { geocodeAddress } from "@/lib/geocode.functions";
import type { Map, Marker } from "leaflet";


interface Props {
  address: string;
  lat: number | null;
  lng: number | null;
  onChange: (v: { address: string; lat: number; lng: number }) => void;
}

const DEFAULT_CENTER = { lat: 41.7151, lng: 44.8271 }; // Tbilisi

export function AddressMapPicker({ address, lat, lng, onChange }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const map = useRef<Map | null>(null);
  const marker = useRef<Marker | null>(null);
  const [query, setQuery] = useState(address);
  const [searching, setSearching] = useState(false);
  const queryRef = useRef(query);

  useEffect(() => { setQuery(address); }, [address]);
  useEffect(() => { queryRef.current = query; }, [query]);

  useEffect(() => {
    if (!mapRef.current || map.current) return;
    let cancelled = false;
    const center = lat && lng ? { lat, lng } : DEFAULT_CENTER;
    import("leaflet").then((L) => {
      if (!mapRef.current || cancelled) return;
      map.current = L.map(mapRef.current, { center, zoom: lat && lng ? 15 : 12, scrollWheelZoom: false });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map.current);
      const pinIcon = L.divIcon({
        className: "",
        html: '<span class="block h-5 w-5 rounded-full border-2 border-background bg-foreground shadow-elevated"></span>',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });
      marker.current = L.marker(center, { draggable: true, icon: pinIcon }).addTo(map.current);
      marker.current.on("dragend", () => {
        const p = marker.current!.getLatLng();
        onChange({ address: queryRef.current, lat: p.lat, lng: p.lng });
      });
      map.current.on("click", (e) => {
        marker.current!.setLatLng(e.latlng);
        onChange({ address: queryRef.current, lat: e.latlng.lat, lng: e.latlng.lng });
      });
      setTimeout(() => map.current?.invalidateSize(), 0);
    });
    return () => { cancelled = true; map.current?.remove(); map.current = null; marker.current = null; };
  }, []); // eslint-disable-line

  useEffect(() => {
    if (!map.current || !marker.current || lat == null || lng == null) return;
    const pos = { lat, lng };
    marker.current.setLatLng(pos);
    map.current.setView(pos, Math.max(map.current.getZoom(), 15));
  }, [lat, lng]);

  const geocode = async () => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const result = await geocodeAddress({ data: { address: query } });
      if (result) onChange({ address: result.address, lat: result.lat, lng: result.lng });
      else toast.error("Address not found");
    } catch (e: any) {
      toast.error(e?.message ?? "Geocoding failed");
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), geocode())}
          placeholder="Search address…"
          className="h-10 flex-1 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary"
        />
        <button
          type="button"
          onClick={geocode}
          disabled={searching}
          className="flex h-10 items-center gap-1 rounded-xl bg-foreground px-3 text-xs font-bold text-background disabled:opacity-50"
        >
          {searching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
          Find
        </button>
      </div>
      <div ref={mapRef} className="h-64 w-full overflow-hidden rounded-xl border border-border bg-muted" />
      {lat != null && lng != null && (
        <p className="text-xs text-muted-foreground">Pinned: {lat.toFixed(5)}, {lng.toFixed(5)}</p>
      )}
    </div>
  );
}
