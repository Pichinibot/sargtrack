"use client";

import { useEffect, useState } from "react";
import { supabase, SatelliteIndex, NIVEAU_SAT_LABEL, NIVEAU_SAT_COLOR } from "@/lib/supabase";

export default function SatelliteBanner() {
  const [rows, setRows] = useState<SatelliteIndex[]>([]);
  const [date, setDate] = useState<string>("");

  useEffect(() => {
    supabase
      .from("satellite_index")
      .select("*")
      .order("mesure_le", { ascending: false })
      .then(({ data }) => {
        const all = (data as SatelliteIndex[]) || [];
        if (!all.length) return;
        const latest = all[0].mesure_le;
        setDate(latest);
        // dernière mesure par commune
        const seen = new Set<string>();
        const last = all.filter((r) => {
          if (seen.has(r.commune)) return false;
          seen.add(r.commune);
          return true;
        });
        setRows(last);
      });
  }, []);

  if (!rows.length) return null;

  const ordre = { tres_eleve: 3, eleve: 2, modere: 1, faible: 0 } as Record<string, number>;
  const sorted = [...rows].sort((a, b) => ordre[b.niveau] - ordre[a.niveau]);

  return (
    <section style={{ marginBottom: 36 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 500 }}>
          Prévision d&apos;échouage · détection satellite
        </h2>
        <span className="hint">
          Radeaux détectés au large · {date ? new Date(date).toLocaleDateString("fr-FR") : ""}
        </span>
      </div>
      <div className="grid grid-3" style={{ gap: 1 }}>
        {sorted.map((r) => (
          <div className="card" key={r.commune} style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ width: 10, height: 40, borderRadius: 2, background: NIVEAU_SAT_COLOR[r.niveau], flex: "none" }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{r.commune}</div>
              <div style={{ color: NIVEAU_SAT_COLOR[r.niveau], fontWeight: 700, fontSize: 13, textTransform: "uppercase", letterSpacing: 1 }}>
                Risque {NIVEAU_SAT_LABEL[r.niveau]}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="hint" style={{ marginTop: 10 }}>
        Source : NOAA Atlantic OceanWatch / University of South Florida — indice AFAI, données ouvertes.
      </div>
    </section>
  );
}
