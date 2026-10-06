#!/usr/bin/env node
/* Engineer/tools/validate.js -- node Engineer/tools/validate.js   (no dependencies)
 * Checks the Engineer world's data and its architectural rules.  Exit code 1 on any failure. */
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..', '..');            // site root
const ENG = path.join(ROOT, 'Engineer'), ENGINE = path.join(ROOT, 'engine');
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL  ' + m); } };
const rd = p => fs.readFileSync(p, 'utf8');
const js = p => JSON.parse(rd(p).replace(/^﻿/, ''));

/* ---- mini JSON-Schema (type, required, enum, pattern, properties, items, additionalProperties, minimum) ---- */
function check(sch, v, where, errs) {
  if (sch.enum && !sch.enum.includes(v)) errs.push(`${where}: ${JSON.stringify(v)} not in ${JSON.stringify(sch.enum)}`);
  if (sch.type) {
    const t = Array.isArray(v) ? 'array' : v === null ? 'null' : Number.isInteger(v) ? 'integer' : typeof v;
    const okT = sch.type === t || (sch.type === 'number' && t === 'integer');
    if (!okT) { errs.push(`${where}: expected ${sch.type}, got ${t}`); return; }
  }
  if (sch.pattern && typeof v === 'string' && !new RegExp(sch.pattern).test(v)) errs.push(`${where}: "${v}" !~ ${sch.pattern}`);
  if (sch.minimum != null && typeof v === 'number' && v < sch.minimum) errs.push(`${where}: < ${sch.minimum}`);
  if (sch.type === 'object' && v && typeof v === 'object') {
    (sch.required || []).forEach(k => { if (!(k in v)) errs.push(`${where}: missing ${k}`); });
    const props = sch.properties || {};
    Object.keys(v).forEach(k => {
      if (props[k]) check(props[k], v[k], `${where}.${k}`, errs);
      else if (sch.additionalProperties === false) errs.push(`${where}: unexpected property ${k}`);
    });
  }
  if (sch.type === 'array' && Array.isArray(v) && sch.items) v.forEach((x, i) => check(sch.items, x, `${where}[${i}]`, errs));
}

/* ---- load ---- */
const registry = js(path.join(ENG, 'data', 'registry.json'));
const subjDoc = js(path.join(ENG, 'data', registry.subjects));
const entSchema = js(path.join(ENG, 'schema', 'entity.schema.json'));
const subSchema = js(path.join(ENG, 'schema', 'subject.schema.json'));
const worlds = js(path.join(ENGINE, 'worlds.json'));
const iconsSrc = rd(path.join(ENGINE, 'core.js')) + rd(path.join(ENG, 'engineer.js'));
const iconNames = new Set();
[...iconsSrc.matchAll(/icons\.register\('[a-z]+',\s*\{([\s\S]*?)\}\);/g)].forEach(m =>
  [...m[1].matchAll(/([a-z]+):\s*'([^']+)'/g)].forEach(k => iconNames.add(k[1])));

/* ---- 1 schemas ---- */
const domainIds = new Set(subjDoc.domains.map(d => d.id));
const subjects = new Map();
subjDoc.subjects.forEach(s => {
  const e = []; check(subSchema, s, 'subject ' + s.id, e); e.forEach(x => ok(false, x));
  ok(!subjects.has(s.id), 'duplicate subject id ' + s.id); subjects.set(s.id, s);
  ok(domainIds.has(s.domain), `subject ${s.id}: unknown domain ${s.domain}`);
  ok(s.urn === 'eng:subject/' + s.id, `subject ${s.id}: urn mismatch`);
  ok(iconNames.has(s.icon), `subject ${s.id}: icon "${s.icon}" is not registered`);
});
subjDoc.domains.forEach(d => ok(iconNames.has(d.icon), `domain ${d.id}: icon "${d.icon}" is not registered`));
const entities = new Map();
registry.shards.forEach(sh => {
  const f = path.join(ENG, 'data', sh.path); ok(fs.existsSync(f), 'shard missing ' + sh.path); if (!fs.existsSync(f)) return;
  js(f).forEach(en => {
    const e = []; check(entSchema, en, 'entity ' + en.id, e); e.forEach(x => ok(false, x));
    ok(!entities.has(en.id), 'duplicate entity id ' + en.id); entities.set(en.id, en);
    ok(en.id.split(':')[1].split('/')[0] === en.kind, `entity ${en.id}: kind does not match id`);
    en.subjects.forEach(s => ok(subjects.has(s), `entity ${en.id}: unknown subject ${s}`));
    ok(en.kind !== 'lecture' || en.lecture, `entity ${en.id}: lecture needs a lecture{series,no}`);
  });
});

/* ---- 2 references / cross-world ---- */
const atlasConcepts = js(path.join(ROOT, 'atlas-concepts.json')).concepts;
const atlasList = Array.isArray(atlasConcepts) ? atlasConcepts : Object.values(atlasConcepts);
const atlasBySlug = new Map(atlasList.map(c => [c.slug, c]));
const prefixes = new Set(worlds.worlds.flatMap(w => Object.keys(w.urns || {})));
function checkRef(r, where) {
  const m = /^([a-z][a-z0-9-]*):([a-z][a-z0-9-]*)\/(.+)$/.exec(r.urn);
  if (!m) return ok(false, `${where}: bad urn ${r.urn}`);
  ok(prefixes.has(m[1] + ':' + m[2]), `${where}: no world registers ${m[1]}:${m[2]}`);
  if (m[1] === 'eng') ok(m[2] === 'subject' ? subjects.has(m[3]) : entities.has(r.urn), `${where}: ${r.urn} does not exist in Engineer`);
  if (m[1] === 'atlas' && m[2] === 'concept') {
    const c = atlasBySlug.get(m[3]); ok(!!c, `${where}: Atlas concept ${m[3]} not found`);
    if (c && r.labelSnapshot) ok(c.titleTH === r.labelSnapshot, `${where}: labelSnapshot "${r.labelSnapshot}" drifted from Atlas "${c.titleTH}"`);
  }
}
subjDoc.subjects.forEach(s => (s.references || []).forEach((r, i) => checkRef(r, `subject ${s.id}.references[${i}]`)));
entities.forEach(en => (en.related || []).forEach((r, i) => checkRef(r, `entity ${en.id}.related[${i}]`)));

/* ---- 3 external pointers + block types ---- */
const ext = registry.external;
const extFiles = {};
[...ext.dictionaries, ...ext.sourceRegistries].forEach(x => {
  const f = path.resolve(ENG, x.path); ok(fs.existsSync(f), 'external missing ' + x.path); if (fs.existsSync(f)) extFiles[x.id] = js(f);
});
const blockTypes = new Set([...rd(path.join(ENGINE, 'reader.js')).matchAll(/BLOCKS\.([a-z]+)\s*=/g)].map(m => m[1])
  .concat([...rd(path.join(ENG, 'engineer.js')).matchAll(/registerBlock\('([a-z-]+)'/g)].map(m => m[1])));
entities.forEach(en => (en.body || []).forEach((b, i) => {
  ok(blockTypes.has(b.type), `entity ${en.id}.body[${i}]: block type "${b.type}" has no renderer`);
  if (b.type === 'dict-rows') {
    const d = extFiles[b.volume]; ok(!!d, `entity ${en.id}: unknown dictionary volume ${b.volume}`);
    if (d) b.match.forEach(m => ok(d.entries.some(e => String(e.abbr).toUpperCase() === m.toUpperCase()), `entity ${en.id}: "${m}" not found in dictionary ${b.volume}`));
  }
  if (b.type === 'dict-header') ok(!!extFiles[b.volume], `entity ${en.id}: unknown dictionary ${b.volume}`);
  if (b.type === 'av-source-list') ok(!!extFiles[b.registry], `entity ${en.id}: unknown registry ${b.registry}`);
}));
/* demo entity titles must equal the dictionary row they quote (drift check) */
const sms = entities.get('eng:concept/sms');
if (sms && extFiles.abbr) {
  const row = extFiles.abbr.entries.find(e => e.abbr === 'SMS');
  ok(row && row.meanings.some(m => m.en === sms.titleEN && (m.th || []).includes(sms.titleTH)), 'eng:concept/sms titles drifted from the dictionary row');
}

/* ---- 4 architecture rules ---- */
const colour = /#[0-9A-Fa-f]{3,8}\b|\brgba?\(|\bhsla?\(/;
const engineerFiles = [...fs.readdirSync(ENG).filter(f => /\.(html|js|css)$/.test(f)).map(f => path.join(ENG, f))];
engineerFiles.forEach(f => rd(f).split('\n').forEach((l, i) => ok(!colour.test(l), `hard-coded colour in ${path.relative(ROOT, f)}:${i + 1}`)));
['core.js', 'shell.js', 'reader.js'].forEach(f => rd(path.join(ENGINE, f)).split('\n').forEach((l, i) => ok(!colour.test(l), `hard-coded colour in engine/${f}:${i + 1}`)));
rd(path.join(ENGINE, 'theme.css')).split('\n').forEach((l, i) => { if (colour.test(l)) ok(/--[a-z0-9-]+\s*:/.test(l), `engine/theme.css:${i + 1}: colour outside a token definition`); });
ok(!/<style[\s>]/i.test(engineerFiles.filter(f => f.endsWith('.html')).map(rd).join('\n')), 'Engineer pages must not carry <style> blocks');
const code = rd(path.join(ENG, 'engineer.js')) + ['core.js', 'shell.js', 'reader.js'].map(f => rd(path.join(ENGINE, f))).join('\n');
subjects.forEach((s, id) => ok(!new RegExp("['\"]" + id + "['\"]").test(code), `subject id "${id}" is hard-coded in code (adding a subject must not need code)`));
ok(!/codex-data|atlas-core|atlas-concepts/.test(code), 'engine/Engineer code must not depend on Legal Atlas data/code');
/* one source of truth: no Engineer data file duplicates another repo file, and none is large */
const sha = f => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const dataFiles = [];
(function walk(d) { fs.readdirSync(d, { withFileTypes: true }).forEach(e => { const p = path.join(d, e.name); e.isDirectory() ? walk(p) : dataFiles.push(p); }); })(path.join(ENG, 'data'));
dataFiles.forEach(f => ok(fs.statSync(f).size < 200000, `Engineer data file unexpectedly large: ${path.relative(ROOT, f)}`));
const extHashes = new Set(Object.values(ext).flat().map(x => sha(path.resolve(ENG, x.path))));
dataFiles.forEach(f => ok(!extHashes.has(sha(f)), `Engineer data duplicates an external source: ${path.relative(ROOT, f)}`));

console.log(`\nEngineer validate: ${pass} passed, ${fail} failed  (${subjects.size} subjects, ${entities.size} entities, ${blockTypes.size} block types, ${iconNames.size} icons)`);
process.exit(fail ? 1 : 0);
