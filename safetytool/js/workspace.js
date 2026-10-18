// Safetytool — multi-model workspace (N1): which models are open, which one is active per type, which are closed but still stored.
// Pure: no DOM, no localStorage of its own — storage is passed in as { get(key), set(key, text) -> boolean, remove(key) }.
//
// Storage layout (old versions keep working: they only ever read the first line):
//   safetytool.<type>.current      the ACTIVE model of that type (exactly as before this feature)
//   safetytool.ws.m.<modelId>      a copy of every open or closed model, written on each save (so switching or closing never loses edits)
//   safetytool.workspace           the index below
// index = { v: 1, open: { <type>: [modelId ...] }, active: { <type>: modelId }, closed: [{ id, type, title, at, reason }] }
// A model is identified by meta.modelId only; links and packages are not touched here (they already point at modelId).

export const MAX_PER_TYPE = 5;
export const WS_KEY = 'safetytool.workspace';
export const slotKey = (type) => 'safetytool.' + type + '.current';
export const modelKey = (id) => 'safetytool.ws.m.' + id;

const idOf = (m) => (m && m.meta && typeof m.meta.modelId === 'string' && m.meta.modelId ? m.meta.modelId : null);
const hash = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); };

export function emptyIndex() { return { v: 1, open: {}, active: {}, closed: [] }; }

/** Parse a stored index. Returns a clean copy, or null when it is not a usable index (never throws). */
export function parseIndex(raw) {
  let j;
  try { j = JSON.parse(raw); } catch { return null; }
  if (!j || typeof j !== 'object' || j.v !== 1 || !j.open || typeof j.open !== 'object' || Array.isArray(j.open)) return null;
  const ix = emptyIndex();
  for (const [type, ids] of Object.entries(j.open)) {
    if (!Array.isArray(ids)) return null;
    ix.open[type] = [...new Set(ids.filter((x) => typeof x === 'string' && x))];
  }
  if (j.active && typeof j.active === 'object') for (const [type, id] of Object.entries(j.active)) if (typeof id === 'string' && (ix.open[type] || []).includes(id)) ix.active[type] = id;
  if (Array.isArray(j.closed)) ix.closed = j.closed.filter((c) => c && typeof c.id === 'string' && typeof c.type === 'string').map((c) => ({ id: c.id, type: c.type, title: typeof c.title === 'string' ? c.title : '', at: typeof c.at === 'string' ? c.at : '', reason: c.reason === 'replaced' ? 'replaced' : 'closed' }));
  for (const type of Object.keys(ix.open)) if (!ix.active[type] && ix.open[type].length) ix.active[type] = ix.open[type][0];
  return ix;
}

export const openIds = (ix, type) => (ix.open[type] || []).slice();
export const activeId = (ix, type) => ix.active[type] || null;
export const canOpen = (ix, type) => openIds(ix, type).length < MAX_PER_TYPE;
export const closedList = (ix) => ix.closed.map((c) => ({ ...c }));
export const findClosed = (ix, id) => ix.closed.find((c) => c.id === id) || null;
export const isOpen = (ix, id) => Object.values(ix.open).some((a) => a.includes(id));
export function typeOfOpen(ix, id) { return Object.keys(ix.open).find((t) => ix.open[t].includes(id)) || null; }

/** Add a model to the open set of its type. Never evicts: at the cap it refuses. */
export function addOpen(ix, type, id) {
  const a = (ix.open[type] = ix.open[type] || []);
  if (a.includes(id)) return { ok: true };
  if (a.length >= MAX_PER_TYPE) return { ok: false, reason: 'full' };
  a.push(id);
  ix.closed = ix.closed.filter((c) => c.id !== id);
  return { ok: true };
}

export function setActive(ix, type, id) {
  if (!(ix.open[type] || []).includes(id)) return false;
  ix.active[type] = id;
  return true;
}

/**
 * The model now in the slot of `type` is `id` (it was just loaded, created, switched to or restored).
 * - already open: it becomes the active one;
 * - not open and it REPLACED the previous active model (a guarded open/new/example): the old one leaves the open set and is listed as
 *   closed ("replaced"), its stored copy stays, so it is recoverable; a blank old model is simply dropped;
 * - not open and nothing was replaced: it is added to the open set (even past the cap if the caller did not check: never lose a model).
 * Returns { replaced: oldId|null, dropped: oldId|null }.
 */
export function noteActive(ix, type, id, { title = '', blankOld = false, at = '' } = {}) {
  const a = (ix.open[type] = ix.open[type] || []);
  const prev = ix.active[type] || null;
  const out = { replaced: null, dropped: null };
  if (a.includes(id)) { ix.active[type] = id; return out; }
  if (prev && prev !== id && a.includes(prev)) {
    a[a.indexOf(prev)] = id;
    if (blankOld) out.dropped = prev; else { ix.closed = ix.closed.filter((c) => c.id !== prev); ix.closed.push({ id: prev, type, title, at, reason: 'replaced' }); out.replaced = prev; }
  } else a.push(id);
  ix.closed = ix.closed.filter((c) => c.id !== id);
  ix.active[type] = id;
  return out;
}

/** Remove a model from the OPEN set only. Its stored copy and every link to it are untouched. */
export function closeModel(ix, type, id, { title = '', at = '' } = {}) {
  const a = ix.open[type] || [];
  const i = a.indexOf(id);
  if (i < 0) return { ok: false, reason: 'not-open' };
  a.splice(i, 1);
  if (ix.active[type] === id) { if (a.length) ix.active[type] = a[Math.min(i, a.length - 1)]; else delete ix.active[type]; }
  ix.closed = ix.closed.filter((c) => c.id !== id);
  ix.closed.push({ id, type, title, at, reason: 'closed' });
  return { ok: true };
}

/** Bring a closed model back into the open set (refuses at the cap). */
export function reopen(ix, id) {
  const c = findClosed(ix, id);
  if (!c) return { ok: false, reason: 'unknown' };
  const r = addOpen(ix, c.type, id);
  return r.ok ? { ok: true, entry: c } : r;
}

/** Explicit removal of a closed model from the stored list (the caller deletes the stored copy only after the user confirmed). */
export function forget(ix, id) {
  const n = ix.closed.length;
  ix.closed = ix.closed.filter((c) => c.id !== id);
  return ix.closed.length !== n;
}

/** Write the active model of `type` to the compatibility slot, to its own stored copy and the index. -> { ok, replaced, dropped } */
export function persistModel(store, ix, type, model, { title = '', blankOld = false, at = '' } = {}) {
  const id = idOf(model);
  if (!id) return { ok: false, reason: 'no-id', replaced: null, dropped: null };
  const r = noteActive(ix, type, id, { title, blankOld, at });
  const json = JSON.stringify(model);
  const ok = store.set(slotKey(type), json) && store.set(modelKey(id), json) && store.set(WS_KEY, JSON.stringify(ix));
  return { ok, ...r };
}

/**
 * First load of the workspace format (and every later load). store/types as above;
 * hooks: { validate(type, model) -> string[], ensureId(model) } (ensureId must only ADD a missing meta.modelId).
 * - no index: migrate the single-slot data. Each valid slot model becomes the one open + active model of its type, keeping its modelId and content.
 *   A slot that cannot be parsed or fails validation is NOT touched and NOT adopted; a copy is kept under safetytool.ws.malformed.*.
 * - index present: nothing is migrated; a slot whose model differs from the recorded active one (an older version of the app wrote it)
 *   is reconciled through noteActive, which keeps the previous model recoverable.
 * - index present but unreadable: a copy is kept under safetytool.workspace.bad.*, then the workspace is rebuilt from the slots.
 * Idempotent: running it again on its own output writes nothing. The index is written last, so an interrupted run is simply repeated.
 */
export function loadWorkspace(store, types, { validate, ensureId, at = '' }) {
  const report = { migrated: false, rebuilt: false, malformed: [], invalid: [], adopted: [], assignedIds: [], reconciled: [], restored: [], missing: [] };
  const slotOk = {};   // type -> id of the valid model found in its legacy slot
  let ix = null;
  const raw = store.get(WS_KEY);
  if (raw != null) {
    ix = parseIndex(raw);
    if (!ix) { store.set(WS_KEY + '.bad.' + hash(raw), raw); report.rebuilt = true; }
  }
  const fresh = !ix;
  if (fresh) ix = emptyIndex();
  let changed = fresh;
  for (const type of types) {
    const rawSlot = store.get(slotKey(type));
    if (rawSlot == null) {
      // the slot is gone but the index knows an active model with a readable stored copy: put it back (never start a blank over it)
      const a = !fresh && ix.active[type];
      const r = a ? readStored(store, a, type, validate) : null;
      if (r && r.ok && store.set(slotKey(type), store.get(modelKey(a)))) { report.restored.push({ type, id: a }); slotOk[type] = a; }
      continue;
    }
    let m;
    try { m = JSON.parse(rawSlot); } catch { report.malformed.push(type); store.set('safetytool.ws.malformed.' + type + '.' + hash(rawSlot), rawSlot); continue; }
    const errs = m && typeof m === 'object' ? validate(type, m) : ['not an object'];
    if (errs.length) { report.invalid.push({ type, errors: errs.slice(0, 3) }); store.set('safetytool.ws.malformed.' + type + '.' + hash(rawSlot), rawSlot); continue; }
    let json = rawSlot;
    if (!idOf(m)) { ensureId(m); json = JSON.stringify(m); store.set(slotKey(type), json); report.assignedIds.push(type); changed = true; }
    const id = idOf(m);
    slotOk[type] = id;
    const prevCopy = store.get(modelKey(id));
    if (prevCopy !== json) {
      if (prevCopy != null) store.set(modelKey(id) + '.prev.' + hash(prevCopy), prevCopy);   // a differing earlier copy is kept, never overwritten
      store.set(modelKey(id), json);
    }
    if (fresh) { ix.open[type] = [id]; ix.active[type] = id; report.adopted.push({ type, id }); continue; }
    const before = JSON.stringify(ix);
    const r = noteActive(ix, type, id, { title: '', at });
    if (JSON.stringify(ix) !== before) { changed = true; if (r.replaced) report.reconciled.push({ type, id, replaced: r.replaced }); }
  }
  // An index entry whose model has no readable stored copy anywhere (not in its slot, not under ws.m.*) cannot be opened or recovered.
  // Drop the dangling entry so it does not hold one of the 5 places forever; nothing readable is removed by this.
  if (!fresh) {
    const has = (type, id) => slotOk[type] === id || readStored(store, id, type, validate).ok;
    for (const type of Object.keys(ix.open)) {
      const keep = ix.open[type].filter((id) => has(type, id) || (report.missing.push({ id, type }), false));
      if (keep.length !== ix.open[type].length) { ix.open[type] = keep; changed = true; if (!keep.includes(ix.active[type])) { if (keep.length) ix.active[type] = keep[0]; else delete ix.active[type]; } }
    }
    const kc = ix.closed.filter((c) => readStored(store, c.id, c.type, validate).ok || (report.missing.push({ id: c.id, type: c.type }), false));
    if (kc.length !== ix.closed.length) { ix.closed = kc; changed = true; }
  }
  report.migrated = fresh;
  if (changed || report.restored.length) store.set(WS_KEY, JSON.stringify(ix));
  return { ix, report };
}

// ---------------------------------------------------------------- session: the in-memory side (used by the app and by the tests)
// st  = { ws: index, models: {type: activeModel}, undo: {type: []}, redo: {type: []}, inactive: {modelId: model}, hist: {modelId: {undo, redo}} }
// env = { store, validate(type, m) -> string[], normalize(type, m) -> m, ensureId(m), empty(type) -> model, isBlank(m) -> bool, now() -> ISO string }
// st.models[type] / st.undo[type] / st.redo[type] always describe the ACTIVE model of that type, exactly as before the workspace existed;
// every other open model sits in st.inactive with its own history in st.hist. Switching swaps them, so undo/redo can never reach another model.
export function newSession(ix) { return { ws: ix, models: {}, undo: {}, redo: {}, inactive: {}, hist: {} }; }
const titleOf = (m) => (m && m.meta && typeof m.meta.title === 'string' ? m.meta.title : '');

/** Save the active model of `type` (slot, stored copy, index). Call after every edit and whenever a model is installed. */
export function persistActive(st, env, type) {
  const m = st.models[type];
  if (!m) return { ok: true };
  env.ensureId(m);
  const id = idOf(m);
  const prev = activeId(st.ws, type);
  let blankOld = false;
  if (prev && prev !== id && !(st.ws.open[type] || []).includes(id)) {   // the model in the slot was REPLACED by this one: a blank one is not worth keeping
    const old = readStored(env.store, prev, type, () => []);
    blankOld = old.ok && env.isBlank(old.model);
  }
  const r = persistModel(env.store, st.ws, type, m, { title: titleOf(m), blankOld, at: env.now() });
  // a dropped (blank/example) model's stored copy is removed only after the index that no longer lists it was written
  if (r.dropped) { if (r.ok) env.store.remove(modelKey(r.dropped)); delete st.inactive[r.dropped]; delete st.hist[r.dropped]; }
  if (r.replaced) { delete st.inactive[r.replaced]; delete st.hist[r.replaced]; }
  return r;
}

function stash(st, env, type) {
  const now = st.models[type];
  if (!now) return { ok: true };
  const p = persistActive(st, env, type);
  if (!p.ok) return { ok: false, reason: 'storage' };
  st.inactive[idOf(now)] = now;
  st.hist[idOf(now)] = { undo: st.undo[type] || [], redo: st.redo[type] || [] };
  return { ok: true };
}

function install(st, env, type, model, hist) {
  st.models[type] = model;
  st.undo[type] = hist ? hist.undo : [];
  st.redo[type] = hist ? hist.redo : [];
  return persistActive(st, env, type);
}

/** Models open in the workspace: [{ type, id, model, active }] (inactive ones are read from their stored copy once, then cached). */
export function openModels(st, env) {
  const out = [];
  for (const type of Object.keys(st.ws.open)) {
    for (const id of st.ws.open[type]) {
      let model = st.models[type] && idOf(st.models[type]) === id ? st.models[type] : st.inactive[id];
      if (!model) { const r = readStored(env.store, id, type, env.validate); if (r.ok) { model = env.normalize(type, r.model); st.inactive[id] = model; } }
      if (model) out.push({ type, id, model, active: st.models[type] === model });
    }
  }
  return out;
}

/** Open + closed models by id, for link health and "go to": closing a model must not make links to it look broken. */
export function universe(st, env) {
  const map = new Map(openModels(st, env).map((o) => [o.id, { type: o.type, model: o.model, open: true }]));
  for (const c of st.ws.closed) {
    if (map.has(c.id)) continue;
    const r = readStored(env.store, c.id, c.type, env.validate);
    if (r.ok) map.set(c.id, { type: c.type, model: env.normalize(c.type, r.model), open: false });
  }
  return map;
}

/** Make an open model the active one of its type. History of the model being left is kept with it. */
export function activate(st, env, type, id) {
  const ix = st.ws;
  if (!(ix.open[type] || []).includes(id)) return { ok: false, reason: 'not-open' };
  const now = st.models[type];
  if (now && idOf(now) === id) return { ok: true, same: true };
  let target = st.inactive[id];
  if (!target) {
    const r = readStored(env.store, id, type, env.validate);
    if (!r.ok) return { ok: false, reason: r.reason };
    target = env.normalize(type, r.model);
  }
  const s = stash(st, env, type);
  if (!s.ok) return s;
  const h = st.hist[id];
  delete st.inactive[id]; delete st.hist[id];
  setActive(ix, type, id);
  const p = install(st, env, type, target, h);
  return { ok: true, stored: p.ok };
}

/** Add a model to the open set and make it active, keeping the current one open. Refuses at the cap — nothing is evicted. */
export function addModel(st, env, type, model) {
  const ix = st.ws;
  env.ensureId(model);
  const id = idOf(model);
  if ((ix.open[type] || []).includes(id)) return activate(st, env, type, id);
  if (!canOpen(ix, type)) return { ok: false, reason: 'full' };
  const s = stash(st, env, type);
  if (!s.ok) return s;
  addOpen(ix, type, id);
  setActive(ix, type, id);
  const p = install(st, env, type, model, null);
  return { ok: true, id, stored: p.ok };
}

/** Close a model: it leaves the OPEN set only. Its stored copy and links stay. Closing the last model of a type leaves a fresh blank one. */
export function closeOpen(st, env, type, id) {
  const ix = st.ws;
  const list = ix.open[type] || [];
  const i = list.indexOf(id);
  if (i < 0) return { ok: false, reason: 'not-open' };
  const isActive = st.models[type] && idOf(st.models[type]) === id;
  const model = isActive ? st.models[type] : (st.inactive[id] || (readStored(env.store, id, type, env.validate).model || null));
  const title = titleOf(model);
  let createdBlank = false;
  if (isActive) {
    const p = persistActive(st, env, type);   // make sure the stored copy has the latest edits before the model leaves the workspace
    if (!p.ok) return { ok: false, reason: 'storage' };
    const others = list.filter((x) => x !== id);
    if (others.length) {
      const a = activate(st, env, type, others[Math.min(i, others.length - 1)]);
      if (!a.ok) return a;
    } else {
      const blank = env.empty(type); env.ensureId(blank);
      closeModel(ix, type, id, { title, at: env.now() });
      addOpen(ix, type, idOf(blank)); setActive(ix, type, idOf(blank));
      install(st, env, type, blank, null);
      createdBlank = true;
    }
  }
  if (!createdBlank) closeModel(ix, type, id, { title, at: env.now() });
  delete st.inactive[id]; delete st.hist[id];
  const ok = env.store.set(WS_KEY, JSON.stringify(ix));
  return { ok, createdBlank };
}

/** Bring a closed model back (and make it active). Refuses at the cap. */
export function reopenClosed(st, env, id) {
  const c = findClosed(st.ws, id);
  if (!c) return { ok: false, reason: 'unknown' };
  if (!canOpen(st.ws, c.type)) return { ok: false, reason: 'full', type: c.type };
  const r = readStored(env.store, id, c.type, env.validate);
  if (!r.ok) return { ok: false, reason: r.reason };
  return addModel(st, env, c.type, env.normalize(c.type, r.model));
}

/** Explicit, separate removal of a closed model's stored copy. The caller must already have the user's confirmation. */
export function forgetClosed(st, env, id) {
  if (!findClosed(st.ws, id)) return { ok: false, reason: 'unknown' };
  // index first: if it cannot be written nothing changes; the stored copy is deleted only once the index no longer lists it
  const next = { ...st.ws, closed: st.ws.closed.filter((c) => c.id !== id) };
  if (!env.store.set(WS_KEY, JSON.stringify(next))) return { ok: false, reason: 'storage' };
  forget(st.ws, id);
  deleteStored(env.store, id);
  return { ok: true };
}

/** Load a stored model copy by id: { ok, model } | { ok:false, reason }. */
export function readStored(store, id, type, validate) {
  const raw = store.get(modelKey(id));
  if (raw == null) return { ok: false, reason: 'missing' };
  let m;
  try { m = JSON.parse(raw); } catch { return { ok: false, reason: 'unreadable' }; }
  const errs = validate(type, m);
  return errs.length ? { ok: false, reason: 'invalid', errors: errs } : { ok: true, model: m };
}

/** Remove a stored copy (the caller has the user's explicit confirmation). */
export function deleteStored(store, id) { store.remove(modelKey(id)); }
