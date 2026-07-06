"""
Règle d'agrégation : rapport synthétique multi-échantillons
"""

rule summary_report:
    """Génère un rapport TSV agrégé de tous les échantillons"""
    input:
        bracken_reports = expand(
            "results/bracken_output/{sample}.bracken_report.txt",
            sample=SAMPLES
        ),
    output:
        tsv = "results/summary_report.tsv",
    script:
        "../scripts/kraken2_runner.py"
