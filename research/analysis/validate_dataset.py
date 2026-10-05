#!/usr/bin/env python3
"""Schema-integrity validator for the Lost in Translation research dataset (schema 0.2).

Read-only. Exit code 0 = no errors (warnings allowed), 1 = errors. Stdlib only.
Usage: python validate_dataset.py [--root <research dir>]
"""
import argparse
import csv
import hashlib
import json
import re
import sys
from pathlib import Path

SOURCE_FIELDS = ("source_version", "coverage_status", "translation_status",
                 "authority_status", "currency_status", "traceability_status")


def load_table(root, spec):
    path = root / spec["file"]
    if not path.exists():
        return None, [f"{spec['file']}: file missing"]
    raw = path.read_bytes()
    errs = []
    if raw.startswith(b"\xef\xbb\xbf"):
        errs.append(f"{spec['file']}: UTF-8 BOM present (must be BOM-free)")
    text = raw.decode("utf-8-sig")
    # csv module only; values stay strings (section ids are never coerced)
    reader = csv.DictReader(text.splitlines(), restkey="__extra__")
    return (reader.fieldnames, list(reader)), errs


def tool_of(actor):
    return actor.split(":", 1)[0].strip().lower()


def derive_independence(p1, p2):
    """A = different tool (or human/conductor Pass 2); B = same tool family, different run; C = same run."""
    if p1.strip().lower() == p2.strip().lower():
        return "C"
    t1, t2 = tool_of(p1), tool_of(p2)
    if t2 in ("human", "conductor") or t1 != t2:
        return "A"
    return "B"


def check_verification(where, r, high_impact, errors, warnings):
    """Pass 1 = extraction, Pass 2 = independent verification, dispute = Conductor."""
    p1, p2 = r["pass1_extractor"].strip(), r["pass2_verifier"].strip()
    outcome = r["verification_outcome"]
    prov = r.get("provenance_status") or r.get("verification")
    if outcome == "disputed" and prov == "verified":
        errors.append(f"{where}: disputed record cannot be 'verified'")
    if outcome == "adjudicated" and not r["conductor_review"].strip():
        errors.append(f"{where}: outcome=adjudicated requires conductor_review")
    declared = r["verification_independence"].strip()
    if p2:
        derived = derive_independence(p1, p2)
        if not declared:
            errors.append(f"{where}: verification_independence required when pass2_verifier is set (derived {derived})")
        elif declared != derived:
            errors.append(f"{where}: verification_independence={declared} but actors imply {derived} (A = different tool/human, B = same tool family independent run, C = same run/self-check)")
    elif declared:
        errors.append(f"{where}: verification_independence set without pass2_verifier")
    # C (same run / self-check) is a valid, storable provenance value; it is only an error when
    # it is *used as* independent Pass 2 (counted toward 'verified' or an 'agreed' outcome).
    counted_as_pass2 = prov == "verified" or outcome == "agreed"
    if p2 and counted_as_pass2:
        ind = derive_independence(p1, p2)
        if ind == "C":
            errors.append(f"{where}: independence C (same run / self-check) cannot count as independent Pass 2 (provenance_status={prov}, outcome={outcome})")
        elif ind == "B":
            warnings.append(f"{where}: Pass 2 is same-family verification (independence B, tool '{tool_of(p1)}'): independent run but not an independent model/tool")
    if prov == "verified":
        if not (p1 and p2):
            errors.append(f"{where}: 'verified' requires pass1_extractor and pass2_verifier")
        if outcome not in ("agreed", "adjudicated"):
            errors.append(f"{where}: 'verified' requires verification_outcome agreed|adjudicated, got {outcome!r}")
        if high_impact and not r["conductor_review"].strip():
            errors.append(f"{where}: high-impact record (official / full_code) requires conductor_review")


def validate(root):
    root = Path(root)
    schema = json.loads((root / "methodology/schemas/master-dataset.schema.json").read_text(encoding="utf-8"))
    vocab, patterns = schema["vocab"], schema["patterns"]
    errors, warnings, tables = [], [], {}

    state_path = root / "sources/protocol_state.json"
    state = json.loads(state_path.read_text(encoding="utf-8")) if state_path.exists() else None
    if state is None:
        errors.append("sources/protocol_state.json: missing")
        state = {"venues_frozen": False, "search_completed": {}}

    for name, spec in schema["tables"].items():
        loaded, errs = load_table(root, spec)
        errors += errs
        if loaded is None:
            continue
        header, rows = loaded
        expected = list(spec["fields"])
        if header != expected:
            errors.append(f"{spec['file']}: header mismatch; expected {expected}, got {header}")
            continue
        tables[name] = rows
        keyf = spec["key"] if isinstance(spec["key"], list) else [spec["key"]]
        seen = set()
        for i, row in enumerate(rows, start=2):
            where = f"{spec['file']}:{i}"
            if "__extra__" in row:
                errors.append(f"{where}: more cells than header columns")
            for f, rule in spec["fields"].items():
                v = (row.get(f) or "").strip()
                if rule.get("required") and not v:
                    errors.append(f"{where}: '{f}' is required")
                    continue
                if not v:
                    continue
                if "enum" in rule and v not in vocab[rule["enum"]] and v not in rule.get("allow", []):
                    errors.append(f"{where}: '{f}'={v!r} not in vocab '{rule['enum']}'")
                pat = rule.get("pattern") or (patterns[rule["pattern_ref"]] if "pattern_ref" in rule else None)
                if pat and not re.match(pat, v):
                    errors.append(f"{where}: '{f}'={v!r} fails pattern {pat}")
            key = tuple(row.get(k, "") for k in keyf)
            if key in seen:
                errors.append(f"{where}: duplicate key {key}")
            seen.add(key)

    # foreign keys (single and ';'-separated)
    for name, spec in schema["tables"].items():
        if name not in tables:
            continue
        for f, rule in spec["fields"].items():
            ref = rule.get("fk") or rule.get("fk_multi")
            if not ref:
                continue
            tname, tfield = ref.split(".")
            if tname not in tables:
                continue
            valid = {r[tfield] for r in tables[tname]}
            for i, row in enumerate(tables[name], start=2):
                raw = (row.get(f) or "").strip()
                vals = [x.strip() for x in raw.split(";")] if "fk_multi" in rule else [raw]
                for v in vals:
                    if v and v not in valid:
                        errors.append(f"{spec['file']}:{i}: '{f}'={v!r} not found in {ref}")

    reg = {r["source_id"]: r for r in tables.get("source_register", [])}

    # ---- source_register rules
    fam = {}
    for i, r in enumerate(tables.get("source_register", []), start=2):
        w = f"sources/source_register.csv:{i}"
        if r["provenance_status"] != "unverified" and not r["evidence_location"].strip():
            errors.append(f"{w}: provenance_status={r['provenance_status']} requires evidence_location")
        if r["authority_status"] == "official":
            if not r["authority_evidence"].strip():
                errors.append(f"{w}: authority_status=official requires explicit authority_evidence (government_published is NOT official)")
            if r["provenance_status"] == "unverified":
                errors.append(f"{w}: authority_status=official cannot be unverified")
        if r["raw_file_sha256"] and not r["date_accessed"]:
            errors.append(f"{w}: raw_file_sha256 set but date_accessed empty")
        high = r["authority_status"] == "official" or r["coverage"] == "full_code"
        check_verification(w, r, high, errors, warnings)
        if r["source_family_id"]:
            k = (r["source_family_id"], r["source_version"])
            if k in fam:
                errors.append(f"{w}: family/version {k} already used by {fam[k]} (identical reprint = same source; revision = new version)")
            fam[k] = r["source_id"]
    sig = {}
    for r in tables.get("source_register", []):
        s = tuple(re.sub(r"\W+", "", r[k].lower()) for k in ("title", "translator", "publisher", "publication_year", "source_version"))
        if s in sig and "unknown" not in r["title"].lower():
            errors.append(f"possible duplicate sources {sig[s]} and {r['source_id']} (same title/translator/publisher/year/version)")
        sig[s] = r["source_id"]

    # ---- per-claim Pass 1 / Pass 2 provenance (kept separate; Pass 1 evidence is never overwritten)
    claims_by_src = {}
    for i, c in enumerate(tables.get("verification_claims", []), start=2):
        w = f"sources/verification_claims.csv:{i}"
        claims_by_src.setdefault(c["source_id"], []).append(c)
        derived = derive_independence(c["pass1_extractor"], c["pass2_verifier"])
        if c["verification_independence"] != derived:
            errors.append(f"{w}: verification_independence={c['verification_independence']} but actors imply {derived}")
        if c["result"] in ("rejected", "unresolved") and c["resolution_status"] == "none":
            errors.append(f"{w}: result={c['result']} requires resolution_status other than 'none' (conflicts are kept and tracked)")
        if c["result"] in ("confirmed", "not_stated") and c["resolution_status"] not in ("none", "resolved_by_evidence"):
            errors.append(f"{w}: result={c['result']} must not carry an open resolution_status")
        if c["result"] == "rejected" and not c["notes"].strip():
            errors.append(f"{w}: rejected claim requires notes (what the evidence shows)")
    for sid, s in reg.items():
        cl = claims_by_src.get(sid, [])
        if s["provenance_status"] == "verified":
            if not cl:
                errors.append(f"source {sid}: 'verified' requires recorded per-claim Pass 2 results (verification_claims)")
            bad = [c["claim_id"] for c in cl if c["result"] == "unresolved"
                   or (c["result"] == "rejected" and c["resolution_status"] != "resolved_by_evidence")
                   or c["resolution_status"] in ("open", "conductor_pending")]
            if bad:
                errors.append(f"source {sid}: 'verified' but claims remain rejected/unresolved/open: {bad}")
            if any(derive_independence(c["pass1_extractor"], c["pass2_verifier"]) == "C" for c in cl):
                errors.append(f"source {sid}: 'verified' relies on a C (same-run/self-check) claim")
        if s["verification_outcome"] == "agreed" and any(c["resolution_status"] == "conductor_pending" for c in cl):
            errors.append(f"source {sid}: verification_outcome=agreed but a claim awaits Conductor adjudication (should be 'disputed')")
        if s["verification_outcome"] == "disputed" and cl and not any(c["resolution_status"] in ("conductor_pending", "open") or c["result"] == "rejected" for c in cl):
            errors.append(f"source {sid}: verification_outcome=disputed but no claim records a dispute")

    # ---- leads <-> sources (prior findings are preserved, never silently dropped)
    leads = {r["lead_id"]: r for r in tables.get("leads", [])}
    for i, r in enumerate(tables.get("leads", []), start=2):
        w = f"sources/leads.csv:{i}"
        res = r["resolution"]
        if res in ("confirmed", "partially_confirmed", "corrected") and not r["resolved_source_ids"].strip():
            errors.append(f"{w}: resolution={res} requires resolved_source_ids")
        if res == "rejected" and not r["evidence"].strip():
            errors.append(f"{w}: a lead may be 'rejected' only with positive evidence; failure to find is 'unresolved'")
        for sid in [x.strip() for x in r["resolved_source_ids"].split(";") if x.strip()]:
            s = reg.get(sid)
            if s and r["lead_id"] not in [x.strip() for x in s["lead_ids"].split(";")]:
                errors.append(f"{w}: resolved source {sid} does not list {r['lead_id']} in lead_ids")
    for sid, s in reg.items():
        w = f"source {sid}"
        ids = [x.strip() for x in s["lead_ids"].split(";") if x.strip()]
        if s["origin"] == "prior_lead" and not ids:
            errors.append(f"{w}: origin=prior_lead requires lead_ids")
        for lid in ids:
            ld = leads.get(lid)
            if ld and sid not in [x.strip() for x in ld["resolved_source_ids"].split(";")]:
                errors.append(f"{w}: lists {lid} but that lead's resolved_source_ids does not include it")

    # ---- coverage rules (one-to-many Code coverage lives here, never via duplicate sources)
    cov_by_src = {}
    for i, r in enumerate(tables.get("source_coverage", []), start=2):
        w = f"sources/source_coverage.csv:{i}"
        cov_by_src.setdefault(r["source_id"], []).append(r)
        if r["unit_type"] == "whole_code" and (r["unit_from"] or r["unit_to"]):
            errors.append(f"{w}: whole_code must not have unit_from/unit_to")
        if r["unit_type"] != "whole_code" and not r["unit_from"]:
            errors.append(f"{w}: unit_from required for unit_type={r['unit_type']}")
        if r["unit_type"] in ("single_section", "section_range"):
            for f in ("unit_from", "unit_to"):
                if r[f] and not re.match(patterns["section_label"], r[f]):
                    errors.append(f"{w}: {f}={r[f]!r} is not a valid section label (strings only, e.g. '1', '1/1')")
        if r["unit_type"] == "single_section" and r["unit_to"] and r["unit_to"] != r["unit_from"]:
            errors.append(f"{w}: single_section must not have a different unit_to")
        # row-level B notices are not repeated per coverage row; the source-level warning carries them
        check_verification(w, r, r["coverage_status"] == "full_code", errors, [])
    for sid, src in reg.items():
        rows = cov_by_src.get(sid, [])
        if src["coverage"] == "full_code" and rows and not any(c["unit_type"] == "whole_code" for c in rows):
            errors.append(f"{sid}: summary coverage=full_code but no whole_code coverage row")
        codes = {c["code"] for c in rows}
        if src["code"] == "MULTI":
            if rows and len(codes) < 2:
                errors.append(f"{sid}: code=MULTI but coverage rows span only {sorted(codes)}")
        elif codes - {src["code"]}:
            errors.append(f"{sid}: coverage rows for other codes {sorted(codes - {src['code']})} but code={src['code']} (use MULTI, not a duplicate source)")

    # ---- venues, deviations, protocol gate
    devs = {r["deviation_id"]: r for r in tables.get("protocol_deviations", [])}
    ven = {r["venue_id"]: r for r in tables.get("search_venues", [])}
    frozen = bool(state.get("venues_frozen"))
    for i, r in enumerate(tables.get("search_venues", []), start=2):
        w = f"sources/search_venues.csv:{i}"
        if r["venue_status"] == "frozen" and not (r["date_checked"] and r["frozen_in_protocol_version"]):
            errors.append(f"{w}: frozen venue requires date_checked and frozen_in_protocol_version")
        if frozen and r["venue_status"] == "proposed":
            errors.append(f"{w}: venues are frozen but this venue is still 'proposed' (add via protocol_deviations or withdraw)")
        if frozen and r["venue_status"] == "frozen" and r["deviation_id"]:
            errors.append(f"{w}: venue added by deviation must not claim the original freeze")
        if r["deviation_id"]:
            d = devs.get(r["deviation_id"])
            if d and d["venue_id"] != r["venue_id"]:
                errors.append(f"{w}: deviation {r['deviation_id']} refers to {d['venue_id']}")
        vs = r["verification_status"]
        if vs in ("verified", "verified_redirected") and not r["verified_date"]:
            errors.append(f"{w}: verification_status={vs} requires verified_date")
        if vs not in ("verified", "verified_redirected") and r["verified_date"]:
            errors.append(f"{w}: verified_date set but verification_status={vs}")
        if vs != "not_verified" and not r["verification_evidence"].strip():
            errors.append(f"{w}: verification_status={vs} requires verification_evidence")
        if r["venue_status"] == "frozen" and vs in ("not_verified", "unreachable"):
            errors.append(f"{w}: cannot freeze a venue with verification_status={vs}")
        if r["venue_status"] == "frozen" and r["proposed_disposition"] in ("drop", "merge"):
            errors.append(f"{w}: cannot freeze a venue whose proposed_disposition={r['proposed_disposition']}")
        if r["proposed_disposition"] in ("drop", "merge") and r["venue_status"] == "proposed":
            errors.append(f"{w}: proposed_disposition={r['proposed_disposition']} requires venue_status=withdrawn")
        if r["venue_status"] == "withdrawn" and not r["notes"].strip():
            errors.append(f"{w}: withdrawn venue requires notes with the reason")
    if frozen and not state.get("venues_frozen_date"):
        errors.append("protocol_state.json: venues_frozen=true requires venues_frozen_date")
    for code, done in (state.get("search_completed") or {}).items():
        if done and not frozen:
            errors.append(f"protocol_state.json: search_completed[{code}]=true but venues not frozen")
    for i, r in enumerate(tables.get("search_log", []), start=2):
        w = f"sources/search_log.csv:{i}"
        if not frozen:
            errors.append(f"{w}: search recorded before venue list is frozen (protocol_state.venues_frozen=false)")
        v = ven.get(r["venue_id"])
        if v:
            if v["category"] != r["category"]:
                errors.append(f"{w}: category {r['category']} != venue category {v['category']}")
            if v["venue_status"] != "frozen" and not r["deviation_id"]:
                errors.append(f"{w}: venue {r['venue_id']} is not frozen and no deviation_id recorded")
        if r["outcome"] == "hit" and not r["source_ids"].strip():
            errors.append(f"{w}: outcome=hit requires source_ids")

    # ---- section grid + article level
    grid = {(r["code"], r["section"]) for r in tables.get("section_grid", [])}

    # ---- Thai authoritative corpus (versioned independently of the venue freeze)
    tc_path = root / "sources/thai_corpus_state.json"
    tstate = json.loads(tc_path.read_text(encoding="utf-8")) if tc_path.exists() else None
    if tstate is None:
        errors.append("sources/thai_corpus_state.json: missing")
        tstate = {"corpora": {}}
    corp = tstate.get("corpora", {})
    tcreg = {(r["code"], r["corpus_version"]): r for r in tables.get("thai_corpus_register", [])}
    for i, r in enumerate(tables.get("thai_corpus_register", []), start=2):
        w = f"sources/thai_corpus_register.csv:{i}"
        if not r["corpus_version"].startswith(f"TCV-{r['code']}-"):
            errors.append(f"{w}: corpus_version {r['corpus_version']} does not belong to code {r['code']}")
        if r["status"] in ("acquired", "frozen"):
            for f in ("retrieval_date", "raw_file", "sha256", "as_of_date"):
                if not r[f].strip():
                    errors.append(f"{w}: status={r['status']} requires {f}")
        if r["status"] == "frozen" and not r["frozen_date"]:
            errors.append(f"{w}: status=frozen requires frozen_date")
        if r["status"] == "superseded" and not r["superseded_by"]:
            errors.append(f"{w}: status=superseded requires superseded_by")
        if r["raw_file"]:
            p = root / "sources/thai_corpus" / r["raw_file"]
            if not p.exists():
                errors.append(f"{w}: raw_file {r['raw_file']} missing from sources/thai_corpus")
            elif r["sha256"] and hashlib.sha256(p.read_bytes()).hexdigest() != r["sha256"]:
                errors.append(f"{w}: SHA-256 mismatch for {r['raw_file']} (raw Thai corpus file modified?)")
    for code, st in corp.items():
        if st.get("frozen"):
            row = tcreg.get((code, st.get("corpus_version")))
            if not st.get("corpus_version") or row is None or row["status"] != "frozen":
                errors.append(f"thai_corpus_state.json: {code} frozen=true requires corpus_version with a register row of status 'frozen'")
    recon = tables.get("section_grid_reconciliation", [])
    for i, r in enumerate(recon, start=2):
        w = f"sources/section_grid_reconciliation.csv:{i}"
        if (r["code"], r["thai_corpus_version"]) not in tcreg:
            errors.append(f"{w}: thai_corpus_version {r['thai_corpus_version']} not in thai_corpus_register")
        elif not r["thai_corpus_version"].startswith(f"TCV-{r['code']}-"):
            errors.append(f"{w}: corpus version does not belong to code {r['code']}")
        in_grid = (r["code"], r["section"]) in grid
        reconciled = "RECONCILED" in {x["grid_status"] for x in tables.get("section_grid", []) if x["code"] == r["code"]}
        if not reconciled and (r["atlas_present"] == "yes") != in_grid:
            errors.append(f"{w}: atlas_present={r['atlas_present']} contradicts the PROXY section_grid (section {'present' if in_grid else 'absent'})")
        if reconciled and in_grid != (r["authoritative_present"] == "yes"):
            errors.append(f"{w}: RECONCILED grid must equal the authoritative corpus (in_grid={in_grid}, authoritative_present={r['authoritative_present']})")
        s, a, ap = r["status"], r["authoritative_present"], r["atlas_present"]
        if s == "MATCH" and not (ap == "yes" and a == "yes"):
            errors.append(f"{w}: MATCH requires atlas_present=yes and authoritative_present=yes")
        if s == "MISSING_FROM_ATLAS" and not (ap == "no" and a == "yes"):
            errors.append(f"{w}: MISSING_FROM_ATLAS requires atlas_present=no and authoritative_present=yes")
        if s == "EXTRA_IN_ATLAS" and not (ap == "yes" and a == "no"):
            errors.append(f"{w}: EXTRA_IN_ATLAS requires atlas_present=yes and authoritative_present=no")
        if s == "UNCERTAIN" and a != "unknown" and not r["notes"].strip():
            errors.append(f"{w}: UNCERTAIN requires notes explaining the uncertainty")
        if a == "yes" and not r["authoritative_source"].strip():
            errors.append(f"{w}: authoritative_present=yes requires authoritative_source")
    gstat = {}
    for r in tables.get("section_grid", []):
        gstat.setdefault(r["code"], set()).add(r["grid_status"])
    for code, ss in gstat.items():
        if len(ss) > 1:
            errors.append(f"section_grid: {code} has mixed grid_status {sorted(ss)}")
        if "RECONCILED" in ss:
            st = corp.get(code, {})
            ver = st.get("corpus_version")
            if not st.get("frozen"):
                errors.append(f"section_grid: {code} RECONCILED but its Thai corpus is not frozen")
            rows = [x for x in recon if x["code"] == code and x["thai_corpus_version"] == ver]
            done = {x["section"] for x in rows}
            missing = {s for (c, s) in grid if c == code} - done
            if missing:
                errors.append(f"section_grid: {code} RECONCILED but {len(missing)} grid sections lack a reconciliation row (e.g. {sorted(missing)[:3]})")
            if any(r["grid_source"].startswith("atlas:") for r in tables.get("section_grid", []) if r["code"] == code):
                errors.append(f"section_grid: {code} RECONCILED but rows still have grid_source 'atlas:*' (a reconciled grid must be rebuilt from the Thai corpus, not relabelled)")
            if any(x["status"] == "UNCERTAIN" for x in rows):
                errors.append(f"section_grid: {code} RECONCILED but UNCERTAIN reconciliation rows remain")
            if any(x["status"] in ("MISSING_FROM_ATLAS", "EXTRA_IN_ATLAS", "RENAMED") for x in rows):
                warnings.append(f"section_grid: {code} RECONCILED with divergences recorded in section_grid_reconciliation (grid is not changed silently; review)")
    for i, r in enumerate(tables.get("article_level", []), start=2):
        w = f"corpus/article_level.csv:{i}"
        st = r["search_status"]
        if r["audit_date"] and r["audit_status"] in ("", "not_audited"):
            errors.append(f"{w}: audit_date requires audit_status other than not_audited")
        if r["previous_translation_source_id"] and r["previous_translation_source_id"] == r["english_source_id"]:
            errors.append(f"{w}: previous_translation_source_id must differ from english_source_id")
        if grid and (r["code"], r["section"]) not in grid:
            errors.append(f"{w}: section {r['section']!r} not in section_grid for {r['code']}")
        if st == "IDENTIFIED":
            for f in ("english_source_id", "english_text_available") + SOURCE_FIELDS:
                if not r[f].strip():
                    errors.append(f"{w}: IDENTIFIED requires '{f}'")
            s = reg.get(r["english_source_id"])
            if s and s["source_version"] != r["source_version"]:
                errors.append(f"{w}: source_version {r['source_version']} != register version {s['source_version']}")
        else:
            if r["english_source_id"].strip() or any(r[f].strip() for f in SOURCE_FIELDS):
                errors.append(f"{w}: {st} rows must have empty english_source_id and source-specific fields")
            if st == "NOT_ASSESSED" and r["english_text_available"].strip():
                errors.append(f"{w}: NOT_ASSESSED must have empty english_text_available")
            if st == "NONE_IDENTIFIED":
                if r["english_text_available"] != "no":
                    errors.append(f"{w}: NONE_IDENTIFIED requires english_text_available=no")
                if not state.get("search_completed", {}).get(r["code"]):
                    errors.append(f"{w}: NONE_IDENTIFIED not allowed - systematic search for {r['code']} not marked complete in protocol_state.json")

    # ---- raw artefact integrity (no raw-source modification)
    for i, r in enumerate(tables.get("raw_manifest", []), start=2):
        p = root / "sources/raw" / r["filename"]
        if not p.exists():
            # raw third-party artefacts are kept out of git (see research/.gitignore); the manifest hash still pins them
            warnings.append(f"sources/raw_manifest.csv:{i}: {r['filename']} not present locally (raw files are not committed; restore it to re-verify the hash)")
            continue
        if hashlib.sha256(p.read_bytes()).hexdigest() != r["sha256"]:
            errors.append(f"sources/raw_manifest.csv:{i}: SHA-256 mismatch for {r['filename']} (raw file modified?)")
    listed = {r["filename"] for r in tables.get("raw_manifest", [])}
    raw_dir = root / "sources/raw"
    if raw_dir.exists():
        for p in raw_dir.iterdir():
            if p.is_file() and p.name != ".gitkeep" and p.name not in listed:
                errors.append(f"sources/raw/{p.name}: not in raw_manifest.csv")
    return errors, warnings, {k: len(v) for k, v in tables.items()}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", default=str(Path(__file__).resolve().parents[1]))
    args = ap.parse_args()
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    errors, warnings, counts = validate(args.root)
    print("rows:", counts)
    for w in warnings:
        print("WARN ", w)
    for e in errors:
        print("ERROR", e)
    print("OK" if not errors else f"{len(errors)} error(s)")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
