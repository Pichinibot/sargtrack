"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase, Signalement, QUANTITE_COLOR, QUANTITE_LABEL } from "@/lib/supabase";

export default function Home() {
  const [sigs, setSigs] = useState<Signalement[]>([]);

  useEffect(() => {
    supabase
      .from("signalements")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => setSigs((data as Signalement[]) || []));
  }, []);

  const actifs = sigs.filter((s) => s.statut !== "collecte");
  const volumeEnAttente = actifs.reduce((a, s) => a + (Number(s.volume_m3) || 0), 0);
  const pire = actifs[0];
  const niveau =
    actifs.some((s) => s.quantite === "massive")
      ? { label: "Risque élevé", color: "#d63b2f" }
      : actifs.some((s) => s.quantite === "forte")
      ? { label: "Risque marqué", color: "#e4762e" }
      : actifs.length > 0
      ? { label: "Vigilance", color: "#d9a13d" }
      : { label: "Calme", color: "#5fb57a" };

  return (
    <main className="wrap">
      <section className="hero">
        <div className="eyebrow">● Guadeloupe · Suivi en temps réel</div>
        <h1>
          La chaîne sargasses de votre commune, <em>enfin pilotée en temps réel</em>.
        </h1>
        <p>
          Signalements géolocalisés, carte des échouages, suivi des collectes et
          exports prêts pour vos justificatifs de subvention. Fini Excel et WhatsApp.
        </p>
        <div className="cta">
          <Link href="/dashboard" className="btn btn-primary">
            Voir le dashboard
          </Link>
          <Link href="/signaler" className="btn btn-ghost">
            Signaler un échouage
          </Link>
        </div>
        <svg className="vague" viewBox="0 0 1200 46" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0,30 C200,55 400,5 600,25 C800,45 1000,10 1200,30 L1200,46 L0,46 Z" fill="currentColor" />
        </svg>
      </section>

      <div className="bandeau-risque" role="status">
        <div className="inner">
          <span className="pastille pulse" style={{ background: niveau.color }} />
          <strong>Situation actuelle : {niveau.label}</strong>
          <span className="hint">
            {actifs.length} zone{actifs.length > 1 ? "s" : ""} en attente de collecte
            {pire ? ` — dernier signalement : ${pire.plage || pire.commune}` : ""}
          </span>
        </div>
      </div>

      <div className="grid grid-3">
        <div className="card">
          <div className="icon">🚨</div>
          <h3>Signalements actifs</h3>
          <div className="big">{actifs.length}</div>
          <div className="sub">échouages non collectés</div>
        </div>
        <div className="card">
          <div className="icon">🌿</div>
          <h3>Volume en attente</h3>
          <div className="big">{volumeEnAttente.toLocaleString("fr-FR")} m³</div>
          <div className="sub">estimation cumulée</div>
        </div>
        <div className="card">
          <div className="icon">🏛️</div>
          <h3>Communes couvertes</h3>
          <div className="big">5</div>
          <div className="sub">Grande-Terre & Basse-Terre</div>
        </div>
      </div>

      <h2 className="section-title">Derniers signalements</h2>
      <div className="table-scroll">
        <table className="data">
          <thead>
            <tr>
              <th>Commune</th>
              <th>Plage</th>
              <th>Ampleur</th>
              <th>Volume</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {sigs.slice(0, 6).map((s) => (
              <tr key={s.id}>
                <td>{s.commune}</td>
                <td>{s.plage || "—"}</td>
                <td>
                  <span className="tag" style={{ background: QUANTITE_COLOR[s.quantite] }}>
                    {QUANTITE_LABEL[s.quantite]}
                  </span>
                </td>
                <td>{s.volume_m3 ? `${s.volume_m3} m³` : "—"}</td>
                <td>{new Date(s.created_at).toLocaleDateString("fr-FR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <footer className="site">
        SargTrack — outil de suivi des sargasses · Guadeloupe · Données Météo-France & signalements terrain
      </footer>
    </main>
  );
}
