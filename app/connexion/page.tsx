"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Connexion() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [user, setUser] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user.email || null));
  }, []);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setErr("");
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    setSending(false);
    if (error) setErr("Identifiants incorrects.");
    else window.location.href = "/sargtrack/dashboard/";
  }

  async function logout() {
    await supabase.auth.signOut();
    setUser(null);
  }

  return (
    <main className="wrap" style={{ maxWidth: 520 }}>
      <h1 className="section-title" style={{ marginTop: 0 }}>Espace mairie</h1>
      {user ? (
        <div>
          <div className="notice notice-ok" style={{ marginBottom: 16 }}>
            Connecté en tant que <strong>{user}</strong>
          </div>
          <button className="btn btn-sarg" onClick={logout}>Se déconnecter</button>
        </div>
      ) : (
        <>
          <p className="hint" style={{ marginBottom: 22 }}>
            Réservé aux agents des communes partenaires. Vos données sont isolées : chaque
            commune ne voit que les siennes.
          </p>
          {err && <div className="notice notice-err" style={{ marginBottom: 16 }}>{err}</div>}
          <form className="sig" onSubmit={login}>
            <label>
              Email professionnel
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="prenom.nom@mairie.fr" />
            </label>
            <label>
              Mot de passe
              <input type="password" required value={pass} onChange={(e) => setPass(e.target.value)} />
            </label>
            <button className="btn btn-primary" disabled={sending}>
              {sending ? "Connexion…" : "Se connecter"}
            </button>
          </form>
        </>
      )}
    </main>
  );
}
