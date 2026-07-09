// ============================================================
// AquaVigil-WA — modèle de données (démo, déterministe)
// Le narratif épidémiologique vit ici : Canal de Bè = flambée choléra.
// ============================================================

export const N = 12; // semaines
export const YMAX = 6;
export const DEFAULT_WARN = 2.0;
export const DEFAULT_CRIT = 4.0;

export const pathogens = [
  { key: "vibrio", label: "Vibrio cholerae", short: "V. cholerae", color: "#4C86E8" },
  { key: "typhi", label: "Salmonella Typhi", short: "S. Typhi", color: "#8E6BF0" },
  { key: "polio", label: "Poliovirus", short: "Poliovirus", color: "#17A8B4" },
  { key: "amr", label: "Indicateur RAM", short: "RAM (blaNDM)", color: "#D98A2B" },
];

// x,y en coordonnées "carte" 0..400 / 0..300 (comme la maquette)
const rawSites = [
  { id: "LMC-001", name: "Canal de Bè", x: 300, y: 208, gps: "6.132°N, 1.223°E",
    latest: { vibrio: 4.8, typhi: 1.2, polio: 0.9, amr: 1.6 }, spike: ["vibrio"] },
  { id: "LMC-002", name: "Grand Marché", x: 196, y: 172, gps: "6.138°N, 1.215°E",
    latest: { vibrio: 1.3, typhi: 2.3, polio: 1.0, amr: 1.4 }, spike: ["typhi"] },
  { id: "LMC-003", name: "Agoè-Nyivé", x: 158, y: 80, gps: "6.189°N, 1.209°E",
    latest: { vibrio: 0.8, typhi: 1.1, polio: 1.2, amr: 0.9 }, spike: [] },
  { id: "LMC-004", name: "STEP Lomé", x: 84, y: 236, gps: "6.110°N, 1.182°E",
    latest: { vibrio: 1.1, typhi: 0.9, polio: 0.7, amr: 1.9 }, spike: [] },
  { id: "LMC-005", name: "Port de Lomé", x: 244, y: 252, gps: "6.131°N, 1.275°E",
    latest: { vibrio: 1.4, typhi: 1.0, polio: 1.5, amr: 1.2 }, spike: [] },
];

export function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const smooth = (t) => t * t * (3 - 2 * t);

function makeSeries(seed, latest, isSpike) {
  const rng = mulberry32(seed);
  const arr = [];
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    let base;
    if (isSpike) {
      const s = t < 0.6 ? 0 : (t - 0.6) / 0.4;
      base = 1 + (latest - 1) * smooth(s);
    } else {
      base = 0.92 + (latest - 0.92) * smooth(t);
    }
    const noise = (rng() - 0.5) * 0.16 * Math.max(0.7, base * 0.5);
    arr.push(Math.max(0.2, +(base + noise).toFixed(2)));
  }
  arr[N - 1] = latest;
  return arr;
}

let seed = 7;
export const sites = rawSites.map((site) => {
  const series = {};
  pathogens.forEach((p) => {
    series[p.key] = makeSeries(seed++, site.latest[p.key], site.spike.includes(p.key));
  });
  const maxLatest = Math.max(...pathogens.map((p) => site.latest[p.key]));
  return { ...site, series, maxLatest };
});

export const sev = (r, warn, crit) => (r >= crit ? "crit" : r >= warn ? "warn" : "good");

export function weeksSinceCross(series, warn) {
  for (let i = 0; i < N; i++) if (series[i] >= warn) return N - 1 - i;
  return null;
}
export function trendLabel(series) {
  const d = series[N - 1] - series[N - 4];
  if (d > 0.6) return { icon: "trendUp", t: "hausse forte" };
  if (d > 0.15) return { icon: "trendUp", t: "en hausse" };
  if (d < -0.15) return { icon: "trendDown", t: "en baisse" };
  return { icon: "trendFlat", t: "stable" };
}

export const geneMap = {
  vibrio: { genome: "V. cholerae — 2 chromosomes · ≈4,0 Mb", genes: [
    { n: "ctxA", s: 0.33, e: 0.37, note: "toxine A" },
    { n: "ctxB", s: 0.40, e: 0.44, note: "toxine B" },
    { n: "tcpA", s: 0.66, e: 0.71, note: "pilus TCP" }] },
  typhi: { genome: "S. Typhi CT18 · ≈4,8 Mb", genes: [
    { n: "viaB", s: 0.30, e: 0.35, note: "antigène Vi" },
    { n: "fliC", s: 0.60, e: 0.64, note: "flagelline" }] },
  polio: { genome: "Poliovirus 1 · ≈7,5 kb (ARN)", genes: [
    { n: "VP1", s: 0.28, e: 0.40, note: "capside" },
    { n: "3Dpol", s: 0.74, e: 0.90, note: "polymérase" }] },
  amr: { genome: "Marqueur RAM · plasmide", genes: [
    { n: "blaNDM-1", s: 0.42, e: 0.55, note: "carbapénémase" }] },
};

// hauteur de vague partagée (plan d'eau + flottaison des marqueurs)
export function waveHeight(x, z, t) {
  return (
    Math.sin(x * 0.6 + t * 1.1) * 0.12 +
    Math.sin(z * 0.8 - t * 0.9) * 0.10 +
    Math.sin((x + z) * 0.4 + t * 0.6) * 0.07
  );
}

// site.x/y (0..400 / 0..300) -> coordonnées monde 3D
export function siteToWorld(site) {
  const X = (site.x / 400) * 10 - 5;
  const Z = (site.y / 300) * 7 - 3.5;
  return [X, Z];
}

// runs du pipeline automatisé (dossier surveillé) — démo
export const pipelineRuns = [
  { sample: "LMC-001_S12", site: "Canal de Bè", status: "done", taxa: 214, flagged: ["Vibrio cholerae"], time: "il y a 2 h" },
  { sample: "LMC-002_S12", site: "Grand Marché", status: "done", taxa: 198, flagged: ["Salmonella Typhi"], time: "il y a 2 h" },
  { sample: "LMC-005_S12", site: "Port de Lomé", status: "done", taxa: 176, flagged: [], time: "il y a 3 h" },
  { sample: "LMC-004_S12", site: "STEP Lomé", status: "running", taxa: null, flagged: [], time: "en cours" },
  { sample: "LMC-003_S12", site: "Agoè-Nyivé", status: "queued", taxa: null, flagged: [], time: "en file" },
];
