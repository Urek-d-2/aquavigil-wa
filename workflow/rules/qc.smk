"""
Règles QC : FastQC + Trimmomatic + MultiQC
"""

rule fastqc_raw:
    """Contrôle qualité des reads bruts"""
    input:
        r1 = os.path.join(DATA_DIR, "{sample}_R1.fastq.gz"),
        r2 = os.path.join(DATA_DIR, "{sample}_R2.fastq.gz"),
    output:
        html_r1 = "results/qc/{sample}_R1_fastqc.html",
        html_r2 = "results/qc/{sample}_R2_fastqc.html",
        zip_r1  = "results/qc/{sample}_R1_fastqc.zip",
        zip_r2  = "results/qc/{sample}_R2_fastqc.zip",
    threads: 2
    shell:
        "fastqc {input.r1} {input.r2} --outdir results/qc/ --threads {threads}"


rule trimmomatic:
    """Filtrage adaptateurs et bases basse qualité"""
    input:
        r1 = os.path.join(DATA_DIR, "{sample}_R1.fastq.gz"),
        r2 = os.path.join(DATA_DIR, "{sample}_R2.fastq.gz"),
    output:
        r1_paired   = "results/qc/{sample}_R1_trimmed.fastq.gz",
        r2_paired   = "results/qc/{sample}_R2_trimmed.fastq.gz",
        r1_unpaired = "results/qc/{sample}_R1_unpaired.fastq.gz",
        r2_unpaired = "results/qc/{sample}_R2_unpaired.fastq.gz",
    params:
        adapters  = config["trimmomatic"]["adapters"],
        leading   = config["trimmomatic"]["leading"],
        trailing  = config["trimmomatic"]["trailing"],
        sw        = config["trimmomatic"]["sliding_window"],
        minlen    = config["trimmomatic"]["minlen"],
    threads: 4
    shell:
        """
        trimmomatic PE -threads {threads} \
            {input.r1} {input.r2} \
            {output.r1_paired} {output.r1_unpaired} \
            {output.r2_paired} {output.r2_unpaired} \
            ILLUMINACLIP:{params.adapters}:2:30:10 \
            LEADING:{params.leading} \
            TRAILING:{params.trailing} \
            SLIDINGWINDOW:{params.sw} \
            MINLEN:{params.minlen}
        """


rule multiqc:
    """Rapport QC agrégé sur tous les échantillons"""
    input:
        expand("results/qc/{sample}_R1_fastqc.zip", sample=SAMPLES),
        expand("results/qc/{sample}_R2_fastqc.zip", sample=SAMPLES),
    output:
        "results/qc/multiqc_report.html",
    shell:
        "multiqc results/qc/ --outdir results/qc/ --filename multiqc_report"
