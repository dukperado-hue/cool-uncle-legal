Pipeline used 2026-10-04 to enrich books.crimpro in codex-data.json (lectureNotes L1-9, articleTitle, examples, levelNotes) and criminal examples.
Run from repo root on a CLEAN codex-data.json (`git checkout codex-data.json` first):
  export SPW=<this folder, forward slashes>; node dump_lectures.js   # writes real_lectures.json from crimpro.html
  python apply_all.py                                                 # applies all steps, keeps minified JSON
Edit lecture->article mapping in buildnotes.py (M list), titles in titles*.json, examples in step_examples.py, level notes in step_levels.py.
