#!/usr/bin/env python3
"""
Pipeline sargasses SargTrack — 100% gratuit, sans clé API.
Récupère l'indice AFAI (présence de sargasses) de NOAA Atlantic OceanWatch
pour la fenêtre maritime au large de chaque commune, puis met à jour Supabase.
Tourne quotidiennement via GitHub Actions.
Source : NOAA/AOML + University of South Florida (données ouvertes, usage libre).
"""
import os, sys, csv, io, datetime, urllib.request, urllib.error, json

SUPABASE_URL = os.environ["SUPABASE_URL"].rstrip("/")
SERVICE_KEY = os.environ["SUPABASE_SERVICE_KEY"]

ERDDAP = "https://cwcgom.aoml.noaa.gov/erddap/griddap/noaa_aoml_atlantic_oceanwatch_AFAI_7D.csv"

# Fenêtre maritime "au large" de chaque commune (petit rectangle côté Atlantique/mer)
COMMUNES = {
    "Saint-François":        (16.20, 16.35, -61.28, -61.05),
    "Le Moule":              (16.30, 16.45, -61.40, -61.20),
    "Sainte-Anne":           (16.13, 16.26, -61.40, -61.20),
    "Capesterre-Belle-Eau":  (15.95, 16.10, -61.60, -61.45),
    "Le Gosier":             (16.12, 16.22, -61.52, -61.35),
}

# Seuils AFAI -> niveau. L'AFAI de sargasses est faible en valeur absolue ;
# ces seuils sont calibrables une fois qu'on observe les vraies distributions.
def niveau_from_afai(mx):
    if mx is None: return "faible"
    if mx >= 0.0018: return "tres_eleve"
    if mx >= 0.0010: return "eleve"
    if mx >= 0.0004: return "modere"
    return "faible"

def fetch_zone(lat0, lat1, lon0, lon1):
    q = f"{ERDDAP}?AFAI%5B(last)%5D%5B({lat0}):({lat1})%5D%5B({lon0}):({lon1})%5D"
    req = urllib.request.Request(q, headers={"User-Agent": "SargTrack/1.0"})
    with urllib.request.urlopen(req, timeout=90) as r:
        text = r.read().decode("utf-8", "replace")
    reader = csv.reader(io.StringIO(text))
    rows = list(reader)
    vals, tstamp = [], None
    for row in rows[2:]:  # 2 lignes d'en-tête (noms + unités)
        if len(row) < 4: continue
        if tstamp is None: tstamp = row[0][:10]
        try:
            v = float(row[3])
            vals.append(v)
        except ValueError:
            pass  # NaN = nuage / pas de donnée
    if not vals:
        return None, None, tstamp
    return sum(vals)/len(vals), max(vals), tstamp

def rpc(fn, payload):
    url = f"{SUPABASE_URL}/rest/v1/rpc/{fn}"
    data = json.dumps(payload).encode()
    req = urllib.request.Request(url, data=data, method="POST", headers={
        "apikey": SERVICE_KEY, "Authorization": f"Bearer {SERVICE_KEY}",
        "Content-Type": "application/json",
    })
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.status

def main():
    today = datetime.date.today().isoformat()
    ok, fail = 0, 0
    for commune, (la0, la1, lo0, lo1) in COMMUNES.items():
        try:
            moy, mx, tstamp = fetch_zone(la0, la1, lo0, lo1)
            niv = niveau_from_afai(mx)
            mesure = (tstamp or today)[:10]
            rpc("upsert_satellite_index", {
                "p_commune": commune, "p_afai_moyen": moy, "p_afai_max": mx,
                "p_niveau": niv, "p_mesure_le": mesure,
            })
            print(f"OK  {commune:24s} niveau={niv:10s} afai_max={mx}")
            ok += 1
        except Exception as e:
            print(f"ERR {commune:24s} {type(e).__name__}: {e}", file=sys.stderr)
            fail += 1
    print(f"\nTerminé : {ok} OK, {fail} échecs.")
    sys.exit(1 if ok == 0 else 0)

if __name__ == "__main__":
    main()
