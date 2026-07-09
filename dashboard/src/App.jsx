import { useState, useEffect } from "react";
import Icon from "./icons.jsx";
import WaterMap from "./WaterMap.jsx";
import {
  sites, pathogens, sev, N, YMAX, DEFAULT_WARN, DEFAULT_CRIT,
  weeksSinceCross, trendLabel, geneMap, mulberry32, pipelineRuns,
} from "./data.js";

const fr = (n) => n.toLocaleString("fr-FR");
const TAXA_BG = ["#7B8F88", "#5E7A70", "#8AA79B", "#6C8A9A"];
const SITE = (id) => sites.find((s) => s.id === id);

/* ---------------- SVG builders (chaîne cohérente avec le pipeline) --------------- */
function sparkPath(series) {
  const max = Math.max(YMAX, ...series);
  return series
    .map((v, i) => {
      const x = 3 + 78 * (i / (N - 1));
      const y = 27 - 24 * (v / max);
      return (i ? "L" : "M") + x.toFixed(1) + "," + y.toFixed(1);
    })
    .join(" ");
}

function chartSVG(site, isolate, warn, crit) {
  const W = 760, H = 300, padL = 42, padR = 116, padT = 16, padB = 30;
  const iW = W - padL - padR, iH = H - padT - padB;
  const X = (i) => padL + iW * (i / (N - 1));
  const Y = (v) => padT + iH * (1 - v / YMAX);
  let s = "";
  s += `<rect x="${padL}" y="${Y(crit)}" width="${iW}" height="${Y(0) - Y(crit)}" fill="var(--band-crit)"/>`;
  s += `<rect x="${padL}" y="${Y(crit)}" width="${iW}" height="${Y(warn) - Y(crit)}" fill="var(--band-warn)"/>`;
  for (let g = 0; g <= YMAX; g++) {
    const yy = Y(g);
    s += `<line x1="${padL}" y1="${yy}" x2="${padL + iW}" y2="${yy}" stroke="var(--grid)" stroke-width="1"/>`;
    s += `<text x="${padL - 8}" y="${yy + 3.5}" text-anchor="end" font-family="var(--font-mono)" font-size="10" fill="var(--text-faint)">${g}×</text>`;
  }
  s += `<line x1="${padL}" y1="${Y(1)}" x2="${padL + iW}" y2="${Y(1)}" stroke="var(--text-faint)" stroke-width="1" stroke-dasharray="3 3" opacity="0.7"/>`;
  s += `<text x="${padL + iW + 8}" y="${Y(warn) + 3.5}" font-family="var(--font-mono)" font-size="10" font-weight="700" fill="var(--warn)">seuil ${warn.toFixed(1)}×</text>`;
  s += `<text x="${padL + iW + 8}" y="${Y(crit) + 3.5}" font-family="var(--font-mono)" font-size="10" font-weight="700" fill="var(--crit)">seuil ${crit.toFixed(1)}×</text>`;
  for (let i = 0; i < N; i += 2)
    s += `<text x="${X(i)}" y="${H - 10}" text-anchor="middle" font-family="var(--font-mono)" font-size="9.5" fill="var(--text-faint)">S${i + 1}</text>`;
  pathogens.forEach((p) => {
    if (isolate && isolate !== p.key) return;
    const ser = site.series[p.key];
    let line = "", area = `M${padL},${Y(0)}`;
    ser.forEach((v, idx) => {
      const x = X(idx), y = Y(Math.min(v, YMAX));
      line += (idx ? "L" : "M") + x.toFixed(1) + "," + y.toFixed(1) + " ";
      area += ` L${x.toFixed(1)},${y.toFixed(1)}`;
    });
    area += ` L${X(N - 1)},${Y(0)} Z`;
    s += `<path d="${area}" fill="${p.color}" opacity="${isolate ? 0.16 : 0.12}"/>`;
    s += `<path d="${line}" fill="none" stroke="${p.color}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`;
    const last = ser[N - 1], ex = X(N - 1), ey = Y(Math.min(last, YMAX));
    const lvl = sev(last, warn, crit);
    const rc = lvl === "crit" ? "var(--crit)" : lvl === "warn" ? "var(--warn)" : p.color;
    s += `<circle cx="${ex}" cy="${ey}" r="5.5" fill="${p.color}" stroke="var(--surface)" stroke-width="2"/>`;
    if (lvl !== "good") s += `<circle cx="${ex}" cy="${ey}" r="8.5" fill="none" stroke="${rc}" stroke-width="1.6"/>`;
    s += `<text x="${ex + 11}" y="${ey + 3.5}" font-family="var(--font-mono)" font-size="11" font-weight="700" fill="${p.color}">${last.toFixed(1)}×</text>`;
  });
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Évolution des signaux normalisés">${s}</svg>`;
}

function pickPathogen(site, isolate) {
  if (isolate) return isolate;
  let best = pathogens[0].key, bv = 0;
  pathogens.forEach((p) => { if (site.latest[p.key] > bv) { bv = site.latest[p.key]; best = p.key; } });
  return best;
}

function dropletSVG(site, pk, color) {
  const rng = mulberry32(site.id.charCodeAt(5) * 97 + pk.length * 13 + 3);
  const ratio = site.latest[pk];
  const colored = Math.min(26, Math.round(ratio * 4)), NP = 46;
  let parts = "";
  for (let i = 0; i < NP; i++) {
    const ang = rng() * 6.283, rad = Math.sqrt(rng()) * 40;
    const px = 60 + Math.cos(ang) * rad, py = 104 + Math.sin(ang) * rad * 1.02;
    const r = 1.6 + rng() * 2.4, c = i < colored ? color : TAXA_BG[i % TAXA_BG.length];
    const dur = (2.6 + rng() * 2.4).toFixed(2), del = (rng() * 2).toFixed(2);
    parts += `<circle class="particle" cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${r.toFixed(1)}" fill="${c}" opacity="${i < colored ? 0.95 : 0.5}" style="animation:drift ${dur}s ease-in-out ${del}s infinite alternate"/>`;
  }
  return `<svg viewBox="0 0 120 150" role="img" aria-label="Composition de l'échantillon"><defs><clipPath id="dc"><path d="M60 8 C60 8 104 66 104 100 A44 44 0 1 1 16 100 C16 66 60 8 60 8 Z"/></clipPath></defs><path d="M60 8 C60 8 104 66 104 100 A44 44 0 1 1 16 100 C16 66 60 8 60 8 Z" fill="var(--surface-2)" stroke="var(--cyan)" stroke-width="1.5"/><g clip-path="url(#dc)">${parts}</g></svg>`;
}

function geneSVG(site, pk, color) {
  const gm = geneMap[pk], ratio = site.latest[pk];
  const W = 440, H = 100, padL = 8, padR = 8, trackY = 52, iW = W - padL - padR;
  const grng = mulberry32(site.id.charCodeAt(6) * 131 + pk.length * 7);
  let bars = "";
  const nb = 60;
  for (let b = 0; b < nb; b++) {
    const xx = padL + iW * (b / nb), bw = iW / nb - 0.6;
    let base = 6 + grng() * 9;
    gm.genes.forEach((g) => { const gc = (g.s + g.e) / 2; if (Math.abs(b / nb - gc) < 0.05) base += (18 + grng() * 10) * Math.min(1, ratio / 4); });
    const hh = Math.min(32, base);
    bars += `<rect x="${xx.toFixed(1)}" y="${(trackY - hh).toFixed(1)}" width="${bw.toFixed(1)}" height="${hh.toFixed(1)}" fill="${color}" opacity="0.5" rx="1"/>`;
  }
  let genes = "";
  gm.genes.forEach((g) => {
    const gx = padL + iW * g.s, gw = iW * (g.e - g.s);
    genes += `<rect x="${gx.toFixed(1)}" y="${trackY + 4}" width="${gw.toFixed(1)}" height="10" rx="3" fill="var(--accent)"/><text x="${(gx + gw / 2).toFixed(1)}" y="${trackY + 30}" text-anchor="middle" font-family="var(--font-mono)" font-size="9" font-weight="700" fill="var(--text)">${g.n}</text><text x="${(gx + gw / 2).toFixed(1)}" y="${trackY + 41}" text-anchor="middle" font-size="7.5" fill="var(--text-faint)">${g.note}</text>`;
  });
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Piste génomique"><line x1="${padL}" y1="${trackY}" x2="${W - padR}" y2="${trackY}" stroke="var(--border-strong)" stroke-width="2"/>${bars}${genes}</svg>`;
}

/* ---------------- Components ---------------- */
function Kpis({ warn, crit }) {
  const levels = sites.map((s) => sev(s.maxLatest, warn, crit));
  const nc = levels.filter((x) => x === "crit").length;
  const nw = levels.filter((x) => x === "warn").length;
  const tiles = [
    { cls: "hero", label: "Avance de détection", val: "≈2", sub: "semaines avant l'hôpital" },
    { cls: "alert-kpi", label: "Alertes actives", val: String(nc + nw), badges: true },
    { cls: "", label: "Sites surveillés", val: "5", sub: "Lomé — réseau pilote" },
    { cls: "", label: "Pathogènes suivis", val: "4", sub: "choléra · typhoïde · polio · RAM" },
    { cls: "", label: "Prélèvements / sem.", val: "5", sub: "1 par site, hebdomadaire" },
  ];
  return (
    <section className="kpis">
      {tiles.map((k, i) => (
        <div className={"kpi " + k.cls} key={i}>
          <div className="k-label">{k.label}</div>
          <div className="k-val">{k.val}</div>
          {k.badges ? (
            <div className="k-badges">
              {nc > 0 && <span className="sev-tag crit">{nc} rouge</span>}
              {nw > 0 && <span className="sev-tag warn">{nw} jaune</span>}
            </div>
          ) : (
            <div className="k-sub">{k.sub}</div>
          )}
        </div>
      ))}
    </section>
  );
}

function Alerts({ selected, warn, crit, onSelect }) {
  const [open, setOpen] = useState({});
  const rows = [];
  sites.forEach((s) => pathogens.forEach((p) => { if (s.latest[p.key] >= warn) rows.push({ s, p, r: s.latest[p.key] }); }));
  rows.sort((a, b) => b.r - a.r);
  const nominal = sites.filter((s) => sev(s.maxLatest, warn, crit) === "good").length;
  return (
    <div className="alerts-list">
      {rows.map((row, idx) => {
        const level = sev(row.r, warn, crit);
        const tr = trendLabel(row.s.series[row.p.key]);
        const wk = weeksSinceCross(row.s.series[row.p.key], warn);
        const key = row.s.id + row.p.key;
        const copies = Math.round(row.r * 500), preads = Math.round((copies * 260000) / 1e6);
        return (
          <div key={idx} className={"alert-card " + (row.s.id === selected ? "sel" : "")} onClick={() => onSelect(row.s.id)}>
            <div className={"a-stripe " + level}></div>
            <div className="a-body">
              <div className="a-top">
                <span className={"a-sev " + level}>{level === "crit" ? "ALERTE" : "VIGILANCE"}</span>
                <span className="a-site">{row.s.name}</span>
                <span className="a-code">{row.s.id}</span>
              </div>
              <div className="a-path">{row.p.label}</div>
              <div className="a-meta">
                <span><Icon name={tr.icon} size={13} /> {tr.t}</span>
                {wk !== null && <span>franchi il y a {wk === 0 ? "<1" : wk} sem.</span>}
              </div>
              <button className="why" onClick={(e) => { e.stopPropagation(); setOpen((o) => ({ ...o, [key]: !o[key] })); }} aria-expanded={!!open[key]}>
                <Icon name="info" size={13} /> Pourquoi cette alerte ?
              </button>
              {open[key] && (
                <div className="explain">
                  <div className="chain">
                    <div className="chain-step"><span className="n">1</span><span><b>{fr(preads)}</b> reads {row.p.short} classés (Kraken2 → Bracken).</span></div>
                    <div className="chain-step"><span className="n">2</span><span>Normalisation PMMoV : {fr(preads)} / <b>260 000</b> × 10⁶ = <b>{fr(copies)}</b> copies/M.</span></div>
                    <div className="chain-step"><span className="n">3</span><span>÷ ligne de base <b>500</b> = <b>{row.r.toFixed(1)}×</b> — {level === "crit" ? `dépasse le seuil rouge (${crit.toFixed(1)}×)` : `dépasse le seuil jaune (${warn.toFixed(1)}×)`}.</span></div>
                    <div className="chain-step"><span className="n">4</span><span>Tendance ARIMA {tr.t} · anomalie Isolation Forest {level === "crit" ? "confirmée" : "à surveiller"}.</span></div>
                  </div>
                </div>
              )}
            </div>
            <div className="a-right">
              <div className={"a-ratio " + level}>{row.r.toFixed(1)}×</div>
              <svg width="84" height="30" viewBox="0 0 84 30"><path d={sparkPath(row.s.series[row.p.key])} fill="none" stroke={row.p.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
          </div>
        );
      })}
      <div className="nominal-row"><span className="lg-dot"></span> {nominal} sites nominaux — aucun signal au-dessus du seuil.</div>
    </div>
  );
}

function Ingestion() {
  const [manual, setManual] = useState(null);
  function onFile(e) {
    const f = e.target.files[0]; if (!f) return;
    const rd = new FileReader();
    rd.onload = () => {
      const rows = String(rd.result).split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
        .map((l) => l.split("\t")).filter((p) => p.length >= 6);
      const flags = rows.filter((p) => /vibrio|salmonella|typhi|poliovirus|shigella/i.test(p[5]) && (+p[2] || 0) > 0).map((p) => p[5].trim());
      setManual({ n: rows.length, flags: [...new Set(flags)], name: f.name });
    };
    rd.readAsText(f);
  }
  return (
    <section className="panel">
      <div className="panel-head">
        <h2><Icon name="activity" /> Ingestion automatique <span className="tag auto" style={{ marginLeft: 8 }}>PIPELINE</span></h2>
        <span className="hint mono">dossier surveillé · data/incoming/</span>
      </div>
      <div style={{ padding: "4px 17px 8px" }}>
        <table className="runs">
          <thead><tr><th>Échantillon</th><th>Site</th><th>Statut</th><th>Taxons</th><th>Détections</th><th>Reçu</th></tr></thead>
          <tbody>
            {pipelineRuns.map((r) => (
              <tr key={r.sample}>
                <td className="smp">{r.sample}</td>
                <td>{r.site}</td>
                <td><span className={"st " + r.status}><span className="sdot"></span>{r.status === "done" ? "terminé" : r.status === "running" ? "en cours" : "en file"}</span></td>
                <td className="mono">{r.taxa ?? "—"}</td>
                <td>{r.flagged.length ? r.flagged.map((f) => <span key={f} className="flagchip"><Icon name="alert" size={11} />{f}</span>) : <span style={{ color: "var(--text-faint)" }}>—</span>}</td>
                <td style={{ color: "var(--text-faint)" }}>{r.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <details className="manual">
          <summary>Importer un rapport manuellement (secours)</summary>
          <label className="dropzone" style={{ display: "block" }}>
            Clique pour choisir un <b>.bracken_report.txt</b>
            <input type="file" accept=".txt,.tsv,.report" hidden onChange={onFile} />
          </label>
          {manual && (
            <div className="ing-mini">
              {manual.name} · {manual.n} taxons · {manual.flags.length ? "détections : " + manual.flags.join(", ") : "aucun pathogène cible"}
            </div>
          )}
        </details>
      </div>
    </section>
  );
}

const JSTEPS = [
  { ic: "droplet", l: "Prélèvement", n: "eau usée · 250 mL" },
  { ic: "flask", l: "Filtration", n: "0,2 µm" },
  { ic: "dna", l: "Extraction ADN", n: "kit sol/eau" },
  { ic: "activity", l: "Séquençage", n: "Illumina / MinION" },
  { ic: "check", l: "QC", n: "FastQC · Trimmomatic" },
  { ic: "activity", l: "Kraken2", n: "classification k-mers" },
  { ic: "sliders", l: "Bracken", n: "abondances" },
  { ic: "droplet", l: "Normalisation", n: "PMMoV" },
  { ic: "trendUp", l: "Alerte", n: "seuils 2× / 4×" },
];
function Journey() {
  const [done, setDone] = useState(JSTEPS.length);
  function run() {
    let i = 0; setDone(0);
    const t = setInterval(() => { i++; setDone(i); if (i >= JSTEPS.length) clearInterval(t); }, 420);
  }
  return (
    <section className="panel">
      <div className="panel-head">
        <h2><Icon name="activity" /> Parcours de l'échantillon — de l'eau à l'alerte</h2>
        <button className="btn" onClick={run}><Icon name="play" /> Simuler un run</button>
      </div>
      <div className="journey">
        {JSTEPS.map((s, i) => (
          <div key={i} className={"jstep " + (done > i ? "done" : done === i ? "run" : "")}>
            <div className="jbullet"><Icon name={s.ic} /></div>
            <div className="jlabel">{s.l}</div>
            <div className="jnote">{s.n}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function exportReport(warn, crit) {
  const payload = {
    specification: "PHA4GE Wastewater Contextual Data (démo)",
    generated_at: new Date().toISOString(), week: 12,
    thresholds: { yellow_x: warn, red_x: crit }, normalization: "PMMoV",
    sites: sites.map((s) => ({
      site_id: s.id, name: s.name, gps: s.gps,
      measurements: pathogens.map((p) => ({ taxon: p.label, normalized_ratio: s.latest[p.key], alert_level: sev(s.latest[p.key], warn, crit) })),
    })),
  };
  const b = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(b); a.download = "aquavigil_report_S12.json";
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(a.href);
}

/* ---------------- App ---------------- */
export default function App() {
  const [selected, setSelected] = useState("LMC-001");
  const [isolate, setIsolate] = useState(null);
  const [warn, setWarn] = useState(DEFAULT_WARN);
  const [crit, setCrit] = useState(DEFAULT_CRIT);
  const [dark, setDark] = useState(() => window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);

  useEffect(() => { document.documentElement.setAttribute("data-theme", dark ? "dark" : "light"); }, [dark]);

  const site = SITE(selected);
  const pk = pickPathogen(site, isolate);
  const pObj = pathogens.find((p) => p.key === pk);

  function selectSite(id) { setSelected(id); setIsolate(null); }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="mark"><Icon name="droplet" size={22} /></div>
          <div>
            <h1>AquaVigil-WA</h1>
            <div className="sub">Surveillance des eaux usées · Lomé, Togo</div>
          </div>
        </div>
        <div className="spacer"></div>
        <span className="chip live"><span className="dot-live"></span> EN DIRECT</span>
        <span className="chip demo">DÉMO · données simulées</span>
        <span className="updated">Dernier run&nbsp;: <b>Sem. 12 · 06 juil. 2026</b></span>
        <button className="theme-btn" onClick={() => setDark((d) => !d)} aria-label="Changer de thème">
          <Icon name={dark ? "check" : "cube"} size={18} />
        </button>
      </header>

      <Kpis warn={warn} crit={crit} />

      <section className="toolbar">
        <div className="tool-card" style={{ gridColumn: "1 / 2" }}>
          <div className="tool-head"><Icon name="cube" /> Carte 3D interactive</div>
          <div className="chart-sub" style={{ padding: 0 }}>Fais tourner la carte (glisser) · clique un site pour l'analyser. L'eau est animée en temps réel.</div>
        </div>
        <div className="tool-card">
          <div className="tool-head"><Icon name="sliders" /> Réglages d'analyse <span className="tag real">RÉEL</span></div>
          <div className="thr-row"><label>Seuil jaune</label><input type="range" min="1.2" max="3" step="0.1" value={warn} onChange={(e) => setWarn(+e.target.value)} /><span className="val-pill warn">{warn.toFixed(1)}×</span></div>
          <div className="thr-row"><label>Seuil rouge</label><input type="range" min="3" max="6" step="0.1" value={crit} onChange={(e) => setCrit(Math.max(+e.target.value, warn + 0.2))} /><span className="val-pill crit">{crit.toFixed(1)}×</span></div>
          <div className="chart-sub" style={{ padding: 0 }}>Déplace les seuils — carte et alertes se recalculent en direct.</div>
        </div>
        <div className="tool-card">
          <div className="tool-head"><Icon name="download" /> Exporter</div>
          <div className="btn-row"><button className="btn primary" onClick={() => exportReport(warn, crit)}><Icon name="download" /> Rapport PHA4GE</button></div>
          <div className="chart-sub" style={{ padding: 0, marginTop: 9 }}>JSON structuré conforme au standard PHA4GE Wastewater.</div>
        </div>
      </section>

      <section className="grid-main">
        <div className="panel">
          <div className="panel-head"><h2><Icon name="cube" /> Carte de surveillance — 5 sites</h2><span className="hint">Carte 3D · l'eau bouge</span></div>
          <div className="map3d"><WaterMap sites={sites} selected={selected} warn={warn} crit={crit} onSelect={selectSite} /></div>
          <div className="map-legend">
            <span><span className="lg-dot" style={{ background: "var(--good)" }}></span> Nominal (&lt; {warn.toFixed(1)}×)</span>
            <span><span className="lg-dot" style={{ background: "var(--warn)" }}></span> Vigilance (≥ {warn.toFixed(1)}×)</span>
            <span><span className="lg-dot" style={{ background: "var(--crit)" }}></span> Alerte (≥ {crit.toFixed(1)}×)</span>
          </div>
        </div>
        <div className="panel">
          <div className="panel-head"><h2><Icon name="alert" /> Alertes actives</h2><span className="hint">Triées par gravité</span></div>
          <Alerts selected={selected} warn={warn} crit={crit} onSelect={selectSite} />
        </div>
      </section>

      <section className="panel">
        <div className="chart-head">
          <div className="chart-title-row">
            <h2>{site.name}</h2><span className="code">{site.id}</span><span className="gps">{site.gps}</span>
          </div>
          <div className="chart-sub">Signal normalisé PMMoV, en multiple de la ligne de base · 12 dernières semaines</div>
        </div>
        <div className="chart-area" dangerouslySetInnerHTML={{ __html: chartSVG(site, isolate, warn, crit) }} />
        <div className="legend">
          {pathogens.map((p) => (
            <span key={p.key} className={"leg-item " + (isolate && isolate !== p.key ? "off" : "")} onClick={() => setIsolate(isolate === p.key ? null : p.key)}>
              <span className="leg-swatch" style={{ background: p.color }}></span>{p.short} <span className="leg-val">{site.latest[p.key].toFixed(1)}×</span>
            </span>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-head"><h2><Icon name="droplet" /> Visualiser l'échantillon — <span className="mono" style={{ color: "var(--accent)", fontWeight: 700 }}>{site.id}</span></h2><span className="hint">Ce que contient l'eau · gènes détectés</span></div>
        <div className="sample-grid">
          <div className="droplet-wrap">
            <div dangerouslySetInnerHTML={{ __html: dropletSVG(site, pk, pObj.color) }} />
            <div className="legend-mini">
              <span><i style={{ background: pObj.color }}></i>{pObj.short}</span>
              <span><i style={{ background: TAXA_BG[0] }}></i>microbiome de fond</span>
            </div>
          </div>
          <div className="gene-panel">
            <div className="gtitle">{geneMap[pk].genome} — couverture des reads classifiés</div>
            <div dangerouslySetInnerHTML={{ __html: geneSVG(site, pk, pObj.color) }} />
          </div>
        </div>
      </section>

      <Ingestion />
      <Journey />

      <footer className="foot">
        <div>Signal normalisé par <b>PMMoV</b> (copies / M reads). Seuils&nbsp;: <b>jaune ≥ {warn.toFixed(1)}×</b>, <b>rouge ≥ {crit.toFixed(1)}×</b>.</div>
        <div>Sortie <b>PHA4GE</b>-compatible · <span className="mono">Brique 3 · T3.6 · React + Three.js</span></div>
      </footer>
    </div>
  );
}
