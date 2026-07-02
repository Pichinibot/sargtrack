"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AccessGate({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<"checking" | "locked" | "open">("checking");
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [sending, setSending] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session || sessionStorage.getItem("sargtrack_access") === "1") setStatus("open");
      else setStatus("locked");
    });
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setErr("");
    try {
      const { data, error } = await supabase.rpc("verify_access", {
        p_code: code.trim().toUpperCase(),
        p_agent: navigator.userAgent.slice(0, 200),
      });
      if (error) throw error;
      if (data === true) {
        sessionStorage.setItem("sargtrack_access", "1");
        setStatus("open");
      } else {
        setErr("Code invalide. Chaque tentative est enregistrée.");
      }
    } catch {
      setErr("Erreur de connexion. Réessayez.");
    } finally {
      setSending(false);
    }
  }

  if (status === "open" || pathname.startsWith("/connexion")) return <>{children}</>;
  if (status === "checking") return null;

  return (
    <div className="gate">
      <div className="gate-card">
        <div className="gate-logo">
          <span className="dot">🌊</span> Sarg<span>Track</span>
        </div>
        <h1>Accès privé</h1>
        <p>
          Cette plateforme est en phase pilote. Entrez votre code d&apos;accès pour
          continuer.
        </p>
        <form onSubmit={submit}>
          <input
            type="password"
            autoFocus
            placeholder="Code d'accès"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            aria-label="Code d'accès"
          />
          <button className="btn btn-primary" disabled={sending || !code}>
            {sending ? "Vérification…" : "Entrer"}
          </button>
        </form>
        {err && <div className="gate-err">{err}</div>}
        <div style={{ marginTop: 18 }}>
          <a href="/sargtrack/connexion/" style={{ fontSize: 13, fontWeight: 600, color: "var(--accent)" }}>
            Agent communal ? Connexion mairie →
          </a>
        </div>
        <div className="gate-hint">Connexions journalisées · SargTrack Guadeloupe</div>
      </div>
    </div>
  );
}
