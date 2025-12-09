"use client";

import { useEffect, useRef } from "react";
import { Loader } from "@googlemaps/js-api-loader";

export default function GoogleMap() {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initMap = async () => {
      const loader = new Loader({
        apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
        version: "weekly",
      });

      const { Map } = await loader.importLibrary("maps");

      // Replace with your store's coordinates
      const storeLocation = { lat: 44.123, lng: 26.123 };

      const map = new Map(mapRef.current!, {
        center: storeLocation,
        zoom: 15,
        mapId: "YOUR_MAP_ID", // Optional: for styled maps
      });

      const { Marker } = await loader.importLibrary("marker");

      new Marker({
        position: storeLocation,
        map,
        title: "iaCaiace.ro Store",
      });
    };

    initMap();
  }, []);

  return (
    <div
      ref={mapRef}
      className="h-full w-full"
    />
  );
}
