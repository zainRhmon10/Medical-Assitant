"""Knowledge Graph built on NetworkX DiGraph."""

import networkx as nx
import pandas as pd

from kbs_extractor.logger import get_logger
from kbs_extractor.profiler import profile_dataframe, compute_correlations

log = get_logger("graph")


class KnowledgeGraph:
    def __init__(self):
        self.g = nx.DiGraph()

    def build_from_dataframe(self, df: pd.DataFrame, dataset_name: str = "dataset",
                             categorical_overrides: list[str] | None = None) -> None:
        self.g.add_node(dataset_name, type="dataset", row_count=len(df), col_count=len(df.columns))

        profiles = profile_dataframe(df, categorical_overrides=categorical_overrides)
        for p in profiles:
            node_type = "text_column" if p["dtype"] == "text" else "column"
            node_id = f"col:{p['name']}"
            self.g.add_node(node_id, type=node_type, **p)
            self.g.add_edge(dataset_name, node_id, relation="has_column")
            log.info("Added graph node '%s' [%s]", node_id, node_type)

        correlations = compute_correlations(df, threshold=0.3)
        for c in correlations:
            src, dst = f"col:{c['col_a']}", f"col:{c['col_b']}"
            self.g.add_edge(src, dst, relation="correlates",
                            pearson=c["pearson"], abs_pearson=c["abs_pearson"])

        log.info("Knowledge graph built: %d nodes, %d edges",
                 self.g.number_of_nodes(), self.g.number_of_edges())

    def get_columns(self, dtype: str | None = None) -> list[dict]:
        results = []
        for node, attrs in self.g.nodes(data=True):
            if attrs.get("type") not in ("column", "text_column"):
                continue
            if dtype and attrs.get("dtype") != dtype:
                continue
            results.append(attrs)
        return results

    def get_all_profiles(self) -> list[dict]:
        return [attrs for _, attrs in self.g.nodes(data=True)
                if attrs.get("type") in ("column", "text_column")]

    def get_correlations(self) -> list[dict]:
        results = []
        for u, v, attrs in self.g.edges(data=True):
            if attrs.get("relation") == "correlates":
                results.append({
                    "col_a": u.removeprefix("col:"),
                    "col_b": v.removeprefix("col:"),
                    "pearson": attrs["pearson"],
                    "abs_pearson": attrs["abs_pearson"],
                })
        return results

    def get_dataset_meta(self) -> dict:
        for node, attrs in self.g.nodes(data=True):
            if attrs.get("type") == "dataset":
                return attrs
        return {}

    def add_issue(self, column: str, kind: str, severity: str, description: str) -> str:
        issue_id = f"issue:{column}:{kind}"
        self.g.add_node(issue_id, type="issue", column=column,
                        kind=kind, severity=severity, description=description)
        self.g.add_edge(f"col:{column}", issue_id, relation="has_issue")
        return issue_id

    def add_feature_plan(self, source: str | list, operation: str,
                         params: dict | None, rationale: str) -> str:
        src_label = source if isinstance(source, str) else "_".join(source)
        plan_id = f"plan:{src_label}:{operation}"
        self.g.add_node(plan_id, type="feature_plan", source=source,
                        operation=operation, params=params or {}, rationale=rationale)
        if isinstance(source, str):
            self.g.add_edge(f"col:{source}", plan_id, relation="planned_as")
        else:
            for s in source:
                self.g.add_edge(f"col:{s}", plan_id, relation="planned_as")
        return plan_id

    def get_issues(self) -> list[dict]:
        return [attrs for _, attrs in self.g.nodes(data=True)
                if attrs.get("type") == "issue"]

    def get_feature_plans(self) -> list[dict]:
        return [attrs for _, attrs in self.g.nodes(data=True)
                if attrs.get("type") == "feature_plan"]
