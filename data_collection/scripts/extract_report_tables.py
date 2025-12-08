"""
Extract tables from market-report PDFs (PropIndex, Insite, Real Insight, brokerage PDFs).

Usage:
  python extract_report_tables.py

Place PDFs in: data_collection/reports/raw/
Outputs CSVs to: data_collection/reports/processed/<pdf_name>_table<N>.csv

Notes:
- Uses tabula-py (Java required). Install deps: pip install tabula-py pdfplumber pandas
- If a table fails via tabula, we attempt a simple pdfplumber fallback.
- This is generic; report layouts vary. Manual review/cleanup will still be needed.
"""

import os
import logging
from pathlib import Path
from typing import List

import pandas as pd
import tabula  # type: ignore
import pdfplumber  # type: ignore

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


RAW_DIR = Path("data_collection/reports/raw")
OUT_DIR = Path("data_collection/reports/processed")
OUT_DIR.mkdir(parents=True, exist_ok=True)


def extract_with_tabula(pdf_path: Path) -> List[Path]:
    """Extract tables from a PDF using tabula; return list of CSV paths."""
    logger.info(f"Extracting (tabula): {pdf_path.name}")
    try:
        tables = tabula.read_pdf(str(pdf_path), pages="all", multiple_tables=True, lattice=True)
    except Exception as e:
        logger.error(f"Tabula failed for {pdf_path.name}: {e}")
        return []

    out_files: List[Path] = []
    for idx, df in enumerate(tables):
        if df is None or df.empty:
            continue
        out_file = OUT_DIR / f"{pdf_path.stem}_table{idx+1}.csv"
        df.to_csv(out_file, index=False)
        out_files.append(out_file)
    return out_files


def extract_with_pdfplumber(pdf_path: Path) -> List[Path]:
    """Fallback extraction using pdfplumber; returns CSV paths."""
    logger.info(f"Fallback (pdfplumber): {pdf_path.name}")
    out_files: List[Path] = []
    try:
        with pdfplumber.open(pdf_path) as pdf:
            table_idx = 0
            for page_num, page in enumerate(pdf.pages, start=1):
                tables = page.extract_tables()
                for tbl in tables:
                    table_idx += 1
                    df = pd.DataFrame(tbl)
                    if df.empty:
                        continue
                    out_file = OUT_DIR / f"{pdf_path.stem}_fallback_table{table_idx}.csv"
                    df.to_csv(out_file, index=False, header=False)
                    out_files.append(out_file)
    except Exception as e:
        logger.error(f"pdfplumber failed for {pdf_path.name}: {e}")
    return out_files


def process_pdf(pdf_path: Path):
    out_files = extract_with_tabula(pdf_path)
    # If nothing extracted, try fallback
    if not out_files:
        out_files = extract_with_pdfplumber(pdf_path)
    if out_files:
        logger.info(f"Extracted {len(out_files)} tables from {pdf_path.name}")
    else:
        logger.warning(f"No tables extracted from {pdf_path.name}")


def main():
    if not RAW_DIR.exists():
        logger.error(f"Raw reports folder not found: {RAW_DIR}")
        return

    pdfs = list(RAW_DIR.glob("*.pdf"))
    if not pdfs:
        logger.warning(f"No PDFs found in {RAW_DIR}. Drop report PDFs there and rerun.")
        return

    for pdf in pdfs:
        process_pdf(pdf)


if __name__ == "__main__":
    main()

