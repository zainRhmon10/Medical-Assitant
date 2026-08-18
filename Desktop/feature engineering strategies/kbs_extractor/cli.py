import argparse
import sys

from kbs_extractor.logger import get_logger

log = get_logger("cli")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="kbs-extractor",
        description="Knowledge-Based Feature Extraction System — "
                    "Assess data quality and extract ML-ready features using rule graphs.",
    )
    parser.add_argument("--input", "-i", required=True, help="Path to input file (CSV, JSON, Excel)")
    parser.add_argument("--output", "-o", default=None, help="Path for output features CSV (default: <input>_features.csv)")
    parser.add_argument(
        "--mode", "-m",
        choices=["full", "quality", "features"],
        default="full",
        help="Run mode: 'full' (quality + features), 'quality' (assessment only), 'features' (extraction only)",
    )
    parser.add_argument("--target", "-t", default=None, help="Name of the target column (excluded from features, used for MI)")
    parser.add_argument("--report", "-r", default=None, help="Path to save quality report JSON")
    parser.add_argument(
        "--categorical", "-c",
        nargs="+", default=None,
        help="Columns to force as categorical (e.g., --categorical sex cp fbs)",
    )
    parser.add_argument(
        "--task",
        choices=["classification", "regression"],
        default=None,
        help="ML task type (auto-detected from target if not specified)",
    )
    parser.add_argument(
        "--validate", "-v",
        action="store_true",
        help="Run validation: compare raw vs extracted features using cross-validated ML",
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    from pathlib import Path
    input_path = Path(args.input)
    if not input_path.exists():
        log.error("Input file not found: %s", input_path)
        print(f"Error: file not found: {input_path}", file=sys.stderr)
        return 1

    if args.output is None:
        args.output = str(input_path.with_name(input_path.stem + "_features.csv"))

    if args.validate and not args.target:
        print("Error: --validate requires --target", file=sys.stderr)
        return 1

    from kbs_extractor.pipeline import Pipeline

    pipeline = Pipeline(
        input_path=str(input_path),
        output_path=args.output,
        mode=args.mode,
        target_column=args.target,
        report_path=args.report,
        categorical_columns=args.categorical,
        task_type=args.task,
    )
    result_df = pipeline.run()

    if args.validate and result_df is not None:
        from kbs_extractor.validator import validate
        df_original = Pipeline._load_data(str(input_path))
        df_original.columns = df_original.columns.str.strip()
        validation = validate(
            df_original=df_original,
            df_features=result_df,
            target_col=args.target,
            task_type=pipeline.task_type or "classification",
        )
        report_path = args.report or str(Path(args.output).with_suffix(".report.json"))
        import json
        vpath = str(Path(report_path).with_suffix(".validation.json"))
        Path(vpath).write_text(json.dumps(validation, indent=2), encoding="utf-8")
        log.info("Validation report saved to %s", vpath)

    return 0


if __name__ == "__main__":
    sys.exit(main())
