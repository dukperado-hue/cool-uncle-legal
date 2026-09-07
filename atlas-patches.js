/* ============================================================================
 * atlas-patches.js  —  Thai Legal Atlas · source-gap corrections
 * ----------------------------------------------------------------------------
 * codex-data.json leaves some articles' meta.* fields empty or mislabelled at
 * the source (PyThaiNLP thai-law). Without these corrections a structure tree
 * built from meta.* silently DROPS whole ภาค / ลักษณะ runs.
 *
 * These are the same fixes that were previously inlined inside
 * neural-network.html (patchArticleMeta) and the neuralnetworklegalcode
 * gen-legal-hierarchy.js script — now in one shared, idempotent place.
 *
 * Classic script. Exposes window.AtlasPatches. No dependencies.
 * ==========================================================================*/
(function (global) {
  'use strict';

  function toInt(n) {
    var x = parseInt(String(n), 10);
    return isNaN(x) ? null : x;
  }

  /**
   * Mutate & return a meta object with source gaps filled. Idempotent:
   * every write is guarded by a falsy check or an exact-value check, so
   * running it twice (or on already-good data) is a no-op.
   *
   * @param {string} collectionKey  registry/book key, e.g. "criminal"
   * @param {string|number} number  article number as stored ("1", "193 ทวิ")
   * @param {object} meta            article.meta (may be null)
   * @returns {object} the same meta object, patched
   */
  function patchMeta(collectionKey, number, meta) {
    var m = meta || {};
    var n = toInt(number);

    // ---- ประมวลกฎหมายอาญา -------------------------------------------------
    // ภาค 1 "บทบัญญัติทั่วไป" (มาตรา 1–106) is the implicit "everything before
    // ภาค 2" default and carries NO phaak/laksana tag at all in the source.
    // Only ภาค 2 / ภาค 3 are explicitly tagged. Without this the entire ภาค 1
    // disappears from the criminal tree.
    if (collectionKey === 'criminal' && n != null) {
      if (n === 1 && !m.muad) { m.muad = 'หมวด 1'; m.muadTitle = 'บทนิยาม'; }
      if (n <= 101 && !m.laksana) {
        m.laksana = 'ลักษณะ 1';
        m.laksanaTitle = 'บทบัญญัติที่ใช้แก่ความผิดทั่วไป';
      }
      if (n <= 106 && !m.phaak) {
        m.phaak = 'ภาค 1';
        m.phaakTitle = 'บทบัญญัติทั่วไป';
      }
    }

    // ---- ประมวลกฎหมายแพ่งและพาณิชย์ -------------------------------------
    // Upstream mislabels 754–769 (จำนำ content) as ลักษณะ 22 (โอนหุ้น/หุ้นกู้).
    // Verified against the real article text in neuralnetworklegalcode.
    if (collectionKey === 'civil' && n != null) {
      if (n >= 754 && n <= 769 && m.laksana === 'ลักษณะ 22') {
        m.laksana = 'ลักษณะ 13';
        m.laksanaTitle = 'จำนำ';
      }
      if (n >= 754 && n <= 757 && !m.muad) {
        m.muad = 'หมวด 1';
        m.muadTitle = 'บทเบ็ดเสร็จทั่วไป';
      }
    }

    return m;
  }

  global.AtlasPatches = {
    version: '1.0',
    patchMeta: patchMeta,

    /** Human-readable list of every correction — for the discovery report / QA. */
    describe: function () {
      return [
        {
          collection: 'criminal',
          range: 'มาตรา 1–106',
          fix: 'synthesize ภาค 1 / ลักษณะ 1 / หมวด 1 (untagged at source — the implicit "before ภาค 2" default)'
        },
        {
          collection: 'civil',
          range: 'มาตรา 754–769',
          fix: 'ลักษณะ 22 → ลักษณะ 13 (จำนำ); มาตรา 754–757 also get หมวด 1 (บทเบ็ดเสร็จทั่วไป)'
        }
      ];
    }
  };
})(typeof window !== 'undefined' ? window : this);
