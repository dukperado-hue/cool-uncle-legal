// Uncle Safetytool
// Created by Anusorn Sintusaichol
// Copy from Anusorn Sintusaichol
// Licence of this release: MIT (see LICENSE). Proposed future terms: USAGE-TERMS.md (draft, NOT adopted). Third-party material: see NOTICE.md.
//
// Single source of the product name and attribution text. Two forms:
//   CREDIT_LINE  - full attribution (footer, Help > About, README, usage-terms documents)
//   CREDIT_SHORT - compact attribution where space is limited (report, print caption, SVG/PNG strip)
// This module states who created the tool; it makes no claim about copyright ownership or which licence applies.
// Pure: no DOM, no storage.
// Internal ids ('safetytool.*' storage keys and schema ids, the 'safetytool' engine name, file names) are NOT renamed on purpose:
// saved models, browser storage and exchange packages keep working.

export const PRODUCT = 'Uncle Safetytool';
export const CREATOR = 'Anusorn Sintusaichol';
export const CREATED_BY = 'Created by ' + CREATOR;
export const COPY_FROM = 'Copy from ' + CREATOR;
export const TERMS_URL = 'https://github.com/dukperado-hue/Safetytool/blob/main/USAGE-TERMS.md';   // PROPOSED future terms; not adopted

/** Full attribution (exact phrases required wherever the full form is used). */
export const CREDIT_LINE = PRODUCT + ' · ' + CREATED_BY + ' · ' + COPY_FROM;

/** Compact attribution for tight spaces. */
export const CREDIT_SHORT = PRODUCT + ' · ' + CREATED_BY;
