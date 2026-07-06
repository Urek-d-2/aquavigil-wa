"""
AquaVigil-WA — kraken2_runner.py
Parse les sorties Bracken multi-échantillons → DataFrame → JSON/CSV/TSV
Usage CLI : python kraken2_runner.py --input results/bracken_output/ --output results/summary_report.tsv
Usage Snakemake : script mode (snakemake.input, snakemake.output)
"""
import argparse
import json
import os
import sys
from pathlib import Path

import pandas as pd


# ---------------------------------------------------------------------------
# Parsing d'un fichier Bracken report
# ---------------------------------------------------------------------------

def parse_bracken_report(filepath: str) -> pd.DataFrame:
    """
    Parse un fichier .bracken_report.txt (format Kraken2 report).
    Retourne un DataFrame avec colonnes :
        sample, taxon, taxid, rank, kraken_assigned, bracken_assigned,
        bracken_fraction
    """
    sample_name = Path(filepath).stem.replace(".bracken_report", "")
    rows = []

    with open(filepath) as fh:
        for line in fh:
            line = line.strip()
            if not line:
                continue
            parts = line.split("\t")
            if len(parts) < 6:
                continue
            fraction    = float(parts[0])
            reads_cover = int(parts[1])
            reads_taxon = int(parts[2])
            rank        = parts[3].strip()
            taxid       = parts[4].strip()
            taxon       = parts[5].strip()

            rows.append({
                "sample":             sample_name,
                "taxon":              taxon,
                "taxid":              taxid,
                "rank":               rank,
                "bracken_fraction":   fraction,
                "bracken_assigned":   reads_taxon,
                "kraken_covered":     reads_cover,
            })

    return pd.DataFrame(rows)


# ---------------------------------------------------------------------------
# Agrégation multi-échantillons
# ---------------------------------------------------------------------------

def aggregate_reports(report_files: list[str]) -> pd.DataFrame:
    """Combine plusieurs rapports Bracken en un seul DataFrame."""
    frames = []
    for f in report_files:
        if os.path.exists(f):
            df = parse_bracken_report(f)
            if not df.empty:
                frames.append(df)
    if not frames:
        return pd.DataFrame()
    return pd.concat(frames, ignore_index=True)


# ---------------------------------------------------------------------------
# Export
# ---------------------------------------------------------------------------

def export_tsv(df: pd.DataFrame, output_path: str) -> None:
    df.to_csv(output_path, sep="\t", index=False)


def export_json(df: pd.DataFrame, output_path: str) -> None:
    """Export JSON structuré par échantillon, prêt pour le Normalizer."""
    result = {}
    for sample, grp in df.groupby("sample"):
        result[sample] = grp[
            ["taxon", "taxid", "rank", "bracken_fraction", "bracken_assigned"]
        ].to_dict(orient="records")
    with open(output_path, "w") as fh:
        json.dump(result, fh, indent=2, ensure_ascii=False)


# ---------------------------------------------------------------------------
# Résumé console
# ---------------------------------------------------------------------------

def print_summary(df: pd.DataFrame) -> None:
    if df.empty:
        print("Aucune donnée à résumer.")
        return
    print(f"\n{'='*60}")
    print(f"  Résumé AquaVigil-WA — {df['sample'].nunique()} échantillon(s)")
    print(f"{'='*60}")
    for sample in sorted(df["sample"].unique()):
        sub = df[df["sample"] == sample]
        classified = sub["bracken_assigned"].sum()
        top5 = sub.nlargest(5, "bracken_fraction")[["taxon","bracken_fraction"]]
        print(f"\n  [{sample}] — {classified:,} reads classifiés")
        for _, row in top5.iterrows():
            print(f"    {row['bracken_fraction']:6.2%}  {row['taxon']}")
    print()


# ---------------------------------------------------------------------------
# Point d'entrée Snakemake
# ---------------------------------------------------------------------------

def snakemake_main():
    """Appelé par Snakemake via script: directive."""
    input_files = list(snakemake.input.bracken_reports)
    output_tsv  = snakemake.output.tsv
    output_json = output_tsv.replace(".tsv", ".json")

    df = aggregate_reports(input_files)
    export_tsv(df, output_tsv)
    export_json(df, output_json)
    print_summary(df)


# ---------------------------------------------------------------------------
# Point d'entrée CLI
# ---------------------------------------------------------------------------

def cli_main():
    parser = argparse.ArgumentParser(
        description="AquaVigil-WA — Agrégation des sorties Bracken"
    )
    parser.add_argument(
        "--input", "-i", required=True,
        help="Dossier contenant les fichiers .bracken_report.txt"
    )
    parser.add_argument(
        "--output", "-o", required=True,
        help="Fichier de sortie TSV (ex: results/summary_report.tsv)"
    )
    parser.add_argument(
        "--json", action="store_true",
        help="Exporter également en JSON"
    )
    args = parser.parse_args()

    input_dir = Path(args.input)
    report_files = list(input_dir.glob("*.bracken_report.txt"))

    if not report_files:
        print(f"[ERREUR] Aucun fichier .bracken_report.txt trouvé dans {input_dir}")
        sys.exit(1)

    df = aggregate_reports([str(f) for f in report_files])
    export_tsv(df, args.output)
    print(f"[OK] TSV exporté : {args.output}")

    if args.json:
        json_out = args.output.replace(".tsv", ".json")
        export_json(df, json_out)
        print(f"[OK] JSON exporté : {json_out}")

    print_summary(df)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    # Détection mode Snakemake vs CLI
    try:
        snakemake
        snakemake_main()
    except NameError:
        cli_main()
