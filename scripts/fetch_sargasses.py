#!/usr/bin/env python3
"""
Pipeline sargasses SargTrack — 100% gratuit, sans clé API ni clé admin.
Récupère l'indice AFAI (présence de sargasses) de NOAA Atlantic OceanWatch
pour la fenêtre maritime au large de chaque commune, puis met à jour Supabase
via une fonction protégée par jeton (aucune clé service_role nécessaire).
Tourne quotidiennement via GitHub Actions.
Source : NOAA/AOML + University of South Florida (données ouvertes, usage libre).
"""
import os, sys, csv, io, math, datetime, urllib.request, urllib.error, json

SUPABASE_URL = os.environ["SUPABASE_URL"].rstrip("/")
ANON_KEY = os.environ["SUPABASE_ANON_KEY"]
INGEST_TOKEN = os.environ["INGEST_TOKEN"]

ERDDAP = "https://cwcgom.aoml.noaa.gov/erddap/griddap/noaa_aoml_atlantic_oceanwatch_AFAI_7D.csv"

COMMUNES = {
    "Saint-François":        (16.20, 16.35, -61.28, -61.05),
    "Le Moule":              (16.30, 16.45, -61.40, -61.20),
    "Sainte-Anne":           (16.13, 16.26, -61.40, -61.20),
    "Capesterre-Belle-Eau":  (15.95, 16.10, -61.60, -61.45),
    "Le Gosier":             (16.12, 16.22, -61.52, -61.35),
}

def niveau_from_afai(moy):
    # On classe sur l'AFAI MOYEN de la fenêtre côtière (discriminant), pas le max
    # qui sature à 0.004 sur le moindre pixel parasite. Seuils calibrés sur la
    # plage observée de la moyenne (~ -0.001 à +0.001). À affiner avec le terrain.
    if moy is None: return "faible"
    if moy >= 0.0004:  return "tres_eleve"
    if moy >= 0.0001:  return "eleve"
    if moy >= -0.0001: return "modere"
    return "faible"

def fetch_zone(lat0, lat1, lon0, lon1):
    # Structure : AFAI[time][latitude][longitude]. Latitude croissante (0->38).
    # [(last)] pour le dernier pas de temps ; strides à 1.
    q = (f"{ERDDAP}?AFAI"
         f"%5B(last)%5D"
         f"%5B({lat0}):1:({lat1})%5D"
         f"%5B({lon0}):1:({lon1})%5D")
    req = urllib.request.Request(q, headers={"User-Agent": "SargTrack/1.0 (commune monitoring)"})
    try:
        with urllib.request.urlopen(req, timeout=90) as r:
            text = r.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", "replace")[:200]
        raise RuntimeError(f"HTTP {e.code} sur {q[:120]} :: {detail}")
    rows = list(csv.reader(io.StringIO(text)))
    vals, tstamp = [], None
    for row in rows[2:]:
        if len(row) < 4: continue
        if tstamp is None: tstamp = row[0][:10]
        try: vals.append(float(row[3]))
        except ValueError: pass
    # Filtrer les NaN/inf (nuages, sun glint) : ne garder que les valeurs finies
    vals = [v for v in vals if math.isfinite(v)]
    if not vals: return None, None, tstamp
    return sum(vals)/len(vals), max(vals), tstamp

def _clean(x):
    return None if (x is None or not math.isfinite(x)) else round(float(x), 6)

def ingest(commune, moy, mx, niv, mesure):
    moy, mx = _clean(moy), _clean(mx)
    url = f"{SUPABASE_URL}/rest/v1/rpc/ingest_satellite"
    body = json.dumps({
        "p_token": INGEST_TOKEN, "p_commune": commune,
        "p_afai_moyen": moy, "p_afai_max": mx,
        "p_niveau": niv, "p_mesure_le": mesure,
    }, allow_nan=False).encode()
    req = urllib.request.Request(url, data=body, method="POST", headers={
        "apikey": ANON_KEY, "Authorization": f"Bearer {ANON_KEY}",
        "Content-Type": "application/json",
    })
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode().strip().strip(chr(34))


def plog(msg):
    try:
        url = f"{SUPABASE_URL}/rest/v1/rpc/pipe_log"
        body = json.dumps({"p_token": INGEST_TOKEN, "p_msg": str(msg)[:500]}).encode()
        req = urllib.request.Request(url, data=body, method="POST", headers={
            "apikey": ANON_KEY, "Authorization": f"Bearer {ANON_KEY}",
            "Content-Type": "application/json",
        })
        urllib.request.urlopen(req, timeout=20)
    except Exception:
        pass

def main():
    today = datetime.date.today().isoformat()
    plog(f"START pipeline {today}")
    ok = 0
    for commune, (la0, la1, lo0, lo1) in COMMUNES.items():
        # Étape 1 : fetch NOAA
        try:
            moy, mx, tstamp = fetch_zone(la0, la1, lo0, lo1)
        except Exception as e:
            plog(f"FETCH-ERR {commune}: {repr(e)[:300]}")
            continue
        # Étape 2 : ingestion Supabase
        try:
            niv = niveau_from_afai(moy)
            res = ingest(commune, moy, mx, niv, (tstamp or today)[:10])
            if res == 'ok':
                ok += 1
            else:
                plog(f"INGEST-KO {commune}: reponse={res}")
        except Exception as e:
            plog(f"INGEST-ERR {commune}: {repr(e)[:300]}")
    plog(f"END : {ok}/{len(COMMUNES)} communes OK")
    print(f"\nTerminé : {ok}/{len(COMMUNES)} communes mises à jour.")
    sys.exit(0 if ok else 1)

if __name__ == "__main__":
    main()
