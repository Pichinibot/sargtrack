"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

const COMMUNES = [
  "Saint-François",
  "Le Moule",
  "Sainte-Anne",
  "Capesterre-Belle-Eau",
  "Le Gosier",
  "Autre",
];

export default function Signaler() {
  const [form, setForm] = useState({
    commune: "Saint-François",
    plage: "",
    quantite: "moyenne",
    volume_m3: "",
    commentaire: "",
    auteur: "",
  });
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [state, setState] = useState<"idle" | "sending" | "ok" | "err">("idle");
  const [geoMsg, setGeoMsg] = useState("");

  function locate() {
    setGeoMsg("Localisation en cours…");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setCoords({ lat: p.coords.latitude, lng: p.coords.longitude });
        setGeoMsg(`Position captée : ${p.coords.latitude.toFixed(4)}, ${p.coords.longitude.toFixed(4)}`);
      },
      () => setGeoMsg("Impossible d'obtenir la position — la position de la commune sera utilisée.")
    );
  }

  const FALLBACK: Record<string, [number, number]> = {
    "Saint-François": [16.2526, -61.2741],
    "Le Moule": [16.3326, -61.3462],
    "Sainte-Anne": [16.226, -61.3825],
    "Capesterre-Belle-Eau": [16.0451, -61.5643],
    "Le Gosier": [16.2064, -61.4931],
    Autre: [16.22, -61.4],
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    try {
      let photo_url: string | null = null;
      if (photo) {
        const path = `${Date.now()}-${photo.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
        const { error: upErr } = await supabase.storage.from("photos").upload(path, photo);
        if (!upErr) {
          photo_url = supabase.storage.from("photos").getPublicUrl(path).data.publicUrl;
        }
      }
      const [flat, flng] = FALLBACK[form.commune] || FALLBACK["Autre"];
      const { error } = await supabase.from("signalements").insert({
        commune: form.commune,
        plage: form.plage || null,
        lat: coords?.lat ?? flat,
        lng: coords?.lng ?? flng,
        quantite: form.quantite,
        volume_m3: form.volume_m3 ? Number(form.volume_m3) : null,
        commentaire: form.commentaire || null,
        auteur: form.auteur || null,
        photo_url,
      });
      if (error) throw error;
      setState("ok");
      setForm({ ...form, plage: "", volume_m3: "", commentaire: "" });
      setPhoto(null);
    } catch {
      setState("err");
    }
  }

  return (
    <main className="wrap">
      <h1 className="section-title" style={{ marginTop: 0 }}>
        Signaler un échouage
      </h1>
      <p className="hint" style={{ marginBottom: 20 }}>
        Votre signalement apparaît immédiatement sur la carte et le dashboard communal.
      </p>

      {state === "ok" && (
        <div className="notice notice-ok" style={{ marginBottom: 16 }}>
          Signalement enregistré. Merci — la commune est informée.
        </div>
      )}
      {state === "err" && (
        <div className="notice notice-err" style={{ marginBottom: 16 }}>
          Échec de l&apos;envoi. Vérifiez votre connexion puis réessayez.
        </div>
      )}

      <form className="sig" onSubmit={submit}>
        <label>
          Commune
          <select
            value={form.commune}
            onChange={(e) => setForm({ ...form, commune: e.target.value })}
          >
            {COMMUNES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label>
          Plage / lieu-dit
          <input
            placeholder="Ex. Anse à la Gourde"
            value={form.plage}
            onChange={(e) => setForm({ ...form, plage: e.target.value })}
          />
        </label>
        <label>
          Ampleur de l&apos;échouage
          <select
            value={form.quantite}
            onChange={(e) => setForm({ ...form, quantite: e.target.value })}
          >
            <option value="faible">Faible — dépôts épars</option>
            <option value="moyenne">Moyenne — bande continue</option>
            <option value="forte">Forte — accumulation épaisse</option>
            <option value="massive">Massive — plage impraticable</option>
          </select>
        </label>
        <label>
          Volume estimé (m³) — optionnel
          <input
            type="number"
            min="0"
            placeholder="Ex. 40"
            value={form.volume_m3}
            onChange={(e) => setForm({ ...form, volume_m3: e.target.value })}
          />
        </label>
        <label>
          Photo — optionnel
          <input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] || null)} />
        </label>
        <div>
          <button type="button" className="btn btn-sarg" onClick={locate}>
            📍 Utiliser ma position
          </button>
          <div className="hint" style={{ marginTop: 6 }}>{geoMsg}</div>
        </div>
        <label>
          Commentaire
          <textarea
            rows={3}
            placeholder="Accès, odeurs, urgence…"
            value={form.commentaire}
            onChange={(e) => setForm({ ...form, commentaire: e.target.value })}
          />
        </label>
        <label>
          Votre nom ou fonction — optionnel
          <input
            placeholder="Ex. Agent communal, riverain…"
            value={form.auteur}
            onChange={(e) => setForm({ ...form, auteur: e.target.value })}
          />
        </label>
        <button className="btn btn-primary" disabled={state === "sending"}>
          {state === "sending" ? "Envoi…" : "Envoyer le signalement"}
        </button>
      </form>
    </main>
  );
}
