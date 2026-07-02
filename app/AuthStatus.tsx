"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function AuthStatus() {
  const [email, setEmail] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setEmail(data.session?.user.email || null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setEmail(s?.user.email || null));
    return () => sub.subscription.unsubscribe();
  }, []);
  return (
    <Link href="/connexion" title={email || "Connexion mairie"}>
      {email ? `● ${email.split("@")[0]}` : "Connexion mairie"}
    </Link>
  );
}
