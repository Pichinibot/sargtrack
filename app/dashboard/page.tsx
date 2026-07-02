"use client";

import { useEffect, useMemo, useState } from "react";
import {
  supabase,
  Signalement,
  Collecte,
  QUANTITE_COLOR,
  QUANTITE_LABEL,
  STATUT_LABEL,
} from "@/lib/supabase";

export default function Dashboard() {
  const [sigs, setSigs] = useState<Signalement[]>([]);
  const [cols, setCols] = useState<Collecte[]>([]);
  const [commune, setCommune] = useState("Toutes");

  useEffect(() => {
    supabase
      .from("signalements")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => setSigs((data as Signalement[]) || []));
    supabase
      .from("collectes")
      .select("*")
      .order("date_collecte", { ascending: false })
      .then(({ data }) => setCols((data as Collecte[]) || []));
  }, []);

  const communes = useMemo(
    () => ["Toutes", ...Array.from(new Set(sigs.map((s) => s.commune)))],
    [sigs]
  );
  const fSigs = commune === "Toutes" ? sigs : sigs.filter((s) => s.commune === commune);
  const fCols = commune === "Toutes" ? cols : cols.filter((c) => c.commune === commune);

  const volCollecte = fCols.reduce((a, c) => a + Number(c.volume_m3 || 0), 0);
  const coutTotal = fCols.reduce((a, c) => a + Number(c.cout_eur || 0), 0);
  const actifs = fSigs.filter((s) => s.statut !== "collecte").length;

  const parCommune = useMemo(() => {
    const m = new Map<string, number>();
    sigs.forEach((s) => m.set(s.commune, (m.get(s.commune) || 0) + Number(s.volume_m3 || 0)));
    const arr = Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
    const max = Math.max(...arr.map(([, v]) => v), 1);
    return { arr, max };
  }, [sigs]);

  function exportCSV() {
    const rows = [
      ["Date", "Commune", "Plage", "Ampleur", "Volume m3", "Statut", "Auteur", "Commentaire"],
      ...fSigs.map((s) => [
        new Date(s.created_at).toLocaleString("fr-FR"),
        s.commune,
        s.plage || "",
        QUANTITE_LABEL[s.quantite],
        s.volume_m3 ?? "",
        STATUT_LABEL[s.statut],
        s.auteur || "",
        (s.commentaire || "").replace(/[\n;]/g, " "),
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(";")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `sargtrack-signalements-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  return (
    <main className="wrap">
      <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <h1 className="section-title" style={{ margin: 0, flex: 1 }}>
          Dashboard communal
        </h1>
        <select
          value={commune}
          onChange={(e) => setCommune(e.target.value)}
          style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid var(--ecume-2)" }}
        >
          {communes.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <button className="btn btn-sarg" onClick={exportCSV}>
          ⬇ Export CSV (subventions)
        </button>
      </div>

      <div className="grid grid-4" style={{ marginTop: 18 }}>
        <div className="card">
          <div className="icon">📍</div>
          <h3>Signalements</h3>
          <div className="big">{fSigs.length}</div>
          <div className="sub">{actifs} actifs</div>
        </div>
        <div className="card">
          <div className="icon">🚛</div>
          <h3>Volume collecté</h3>
          <div className="big">{volCollecte.toLocaleString("fr-FR")} m³</div>
          <div className="sub">collectes enregistrées</div>
        </div>
        <div className="card">
          <div className="icon">💶</div>
          <h3>Coût des collectes</h3>
          <div className="big">{coutTotal.toLocaleString("fr-FR")} €</div>
          <div className="sub">justifiable en subvention</div>
        </div>
        <div className="card">
          <div className="icon">📊</div>
          <h3>Coût moyen / m³</h3>
          <div className="big">
            {volCollecte ? Math.round(coutTotal / volCollecte).toLocaleString("fr-FR") : "—"} €
          </div>
          <div className="sub">indicateur d&apos;efficacité</div>
        </div>
      </div>

      <h2 className="section-title">Volumes signalés par commune</h2>
      <div className="card">
        {parCommune.arr.map(([c, v]) => (
          <div className="bar-row" key={c}>
            <span>{c}</span>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${(v / parCommune.max) * 100}%` }} />
            </div>
            <strong>{v.toLocaleString("fr-FR")} m³</strong>
          </div>
        ))}
      </div>

      <h2 className="section-title">Signalements</h2>
      <div className="table-scroll">
        <table className="data">
          <thead>
            <tr>
              <th>Date</th>
              <th>Commune</th>
              <th>Plage</th>
              <th>Ampleur</th>
              <th>Volume</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {fSigs.map((s) => (
              <tr key={s.id}>
                <td>{new Date(s.created_at).toLocaleDateString("fr-FR")}</td>
                <td>{s.commune}</td>
                <td>{s.plage || "—"}</td>
                <td>
                  <span className="tag" style={{ background: QUANTITE_COLOR[s.quantite] }}>
                    {QUANTITE_LABEL[s.quantite]}
                  </span>
                </td>
                <td>{s.volume_m3 ? `${s.volume_m3} m³` : "—"}</td>
                <td>{STATUT_LABEL[s.statut]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="section-title">Collectes réalisées</h2>
      <div className="table-scroll">
        <table className="data">
          <thead>
            <tr>
              <th>Date</th>
              <th>Commune</th>
              <th>Opérateur</th>
              <th>Volume</th>
              <th>Coût</th>
            </tr>
          </thead>
          <tbody>
            {fCols.map((c) => (
              <tr key={c.id}>
                <td>{new Date(c.date_collecte).toLocaleDateString("fr-FR")}</td>
                <td>{c.commune}</td>
                <td>{c.operateur || "—"}</td>
                <td>{Number(c.volume_m3).toLocaleString("fr-FR")} m³</td>
                <td>{c.cout_eur ? `${Number(c.cout_eur).toLocaleString("fr-FR")} €` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
