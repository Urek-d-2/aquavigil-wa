# Génomes de Référence — Données Simulées (T1.7)

Ces génomes servent à générer les jeux de données synthétiques via **InSilicoSeq**
pour valider le pipeline en Phase 1 (sans données réelles ni base MiniKraken2).

> ⚠️ Les fichiers `.fna` ne sont **pas versionnés** (voir `.gitignore`).
> Télécharge-les avec : `bash scripts/download_references.sh`

## Composition

| Fichier | Organisme | Accession NCBI | Rôle |
|---------|-----------|----------------|------|
| `vibrio_cholerae.fna` | *Vibrio cholerae* O1 El Tor N16961 | NC_002505.1 + NC_002506.1 | 🎯 Pathogène cible (choléra) |
| `salmonella_typhi.fna` | *Salmonella* Typhi CT18 | NC_003198.1 | 🎯 Pathogène cible (typhoïde) |
| `poliovirus_1.fna` | Poliovirus humain 1 Mahoney | NC_002058.3 | 🎯 Pathogène cible (polio) |
| `pmmov.fna` | Pepper mild mottle virus | NC_003630.1 | 📊 Biomarqueur de normalisation (primaire) |
| `crassphage.fna` | crAssphage (non cultivé) | NC_024711.1 | 📊 Biomarqueur de normalisation (secondaire) |
| `ecoli_k12.fna` | *Escherichia coli* K-12 MG1655 | NC_000913.3 | 🌫️ Bruit de fond métagénomique |
| `klebsiella_pneumoniae.fna` | *Klebsiella pneumoniae* HS11286 | NC_016845.1 | 🌫️ Bruit de fond métagénomique |

## Justification du choix

- **Pathogènes cibles** : les 3 priorités épidémiologiques du Togo (choléra, typhoïde, polio),
  cohérentes avec `config/config.yaml` → `target_pathogens.priority_1`.
- **Biomarqueurs** : PMMoV et crAssphage permettent de tester la normalisation du signal
  (module `normalizer.py`, Brique 2) sur des données où leur abondance est contrôlée.
- **Bruit de fond** : *E. coli* et *K. pneumoniae* sont ubiquitaires dans les eaux usées ;
  ils rendent la communauté simulée réaliste et testent la spécificité de la classification.

## Scénarios de simulation suggérés (T1.7)

| Jeu | Reads | Composition | But |
|-----|-------|-------------|-----|
| `sim_rep1` | 100k | 1 pathogène + bruit de fond | Détection simple |
| `sim_rep2` | 500k | 3 pathogènes + biomarqueurs + bruit | Multi-pathogènes |
| `sim_rep3` | 1M | communauté complexe, faible abondance pathogène | Sensibilité / seuil de détection |
