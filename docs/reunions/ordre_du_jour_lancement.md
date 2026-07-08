# Réunion de Lancement — AquaVigil-WA
**Tâche T1.5 · Chef de Projet (Membre 1)**

| | |
|---|---|
| **Date** | _(à fixer — avant le 20 juillet 2026)_ |
| **Heure** | _(à définir)_ |
| **Lieu / Visio** | _(à définir — lien à ajouter)_ |
| **Durée prévue** | 90 min |
| **Animateur** | Membre 1 (Chef de Projet) |
| **Participants** | M1, M2, M3, M4 |

---

## Objectif de la réunion
Aligner les 4 membres sur la vision, la répartition des rôles, les outils et le calendrier
jusqu'à CPHIA (novembre 2026). Sortir avec les accès configurés et les premières tâches assignées.

---

## Ordre du jour

### 1. Introduction & vision (10 min) — *M1*
- Rappel du problème : surveillance épidémiologique tardive au Togo
- Vision AquaVigil-WA : détection 2 semaines avant les hôpitaux
- Ambition : surpasser le modèle Burkina Faso (open-source, souverain, multi-pathogènes)
- Objectif final : présentation CPHIA Addis-Abeba, novembre 2026

### 2. Présentation des documents de référence (15 min) — *M1*
- Document de Référence Équipe v1.3 (rôles, architecture, roadmap)
- Plan de Travail v1.0 (36 tâches subdivisées par membre)
- Références Scientifiques v1.0 (18 articles — guide de lecture par membre)
- Où tout se trouve : repo GitHub `docs/`

### 3. Rôles & responsabilités (15 min) — *tour de table*
| Membre | Rôle | Responsabilité principale |
|--------|------|---------------------------|
| M1 | Chef de Projet & Data Scientist | Pipeline Snakemake, coordination, publication |
| M2 | Épidémiologiste | Protocole terrain, institutions, Introduction article |
| M3 | Data Scientist Modélisation | Normalizer, ARIMA, dashboard |
| M4 | Biologiste | Extraction ADN, QC, séquençage |

- Chacun confirme sa compréhension de son périmètre
- Clarification des zones de collaboration (M2↔M4 terrain, M1↔M3 pipeline↔modélisation)

### 4. Outils & méthode de travail (15 min) — *M1*
- **GitHub** : repo, issues, kanban (Backlog / En cours / Revue / Terminé), champ Phase
- **Règle d'équipe** : toute tâche terminée = issue fermée + livrable poussé
- Environnements Conda : `aquavigil-wbe` (bio) et `aquavigil-modelling` (data science)
- Communication : _(à définir — WhatsApp / Slack / email ?)_
- Rythme : réunion hebdomadaire de suivi _(jour à fixer)_

### 5. Calendrier & jalons (10 min) — *M1*
| Phase | Période | Jalon clé |
|-------|---------|-----------|
| Setup | Juillet 2026 | Infra + protocoles amorcés |
| Phase 1 | Août 2026 | Pipeline validé sur données simulées |
| Phase 2 | Septembre 2026 | Résultats sur données NCBI SRA |
| Phase 3 | Octobre 2026 | Données réelles Lomé |
| Rédaction | Octobre 2026 | Article complet |
| Publication | Fin octobre | Preprint bioRxiv |
| CPHIA | Novembre 2026 | Présentation Addis-Abeba |

### 6. Premières tâches — assignation (15 min) — *tour de table*
- M1 : T1.3 (base MiniKraken2), T1.6/T1.7 (pipeline + données simulées)
- M2 : T2.1 (cartographie sites Lomé), T2.2 (partenaires institutionnels)
- M3 : T3.1 (environnement modélisation) — *déjà amorcé*
- M4 : T4.1 (labo séquençage), T4.2 (kit extraction ADN)
- Chacun déplace ses issues Backlog → En cours sur le kanban

### 7. Divers & questions (10 min)
- Tour de table final
- Points bloquants éventuels
- Confirmation date prochaine réunion

---

## Actions préparatoires (avant la réunion) — M1
- [ ] Fixer la date avec les 4 membres
- [ ] Envoyer les invitations + lien visio
- [ ] Partager les 3 documents de référence (lien GitHub `docs/`)
- [ ] Récupérer les identifiants GitHub des 4 membres (pour les inviter au repo)
- [ ] Préparer une démo rapide du kanban

---

## Après la réunion — M1
- [ ] Rédiger le compte-rendu (voir `template_compte_rendu.md`)
- [ ] Publier le CR dans le Wiki GitHub ou `docs/reunions/`
- [ ] Vérifier que chaque membre a bien accès au repo
- [ ] Fermer l'issue T1.5
