#!/usr/bin/env bash
# =============================================================================
# AquaVigil-WA — download_references.sh
# Télécharge les génomes de référence pour la génération de données simulées
# (InSilicoSeq, tâche T1.7). Aucune base MiniKraken2 requise ici.
#
# Usage :
#   bash scripts/download_references.sh
#
# Sortie : data/simulated/references/*.fna
# Source : NCBI E-utilities (efetch) — nécessite seulement curl + internet.
# =============================================================================
set -euo pipefail

OUT_DIR="data/simulated/references"
mkdir -p "$OUT_DIR"

EFETCH="https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi"

# --- Génomes : nom_fichier => accession(s) NCBI (séparées par une virgule) ---
# Pathogènes prioritaires + biomarqueurs de normalisation + bruit de fond.
declare -A GENOMES=(
  # -- Pathogènes cibles (Priority 1) --
  ["vibrio_cholerae"]="NC_002505.1,NC_002506.1"   # V. cholerae O1 El Tor N16961 (chr I + II)
  ["salmonella_typhi"]="NC_003198.1"              # S. enterica serovar Typhi CT18
  ["poliovirus_1"]="NC_002058.3"                  # Human poliovirus 1 Mahoney
  # -- Biomarqueurs de normalisation (Brique 2 / M3) --
  ["pmmov"]="NC_003630.1"                         # Pepper mild mottle virus (PMMoV)
  ["crassphage"]="NC_024711.1"                    # Uncultured crAssphage
  # -- Bruit de fond métagénomique (communauté eaux usées) --
  ["ecoli_k12"]="NC_000913.3"                     # E. coli K-12 MG1655
  ["klebsiella_pneumoniae"]="NC_016845.1"         # K. pneumoniae HS11286
)

echo "=================================================="
echo "  AquaVigil-WA — Téléchargement génomes de référence"
echo "  Destination : $OUT_DIR"
echo "=================================================="

for name in "${!GENOMES[@]}"; do
  acc="${GENOMES[$name]}"
  out="$OUT_DIR/${name}.fna"

  if [[ -s "$out" ]]; then
    echo "  [SKIP] $name (déjà présent)"
    continue
  fi

  echo "  [GET ] $name  <- $acc"
  # efetch accepte plusieurs accessions séparées par des virgules
  curl -sS --fail --retry 3 --retry-delay 2 \
    "${EFETCH}?db=nuccore&id=${acc}&rettype=fasta&retmode=text" \
    -o "$out"

  # Validation minimale : le fichier doit commencer par '>'
  if [[ ! -s "$out" ]] || [[ "$(head -c1 "$out")" != ">" ]]; then
    echo "  [ERR ] $name : téléchargement invalide (FASTA attendu)" >&2
    rm -f "$out"
    exit 1
  fi

  seqs=$(grep -c "^>" "$out" || true)
  echo "         OK — $seqs séquence(s)"
  sleep 0.4   # courtoisie envers l'API NCBI (max ~3 req/s sans clé)
done

echo ""
echo "=================================================="
echo "  Terminé. Génomes disponibles dans $OUT_DIR :"
ls -1 "$OUT_DIR"/*.fna 2>/dev/null | sed 's/^/    /'
echo ""
echo "  Étape suivante (T1.7) — générer les données simulées :"
echo "    conda activate aquavigil-wbe"
echo "    iss generate --genomes $OUT_DIR/*.fna \\"
echo "        --abundance lognormal --n_reads 500000 \\"
echo "        --model novaseq --cpus 4 \\"
echo "        --output data/simulated/wastewater_lome_sim_rep1"
echo "=================================================="
