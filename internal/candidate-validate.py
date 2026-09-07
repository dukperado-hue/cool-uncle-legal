#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
candidate-validate.py — Phase 4D-1

Validate INTERNAL candidate-case JSON against internal/candidate.schema.json
plus the semantic rules the schema cannot express (status state-machine,
agent_inferred gating, promotion block, structural-path identity safety).

    python internal/candidate-validate.py <file-or-directory> [...more]

Deterministic. One PASS/FAIL block per candidate, one line per finding:

    FAIL  cand-foo-2567
      [SOURCE_TYPE_INVALID]  source.type "podcast" not in ['lecture', ...]
      [EVIDENCE_MISSING]      cited_provisions[1] has no evidence tag

    2 candidates checked — 1 passed, 1 failed

Exit code 0 iff every candidate passed; 1 otherwise (also 1 on usage error).

This tool NEVER writes anything, NEVER touches prototype/assets/cases/,
golden-cases.json or article-case-index.json, and CANNOT promote a
candidate. It only reads collections-registry.json (for the collection
whitelist) and candidate.schema.json (for the controlled enums).
"""
import json
import glob
import os
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
SCHEMA_PATH = os.path.join(HERE, "candidate.schema.json")
REGISTRY_PATH = os.path.join(REPO, "collections-registry.json")

CANDIDATE_ID_RE = None  # compiled lazily from the schema pattern

# ---------------------------------------------------------------- contract

def _load_contract():
    """Enums + candidate_id pattern from the schema; collections from the
    frozen registry. Single source of truth — nothing hard-coded here."""
    with open(SCHEMA_PATH, encoding="utf-8") as fh:
        schema = json.load(fh)
    d = schema.get("$defs", {})
    contract = {
        "schema_versions": list(d.get("schema_versions", [])),
        "source_types": list(d.get("source_types", [])),
        "evidence_types": list(d.get("evidence_types", [])),
        "confidence_levels": list(d.get("confidence_levels", [])),
        "statuses": list(d.get("statuses", [])),
        "candidate_id_pattern": schema["properties"]["candidate_id"]["pattern"],
    }
    try:
        with open(REGISTRY_PATH, encoding="utf-8") as fh:
            reg = json.load(fh)
        contract["collections"] = sorted((reg.get("collections") or {}).keys())
    except (OSError, ValueError):
        contract["collections"] = []
    return contract


# ---------------------------------------------------------------- findings

class Finding:
    __slots__ = ("code", "message")

    def __init__(self, code, message):
        self.code = code
        self.message = message

    def __repr__(self):
        return "[%s] %s" % (self.code, self.message)


def _is_str(x):
    return isinstance(x, str) and x.strip() != ""


# ---------------------------------------------------------------- validation

def validate_candidate(obj, contract, scope_ids=None):
    """Return (candidate_id, [Finding, ...]). Empty list == PASS.

    scope_ids: optional dict {candidate_id: count} across the whole run, used
    only for the duplicate-id check.
    """
    f = []
    C = contract
    STATUS_ORDER = C["statuses"]

    if not isinstance(obj, dict):
        return ("<not-an-object>", [Finding("NOT_AN_OBJECT",
                "top-level value is %s, expected object" % type(obj).__name__)])

    cid = obj.get("candidate_id")
    cid_disp = cid if _is_str(cid) else "<no-id>"

    # ---- identity -----------------------------------------------------
    sv = obj.get("schema_version")
    if not _is_str(sv):
        f.append(Finding("SCHEMA_VERSION_MISSING", "schema_version is required"))
    elif sv not in C["schema_versions"]:
        f.append(Finding("SCHEMA_VERSION_UNKNOWN",
                         'schema_version "%s" not in %s' % (sv, C["schema_versions"])))

    if not _is_str(cid):
        f.append(Finding("CANDIDATE_ID_MISSING", "candidate_id is required"))
    else:
        import re
        if not re.match(C["candidate_id_pattern"], cid):
            f.append(Finding("CANDIDATE_ID_FORMAT",
                             'candidate_id "%s" must match %s '
                             '(cand-<slug>-<4-digit-year>)' % (cid, C["candidate_id_pattern"])))
        if scope_ids and scope_ids.get(cid, 0) > 1:
            f.append(Finding("CANDIDATE_ID_DUPLICATE",
                             'candidate_id "%s" appears %d times in this run'
                             % (cid, scope_ids[cid])))

    if not _is_str(obj.get("title")):
        f.append(Finding("TITLE_MISSING", "title is required and must be non-empty"))

    # ---- source / provenance ---------------------------------------
    src = obj.get("source")
    if not isinstance(src, dict):
        f.append(Finding("SOURCE_MISSING", "source object is required (a candidate needs provenance)"))
    else:
        st = src.get("type")
        if not _is_str(st):
            f.append(Finding("SOURCE_TYPE_MISSING", "source.type is required"))
        elif st not in C["source_types"]:
            f.append(Finding("SOURCE_TYPE_INVALID",
                             'source.type "%s" not in %s' % (st, C["source_types"])))
        if not _is_str(src.get("ref")):
            f.append(Finding("SOURCE_REF_EMPTY",
                             "source.ref is required and must be non-empty (no provenance otherwise)"))
        for opt in ("notebook", "quote"):
            if opt in src and src[opt] is not None and not isinstance(src[opt], str):
                f.append(Finding("SOURCE_FIELD_TYPE",
                                 "source.%s must be a string or null" % opt))

    # ---- cited provisions + evidence ------------------------------
    provs = obj.get("cited_provisions", [])
    inferred_present = False
    if not isinstance(provs, list):
        f.append(Finding("CITED_PROVISIONS_TYPE", "cited_provisions must be an array"))
        provs = []
    for i, p in enumerate(provs):
        if not isinstance(p, dict):
            f.append(Finding("CITED_PROVISION_TYPE", "cited_provisions[%d] must be an object" % i))
            continue
        if not _is_str(p.get("ref")):
            f.append(Finding("CITED_PROVISION_REF_EMPTY",
                             "cited_provisions[%d].ref is required (\"<collection>:<number>\")" % i))
        ev = p.get("evidence")
        if not _is_str(ev):
            f.append(Finding("EVIDENCE_MISSING", "cited_provisions[%d] has no evidence tag" % i))
        elif ev not in C["evidence_types"]:
            f.append(Finding("EVIDENCE_INVALID",
                             'cited_provisions[%d].evidence "%s" not in %s '
                             "(evidence types are fixed — do not invent one)"
                             % (i, ev, C["evidence_types"])))
        elif ev == "agent_inferred":
            inferred_present = True

    # ---- structural path (derived, never index identity) ----------
    paths = obj.get("candidate_structural_path", [])
    if not isinstance(paths, list):
        f.append(Finding("STRUCTURAL_PATH_TYPE", "candidate_structural_path must be an array"))
        paths = []
    for i, sp in enumerate(paths):
        if not isinstance(sp, dict):
            f.append(Finding("STRUCTURAL_PATH_MALFORMED",
                             "candidate_structural_path[%d] must be an object" % i))
            continue
        col = sp.get("collection")
        if not _is_str(col):
            f.append(Finding("STRUCTURAL_PATH_MALFORMED",
                             "candidate_structural_path[%d].collection is required" % i))
        elif C["collections"] and col not in C["collections"]:
            f.append(Finding("STRUCTURAL_PATH_COLLECTION_UNKNOWN",
                             'candidate_structural_path[%d].collection "%s" is not in '
                             "collections-registry.json" % (i, col)))
        if "instrument" in sp and sp["instrument"] is not None and not isinstance(sp["instrument"], str):
            f.append(Finding("STRUCTURAL_PATH_MALFORMED",
                             "candidate_structural_path[%d].instrument must be a string or null" % i))
        pth = sp.get("path")
        if not isinstance(pth, list):
            f.append(Finding("STRUCTURAL_PATH_MALFORMED",
                             "candidate_structural_path[%d].path must be an array of value strings" % i))
        else:
            for j, seg in enumerate(pth):
                if isinstance(seg, bool) or isinstance(seg, int) or isinstance(seg, float):
                    f.append(Finding("STRUCTURAL_PATH_INDEX_IDENTITY",
                                     "candidate_structural_path[%d].path[%d] is a number (%r) — "
                                     "an array index must never be used as structural identity; "
                                     "path elements are the structural VALUE strings"
                                     % (i, j, seg)))
                elif not isinstance(seg, str):
                    f.append(Finding("STRUCTURAL_PATH_MALFORMED",
                                     "candidate_structural_path[%d].path[%d] must be a string" % (i, j)))
        evd = sp.get("evidence")
        if evd != "derived_from_provision":
            f.append(Finding("STRUCTURAL_PATH_EVIDENCE",
                             'candidate_structural_path[%d].evidence must be "derived_from_provision" '
                             "(the path is derived from a verified provision via AtlasCore, "
                             "not hand-authored) — got %r" % (i, evd)))

    # ---- extraction confidence -----------------------------------
    ec = obj.get("extraction_confidence")
    if ec is not None and ec not in C["confidence_levels"]:
        f.append(Finding("EXTRACTION_CONFIDENCE_INVALID",
                         'extraction_confidence "%s" not in %s' % (ec, C["confidence_levels"])))

    # ---- possible_duplicate_of ----------------------------------
    pdup = obj.get("possible_duplicate_of", [])
    if not isinstance(pdup, list) or any(not isinstance(x, str) for x in pdup):
        f.append(Finding("POSSIBLE_DUPLICATE_TYPE",
                         "possible_duplicate_of must be an array of id strings"))

    # ---- reviewers (append-only log) ---------------------------
    reviewers = obj.get("reviewers", [])
    reviewer_ok = isinstance(reviewers, list)
    if not reviewer_ok:
        f.append(Finding("REVIEWERS_TYPE", "reviewers must be an array"))
        reviewers = []
    for i, r in enumerate(reviewers):
        if not isinstance(r, dict) or not all(_is_str(r.get(k)) for k in ("by", "at", "from_status", "to_status")):
            f.append(Finding("REVIEWERS_MALFORMED",
                             "reviewers[%d] must have non-empty by / at / from_status / to_status" % i))
            reviewer_ok = False

    # ---- status state machine ---------------------------------
    status = obj.get("status")
    if not _is_str(status):
        f.append(Finding("STATUS_MISSING", "status is required"))
        status = None
    elif status not in STATUS_ORDER:
        f.append(Finding("STATUS_INVALID",
                         'status "%s" not in %s' % (status, STATUS_ORDER)))
        status = None

    def rank(s):
        return STATUS_ORDER.index(s) if s in STATUS_ORDER else -1

    if status and reviewer_ok and reviewers:
        # the log must end where status says, and every hop must be one of the
        # ordered lifecycle transitions (forward by exactly one, or a same-status
        # annotation) — never a backward jump or a skip.
        last_to = reviewers[-1].get("to_status")
        if last_to != status:
            f.append(Finding("STATUS_LOG_MISMATCH",
                             'status is "%s" but the last reviewers[] entry ends at "%s"'
                             % (status, last_to)))
        for i, r in enumerate(reviewers):
            a, b = r.get("from_status"), r.get("to_status")
            if a in STATUS_ORDER and b in STATUS_ORDER:
                if rank(b) < rank(a) or rank(b) - rank(a) > 1:
                    f.append(Finding("STATUS_TRANSITION_INVALID",
                                     'reviewers[%d] transition "%s" -> "%s" is not a single '
                                     "forward step in the lifecycle" % (i, a, b)))

    # per-status content requirements
    if status and rank(status) >= rank("source_verified"):
        if not _is_str(obj.get("factual_summary")):
            f.append(Finding("REQUIRES_FACTUAL_SUMMARY",
                             'status "%s" requires a non-empty factual_summary' % status))
        if not _is_str(obj.get("legal_issue")):
            f.append(Finding("REQUIRES_LEGAL_ISSUE",
                             'status "%s" requires a non-empty legal_issue' % status))
        if reviewer_ok and not reviewers:
            f.append(Finding("REQUIRES_REVIEWER",
                             'status "%s" requires at least one reviewers[] entry' % status))

    if status and rank(status) >= rank("citation_verified"):
        cc = obj.get("claimed_citation")
        if not isinstance(cc, dict) or not _is_str(cc.get("case_number")):
            f.append(Finding("REQUIRES_CITATION",
                             'status "%s" requires claimed_citation.case_number '
                             "(confirmed against a judgment or >=2 reputable sources)" % status))

    if status and rank(status) >= rank("mapping_verified"):
        if not provs:
            f.append(Finding("REQUIRES_PROVISIONS",
                             'status "%s" requires at least one cited_provisions entry' % status))
        if not paths:
            f.append(Finding("REQUIRES_STRUCTURAL_PATH",
                             'status "%s" requires candidate_structural_path derived from a '
                             "verified provision" % status))
        if inferred_present:
            cleared = any(isinstance(r, dict) and r.get("action") == "cleared_agent_inferred"
                          for r in reviewers)
            if not cleared:
                f.append(Finding("AGENT_INFERRED_NOT_CLEARED",
                                 'a cited_provisions entry is evidence="agent_inferred"; status '
                                 '"%s" requires a reviewers[] entry with '
                                 'action="cleared_agent_inferred" (a human must confirm or remove '
                                 "an inferred provision before it counts as verified)" % status))

    if status and rank(status) >= rank("content_reviewed"):
        if reviewer_ok and not any(r.get("to_status") == "content_reviewed" for r in reviewers):
            f.append(Finding("REQUIRES_CONTENT_REVIEW",
                             'status "%s" requires a reviewers[] entry reaching content_reviewed '
                             "(deident + <=350-char paragraphs + render test done out-of-band)" % status))

    # ---- promotion block (Phase 4D-1: promotion is manual, no tooling) --
    pcid = obj.get("promoted_case_id")
    if pcid is not None:
        if status != "promoted":
            f.append(Finding("PROMOTION_NOT_ALLOWED",
                             "promoted_case_id is set but status is %r — promoted_case_id must be "
                             "null until a human completes the promotion gate and sets status "
                             '"promoted"' % status))
        if not _is_str(pcid):
            f.append(Finding("PROMOTED_CASE_ID_TYPE", "promoted_case_id must be a string or null"))
    if status == "promoted":
        # allowed to exist as recorded history, but must be internally consistent
        if not _is_str(pcid):
            f.append(Finding("PROMOTED_MISSING_CASE_ID",
                             'status "promoted" requires promoted_case_id to name the public case'))
        if reviewer_ok and not any(r.get("to_status") == "promoted" for r in reviewers):
            f.append(Finding("PROMOTED_NO_REVIEWER",
                             'status "promoted" requires a reviewers[] entry recording who promoted it'))

    return (cid_disp, f)


# ---------------------------------------------------------------- runner

def _iter_targets(args):
    """Yield json file paths, or ('__missing__', arg) for a path that does not
    exist. An existing directory with no *.json yields nothing (that is a
    valid, empty state — not an error)."""
    seen = set()
    for a in args:
        if os.path.isdir(a):
            for p in sorted(glob.glob(os.path.join(a, "*.json"))):
                if p not in seen:
                    seen.add(p)
                    yield p
        elif os.path.isfile(a):
            if a not in seen:
                seen.add(a)
                yield a
        else:
            yield ("__missing__", a)


def main(argv):
    if len(argv) < 2:
        print("usage: python internal/candidate-validate.py <file-or-directory> [...]")
        return 1

    contract = _load_contract()
    targets = list(_iter_targets(argv[1:]))
    missing = [t[1] for t in targets if isinstance(t, tuple) and t and t[0] == "__missing__"]
    files = [t for t in targets if not (isinstance(t, tuple) and t and t[0] == "__missing__")]
    if missing:
        for m in missing:
            print("FAIL  %s" % os.path.basename(m))
            print("      [PATH_NOT_FOUND]  %s does not exist" % m)
    if not files:
        if missing:
            return 1
        print("no candidate JSON files to validate in: %s" % ", ".join(argv[1:]))
        return 0
    targets = files

    # first pass: load all, count ids for the duplicate check
    loaded = []
    scope_ids = {}
    for t in targets:
        try:
            with open(t, encoding="utf-8") as fh:
                obj = json.load(fh)
        except ValueError as e:
            loaded.append((t, None, "invalid JSON: %s" % e))
            continue
        loaded.append((t, obj, None))
        if isinstance(obj, dict) and isinstance(obj.get("candidate_id"), str):
            scope_ids[obj["candidate_id"]] = scope_ids.get(obj["candidate_id"], 0) + 1

    passed = 0
    failed = len(missing)
    for path, obj, load_err in loaded:
        name = os.path.basename(path)
        if load_err:
            failed += 1
            print("FAIL  %s" % name)
            print("      [LOAD_ERROR]  %s" % load_err)
            continue
        cid, findings = validate_candidate(obj, contract, scope_ids)
        if findings:
            failed += 1
            print("FAIL  %s  (%s)" % (name, cid))
            for fd in findings:
                print("      [%s]  %s" % (fd.code, fd.message))
        else:
            passed += 1
            print("PASS  %s  (%s)" % (name, cid))

    print("\n%d candidate%s checked — %d passed, %d failed"
          % (passed + failed, "" if passed + failed == 1 else "s", passed, failed))
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
