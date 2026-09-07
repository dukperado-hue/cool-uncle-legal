#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
candidate-validate-test.py — Phase 4D-1

Tests for internal/candidate-validate.py. Positive cases use the tracked
synthetic fixtures in internal/fixtures/; negative cases are built
programmatically (a valid dict is mutated) so no fake "case" is ever
written to disk.

    python internal/candidate-validate-test.py

PASS/FAIL per test, summary line, exit 0 iff all pass.
"""
import copy
import importlib.util
import json
import os
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

HERE = os.path.dirname(os.path.abspath(__file__))
FIX = os.path.join(HERE, "fixtures")

_spec = importlib.util.spec_from_file_location(
    "candidate_validate", os.path.join(HERE, "candidate-validate.py"))
cv = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(cv)

CONTRACT = cv._load_contract()

_pass = 0
_fail = 0


def run(name, fn):
    global _pass, _fail
    try:
        fn()
        _pass += 1
        print("  PASS  " + name)
    except AssertionError as e:
        _fail += 1
        print("  FAIL  " + name + "  — " + str(e))
    except Exception as e:  # noqa: BLE001
        _fail += 1
        print("  FAIL  " + name + "  — unexpected " + type(e).__name__ + ": " + str(e))


def codes(obj, scope=None):
    _cid, findings = cv.validate_candidate(obj, CONTRACT, scope)
    return {f.code for f in findings}


def load_fixture(name):
    with open(os.path.join(FIX, name), encoding="utf-8") as fh:
        return json.load(fh)


def valid_base():
    """A programmatic status='candidate' object that passes clean."""
    return {
        "schema_version": "1.0",
        "candidate_id": "cand-testonly-synthetic-0000",
        "title": "TEST ONLY synthetic",
        "source": {"type": "lecture", "ref": "TEST ref", "notebook": None, "quote": None},
        "claimed_citation": None,
        "factual_summary": None,
        "legal_issue": None,
        "cited_provisions": [],
        "candidate_structural_path": [],
        "extraction_confidence": "low",
        "possible_duplicate_of": [],
        "status": "candidate",
        "reviewers": [],
        "promoted_case_id": None,
    }


def _assert_empty(cset):
    assert cset == set(), "expected no findings, got %s" % sorted(cset)


def _assert_has(cset, code):
    assert code in cset, "expected %s among findings, got %s" % (code, sorted(cset))


def valid_mapping_verified():
    o = valid_base()
    o["candidate_id"] = "cand-testonly-synthetic-0002"
    o["factual_summary"] = "TEST synthetic facts"
    o["legal_issue"] = "TEST synthetic issue"
    o["claimed_citation"] = {"case_number": "TEST-000/0000", "court": "TEST", "year": "0000"}
    o["cited_provisions"] = [{"ref": "civil:1", "evidence": "source_explicit"}]
    o["candidate_structural_path"] = [
        {"collection": "civil", "instrument": None, "path": ["บรรพ 1"], "evidence": "derived_from_provision"}
    ]
    o["status"] = "mapping_verified"
    o["reviewers"] = [
        {"by": "t", "at": "d", "from_status": "candidate", "to_status": "source_verified"},
        {"by": "t", "at": "d", "from_status": "source_verified", "to_status": "citation_verified"},
        {"by": "t", "at": "d", "from_status": "citation_verified", "to_status": "mapping_verified"},
    ]
    return o


# ================================================================
# POSITIVE — fixtures + programmatic
# ================================================================
run("fixture candidate-minimal.json passes clean",
    lambda: _assert_empty(codes(load_fixture("candidate-minimal.json"))))

run("fixture candidate-mapping-verified.json passes clean",
    lambda: _assert_empty(codes(load_fixture("candidate-mapping-verified.json"))))

run("programmatic minimal candidate passes clean",
    lambda: _assert_empty(codes(valid_base())))

run("programmatic mapping_verified candidate passes clean",
    lambda: _assert_empty(codes(valid_mapping_verified())))


# ================================================================
# NEGATIVE — required by the phase brief
# ================================================================
def t_missing_candidate_id():
    o = valid_base(); del o["candidate_id"]
    _assert_has(codes(o), "CANDIDATE_ID_MISSING")
run("missing candidate_id -> CANDIDATE_ID_MISSING", t_missing_candidate_id)


def t_bad_candidate_id_format():
    o = valid_base(); o["candidate_id"] = "my_case_123"
    _assert_has(codes(o), "CANDIDATE_ID_FORMAT")
run("malformed candidate_id -> CANDIDATE_ID_FORMAT", t_bad_candidate_id_format)


def t_duplicate_candidate_id():
    o = valid_base()
    scope = {o["candidate_id"]: 2}
    _assert_has(codes(o, scope), "CANDIDATE_ID_DUPLICATE")
run("duplicate candidate_id in scope -> CANDIDATE_ID_DUPLICATE", t_duplicate_candidate_id)


def t_missing_source():
    o = valid_base(); del o["source"]
    _assert_has(codes(o), "SOURCE_MISSING")
run("missing source -> SOURCE_MISSING", t_missing_source)


def t_empty_source_ref():
    o = valid_base(); o["source"]["ref"] = "   "
    _assert_has(codes(o), "SOURCE_REF_EMPTY")
run("empty source.ref (no provenance) -> SOURCE_REF_EMPTY", t_empty_source_ref)


def t_invalid_source_type():
    o = valid_base(); o["source"]["type"] = "podcast"
    _assert_has(codes(o), "SOURCE_TYPE_INVALID")
run("invalid source.type -> SOURCE_TYPE_INVALID", t_invalid_source_type)


def t_invalid_evidence_type():
    o = valid_mapping_verified()
    o["cited_provisions"] = [{"ref": "civil:1", "evidence": "gut_feeling"}]
    _assert_has(codes(o), "EVIDENCE_INVALID")
run("invalid evidence type -> EVIDENCE_INVALID", t_invalid_evidence_type)


def t_missing_evidence():
    o = valid_mapping_verified()
    o["cited_provisions"] = [{"ref": "civil:1"}]
    _assert_has(codes(o), "EVIDENCE_MISSING")
run("cited provision with no evidence -> EVIDENCE_MISSING", t_missing_evidence)


def t_agent_inferred_not_cleared():
    o = valid_mapping_verified()
    o["cited_provisions"] = [{"ref": "civil:1", "evidence": "agent_inferred"}]
    # reviewers present but none clears the inferred provision
    _assert_has(codes(o), "AGENT_INFERRED_NOT_CLEARED")
run("agent_inferred at mapping_verified without human clearance -> AGENT_INFERRED_NOT_CLEARED",
    t_agent_inferred_not_cleared)


def t_agent_inferred_cleared_ok():
    o = valid_mapping_verified()
    o["cited_provisions"] = [{"ref": "civil:1", "evidence": "agent_inferred"}]
    o["reviewers"][-1]["action"] = "cleared_agent_inferred"
    _assert_empty(codes(o))
run("agent_inferred cleared by a reviewer -> passes", t_agent_inferred_cleared_ok)


def t_invalid_status():
    o = valid_base(); o["status"] = "published"
    _assert_has(codes(o), "STATUS_INVALID")
run("invalid status -> STATUS_INVALID", t_invalid_status)


def t_status_log_mismatch():
    o = valid_mapping_verified(); o["status"] = "source_verified"
    _assert_has(codes(o), "STATUS_LOG_MISMATCH")
run("status not matching reviewers[] log end -> STATUS_LOG_MISMATCH", t_status_log_mismatch)


def t_status_transition_skip():
    o = valid_base()
    o["status"] = "citation_verified"
    o["factual_summary"] = "x"; o["legal_issue"] = "x"
    o["claimed_citation"] = {"case_number": "X"}
    o["reviewers"] = [{"by": "t", "at": "d", "from_status": "candidate", "to_status": "citation_verified"}]
    _assert_has(codes(o), "STATUS_TRANSITION_INVALID")
run("reviewers[] skips a lifecycle step -> STATUS_TRANSITION_INVALID", t_status_transition_skip)


def t_malformed_structural_path_index_identity():
    o = valid_mapping_verified()
    o["candidate_structural_path"] = [
        {"collection": "civil", "path": [0, 1], "evidence": "derived_from_provision"}
    ]
    _assert_has(codes(o), "STRUCTURAL_PATH_INDEX_IDENTITY")
run("structural path element is an array index -> STRUCTURAL_PATH_INDEX_IDENTITY",
    t_malformed_structural_path_index_identity)


def t_structural_path_unknown_collection():
    o = valid_mapping_verified()
    o["candidate_structural_path"] = [
        {"collection": "not_a_real_collection", "path": ["x"], "evidence": "derived_from_provision"}
    ]
    _assert_has(codes(o), "STRUCTURAL_PATH_COLLECTION_UNKNOWN")
run("structural path collection not in registry -> STRUCTURAL_PATH_COLLECTION_UNKNOWN",
    t_structural_path_unknown_collection)


def t_structural_path_evidence_wrong():
    o = valid_mapping_verified()
    o["candidate_structural_path"][0]["evidence"] = "agent_authored"
    _assert_has(codes(o), "STRUCTURAL_PATH_EVIDENCE")
run("hand-authored structural path evidence -> STRUCTURAL_PATH_EVIDENCE",
    t_structural_path_evidence_wrong)


def t_promotion_not_allowed():
    o = valid_mapping_verified()
    o["promoted_case_id"] = "some-public-case-2560"
    _assert_has(codes(o), "PROMOTION_NOT_ALLOWED")
run("promoted_case_id set while status != promoted -> PROMOTION_NOT_ALLOWED",
    t_promotion_not_allowed)


def t_citation_verified_requires_citation():
    o = valid_base()
    o["status"] = "citation_verified"
    o["factual_summary"] = "x"; o["legal_issue"] = "x"
    o["reviewers"] = [
        {"by": "t", "at": "d", "from_status": "candidate", "to_status": "source_verified"},
        {"by": "t", "at": "d", "from_status": "source_verified", "to_status": "citation_verified"},
    ]
    _assert_has(codes(o), "REQUIRES_CITATION")
run("citation_verified without claimed_citation.case_number -> REQUIRES_CITATION",
    t_citation_verified_requires_citation)


def t_schema_version_unknown():
    o = valid_base(); o["schema_version"] = "9.9"
    _assert_has(codes(o), "SCHEMA_VERSION_UNKNOWN")
run("unknown schema_version -> SCHEMA_VERSION_UNKNOWN", t_schema_version_unknown)


def t_not_an_object():
    _cid, findings = cv.validate_candidate([1, 2, 3], CONTRACT)
    assert any(f.code == "NOT_AN_OBJECT" for f in findings), "expected NOT_AN_OBJECT"
run("top-level array -> NOT_AN_OBJECT", t_not_an_object)


# ================================================================
# The tool must not have touched the public corpus
# ================================================================
def t_no_public_writes():
    # a paranoid check: importing + running the validator created nothing new
    # under prototype/assets/cases/
    repo = os.path.dirname(HERE)
    cases = os.path.join(repo, "prototype", "assets", "cases")
    before = set(os.listdir(cases))
    cv.validate_candidate(valid_mapping_verified(), CONTRACT)
    after = set(os.listdir(cases))
    assert before == after, "validator changed prototype/assets/cases/ listing"
run("validator does not write to prototype/assets/cases/", t_no_public_writes)


# ================================================================
print("\n  %d passed, %d failed" % (_pass, _fail))
sys.exit(1 if _fail else 0)
