import { createClient } from "@supabase/supabase-js";

const url =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://heitmsccjuciolcotxyk.supabase.co";
const key =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable__QG6mvnU4CS1mQ_YviryQA_UNqzQgK_";

export const supabase = createClient(url, key);

export type Signalement = {
  id: string;
  commune: string;
  plage: string | null;
  lat: number;
  lng: number;
  quantite: "faible" | "moyenne" | "forte" | "massive";
  volume_m3: number | null;
  statut: "signale" | "en_collecte" | "collecte";
  photo_url: string | null;
  commentaire: string | null;
  auteur: string | null;
  created_at: string;
};

export type Collecte = {
  id: string;
  commune: string;
  operateur: string | null;
  volume_m3: number;
  cout_eur: number | null;
  date_collecte: string;
};

export const QUANTITE_LABEL: Record<string, string> = {
  faible: "Faible",
  moyenne: "Moyenne",
  forte: "Forte",
  massive: "Massive",
};

export const QUANTITE_COLOR: Record<string, string> = {
  faible: "#5FB57A",
  moyenne: "#D9A13D",
  forte: "#E4762E",
  massive: "#D63B2F",
};

export const STATUT_LABEL: Record<string, string> = {
  signale: "Signalé",
  en_collecte: "Collecte en cours",
  collecte: "Collecté",
};

export type Profile = {
  id: string;
  email: string;
  nom: string | null;
  role: "agent" | "gestionnaire" | "lecture";
  commune_id: string;
};

export async function getSessionProfile(): Promise<Profile | null> {
  const { data: s } = await supabase.auth.getSession();
  if (!s.session) return null;
  const { data } = await supabase.from("profiles").select("*").eq("id", s.session.user.id).single();
  return (data as Profile) || null;
}
