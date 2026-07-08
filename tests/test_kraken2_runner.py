"""
Tests unitaires pour scripts/kraken2_runner.py

Ces tests utilisent des fichiers Bracken synthétiques (format rapport Kraken2)
et ne nécessitent NI la base MiniKraken2 NI la stack bioinformatique.
Objectif : valider le parsing, l'agrégation et l'export en isolation.

Lancer : pytest tests/ -v --cov=scripts/kraken2_runner
"""
import json
import subprocess
import sys
from pathlib import Path

import pandas as pd
import pytest

SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "kraken2_runner.py"

# Rendre scripts/ importable
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))

import kraken2_runner as kr  # noqa: E402


# ---------------------------------------------------------------------------
# Fixtures : faux rapports Bracken (format Kraken2 report)
# Colonnes : fraction  reads_covered  reads_assigned  rank  taxid  taxon
# ---------------------------------------------------------------------------

SAMPLE1_CONTENT = (
    "5.23\t5230\t5100\tS\t666\tVibrio cholerae\n"
    "2.10\t2100\t2000\tS\t90371\tSalmonella enterica\n"
    "0.05\t50\t45\tS\t12080\tPoliovirus\n"
    "\n"                                        # ligne vide → ignorée
    "malformed line with too few cols\n"         # < 6 colonnes → ignorée
    "1.00\t1000\t980\tS\t1entTax\tEscherichia coli\n"
)

SAMPLE2_CONTENT = (
    "8.40\t8400\t8200\tS\t666\tVibrio cholerae\n"
    "0.90\t900\t870\tS\t90371\tSalmonella enterica\n"
)


@pytest.fixture
def sample1_report(tmp_path):
    fp = tmp_path / "LMC-001.bracken_report.txt"
    fp.write_text(SAMPLE1_CONTENT)
    return str(fp)


@pytest.fixture
def sample2_report(tmp_path):
    fp = tmp_path / "LMC-002.bracken_report.txt"
    fp.write_text(SAMPLE2_CONTENT)
    return str(fp)


# ---------------------------------------------------------------------------
# parse_bracken_report
# ---------------------------------------------------------------------------

def test_parse_returns_dataframe(sample1_report):
    df = kr.parse_bracken_report(sample1_report)
    assert isinstance(df, pd.DataFrame)
    assert not df.empty


def test_parse_skips_empty_and_malformed_lines(sample1_report):
    df = kr.parse_bracken_report(sample1_report)
    # 4 lignes valides sur 6 (1 vide + 1 malformée ignorées)
    assert len(df) == 4


def test_parse_extracts_sample_name(sample1_report):
    df = kr.parse_bracken_report(sample1_report)
    assert (df["sample"] == "LMC-001").all()


def test_parse_column_values(sample1_report):
    df = kr.parse_bracken_report(sample1_report)
    vibrio = df[df["taxon"] == "Vibrio cholerae"].iloc[0]
    assert vibrio["bracken_fraction"] == pytest.approx(5.23)
    assert vibrio["bracken_assigned"] == 5100
    assert vibrio["kraken_covered"] == 5230
    assert vibrio["taxid"] == "666"
    assert vibrio["rank"] == "S"


def test_parse_expected_columns(sample1_report):
    df = kr.parse_bracken_report(sample1_report)
    expected = {
        "sample", "taxon", "taxid", "rank",
        "bracken_fraction", "bracken_assigned", "kraken_covered",
    }
    assert expected.issubset(set(df.columns))


# ---------------------------------------------------------------------------
# aggregate_reports
# ---------------------------------------------------------------------------

def test_aggregate_multiple_samples(sample1_report, sample2_report):
    df = kr.aggregate_reports([sample1_report, sample2_report])
    assert set(df["sample"].unique()) == {"LMC-001", "LMC-002"}
    assert len(df) == 6  # 4 + 2


def test_aggregate_skips_missing_files(sample1_report):
    df = kr.aggregate_reports([sample1_report, "/chemin/inexistant.txt"])
    assert set(df["sample"].unique()) == {"LMC-001"}


def test_aggregate_empty_list_returns_empty_df():
    df = kr.aggregate_reports([])
    assert isinstance(df, pd.DataFrame)
    assert df.empty


# ---------------------------------------------------------------------------
# export_tsv
# ---------------------------------------------------------------------------

def test_export_tsv_roundtrip(sample1_report, tmp_path):
    df = kr.parse_bracken_report(sample1_report)
    out = tmp_path / "summary.tsv"
    kr.export_tsv(df, str(out))
    assert out.exists()
    reloaded = pd.read_csv(out, sep="\t")
    assert len(reloaded) == len(df)
    assert "Vibrio cholerae" in reloaded["taxon"].values


# ---------------------------------------------------------------------------
# export_json (structure PHA4GE-ready)
# ---------------------------------------------------------------------------

def test_export_json_grouped_by_sample(sample1_report, sample2_report, tmp_path):
    df = kr.aggregate_reports([sample1_report, sample2_report])
    out = tmp_path / "summary.json"
    kr.export_json(df, str(out))
    assert out.exists()
    data = json.loads(out.read_text())
    assert set(data.keys()) == {"LMC-001", "LMC-002"}
    assert isinstance(data["LMC-001"], list)


def test_export_json_record_fields(sample1_report, tmp_path):
    df = kr.parse_bracken_report(sample1_report)
    out = tmp_path / "summary.json"
    kr.export_json(df, str(out))
    data = json.loads(out.read_text())
    record = data["LMC-001"][0]
    for field in ("taxon", "taxid", "rank", "bracken_fraction", "bracken_assigned"):
        assert field in record


# ---------------------------------------------------------------------------
# print_summary (ne doit pas crasher)
# ---------------------------------------------------------------------------

def test_print_summary_with_data(sample1_report, capsys):
    df = kr.parse_bracken_report(sample1_report)
    kr.print_summary(df)
    out = capsys.readouterr().out
    assert "LMC-001" in out
    assert "Vibrio cholerae" in out


def test_print_summary_empty_df(capsys):
    kr.print_summary(pd.DataFrame())
    out = capsys.readouterr().out
    assert "Aucune donnée" in out


# ---------------------------------------------------------------------------
# Point d'entrée CLI (via subprocess — teste cli_main + bloc __main__)
# ---------------------------------------------------------------------------

def test_cli_generates_tsv_and_json(tmp_path):
    # Prépare un dossier avec deux rapports Bracken
    (tmp_path / "LMC-001.bracken_report.txt").write_text(SAMPLE1_CONTENT)
    (tmp_path / "LMC-002.bracken_report.txt").write_text(SAMPLE2_CONTENT)
    out_tsv = tmp_path / "summary_report.tsv"

    result = subprocess.run(
        [sys.executable, str(SCRIPT),
         "--input", str(tmp_path),
         "--output", str(out_tsv),
         "--json"],
        capture_output=True, text=True,
    )
    assert result.returncode == 0, result.stderr
    assert out_tsv.exists()
    assert (tmp_path / "summary_report.json").exists()
    # Le résumé console mentionne les échantillons
    assert "LMC-001" in result.stdout


def test_cli_errors_when_no_reports(tmp_path):
    out_tsv = tmp_path / "summary_report.tsv"
    result = subprocess.run(
        [sys.executable, str(SCRIPT),
         "--input", str(tmp_path),      # dossier vide
         "--output", str(out_tsv)],
        capture_output=True, text=True,
    )
    assert result.returncode == 1
    assert "Aucun fichier" in result.stdout


# ---------------------------------------------------------------------------
# cli_main / snakemake_main in-process (couverture réelle)
# ---------------------------------------------------------------------------

def test_cli_main_in_process(tmp_path, monkeypatch, capsys):
    (tmp_path / "LMC-001.bracken_report.txt").write_text(SAMPLE1_CONTENT)
    out_tsv = tmp_path / "out.tsv"
    monkeypatch.setattr(sys, "argv", [
        "kraken2_runner.py", "--input", str(tmp_path),
        "--output", str(out_tsv), "--json",
    ])
    kr.cli_main()
    assert out_tsv.exists()
    assert (tmp_path / "out.json").exists()
    assert "LMC-001" in capsys.readouterr().out


def test_cli_main_no_files_exits(tmp_path, monkeypatch):
    monkeypatch.setattr(sys, "argv", [
        "kraken2_runner.py", "--input", str(tmp_path),
        "--output", str(tmp_path / "out.tsv"),
    ])
    with pytest.raises(SystemExit) as exc:
        kr.cli_main()
    assert exc.value.code == 1


def test_snakemake_main(tmp_path, monkeypatch):
    """Simule l'objet `snakemake` injecté en mode script."""
    r1 = tmp_path / "LMC-001.bracken_report.txt"
    r1.write_text(SAMPLE1_CONTENT)
    out_tsv = tmp_path / "summary.tsv"

    class _NS:
        pass

    fake = _NS()
    fake.input = _NS()
    fake.input.bracken_reports = [str(r1)]
    fake.output = _NS()
    fake.output.tsv = str(out_tsv)

    monkeypatch.setattr(kr, "snakemake", fake, raising=False)
    kr.snakemake_main()
    assert out_tsv.exists()
    assert (tmp_path / "summary.json").exists()
