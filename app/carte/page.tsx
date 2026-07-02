"use client";

import { useEffect, useRef } from "react";
import { supabase, Signalement, QUANTITE_COLOR, QUANTITE_LABEL, STATUT_LABEL } from "@/lib/supabase";

declare global {
  interface Window {
    L: any;
  }
}

export default function Carte() {
  const mapRef = useRef<any>(null);

  useEffect(() => {
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(css);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = init;
    document.body.appendChild(script);

    async function init() {
      if (mapRef.current) return;
      const L = window.L;
      const map = L.map("map").setView([16.22, -61.4], 10);
      mapRef.current = map;
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
      }).addTo(map);

      const { data } = await supabase.from("signalements").select("*");
      ((data as Signalement[]) || []).forEach((s) => {
        const color = QUANTITE_COLOR[s.quantite];
        L.circleMarker([s.lat, s.lng], {
          radius: s.quantite === "massive" ? 14 : s.quantite === "forte" ? 11 : 8,
          color,
          fillColor: color,
          fillOpacity: s.statut === "collecte" ? 0.25 : 0.75,
          weight: 2,
        })
          .addTo(map)
          .bindPopup(
            `<strong>${s.plage || s.commune}</strong><br/>` +
              `Commune : ${s.commune}<br/>` +
              `Ampleur : ${QUANTITE_LABEL[s.quantite]}${s.volume_m3 ? ` (~${s.volume_m3} m³)` : ""}<br/>` +
              `Statut : ${STATUT_LABEL[s.statut]}<br/>` +
              `<em>${new Date(s.created_at).toLocaleString("fr-FR")}</em>` +
              (s.commentaire ? `<br/>${s.commentaire}` : "")
          );
      });
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <main style={{ position: "relative" }}>
      <div id="map" />
      <div className="map-legend">
        <strong>Ampleur de l&apos;échouage</strong>
        {(["faible", "moyenne", "forte", "massive"] as const).map((q) => (
          <div key={q}>
            <span className="pastille" style={{ background: QUANTITE_COLOR[q] }} />
            {QUANTITE_LABEL[q]}
          </div>
        ))}
        <div className="hint">Pastille pâle = déjà collecté</div>
      </div>
    </main>
  );
}
