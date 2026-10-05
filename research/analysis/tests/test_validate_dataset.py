import csv
import hashlib
import json
import shutil
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import build_article_skeleton as bs  # noqa: E402
import validate_dataset as vd  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]


def clone():
    d = Path(tempfile.mkdtemp())
    def ignore(dirpath, names):
        skip = {n for n in names if n in ("tests", "__pycache__")}
        if Path(dirpath).name == "raw":  # big third-party artefacts not needed (missing raw = warning only)
            skip |= {n for n in names if n != ".gitkeep"}
        return skip
    shutil.copytree(ROOT, d / "r", ignore=ignore)
    return d / "r"


def read(r, rel):
    with open(r / rel, newline="", encoding="utf-8") as f:
        rd = csv.DictReader(f)
        return rd.fieldnames, list(rd)


def write(r, rel, cols, rows):
    with open(r / rel, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=cols, lineterminator="\n")
        w.writeheader()
        w.writerows(rows)


def edit(r, rel, fn):
    cols, rows = read(r, rel)
    fn(rows)
    write(r, rel, cols, rows)


def errs(r):
    return vd.validate(r)[0]


def real_warnings(w):
    """Only warnings about the first register row (SRC-0001), the row the Verification tests edit."""
    return [x for x in w if "source_register.csv:2:" in x]


def has(errors, text):
    return any(text in e for e in errors)


def freeze_all(r, code_done=()):
    """Mark every non-withdrawn venue verified+frozen and set the protocol gate (test helper)."""
    def f(rows):
        for x in rows:
            if x["venue_status"] == "withdrawn":
                continue
            x.update(venue_status="frozen", date_checked="2026-10-06", frozen_in_protocol_version="1.0",
                     verification_status="verified", verified_date="2026-10-06",
                     verification_evidence="test", proposed_disposition="include")
    edit(r, "sources/search_venues.csv", f)
    st = json.loads((r / "sources/protocol_state.json").read_text(encoding="utf-8"))
    st.update(venues_frozen=True, venues_frozen_date="2026-10-06")
    for c in code_done:
        st["search_completed"][c] = True
    (r / "sources/protocol_state.json").write_text(json.dumps(st), encoding="utf-8")


def new_source(r, sid, **kw):
    cols, rows = read(r, "sources/source_register.csv")
    base = dict(rows[0])
    base.update(source_id=sid, title=f"Title {sid}", translator="T", publisher="P", publication_year="2001")
    base.update(kw)
    write(r, "sources/source_register.csv", cols, rows + [base])


class Dataset(unittest.TestCase):
    def test_committed_dataset_is_clean(self):
        self.assertEqual(errs(ROOT), [])

    def test_bad_enum(self):
        r = clone()
        edit(r, "sources/source_register.csv", lambda rows: rows[0].update(authority_status="bogus"))
        self.assertTrue(has(errs(r), "authority_status"))

    def test_fk(self):
        r = clone()
        cols, _ = read(r, "sources/source_coverage.csv")
        row = dict.fromkeys(cols, "")
        row.update(coverage_id="COV-0001", source_id="SRC-9999", code="CCC", unit_type="book", unit_from="Book 1",
                   coverage_status="partial", verification="unverified", verification_outcome="pending")
        write(r, "sources/source_coverage.csv", cols, [row])
        self.assertTrue(has(errs(r), "SRC-9999"))

    def test_missing_raw_file_is_warning_not_error(self):
        r = clone()
        for p in (r / "sources/raw").iterdir():
            if p.name != ".gitkeep":
                p.unlink()
        e, w, _ = vd.validate(r)
        self.assertEqual(e, [])
        self.assertTrue(any("not present locally" in x for x in w))

    def test_raw_unlisted_file(self):
        r = clone()
        (r / "sources/raw/x.pdf").write_bytes(b"abc")
        self.assertTrue(has(errs(r), "not in raw_manifest"))

    def test_raw_tamper(self):
        r = clone()
        (r / "sources/raw/x.pdf").write_bytes(b"abc")
        write(r, "sources/raw_manifest.csv", ["filename", "source_id", "sha256", "bytes", "added_on"],
              [dict(filename="x.pdf", source_id="SRC-0001", sha256=hashlib.sha256(b"abc").hexdigest(), bytes="3", added_on="2026-10-05")])
        self.assertEqual(errs(r), [])
        (r / "sources/raw/x.pdf").write_bytes(b"abd")
        self.assertTrue(has(errs(r), "SHA-256 mismatch"))


class MultiCodeAndCoverage(unittest.TestCase):
    def cov(self, r, rows):
        cols, _ = read(r, "sources/source_coverage.csv")
        out = []
        for i, (sid, code, ut, f, t) in enumerate(rows, 1):
            x = dict.fromkeys(cols, "")
            x.update(coverage_id=f"COV-{i:04d}", source_id=sid, code=code, unit_type=ut, unit_from=f, unit_to=t,
                     coverage_status="section_specific", verification="unverified", verification_outcome="pending")
            out.append(x)
        write(r, "sources/source_coverage.csv", cols, out)

    def test_multi_source_single_row_many_codes(self):
        r = clone()
        edit(r, "sources/source_register.csv", lambda rows: rows[0].update(code="MULTI"))
        self.cov(r, [("SRC-0001", "CCC", "single_section", "1/1", ""), ("SRC-0001", "PENAL", "single_section", "2", "")])
        self.assertEqual(errs(r), [])

    def test_single_code_source_cannot_cover_other_code(self):
        r = clone()
        self.cov(r, [("SRC-0001", "PENAL", "single_section", "2", "")])
        self.assertTrue(has(errs(r), "use MULTI"))

    def test_multi_needs_two_codes_once_rows_exist(self):
        r = clone()
        edit(r, "sources/source_register.csv", lambda rows: rows[0].update(code="MULTI"))
        self.cov(r, [("SRC-0001", "CCC", "single_section", "1", "")])
        self.assertTrue(has(errs(r), "MULTI"))

    def test_single_section_and_amendment_only_are_valid_no_threshold(self):
        r = clone()
        self.cov(r, [("SRC-0001", "CCC", "single_section", "1/2", "")])
        self.assertEqual(errs(r), [])

    def test_section_ids_are_strings_not_integers(self):
        r = clone()
        self.cov(r, [("SRC-0001", "CCC", "single_section", "01", "")])
        self.assertTrue(has(errs(r), "valid section label"))
        self.cov(r, [("SRC-0001", "CCC", "section_range", "1/1", "1/2")])
        self.assertEqual(errs(r), [])


class Authority(unittest.TestCase):
    def test_official_requires_explicit_evidence(self):
        r = clone()
        edit(r, "sources/source_register.csv", lambda rows: rows[0].update(
            authority_status="official", provenance_status="partially_verified"))
        self.assertTrue(has(errs(r), "authority_evidence"))

    def test_government_published_needs_no_official_evidence(self):
        r = clone()
        edit(r, "sources/source_register.csv", lambda rows: rows[0].update(authority_status="government_published"))
        self.assertEqual(errs(r), [])


class Verification(unittest.TestCase):
    def verified(self, **kw):
        r = clone()
        base = dict(provenance_status="verified", evidence_location="raw/x.pdf p.1",
                    pass1_extractor="claude:run1", pass2_verifier="gemini:run7", verification_independence="A",
                    verification_outcome="agreed")
        base.update(kw)
        edit(r, "sources/source_register.csv", lambda rows: rows[0].update(base))
        if base["provenance_status"] == "verified" and base["pass2_verifier"]:
            cols, rows = read(r, "sources/verification_claims.csv")
            c = dict.fromkeys(cols, "")
            c.update(claim_id="VC-9001", source_id="SRC-0001", field="title", pass1_value="t", pass2_value="t", result="confirmed",
                     pass1_extractor=base["pass1_extractor"], pass2_verifier=base["pass2_verifier"],
                     verification_independence=vd.derive_independence(base["pass1_extractor"], base["pass2_verifier"]),
                     verified_date="2026-10-06", evidence="test", resolution_status="none")
            write(r, "sources/verification_claims.csv", cols, [x for x in rows if x["source_id"] != "SRC-0001"] + [c])
        return r

    def test_independent_pass2_ok(self):
        self.assertEqual(errs(self.verified()), [])

    def test_independence_C_same_run_cannot_verify(self):
        e = errs(self.verified(pass2_verifier="claude:run1", verification_independence="C"))
        self.assertTrue(has(e, "cannot count as independent Pass 2"))

    def test_same_run_cannot_be_declared_A_or_B(self):
        for decl in ("A", "B"):
            self.assertTrue(has(errs(self.verified(pass2_verifier="claude:run1", verification_independence=decl)), "actors imply C"))

    def test_independence_B_is_allowed_but_warns(self):
        r = self.verified(pass2_verifier="claude:run2", verification_independence="B")
        e, w, _ = vd.validate(r)
        self.assertEqual(e, [])
        self.assertTrue(any("same-family" in x for x in w))

    def test_same_family_cannot_be_declared_A(self):
        self.assertTrue(has(errs(self.verified(pass2_verifier="claude:run2", verification_independence="A")), "actors imply B"))

    def test_independence_A_has_no_warning(self):
        e, w, _ = vd.validate(self.verified())
        self.assertEqual((e, real_warnings(w)), ([], []))

    def test_human_pass2_is_A(self):
        r = self.verified(pass2_verifier="human:reviewer", verification_independence="A")
        self.assertEqual(errs(r), [])

    def test_independence_required_when_pass2_set(self):
        self.assertTrue(has(errs(self.verified(verification_independence="")), "verification_independence required"))

    def test_C_self_check_only_is_valid_and_storable(self):
        r = self.verified(provenance_status="unverified", evidence_location="PENDING", pass2_verifier="claude:run1",
                          verification_independence="C", verification_outcome="pending")
        e, w, _ = vd.validate(r)
        self.assertEqual((e, real_warnings(w)), ([], []))

    def test_C_self_check_with_disputed_or_adjudicated_outcome_is_not_an_error(self):
        for outcome, review in (("disputed", ""), ("adjudicated", "Conductor 2026-10-06")):
            r = self.verified(provenance_status="partially_verified", pass2_verifier="claude:run1",
                              verification_independence="C", verification_outcome=outcome, conductor_review=review)
            self.assertEqual(errs(r), [], outcome)

    def test_C_used_as_independent_pass2_is_error(self):
        # counted as 'verified'
        e = errs(self.verified(pass2_verifier="claude:run1", verification_independence="C"))
        self.assertTrue(has(e, "cannot count as independent Pass 2"))
        # counted as an 'agreed' Pass 2 outcome even without 'verified'
        r = self.verified(provenance_status="partially_verified", pass2_verifier="claude:run1",
                          verification_independence="C", verification_outcome="agreed")
        self.assertTrue(has(errs(r), "cannot count as independent Pass 2"))

    def test_declared_value_must_match_derived(self):
        cases = [("claude:run1", "gemini:run7", "B", "actors imply A"),
                 ("claude:run1", "claude:run2", "A", "actors imply B"),
                 ("claude:run1", "claude:run2", "C", "actors imply B"),
                 ("claude:run1", "claude:run1", "A", "actors imply C")]
        for p1, p2, decl, msg in cases:
            r = self.verified(provenance_status="unverified", evidence_location="PENDING", pass1_extractor=p1, pass2_verifier=p2,
                              verification_independence=decl, verification_outcome="pending")
            self.assertTrue(has(errs(r), msg), (p1, p2, decl))

    def test_independence_without_pass2_rejected(self):
        r = clone()
        edit(r, "sources/source_register.csv", lambda rows: rows[0].update(verification_independence="A"))
        self.assertTrue(has(errs(r), "without pass2_verifier"))

    def test_disputed_cannot_be_verified(self):
        self.assertTrue(has(errs(self.verified(verification_outcome="disputed")), "verified"))

    def test_high_impact_needs_conductor(self):
        r = self.verified(authority_status="government_published", coverage="full_code")
        self.assertTrue(has(errs(r), "conductor_review"))
        edit(r, "sources/source_register.csv", lambda rows: rows[0].update(conductor_review="Conductor 2026-10-06"))
        self.assertEqual(errs(r), [])


class VersionModel(unittest.TestCase):
    def test_family_version_unique_reprint_vs_revision(self):
        r = clone()
        edit(r, "sources/source_register.csv", lambda rows: rows[0].update(source_family_id="FAM-0001"))
        new_source(r, "SRC-9002", source_family_id="FAM-0001", source_version="v1")
        self.assertTrue(has(errs(r), "family/version"))
        edit(r, "sources/source_register.csv", lambda rows: rows[-1].update(source_version="v2"))
        self.assertEqual(errs(r), [])


class VenuesAndGate(unittest.TestCase):
    def search_row(self, r, **kw):
        cols, _ = read(r, "sources/search_log.csv")
        x = dict.fromkeys(cols, "")
        x.update(search_id="SRCH-00001", date="2026-10-06", code="CCC", category="C1", venue_id="VEN-002",
                 query="q", language="en", result_count="0", outcome="negative", performer="claude:x")
        x.update(kw)
        write(r, "sources/search_log.csv", cols, [x])

    def test_search_before_freeze_rejected(self):
        r = clone()
        self.search_row(r)
        self.assertTrue(has(errs(r), "before venue list is frozen"))

    def freeze(self, r):
        freeze_all(r)

    def test_search_after_freeze_ok(self):
        r = clone()
        self.freeze(r)
        self.search_row(r)
        self.assertEqual(errs(r), [])

    def test_unfrozen_venue_needs_deviation(self):
        r = clone()
        self.freeze(r)
        edit(r, "sources/search_venues.csv", lambda rows: rows[0].update(venue_status="proposed", proposed_disposition="include"))
        self.search_row(r)
        self.assertTrue(has(errs(r), "still 'proposed'") or has(errs(r), "not frozen"))

    def test_late_venue_must_be_recorded_as_deviation(self):
        r = clone()
        self.freeze(r)
        cols, rows = read(r, "sources/search_venues.csv")
        nv = dict(rows[0]); nv.update(venue_id="VEN-099", venue_status="frozen", deviation_id="DEV-001")
        write(r, "sources/search_venues.csv", cols, rows + [nv])
        self.assertTrue(has(errs(r), "DEV-001"))  # no such deviation row
        dc, _ = read(r, "sources/protocol_deviations.csv")
        write(r, "sources/protocol_deviations.csv", dc, [dict(deviation_id="DEV-001", date="2026-10-07",
              deviation_type="venue_added", venue_id="VEN-099", description="d", reason="r", approved_by="Conductor")])
        self.assertFalse(has(errs(r), "DEV-001"))

    def test_search_completed_requires_freeze(self):
        r = clone()
        st = json.loads((r / "sources/protocol_state.json").read_text(encoding="utf-8"))
        st["search_completed"]["CCC"] = True
        (r / "sources/protocol_state.json").write_text(json.dumps(st), encoding="utf-8")
        self.assertTrue(has(errs(r), "venues not frozen"))


class ArticleStatus(unittest.TestCase):
    def setUp(self):
        self.r = clone()

    def row(self, **kw):
        def f(rows):
            rows[0].update(kw)
        edit(self.r, "corpus/article_level.csv", f)

    def test_not_assessed_default_is_clean(self):
        self.assertEqual(errs(self.r), [])

    def test_none_identified_requires_completed_search(self):
        self.row(search_status="NONE_IDENTIFIED", english_text_available="no")
        self.assertTrue(has(errs(self.r), "not marked complete"))

    def test_none_identified_ok_when_search_complete(self):
        self.row(search_status="NONE_IDENTIFIED", english_text_available="no")
        freeze_all(self.r, code_done=["CCC"])
        self.assertEqual(errs(self.r), [])

    def test_none_is_not_an_id(self):
        self.row(english_source_id="NONE")
        e = errs(self.r)
        self.assertTrue(has(e, "'english_source_id'") and has(e, "not found in source_register"))

    def test_identified_requires_everything(self):
        self.row(search_status="IDENTIFIED")
        self.assertTrue(has(errs(self.r), "IDENTIFIED requires 'english_source_id'"))
        self.row(search_status="IDENTIFIED", english_source_id="SRC-0001", source_version="v1", english_text_available="yes",
                 coverage_status="partial", translation_status="translated", authority_status="unknown",
                 currency_status="unknown", traceability_status="unknown")
        self.assertEqual(errs(self.r), [])

    def test_identified_source_version_must_match_register(self):
        self.row(search_status="IDENTIFIED", english_source_id="SRC-0001", source_version="v2", english_text_available="yes",
                 coverage_status="partial", translation_status="translated", authority_status="unknown",
                 currency_status="unknown", traceability_status="unknown")
        self.assertTrue(has(errs(self.r), "register version"))

    def test_unknown_section_rejected(self):
        self.row(section="999999")
        self.assertTrue(has(errs(self.r), "not in section_grid"))

    def test_repealed_provisions_retained_in_grid(self):
        _, rows = read(ROOT, "corpus/section_grid.csv")
        self.assertTrue(any(x["provision_status"] == "repealed" for x in rows))


class Skeleton(unittest.TestCase):
    def make_codex(self, d):
        arts = lambda labels: {l: {"number": l, "text": "SECRET ATLAS TEXT", "cancelled": l == "3"} for l in labels}
        data = {"books": {"civil": {"articles": arts(["1", "1/1", "2", "3", "193/1", "193/10", "193/2"])},
                          "criminal": {"articles": arts(["1", "2"])},
                          "civpro": {"articles": arts(["4", "4 ตรี", "4 ทวิ"])},
                          "crimpro": {"articles": arts(["172 ทวิ", "172 ทวิ/1", "172"])}}}
        p = d / "codex.json"
        p.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
        return p

    def test_grid_strings_order_repealed_and_no_atlas_text(self):
        d = Path(tempfile.mkdtemp())
        grid = bs.build_grid(self.make_codex(d))
        ccc = [g["section"] for g in grid if g["code"] == "CCC"]
        self.assertEqual(ccc, ["1", "1/1", "2", "3", "193/1", "193/2", "193/10"])  # numeric, not lexical
        self.assertTrue(all(isinstance(g["section"], str) for g in grid))
        self.assertEqual([g["section"] for g in grid if g["code"] == "CIVPRO"], ["4", "4 ทวิ", "4 ตรี"])
        self.assertEqual([g["section"] for g in grid if g["code"] == "CRIMPRO"], ["172", "172 ทวิ", "172 ทวิ/1"])
        self.assertEqual([g["provision_status"] for g in grid if g["code"] == "CCC" and g["section"] == "3"], ["repealed"])
        self.assertNotIn("SECRET", json.dumps(grid))

    def test_unknown_suffix_fails_loudly(self):
        with self.assertRaises(ValueError):
            bs.sort_key("5 XYZ")

    def test_deterministic_and_codex_untouched(self):
        d = Path(tempfile.mkdtemp())
        p = self.make_codex(d)
        before = hashlib.sha256(p.read_bytes()).hexdigest()
        a, b = bs.build_grid(p), bs.build_grid(p)
        self.assertEqual(a, b)
        self.assertEqual(before, hashlib.sha256(p.read_bytes()).hexdigest())

    def test_real_grid_matches_derivation_hash_field(self):
        _, rows = read(ROOT, "corpus/section_grid.csv")
        self.assertEqual(len({x["grid_source_sha256"] for x in rows}), 1)
        self.assertEqual(len(rows), 3089)


class VenueVerification(unittest.TestCase):
    def test_real_venue_list_is_unfrozen_and_verification_fields_present(self):
        _, rows = read(ROOT, "sources/search_venues.csv")
        self.assertTrue(all(x["venue_status"] != "frozen" for x in rows))
        self.assertTrue(all(x["verification_status"] and x["venue_class"] for x in rows))
        self.assertTrue(all(x["verification_evidence"] for x in rows))

    def test_verified_requires_date_and_evidence(self):
        r = clone()
        edit(r, "sources/search_venues.csv", lambda rows: rows[1].update(verified_date="", verification_status="verified"))
        self.assertTrue(has(errs(r), "requires verified_date"))
        edit(r, "sources/search_venues.csv", lambda rows: rows[1].update(verified_date="2026-10-05", verification_evidence=""))
        self.assertTrue(has(errs(r), "requires verification_evidence"))

    def test_cannot_freeze_unreachable_or_unverified(self):
        for vs in ("unreachable", "not_verified"):
            r = clone()
            freeze_all(r)
            edit(r, "sources/search_venues.csv", lambda rows: rows[1].update(
                verification_status=vs, verified_date="", verification_evidence="x" if vs == "unreachable" else ""))
            self.assertTrue(has(errs(r), "cannot freeze a venue"), vs)

    def test_drop_requires_withdrawn(self):
        r = clone()
        edit(r, "sources/search_venues.csv", lambda rows: rows[1].update(proposed_disposition="drop", venue_status="proposed"))
        self.assertTrue(has(errs(r), "requires venue_status=withdrawn"))

    def test_withdrawn_requires_reason(self):
        r = clone()
        edit(r, "sources/search_venues.csv", lambda rows: rows[1].update(proposed_disposition="drop", venue_status="withdrawn", notes=""))
        self.assertTrue(has(errs(r), "withdrawn venue requires notes"))

    def test_withdrawn_venue_cannot_be_searched(self):
        r = clone()
        freeze_all(r)
        _, rows = read(r, "sources/search_venues.csv")
        w = next(x for x in rows if x["venue_status"] == "withdrawn")
        cols, _ = read(r, "sources/search_log.csv")
        row = dict.fromkeys(cols, "")
        row.update(search_id="SRCH-00001", date="2026-10-06", code="CCC", category=w["category"], venue_id=w["venue_id"],
                   query="q", language="en", outcome="negative", performer="claude:x")
        write(r, "sources/search_log.csv", cols, [row])
        self.assertTrue(has(errs(r), "is not frozen"))


TC = "TCV-CCC-001"


def add_corpus(r, status="frozen", sha=None, raw="ccc.txt"):
    if raw and not (r / "sources/thai_corpus" / raw).exists():
        (r / "sources/thai_corpus" / raw).write_bytes(b"thai-corpus-test")
    if sha is None:
        sha = hashlib.sha256((r / "sources/thai_corpus" / raw).read_bytes()).hexdigest()
    cols, _ = read(r, "sources/thai_corpus_register.csv")
    row = dict.fromkeys(cols, "")
    row.update(thai_corpus_id="THC-001", code="CCC", corpus_version=TC, authority_source="test authority",
               source_url_or_reference="ref", retrieval_date="2026-10-06", as_of_date="2026", raw_file=raw, sha256=sha,
               status=status, frozen_date="2026-10-06" if status == "frozen" else "")
    write(r, "sources/thai_corpus_register.csv", cols, [row])


def set_corpus_state(r, frozen, version=TC):
    p = r / "sources/thai_corpus_state.json"
    st = json.loads(p.read_text(encoding="utf-8"))
    st["corpora"]["CCC"] = {"corpus_version": version, "frozen": frozen}
    p.write_text(json.dumps(st), encoding="utf-8")


def recon_rows(r, rows):
    cols, _ = read(r, "sources/section_grid_reconciliation.csv")
    out = []
    for sec, ap, auth, st in rows:
        x = dict.fromkeys(cols, "")
        x.update(code="CCC", section=sec, thai_corpus_version=TC, atlas_present=ap, authoritative_present=auth, status=st,
                 authoritative_source="src" if auth == "yes" else "", notes="n")
        out.append(x)
    write(r, "sources/section_grid_reconciliation.csv", cols, out)


class GridStatusAndThaiCorpus(unittest.TestCase):
    def test_all_real_grids_are_PROXY_and_atlas_sourced(self):
        _, rows = read(ROOT, "corpus/section_grid.csv")
        self.assertEqual({x["grid_status"] for x in rows}, {"PROXY"})
        self.assertTrue(all(x["grid_source"].startswith("atlas:") for x in rows))

    def test_no_thai_corpus_acquired_yet(self):
        st = json.loads((ROOT / "sources/thai_corpus_state.json").read_text(encoding="utf-8"))
        self.assertTrue(all(not v["frozen"] and v["corpus_version"] is None for v in st["corpora"].values()))
        self.assertEqual(read(ROOT, "sources/thai_corpus_register.csv")[1], [])
        self.assertEqual(read(ROOT, "sources/section_grid_reconciliation.csv")[1], [])

    def test_corpus_freeze_independent_of_venue_freeze(self):
        r = clone()
        freeze_all(r)  # venues frozen, corpus not
        self.assertEqual(errs(r), [])
        r2 = clone()
        add_corpus(r2)
        set_corpus_state(r2, True)  # corpus frozen, venues NOT frozen
        self.assertEqual(errs(r2), [])

    def test_state_frozen_requires_register_row(self):
        r = clone()
        set_corpus_state(r, True)
        self.assertTrue(has(errs(r), "frozen=true requires corpus_version"))

    def test_corpus_hash_checked(self):
        r = clone()
        (r / "sources/thai_corpus/ccc.txt").write_bytes(b"abc")
        add_corpus(r, raw="ccc.txt", sha=hashlib.sha256(b"abc").hexdigest())
        self.assertEqual(errs(r), [])
        (r / "sources/thai_corpus/ccc.txt").write_bytes(b"abd")
        self.assertTrue(has(errs(r), "SHA-256 mismatch"))

    def test_recon_requires_registered_corpus_version(self):
        r = clone()
        recon_rows(r, [("1", "yes", "yes", "MATCH")])
        self.assertTrue(has(errs(r), "not in thai_corpus_register"))

    def test_recon_status_consistency(self):
        r = clone()
        add_corpus(r)
        recon_rows(r, [("1", "yes", "yes", "MATCH"), ("2", "yes", "yes", "EXTRA_IN_ATLAS"), ("1/1", "yes", "no", "MATCH")])
        e = errs(r)
        self.assertTrue(has(e, "EXTRA_IN_ATLAS requires"))
        self.assertTrue(has(e, "MATCH requires"))

    def test_recon_atlas_present_must_match_proxy_grid(self):
        r = clone()
        add_corpus(r)
        recon_rows(r, [("1", "no", "yes", "MISSING_FROM_ATLAS")])
        self.assertTrue(has(errs(r), "contradicts the PROXY section_grid"))

    def test_recon_missing_from_atlas_recorded_without_changing_grid(self):
        r = clone()
        add_corpus(r)
        before = (r / "corpus/section_grid.csv").read_bytes()
        recon_rows(r, [("1", "yes", "yes", "MATCH"), ("9999", "no", "yes", "MISSING_FROM_ATLAS")])
        self.assertEqual(errs(r), [])
        self.assertEqual(before, (r / "corpus/section_grid.csv").read_bytes())

    def test_cannot_relabel_proxy_as_reconciled(self):
        r = clone()
        edit(r, "corpus/section_grid.csv", lambda rows: [x.update(grid_status="RECONCILED") for x in rows if x["code"] == "CCC"])
        e = errs(r)
        self.assertTrue(has(e, "RECONCILED but its Thai corpus is not frozen"))
        self.assertTrue(has(e, "lack a reconciliation row"))
        self.assertTrue(has(e, "grid_source 'atlas:*'"))

    def test_mixed_grid_status_rejected(self):
        r = clone()
        edit(r, "corpus/section_grid.csv", lambda rows: rows[0].update(grid_status="RECONCILED"))
        self.assertTrue(has(errs(r), "mixed grid_status"))

    def test_skeleton_builder_refuses_reconciled_grid(self):
        r = clone()
        edit(r, "corpus/section_grid.csv", lambda rows: rows[0].update(grid_status="RECONCILED"))
        argv = sys.argv
        sys.argv = ["x", "--root", str(r), "--codex", str(ROOT.parent / "codex-data.json")]
        try:
            self.assertEqual(bs.main(), 2)
        finally:
            sys.argv = argv


class Src0001(unittest.TestCase):
    def test_src0001_unverified_and_no_fabricated_pdf(self):
        _, rows = read(ROOT, "sources/source_register.csv")
        s = rows[0]
        self.assertEqual((s["source_id"], s["provenance_status"], s["verification_outcome"]), ("SRC-0001", "unverified", "pending"))
        self.assertEqual((s["translator"], s["publisher"], s["publication_year"], s["raw_file_sha256"]), ("unknown", "unknown", "unknown", ""))
        self.assertEqual([m for m in read(ROOT, "sources/raw_manifest.csv")[1] if m["source_id"] == "SRC-0001"], [])
        self.assertFalse([p for p in (ROOT / "sources/raw").iterdir() if p.name.startswith("SRC-0001")])


class Leads(unittest.TestCase):
    def test_conductor_leads_all_preserved_verbatim(self):
        _, rows = read(ROOT, "sources/leads.csv")
        by = {x["lead_id"]: x for x in rows}
        for lid, needle in [("LD-001", "Yale"), ("LD-002", "NHRC"), ("LD-003", "Pinai Nanakorn"), ("LD-004", "Yongyut"),
                            ("LD-005", "Netayasupha"), ("LD-006", "Korea Legislation"), ("LD-007", "ThaiLawOnline"),
                            ("LD-008", "Amendment No. 29"), ("LD-009", "ThaiLawOnline"), ("LD-010", "Leeds"), ("LD-011", "Amendment No. 30")]:
            self.assertIn(needle, by[lid]["lead_text"], lid)
            self.assertEqual(by[lid]["origin"], "conductor_brief")

    def test_no_lead_rejected_merely_for_not_being_found(self):
        _, rows = read(ROOT, "sources/leads.csv")
        self.assertFalse([x for x in rows if x["resolution"] == "rejected"])
        self.assertTrue(all(x["resolution_notes"] for x in rows))

    def test_confirmed_requires_resolved_source(self):
        r = clone()
        edit(r, "sources/leads.csv", lambda rows: next(x for x in rows if x["lead_id"] == "LD-007").update(resolved_source_ids=""))
        self.assertTrue(has(errs(r), "requires resolved_source_ids"))

    def test_rejected_requires_positive_evidence(self):
        r = clone()
        edit(r, "sources/leads.csv", lambda rows: rows[0].update(resolution="rejected", evidence=""))
        self.assertTrue(has(errs(r), "only with positive evidence"))

    def test_lead_source_links_must_be_bidirectional(self):
        r = clone()
        edit(r, "sources/source_register.csv", lambda rows: next(x for x in rows if x["source_id"] == "SRC-0007").update(lead_ids=""))
        e = errs(r)
        self.assertTrue(has(e, "does not list LD-003"))
        self.assertTrue(has(e, "origin=prior_lead requires lead_ids"))

    def test_unresolved_leads_remain_unverified_seeds(self):
        _, regs = read(ROOT, "sources/source_register.csv")
        by = {x["source_id"]: x for x in regs}
        for sid in ("SRC-0007", "SRC-0008", "SRC-0009", "SRC-0016", "SRC-0017", "SRC-0021", "SRC-0025"):
            self.assertEqual((by[sid]["origin"], by[sid]["provenance_status"], by[sid]["authority_status"]),
                             ("prior_lead", "unverified", "unknown"), sid)


class SeedInventoryFacts(unittest.TestCase):
    def setUp(self):
        _, regs = read(ROOT, "sources/source_register.csv")
        self.by = {x["source_id"]: x for x in regs}
        self.regs = regs

    def test_no_source_is_official_and_government_published_is_distinct(self):
        self.assertFalse([x for x in self.regs if x["authority_status"] == "official"])
        self.assertEqual(self.by["SRC-0020"]["authority_status"], "government_published")
        self.assertEqual(self.by["SRC-0020"]["authority_evidence"], "")

    def test_only_two_records_verified_and_none_high_impact(self):
        ver = {x["source_id"] for x in self.regs if x["provenance_status"] == "verified"}
        self.assertEqual(ver, {"SRC-0006", "SRC-0012"})
        for sid in ver:
            self.assertNotEqual(self.by[sid]["coverage"], "full_code")
            self.assertNotEqual(self.by[sid]["authority_status"], "official")

    def test_four_version_dimensions_kept_apart(self):
        s = self.by["SRC-0020"]
        self.assertIn("(No. 30), B.E. 2560", s["last_amending_act"])
        self.assertEqual(s["effective_date"], "2017")
        self.assertEqual(s["publication_year"], "unknown")  # PDF creation date is not a publication date
        self.assertIn("2560", s["thai_version_reference"])

    def test_source_conflict_preserved_not_normalised(self):
        s = self.by["SRC-0015"]
        self.assertEqual(s["publication_year"], "unknown")
        self.assertIn("B.E. 2510 (1977)", s["notes"])

    def test_no_families_invented(self):
        self.assertFalse([x for x in self.regs if x["source_family_id"]])
        self.assertTrue(all(x["source_version"] == "v1" for x in self.regs))

    def test_multi_source_is_single_row_with_four_code_coverage(self):
        self.assertEqual(self.by["SRC-0018"]["code"], "MULTI")
        _, cov = read(ROOT, "sources/source_coverage.csv")
        self.assertEqual({c["code"] for c in cov if c["source_id"] == "SRC-0018"}, {"CCC", "PENAL", "CIVPRO", "CRIMPRO"})
        self.assertEqual(len([x for x in self.regs if "thailawonline.com" in x["source_url_or_bibliographic_reference"]]), 1)

    def test_amendment_only_coverage_uses_string_section_labels(self):
        _, cov = read(ROOT, "sources/source_coverage.csv")
        labs = {c["unit_from"] for c in cov if c["source_id"] == "SRC-0020" and c["unit_type"] == "single_section"}
        self.assertTrue({"169/2", "199 \u0e17\u0e27\u0e34", "222/43", "7"} <= labs)
        self.assertTrue(all(c["coverage_status"] == "amendment_only" for c in cov if c["source_id"] == "SRC-0020"))

    def test_no_translation_gap_claims(self):
        _, art = read(ROOT, "corpus/article_level.csv")
        self.assertEqual({x["search_status"] for x in art}, {"NOT_ASSESSED"})

    def test_raw_manifest_matches_files_when_present(self):
        e, w, _ = vd.validate(ROOT)
        self.assertEqual(e, [])
        self.assertEqual([x for x in w if "same-family" not in x], [])  # all 8 raw files present locally and hash-correct

    def test_thai_text_not_mojibake(self):
        self.assertIn("\u0e1b\u0e23\u0e30\u0e21\u0e27\u0e25\u0e01\u0e0e\u0e2b\u0e21\u0e32\u0e22", self.by["SRC-0002"]["title"])


class ResearchViews(unittest.TestCase):
    def test_coverage_view_one_row_per_coverage_row(self):
        import build_research_view as bv
        cov = bv.coverage_view(ROOT)
        self.assertEqual(len(cov), len(read(ROOT, "sources/source_coverage.csv")[1]))
        row = next(x for x in cov if x["Source ID"] == "SRC-0020" and x["Section"] == "s.169/2")
        self.assertIn("government_published", row["Status"])
        self.assertTrue(row["Current?"].startswith("amendment-only"))

    def test_current_is_never_asserted_without_authoritative_corpus(self):
        import build_research_view as bv
        for x in bv.coverage_view(ROOT):
            self.assertNotIn(x["Current?"], ("current", "yes"))

    def test_article_view_maps_conceptual_fields_by_join(self):
        import build_research_view as bv
        r = clone()
        edit(r, "corpus/article_level.csv", lambda rows: rows[0].update(
            search_status="IDENTIFIED", english_source_id="SRC-0010", source_version="v1", english_text_available="yes",
            coverage_status="full_code", translation_status="translated", authority_status="unknown", currency_status="pre_amendment",
            traceability_status="traceable_to_source", previous_translation_source_id="SRC-0011", audit_status="audited_consistent",
            audit_date="2026-10-06", thai_version="TCV-CCC-001"))
        self.assertEqual(errs(r), [])
        v = bv.article_view(r)
        self.assertEqual(len(v), 1)
        self.assertEqual((v[0]["Code"], v[0]["Section"], v[0]["Previous translation"], v[0]["Audit status"], v[0]["Version"]),
                         ("CCC", "1", "SRC-0011", "audited_consistent", "v1"))
        self.assertIn("reference only", v[0]["Thai authoritative text"])
        self.assertEqual(v[0]["Translator"], "unknown")

    def test_family_history_states_no_families(self):
        import build_research_view as bv
        self.assertIn("None. No source family has been established", bv.family_history(ROOT))

    def test_audit_rules(self):
        r = clone()
        edit(r, "corpus/article_level.csv", lambda rows: rows[0].update(audit_date="2026-10-06"))
        self.assertTrue(has(errs(r), "audit_date requires audit_status"))
        r = clone()
        edit(r, "corpus/article_level.csv", lambda rows: rows[0].update(
            search_status="IDENTIFIED", english_source_id="SRC-0010", source_version="v1", english_text_available="yes",
            coverage_status="full_code", translation_status="translated", authority_status="unknown", currency_status="unknown",
            traceability_status="unknown", previous_translation_source_id="SRC-0010"))
        self.assertTrue(has(errs(r), "must differ from english_source_id"))


class Pass2Results(unittest.TestCase):
    def setUp(self):
        _, regs = read(ROOT, "sources/source_register.csv")
        self.by = {x["source_id"]: x for x in regs}
        _, self.claims = read(ROOT, "sources/verification_claims.csv")
        _, self.cov = read(ROOT, "sources/source_coverage.csv")
        _, self.leads = read(ROOT, "sources/leads.csv")
        self.lead = {x["lead_id"]: x for x in self.leads}

    SIXTEEN = ["SRC-0002", "SRC-0003", "SRC-0004", "SRC-0006", "SRC-0010", "SRC-0011", "SRC-0012", "SRC-0013",
               "SRC-0014", "SRC-0015", "SRC-0018", "SRC-0019", "SRC-0020", "SRC-0022", "SRC-0023", "SRC-0024"]

    def test_all_sixteen_have_pass2_with_independence_B_and_claims(self):
        for sid in self.SIXTEEN:
            s = self.by[sid]
            self.assertEqual(s["verification_independence"], "B", sid)
            self.assertTrue(s["pass2_verifier"].startswith("claude:cli-pass2-"), sid)
            self.assertNotEqual(s["pass1_extractor"], s["pass2_verifier"], sid)
            self.assertIn(s["provenance_status"], ("verified", "partially_verified"), sid)
            self.assertTrue([c for c in self.claims if c["source_id"] == sid], sid)

    def test_pass1_and_pass2_provenance_kept_separately_per_claim(self):
        for c in self.claims:
            if c["source_id"] != "SRC-0001":
                self.assertNotEqual(c["pass1_extractor"], c["pass2_verifier"])
                self.assertEqual(c["verification_independence"], "B")
            self.assertTrue(c["pass1_value"] and c["pass2_value"])

    def test_src0001_stays_unverified_with_c_self_check_only(self):
        s = self.by["SRC-0001"]
        self.assertEqual((s["provenance_status"], s["verification_outcome"], s["raw_file_sha256"]), ("unverified", "pending", ""))
        cl = [c for c in self.claims if c["source_id"] == "SRC-0001"]
        self.assertEqual([(c["result"], c["verification_independence"], c["resolution_status"]) for c in cl], [("unresolved", "C", "open")])

    def test_pass1_error_srcs_corrected_not_silently(self):
        # SRC-0019 year was recorded as 1977 although the list prints B.E. 2519 (1977)
        self.assertEqual(self.by["SRC-0019"]["publication_year"], "unknown")
        rej = [c for c in self.claims if c["source_id"] == "SRC-0019" and c["result"] == "rejected"]
        self.assertEqual(len(rej), 1)
        self.assertEqual(rej[0]["resolution_status"], "resolved_by_evidence")
        self.assertIn("CORRECTION", self.by["SRC-0019"]["notes"])
        # SRC-0012 truncation
        self.assertEqual(self.by["SRC-0012"]["coverage"], "partial")
        rows = [c for c in self.cov if c["source_id"] == "SRC-0012" and c["unit_type"] == "section_range"]
        self.assertEqual([(r["unit_from"], r["unit_to"], r["verification"]) for r in rows], [("1", "335", "verified")])

    def test_lead_note_corrected_act_29_exists_but_oag_unconfirmed(self):
        n = self.lead["LD-008"]["resolution_notes"]
        self.assertIn("(No. 29), B.E. 2558", n)
        self.assertIn("CORRECTION", n)
        self.assertEqual(self.lead["LD-008"]["resolution"], "unresolved")
        self.assertIn("No. 29", self.by["SRC-0020"]["amendment_reference"])

    def test_source_conflicts_remain_open_not_resolved_by_guess(self):
        open_ = {(c["source_id"], c["field"]) for c in self.claims if c["resolution_status"] in ("open", "conductor_pending")}
        for k in [("SRC-0015", "publication_year"), ("SRC-0019", "publication_year"), ("SRC-0003", "publication_year"),
                  ("SRC-0013", "publication_year"), ("SRC-0023", "publication_year"), ("SRC-0020", "coverage")]:
            self.assertIn(k, open_)
        self.assertEqual(self.by["SRC-0015"]["publication_year"], "unknown")
        for sid in ("SRC-0003", "SRC-0013", "SRC-0023"):
            self.assertEqual(self.by[sid]["verification_outcome"], "disputed", sid)

    def test_no_family_inferred_from_text_similarity(self):
        self.assertFalse([x for x in self.by.values() if x["source_family_id"]])
        rel = [c for c in self.claims if c["field"] == "relationship" and c["source_id"] in ("SRC-0010", "SRC-0011", "SRC-0012")]
        self.assertEqual({c["result"] for c in rel}, {"not_stated"})

    def test_verified_does_not_imply_full_coverage(self):
        import build_research_view as bv
        for sid in ("SRC-0006", "SRC-0012"):
            self.assertEqual(self.by[sid]["coverage"], "partial")
            self.assertIn("Coverage remains PARTIAL", self.by[sid]["version_notes"])
            self.assertIn("NOT verification of full-Code coverage", self.by[sid]["notes"])
            rows = [c for c in self.cov if c["source_id"] == sid]
            self.assertFalse([c for c in rows if c["coverage_status"] == "full_code"])
        for x in bv.coverage_view(ROOT):
            if x["Source ID"] in ("SRC-0006", "SRC-0012"):
                self.assertIn("(not completeness)", x["Status"])
                self.assertIn("coverage partial", x["Status"])

    def test_verified_records_have_no_open_claims(self):
        for sid in ("SRC-0006", "SRC-0012"):
            for c in [c for c in self.claims if c["source_id"] == sid]:
                self.assertNotIn(c["resolution_status"], ("open", "conductor_pending"))
                self.assertNotEqual(c["result"], "unresolved")

    def test_full_code_records_not_promoted_without_conductor_review(self):
        for sid in ("SRC-0010", "SRC-0011", "SRC-0018", "SRC-0024"):
            self.assertEqual(self.by[sid]["provenance_status"], "partially_verified")
            self.assertEqual(self.by[sid]["conductor_review"], "")

    def test_new_sources_from_pass2_are_not_overclaimed(self):
        self.assertEqual(self.by["SRC-0027"]["provenance_status"], "unverified")
        self.assertEqual(self.by["SRC-0026"]["verification_outcome"], "pending")
        self.assertEqual(self.by["SRC-0026"]["pass2_verifier"], "")

    def test_ccc_samuiforsale_books_v_vi_present_in_coverage_rows(self):
        rows = [c for c in self.cov if c["source_id"] == "SRC-0006" and c["unit_type"] == "section_range"
                and int(c["unit_to"]) - int(c["unit_from"]) < 1000]  # exclude the 1-1755 span row
        self.assertTrue(any(int(r["unit_from"]) <= 1435 and int(r["unit_to"]) >= 1598 for r in rows))
        self.assertTrue(any(int(r["unit_from"]) <= 1599 and int(r["unit_to"]) >= 1610 for r in rows))
        self.assertFalse(any(int(r["unit_from"]) <= 900 <= int(r["unit_to"]) for r in rows))  # 856-1011 gap

    # --- validator rules for the claims table
    def test_rejected_or_unresolved_claim_needs_resolution_status(self):
        r = clone()
        edit(r, "sources/verification_claims.csv", lambda rows: next(x for x in rows if x["result"] == "unresolved").update(resolution_status="none"))
        self.assertTrue(has(errs(r), "requires resolution_status other than 'none'"))

    def test_verified_blocked_by_open_claim(self):
        r = clone()
        edit(r, "sources/source_register.csv", lambda rows: next(x for x in rows if x["source_id"] == "SRC-0006").update())
        cols, rows = read(r, "sources/verification_claims.csv")
        c = dict.fromkeys(cols, "")
        c.update(claim_id="VC-9999", source_id="SRC-0006", field="coverage", pass1_value="a", pass2_value="b", result="unresolved",
                 pass1_extractor="claude:x", pass2_verifier="claude:cli-pass2-C-2026-10-05", verification_independence="B",
                 verified_date="2026-10-06", evidence="e", resolution_status="open")
        write(r, "sources/verification_claims.csv", cols, rows + [c])
        self.assertTrue(has(errs(r), "'verified' but claims remain"))

    def test_agreed_outcome_cannot_hide_conductor_pending(self):
        r = clone()
        edit(r, "sources/source_register.csv", lambda rows: next(x for x in rows if x["source_id"] == "SRC-0003").update(verification_outcome="agreed"))
        self.assertTrue(has(errs(r), "should be 'disputed'"))

    def test_claim_independence_must_match_actors(self):
        r = clone()
        edit(r, "sources/verification_claims.csv", lambda rows: rows[0].update(verification_independence="A"))
        self.assertTrue(has(errs(r), "actors imply B"))

    def test_verified_requires_claims(self):
        r = clone()
        edit(r, "sources/verification_claims.csv", lambda rows: [x.update(source_id="SRC-0002") for x in rows if x["source_id"] == "SRC-0006"])
        self.assertTrue(has(errs(r), "requires recorded per-claim Pass 2 results"))


if __name__ == "__main__":
    unittest.main()
