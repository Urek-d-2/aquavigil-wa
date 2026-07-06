# AquaVigil-WA 🌊

**Wastewater-Based Epidemiological Surveillance Pipeline for West Africa**  
*Pipeline de Surveillance Épidémiologique par Analyse des Eaux Usées — Togo, Afrique de l'Ouest*

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Snakemake](https://img.shields.io/badge/Snakemake-≥7.0-brightgreen)](https://snakemake.readthedocs.io)
[![Python](https://img.shields.io/badge/Python-3.9+-blue)](https://python.org)
[![CPHIA 2026](https://img.shields.io/badge/Target-CPHIA%20Nov%202026-orange)](https://africacdc.org)

---

## What is AquaVigil-WA?

AquaVigil-WA is the **first open-source, sovereign, multi-pathogen WBE pipeline designed for West Africa**. By analyzing metagenomics data from wastewater samples collected at canals, open drains, and markets — environments without formal sewer networks — it detects epidemic signals **up to 2 weeks before hospitals are overwhelmed**.

> **Target:** Cholera · Typhoid · Polio/Enterovirus · Antimicrobial Resistance (AMR)  
> **Pilot site:** Lomé, Togo — 5 sampling sites  
> **Goal:** Present operational results at [CPHIA](https://africacdc.org) Addis-Ababa, November 2026

---

## Why AquaVigil-WA vs Existing Programs?

| Feature | Burkina Faso | Dakar/IPD | AquaVigil-WA |
|---------|-------------|-----------|--------------|
| In-country sequencing | ❌ (sent to Dakar) | ✅ | ✅ |
| Public pipeline (GitHub) | ❌ | ❌ | ✅ |
| Multi-pathogen (single sample) | ❌ | Partial | ✅ |
| Non-sewered environments | ❌ | ❌ | ✅ |
| Open data (PHA4GE compliant) | ❌ | ❌ | ✅ |
| Real-time alerts (weekly) | ❌ (quarterly) | ✅ | ✅ |

---

## Pipeline Architecture

```
Terrain (M2 & M4)          Qualité (M4)           Brique 1 (M1)
Prélèvement canaux/      ──▶  FastQC             ──▶  Snakemake
marchés/drains               Trimmomatic              Kraken2
.fastq brut                  MultiQC                  Bracken
                                                       MiniKraken DB
                                                       profil taxonomique

Brique 2 (M3)              Brique 3 (M1 & M3)
Normalizer (PMMoV)      ──▶  Dashboard FastAPI
Trend Predictor              Carte Leaflet.js
ARIMA + IsolationForest      API REST publique
PHA4GE-compliant JSON        Alertes SMS/email
```

---

## Repository Structure

```
aquavigil-wa/
├── workflow/
│   ├── Snakefile              # Pipeline principal
│   └── rules/                 # Règles Snakemake modulaires
│       ├── qc.smk             # FastQC + Trimmomatic + MultiQC
│       ├── classify.smk       # Kraken2 + Bracken
│       └── report.smk         # Agrégation résultats
├── scripts/
│   ├── kraken2_runner.py      # Parsing sorties Kraken2/Bracken → JSON/CSV
│   ├── normalizer.py          # Normalisation PMMoV/CrAssphage (M3)
│   └── trend_predictor.py     # ARIMA + Isolation Forest (M3)
├── config/
│   └── config.yaml            # Paramètres globaux du pipeline
├── data/
│   ├── simulated/             # Données InSilicoSeq (Phase 1)
│   ├── ncbi_sra/              # Datasets NCBI SRA Afrique (Phase 2)
│   ├── real_lome/             # Données terrain Lomé [RESTREINT]
│   └── kraken2_db/            # Base MiniKraken2 (~8 GB) [non versionné]
├── results/
│   ├── qc/                    # Rapports FastQC/MultiQC
│   ├── kraken2_output/        # Sorties Kraken2 (.report.txt)
│   ├── bracken_output/        # Estimations d'abondance Bracken
│   ├── normalized/            # Signaux normalisés PHA4GE-compliant
│   └── alerts/                # Alertes JSON (jaune/rouge)
├── notebooks/                 # Jupyter notebooks d'exploration
├── tests/                     # Tests unitaires pytest
├── docs/
│   ├── protocoles/            # PSP v1.0, protocole extraction ADN
│   ├── correspondances/       # Emails Africa CDC, institutions
│   └── article/               # Versions article scientifique
├── environment.yml            # Env bioinformatique (Snakemake, Kraken2...)
├── environment_modelling.yml  # Env data science (statsmodels, sklearn...)
└── config/config.yaml         # Configuration pipeline
```

---

## Quick Start

### 1. Cloner le repo
```bash
git clone https://github.com/[org]/aquavigil-wa.git
cd aquavigil-wa
```

### 2. Installer l'environnement bioinformatique
```bash
conda env create -f environment.yml
conda activate aquavigil-wbe
```

### 3. Télécharger la base MiniKraken2
```bash
wget https://genome-idx.s3.amazonaws.com/kraken/minikraken2_v2_8GB_201904_UPDATE.tgz \
     -P data/kraken2_db/
tar -xzf data/kraken2_db/minikraken2_v2_8GB_201904_UPDATE.tgz -C data/kraken2_db/
```

### 4. Générer les données simulées (Phase 1)
```bash
conda activate aquavigil-sim
iss generate \
    --genomes data/simulated/references/vibrio_cholerae.fna \
               data/simulated/references/ecoli.fna \
               data/simulated/references/klebsiella.fna \
    --abundance lognormal \
    --n_reads 500000 \
    --model HiSeq \
    --output data/simulated/wastewater_lome_sim_rep1
```

### 5. Lancer le pipeline
```bash
snakemake --cores 4 --use-conda
```

---

## Team

| Role | Membre | Responsabilité principale |
|------|--------|--------------------------|
| **Chef de Projet & Bioinformaticien** | Membre 1 | Pipeline Snakemake, coordination, publication |
| **Épidémiologiste** | Membre 2 | Protocole terrain, institutions, Introduction article |
| **Data Scientist Modélisation** | Membre 3 | Normalizer, ARIMA, dashboard |
| **Biologiste** | Membre 4 | Extraction ADN, QC, séquençage |

---

## Roadmap

| Phase | Période | Statut |
|-------|---------|--------|
| Setup & Cadrage | Juil. 2026 | 🔄 En cours |
| Phase 1 — Données simulées | Août 2026 | ⏳ À venir |
| Phase 2 — NCBI SRA | Sept. 2026 | ⏳ À venir |
| Phase 3 — Terrain Lomé | Oct. 2026 | ⏳ À venir |
| Publication bioRxiv | Oct. 2026 | ⏳ À venir |
| CPHIA Addis-Abeba | Nov. 2026 | 🎯 Objectif final |

---

## Data Standards

Les données de sortie normalisées sont conformes au standard
**[PHA4GE Wastewater Contextual Data Specification](https://github.com/pha4ge/wastewater-contextual-data-specification)**.
Les données brutes seront soumises sur **NCBI SRA** après acceptation de l'article.

---

## References

- WHO WES Guidance, Dec 2024 — Wastewater and Environmental Surveillance for one or more pathogens
- ODIN Laboratory Handbook D2.3 (2024) — Mobile lab protocols for sub-Saharan Africa
- PHA4GE Wastewater Contextual Data Specification (2025)
- GLOWACON / Africa CDC Continental WES Strategy (2024)

---

## License

MIT License — See [LICENSE](LICENSE)

---

*AquaVigil-WA · Lomé, Togo · 2026 · Objectif CPHIA Novembre 2026*
