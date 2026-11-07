(() => {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const ed = $('#editor'), tree = $('#tree'), empty = $('#empty'), stats = $('#stats'),
    status = $('#status'), search = $('#search'), gutter = $('#gutter'), toastEl = $('#toast');

  const EXAMPLES = {
    user: { id: 4821, name: 'Ada Lovelace', active: true, email: 'ada@example.com', roles: ['admin', 'editor'],
      address: { city: 'London', zip: 'N1 9GU', geo: { lat: 51.5362, lng: -0.1033 } }, lastLogin: null },
    pkg: { name: 'sample-app', version: '1.2.0', scripts: { build: 'vite build', test: 'vitest' },
      dependencies: { vite: '^5.0.0' }, keywords: ['demo', 'json'], private: true },
    geo: { type: 'FeatureCollection', features: [{ type: 'Feature', properties: { name: 'Null Island' },
      geometry: { type: 'Point', coordinates: [0, 0] } }, { type: 'Feature', properties: { name: 'Greenwich' },
      geometry: { type: 'Point', coordinates: [0, 51.4779] } }] }
  };

  let data, query = '';

  function toast(t) {
    toastEl.textContent = t; toastEl.classList.add('show');
    clearTimeout(toast.id); toast.id = setTimeout(() => toastEl.classList.remove('show'), 1600);
  }
  function setStatus(text, cls) { status.textContent = text; status.className = 'status ' + (cls || ''); }
  function lines() { gutter.textContent = Array.from({ length: ed.value.split('\n').length }, (_, i) => i + 1).join('\n'); }

  function explain(err, text) {
    const m = String(err.message);
    let pos = (m.match(/position (\d+)/) || [])[1];
    let line, col;
    const lc = m.match(/line (\d+) column (\d+)/);
    if (lc) { line = +lc[1]; col = +lc[2]; }
    else if (pos !== undefined) {
      const before = text.slice(0, +pos).split('\n'); line = before.length; col = before[before.length - 1].length + 1;
    }
    const where = line ? ` (line ${line}, column ${col})` : '';
    return `Invalid JSON${where}: ${m.replace(/ in JSON at position.*/, '').replace(/\s*\(line.*\)/, '')}`;
  }

  function parse() {
    const text = ed.value;
    if (!text.trim()) { data = undefined; render(); setStatus('Waiting for JSON'); return false; }
    try { data = JSON.parse(text); setStatus('Valid JSON', 'ok'); render(); return true; }
    catch (e) { data = undefined; render(explain(e, text)); setStatus('Invalid JSON', 'bad'); return false; }
  }

  const esc = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  function hl(text) {
    const t = esc(text);
    if (!query) return t;
    const q = esc(query).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return t.replace(new RegExp(q, 'gi'), (m) => `<mark>${m}</mark>`);
  }
  const isObj = (v) => v !== null && typeof v === 'object';
  function matches(k, v) {
    if (!query) return true;
    const q = query.toLowerCase();
    if (String(k).toLowerCase().includes(q)) return true;
    if (isObj(v)) return Object.entries(v).some(([ck, cv]) => matches(ck, cv));
    return String(v).toLowerCase().includes(q);
  }
  function copyBtn(v) {
    const b = document.createElement('button'); b.className = 'cp'; b.textContent = 'Copy'; b.type = 'button';
    b.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation();
      copy(typeof v === 'string' ? v : JSON.stringify(v, null, 2), 'Value copied'); });
    return b;
  }
  function valueHtml(v) {
    if (v === null) return '<span class="z">null</span>';
    if (typeof v === 'string') return `<span class="s">"${hl(v)}"</span>`;
    if (typeof v === 'number') return `<span class="n">${hl(String(v))}</span>`;
    return `<span class="b">${v}</span>`;
  }
  function node(key, v, root) {
    if (!matches(key, v) && !root) return null;
    const label = root ? '' : `<span class="k">${typeof key === 'number' ? key : '"' + hl(String(key)) + '"'}</span>: `;
    if (!isObj(v)) {
      const row = document.createElement('div'); row.className = 'row';
      row.innerHTML = label + valueHtml(v); row.appendChild(copyBtn(v)); return row;
    }
    const arr = Array.isArray(v), entries = Object.entries(v);
    const d = document.createElement('details'); d.open = !!query || root || false;
    const s = document.createElement('summary');
    s.innerHTML = `${label}${arr ? '[' : '{'}<span class="meta">${entries.length} ${arr ? 'items' : 'keys'}</span>`;
    s.appendChild(copyBtn(v)); d.appendChild(s);
    entries.forEach(([k, c]) => { const n = node(arr ? Number(k) : k, c); if (n) d.appendChild(n); });
    return d;
  }

  function measure(v, a) {
    a.values++;
    if (Array.isArray(v)) { a.arrays++; v.forEach((c) => measure(c, a)); }
    else if (isObj(v)) { a.objects++; Object.entries(v).forEach(([k, c]) => { a.keys++; measure(c, a); }); }
    return a;
  }
  function render(error) {
    tree.innerHTML = '';
    if (error) { stats.hidden = true; empty.hidden = true; const e = document.createElement('div'); e.className = 'err'; e.textContent = error; tree.appendChild(e); return; }
    if (data === undefined) { stats.hidden = true; empty.hidden = false; return; }
    empty.hidden = true; stats.hidden = false;
    const a = measure(data, { keys: 0, objects: 0, arrays: 0, values: 0 });
    const bytes = new Blob([JSON.stringify(data)]).size;
    const size = bytes < 1024 ? bytes + ' B' : (bytes / 1024).toFixed(1) + ' KB';
    stats.innerHTML = [['Keys', a.keys], ['Objects', a.objects], ['Arrays', a.arrays], ['Values', a.values], ['Size', size]]
      .map(([l, n]) => `<span>${l} <b>${n}</b></span>`).join('');
    const n = node('', data, true);
    if (n) tree.appendChild(n);
    if (!n || (query && !tree.querySelector('mark'))) { if (query) { tree.innerHTML = '<div class="err" style="color:var(--dim)">No keys or values match that search.</div>'; } }
  }

  async function copy(text, msg) {
    try { await navigator.clipboard.writeText(text); toast(msg); }
    catch { ed.select(); toast('Press Ctrl+C to copy'); }
  }
  function load(text) { ed.value = text; lines(); parse(); }

  $('#btn-format').addEventListener('click', () => { if (parse()) { ed.value = JSON.stringify(data, null, 2); lines(); toast('Formatted'); } });
  $('#btn-minify').addEventListener('click', () => { if (parse()) { ed.value = JSON.stringify(data); lines(); toast('Minified'); } });
  $('#btn-copy').addEventListener('click', () => ed.value && copy(ed.value, 'JSON copied'));
  $('#btn-clear').addEventListener('click', () => { ed.value = ''; search.value = ''; query = ''; lines(); parse(); ed.focus(); });
  $('#btn-import').addEventListener('click', () => $('#file').click());
  $('#file').addEventListener('change', (e) => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader(); r.onload = () => load(String(r.result)); r.onerror = () => setStatus('Could not read file', 'bad'); r.readAsText(f); e.target.value = '';
  });
  $('#examples').addEventListener('change', (e) => { if (EXAMPLES[e.target.value]) load(JSON.stringify(EXAMPLES[e.target.value], null, 2)); e.target.value = ''; });
  $('#btn-expand').addEventListener('click', () => tree.querySelectorAll('details').forEach((d) => (d.open = true)));
  $('#btn-collapse').addEventListener('click', () => tree.querySelectorAll('details').forEach((d, i) => (d.open = i === 0)));
  search.addEventListener('input', () => { query = search.value.trim(); if (data !== undefined) render(); });
  ed.addEventListener('input', () => { lines(); parse(); });
  ed.addEventListener('scroll', () => (gutter.scrollTop = ed.scrollTop));
  ed.addEventListener('keydown', (e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') $('#btn-format').click(); });
  ['dragover', 'drop'].forEach((t) => document.addEventListener(t, (e) => {
    e.preventDefault(); if (t === 'drop' && e.dataTransfer.files[0]) { const r = new FileReader(); r.onload = () => load(String(r.result)); r.readAsText(e.dataTransfer.files[0]); }
  }));

  const root = document.documentElement;
  const saved = (() => { try { return localStorage.getItem('jsonlens-theme'); } catch { return null; } })();
  root.dataset.theme = saved || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  $('#btn-theme').addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('jsonlens-theme', root.dataset.theme); } catch { /* storage unavailable */ }
  });
  lines(); render();
})();
