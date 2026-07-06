"""
Règles classification : Kraken2 + Bracken
"""

rule kraken2:
    """Classification taxonomique par k-mers"""
    input:
        r1 = "results/qc/{sample}_R1_trimmed.fastq.gz",
        r2 = "results/qc/{sample}_R2_trimmed.fastq.gz",
    output:
        report  = "results/kraken2_output/{sample}.report.txt",
        output  = "results/kraken2_output/{sample}.kraken.txt",
    params:
        db         = config["kraken2_db"],
        confidence = config["kraken2"]["confidence"],
    threads: config["kraken2"]["threads"]
    shell:
        """
        kraken2 --db {params.db} \
            --paired \
            --threads {threads} \
            --confidence {params.confidence} \
            --report {output.report} \
            --output {output.output} \
            {input.r1} {input.r2}
        """


rule bracken:
    """Estimation bayésienne des abondances taxonomiques"""
    input:
        report = "results/kraken2_output/{sample}.report.txt",
    output:
        bracken = "results/bracken_output/{sample}.bracken.txt",
        report  = "results/bracken_output/{sample}.bracken_report.txt",
    params:
        db        = config["kraken2_db"],
        read_len  = config["bracken"]["read_length"],
        level     = config["bracken"]["taxonomic_level"],
        threshold = config["bracken"]["threshold"],
    shell:
        """
        bracken -d {params.db} \
            -i {input.report} \
            -o {output.bracken} \
            -w {output.report} \
            -r {params.read_len} \
            -l {params.level} \
            -t {params.threshold}
        """
