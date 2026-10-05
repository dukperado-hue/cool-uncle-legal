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
    shutil.copytree(ROOT, d / "r", ignore=shutil.ignore_patterns("tests", "__pycache__"))
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
        self.assertEqual((e, w), ([], []))

    def test_human_pass2_is_A(self):
        r = self.verified(pass2_verifier="human:reviewer", verification_independence="A")
        self.assertEqual(errs(r), [])

    def test_independence_required_when_pass2_set(self):
        self.assertTrue(has(errs(self.verified(verification_independence="")), "verification_independence required"))

    def test_C_self_check_only_is_valid_and_storable(self):
        r = self.verified(provenance_status="unverified", evidence_location="PENDING", pass2_verifier="claude:run1",
                          verification_independence="C", verification_outcome="pending")
        e, w, _ = vd.validate(r)
        self.assertEqual((e, w), ([], []))

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
        new_source(r, "SRC-0002", source_family_id="FAM-0001", source_version="v1")
        self.assertTrue(has(errs(r), "family/version"))
        edit(r, "sources/source_register.csv", lambda rows: rows[1].update(source_version="v2"))
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
        self.assertEqual([p.name for p in (ROOT / "sources/raw").iterdir()], [".gitkeep"])
        self.assertEqual(read(ROOT, "sources/raw_manifest.csv")[1], [])


if __name__ == "__main__":
    unittest.main()
