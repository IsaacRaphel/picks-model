/* 3D model map. pkMap(root, games, lessons, v1) draws a rotating map of how the model works, built from the live data. */
window.pkMap = function (root, games, lessons, v1) {
  const C = { navy: '#8aa4ff', sky: '#54b7e8', green: '#5fd06a', red: '#ff6b6b', amber: '#ffb547', gray: '#93a0b3', ink: '#eaf0f8', v1: '#c08bff', line: '#7c8db0', space: '#070b1c' };
  const STARS = Array.from({ length: 240 }, (_, i) => { const r = (n) => { const x = Math.sin(i * 127.1 + n * 311.7) * 43758.5453; return x - Math.floor(x); }; return { u: r(1), v: r(2), d: 0.15 + r(3) * 0.85, s: 0.4 + r(4) * 1.3, p: r(5) * 6.28 }; });
  const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
  const fmtD = (d) => new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const pct = (w, l) => (w + l ? Math.round(100 * w / (w + l)) + '%' : 'n/a');
  games = (games || []).filter((g) => g && g.date);
  lessons = (lessons || []).filter((l) => l && /^L\d+/.test(l.id || '') && !/^parlay/i.test(l.situation || ''));
  const days = [...new Set(games.map((g) => g.date))].sort();
  if (!days.length) { root.textContent = 'No data yet.'; return; }

  // ---------- layout ----------
  const ring = (n, i, r, off, span) => [(n > 1 ? (0.5 - i / (n - 1)) : 0) * (span || 400), Math.sin((off || 0) + i * 2.4) * r];
  const SRC = [['dk', 'DraftKings'], ['fd', 'FanDuel'], ['ka', 'Kalshi'], ['rt', 'Rating systems'], ['inj', 'Injury reports'], ['sch', 'Schedules'], ['pub', 'Public betting splits'], ['wx', 'Weather']];
  const INP = [
    ['ratings', 'Team ratings', 'rating_line', 'The spread that public rating systems (Torvik, FPI, SP+, net rating) imply on their own. This is the starting point for every game.', ['rt']],
    ['home', 'Home edge', 'home_edge', 'Points of home advantage used for the game. Zero at a neutral site.', ['rt']],
    ['rest', 'Rest days', 'rest_home', 'Days since each team last played.', ['sch']],
    ['b2b', 'Back-to-backs', 'b2b_home', 'Whether a team is on the second night of a back-to-back, or a short week in football.', ['sch']],
    ['out', 'Key players out', 'key_out_home', 'How many key players each team is missing, from the latest injury report.', ['inj']],
    ['qb', 'QB change', 'qb_change', 'Football only: whether a team is starting a different quarterback than usual.', ['inj']],
    ['travel', 'Travel', 'travel_tz', 'Time zones the road team crossed to get to the game.', ['sch']],
    ['early', 'Early-season sample', 'games_played_home', 'How many games each team has played. Early on, results are noisy and track record matters more.', ['rt']],
    ['sos', 'Schedule strength', 'sos_rank_home', 'How hard each team’s schedule has been, so a record built on weak opponents isn’t overrated.', ['rt']],
    ['open', 'Market line', 'open_line_home', 'The opening spread, tracked through the day at DraftKings, FanDuel and Kalshi.', ['dk', 'fd', 'ka']],
    ['public', 'Public bets', 'public_bets_pct_home', 'The share of bets on each side. Used as a tiebreaker, never the main reason.', ['pub']],
    ['form', 'Recent form', 'last5_margin_home', 'Average scoring margin over the last 5 games. Added Nov 17 to test whether hot and cold stretches matter.', ['sch']],
    ['streak', 'Streaks', 'streak_home', 'Current winning or losing streak. Added Nov 17 to test momentum and bounce-backs.', ['sch']],
    ['weather', 'Football weather', 'temp_f', 'Temperature, wind and snow or rain for outdoor football, plus whether the road team is from a dome or warm city. Added Nov 17.', ['wx']],
  ];
  const N = [], E = [], byId = {};
  const node = (o) => { N.push(o); byId[o.id] = o; return o; };
  const edge = (a, b, o) => E.push(Object.assign({ a, b }, o || {}));
  SRC.forEach(([id, name], i) => { const [y, z] = ring(SRC.length, i, 120, 0.4, 330); node({ id, name, kind: 'Data source', group: 'src', x: -450, y, z, r: 7, color: C.gray, desc: 'Collected automatically every morning and refreshed through the day.' }); });
  INP.forEach(([id, name, key, desc, srcs], i) => { const [y, z] = ring(INP.length, i, 150, 0.2, 440); node({ id, name, kind: 'Input', group: 'inp', key, x: -265, y, z, r: 9, color: C.sky, desc }); srcs.forEach((s) => edge(s, id)); });
  node({ id: 'base', name: 'Rating baseline', kind: 'Core step', group: 'core', x: -95, y: 55, z: 0, r: 15, color: C.navy, desc: 'Every forecast starts from the spread the public ratings imply, so the baseline is consistent and testable.' });
  node({ id: 'raw', name: 'Raw model line', kind: 'Core step', group: 'core', x: -40, y: -45, z: 0, r: 18, color: C.navy, desc: 'The baseline adjusted for injuries, rest, travel and matchup. This is the model’s own number before any lesson is applied.' });
  node({ id: 'pick', name: 'Pick on every game', kind: 'Decision', group: 'dec', x: 265, y: -40, z: 0, r: 17, color: C.green, desc: 'Every game gets a side so the dataset stays complete, even when the edge is tiny.' });
  node({ id: 'official', name: 'Official plays', kind: 'Decision', group: 'dec', x: 330, y: 70, z: 0, r: 15, color: C.green, desc: 'The few games a day where the model’s number differs enough from the market, with no red flags. This is the record that counts.' });
  node({ id: 'clv', name: 'Closing line check', kind: 'Grading', group: 'chk', x: 440, y: -95, z: 60, r: 13, color: C.navy, desc: 'Did the pick get a better number than where the market closed? Beating the close is the best early sign of a sharp model.' });
  node({ id: 'result', name: 'Graded result', kind: 'Grading', group: 'chk', x: 455, y: 20, z: -40, r: 15, color: C.navy, desc: 'Every game is graded overnight against the exact line that was picked.' });
  node({ id: 'review', name: 'Nightly review', kind: 'Feedback loop', group: 'fb', x: 200, y: 275, z: 0, r: 14, color: C.amber, desc: 'Each night the model reviews its misses, separates bad luck from bad reads, and turns repeated patterns into new lessons to test.' });
  node({ id: 'v1', name: 'Formula v1', kind: 'Formula', group: 'v1', x: 60, y: -285, z: 0, r: 24, color: C.v1, desc: '' });
  lessons.forEach((l, i) => { const [y, z] = ring(lessons.length, i, 130, 0, 400); node({ id: l.id, name: l.id, kind: 'Lesson', group: 'les', les: l, x: 110, y, z, r: 6, color: C.amber, desc: l.lesson }); edge('raw', l.id, { thin: 1 }); edge(l.id, 'pick', { thin: 1 }); edge('review', l.id, { thin: 1, fb: 1 }); });
  ['ratings', 'home'].forEach((i) => edge(i, 'base'));
  edge('base', 'raw', { strong: 1 });
  INP.forEach(([id]) => { if (id !== 'ratings' && id !== 'home') edge(id, 'raw'); edge(id, 'v1', { v1: 1, inp: id }); });
  edge('raw', 'pick', { strong: 1 }); edge('pick', 'official', { strong: 1 }); edge('pick', 'clv'); edge('pick', 'result', { strong: 1 }); edge('official', 'result');
  edge('result', 'review', { fb: 1, strong: 1 }); edge('clv', 'review', { fb: 1 }); edge('v1', 'official', { v1: 1, out: 1 }); edge('result', 'v1', { v1: 1, fb: 1 });

  // ---------- stats as of a date ----------
  let asof = days[days.length - 1], live = !!v1;
  const rec = (rows) => { const w = rows.filter((r) => r === 'W').length, l = rows.filter((r) => r === 'L').length, p = rows.filter((r) => r === 'P').length; return { w, l, p, s: w + '-' + l + (p ? '-' + p : '') }; };
  let S = {};
  function compute() {
    const G = games.filter((g) => g.date <= asof), last = asof === days[days.length - 1];
    const gr = G.filter((g) => ['W', 'L', 'P'].includes(g.spread_result));
    const F = G.filter((g) => g.features && typeof g.features === 'object');
    const cl = gr.map((g) => g.clv).filter((c) => typeof c === 'number');
    S = { G, gr, F, all: rec(gr.map((g) => g.spread_result)), off: rec(gr.filter((g) => g.official === true).map((g) => g.spread_result)), offN: G.filter((g) => g.official === true).length,
      clvN: cl.length, clvUp: cl.filter((c) => c > 0).length, clvDn: cl.filter((c) => c < 0).length, clvAvg: cl.length ? cl.reduce((a, b) => a + b, 0) / cl.length : null };
    const v1Games = G.filter((g) => g.features && g.features.v1_side);
    S.v1Live = live && v1Games.length > 0 || (live && asof >= ((v1 && v1.built) || '9999'));
    const v1in = {}; if (v1 && Array.isArray(v1.inputs)) v1.inputs.forEach((inp) => { const keys = [].concat(inp.features || inp.feature || []); const c = Math.abs(+inp.coefficient || 0); INP.forEach(([id, , key]) => { const stem = key.replace(/_(home|away)$/, ''); if (keys.some((k) => String(k).indexOf(stem) === 0) || String(inp.name || '').toLowerCase().indexOf(stem.replace(/_/g, ' ')) >= 0) v1in[id] = Math.max(v1in[id] || 0, c || 0.0001); }); });
    S.v1in = v1in; const mx = Math.max(0.0001, ...Object.values(v1in)); S.v1w = (id) => (v1in[id] ? v1in[id] / mx : 0);
    N.forEach((n) => {
      n.show = true; n.hollow = false; n.prog = null;
      if (n.group === 'inp') { const c = S.F.filter((g) => g.features[n.key] !== null && g.features[n.key] !== undefined && g.features[n.key] !== '').length; n.cov = c; n.covN = S.F.length; n.hollow = c === 0; n.r = c === 0 ? 7 : 8 + 7 * Math.sqrt(c / Math.max(1, S.F.length)); }
      if (n.group === 'les') { const l = n.les; n.show = !l.added || l.added <= asof; const tag = gr.filter((g) => (g.lessons_applied || '').split(',').map((x) => x.trim()).includes(l.id)).map((g) => g.spread_result); let r = rec(tag); if (last) r = { w: +l.wins || 0, l: +l.losses || 0, p: +l.pushes || 0, s: (+l.wins || 0) + '-' + (+l.losses || 0) + ((+l.pushes) ? '-' + l.pushes : '') }; n.rec = r; const k = r.w + r.l; n.prog = Math.min(1, k / 50); n.r = 6 + 6 * n.prog; const st = last ? l.status : 'Testing'; n.status = st; n.color = st === 'Keep' ? C.green : st === 'Dropped' ? C.red : C.amber; }
      if (n.id === 'v1') { n.hollow = !S.v1Live; n.color = C.v1; }
    });
  }

  // ---------- dom ----------
  root.textContent = ''; root.classList.add('pkmap');
  const head = el('div', 'pkmap-head'); const stage = el('div', 'pkmap-stage'); head.append(stage);
  const ctr = el('div', 'pkmap-ctr');
  const play = el('button', 'pkmap-btn', '▶ Replay growth'); play.type = 'button';
  const slider = el('input'); slider.type = 'range'; slider.min = 0; slider.max = days.length - 1; slider.value = days.length - 1; slider.setAttribute('aria-label', 'Show the model as of this date');
  const dlab = el('span', 'pkmap-date');
  const zin = el('button', 'pkmap-btn', '+'), zout = el('button', 'pkmap-btn', '−'), spin = el('button', 'pkmap-btn', 'Pause'); [zin, zout, spin].forEach((b) => { b.type = 'button'; }); zin.setAttribute('aria-label', 'Zoom in'); zout.setAttribute('aria-label', 'Zoom out');
  ctr.append(play, slider, dlab, zout, zin, spin); head.append(ctr);
  const body = el('div', 'pkmap-body'); const wrap = el('div', 'pkmap-canvas'); const cv = document.createElement('canvas'); wrap.append(cv); const hint = el('div', 'pkmap-hint', 'Drag to rotate · tap any dot for details'); wrap.append(hint);
  const panel = el('div', 'pkmap-panel'); body.append(wrap, panel);
  const legend = el('div', 'pkmap-legend');
  [[C.gray, 'Data sources'], [C.sky, 'Inputs (bigger = more data logged)'], [C.navy, 'Core steps and grading'], [C.amber, 'Lessons being tested (ring = progress to 50 picks)'], [C.green, 'Decisions and kept lessons'], [C.red, 'Dropped lessons'], [C.v1, 'Formula v1']].forEach(([c, t]) => { const s = el('span'); const d = el('i'); d.style.background = c; s.append(d, t); legend.append(s); });
  root.append(head, body, legend);
  const ctx = cv.getContext('2d');

  // ---------- camera ----------
  let yaw = -0.35, pitch = 0.12, zoom = 1, W = 0, H = 0, auto = !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches), t0 = performance.now(), sel = null, dragging = false, moved = 0, lx = 0, ly = 0, userYaw = 0;
  function size() { const r = wrap.getBoundingClientRect(); W = Math.max(280, r.width); H = W < 560 ? 430 : Math.min(640, Math.max(480, W * 0.62)); const d = window.devicePixelRatio || 1; cv.width = W * d; cv.height = H * d; cv.style.height = H + 'px'; ctx.setTransform(d, 0, 0, d, 0, 0); }
  function proj(x, y, z) { const ca = Math.cos(yaw), sa = Math.sin(yaw), cb = Math.cos(pitch), sb = Math.sin(pitch); const x1 = x * ca + z * sa, z1 = -x * sa + z * ca; const y1 = y * cb - z1 * sb, z2 = y * sb + z1 * cb; const D = 1500, k = (D / (D - z2)) * zoom * (W / (W < 560 ? 1450 : 1400)); return [W / 2 + (x1 - 15) * k, H / 2 - y1 * k + 6, k, z2]; }
  const bez = (a, b, c, t) => { const u = 1 - t; return [u * u * a.x + 2 * u * t * c[0] + t * t * b.x, u * u * a.y + 2 * u * t * c[1] + t * t * b.y, u * u * a.z + 2 * u * t * c[2] + t * t * b.z]; };
  function ctrl(e, a, b) { if (e.fb) return [(a.x + b.x) / 2 + 40, Math.max(a.y, b.y) + 120, (a.z + b.z) / 2 + 150]; if (e.v1) return [(a.x + b.x) / 2, Math.min(a.y, b.y) - 30, (a.z + b.z) / 2]; return [(a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2]; }
  const tok = {}; root._pkTok = tok;
  function draw(now) {
    if (root._pkTok !== tok || !root.isConnected) return;
    const t = (now - t0) / 1000; if (auto && !dragging) yaw = userYaw + -0.35 + Math.sin(t * 0.22) * 0.55;
    ctx.clearRect(0, 0, W, H);
    STARS.forEach((st) => { const x = (((st.u + yaw * 0.12 * st.d) % 1) + 1) % 1 * W, y = (((st.v - pitch * 0.1 * st.d) % 1) + 1) % 1 * H; ctx.globalAlpha = (0.35 + 0.65 * st.d) * (auto ? 0.75 + 0.25 * Math.sin(t * 1.3 + st.p) : 0.9); ctx.fillStyle = st.p > 5.4 ? '#ffd9a8' : st.p < 0.9 ? '#a8d4ff' : '#ffffff'; ctx.beginPath(); ctx.arc(x, y, st.s * (0.5 + st.d * 0.6), 0, 7); ctx.fill(); }); ctx.globalAlpha = 1;
    const P = {}; N.forEach((n) => { P[n.id] = proj(n.x, n.y, n.z); });
    const focus = sel ? new Set([sel.id]) : null; if (sel) E.forEach((e) => { if (e.a === sel.id) focus.add(e.b); if (e.b === sel.id) focus.add(e.a); });
    // edges
    E.forEach((e, i) => {
      const a = byId[e.a], b = byId[e.b]; if (!a.show || !b.show) return;
      let alpha = e.thin ? 0.2 : e.strong ? 0.7 : 0.4, lw = e.strong ? 1.8 : 1, col = C.line, dash = null;
      if (e.fb) col = C.amber; if (e.v1) { col = C.v1; dash = S.v1Live ? null : [4, 5]; alpha = 0.4; if (S.v1Live && e.inp) { const w = S.v1w(e.inp); alpha = w ? 0.35 + 0.5 * w : 0.06; lw = w ? 1 + 4 * w : 0.6; } if (S.v1Live && !e.inp) { alpha = 0.7; lw = 2; } }
      const hot = sel && (e.a === sel.id || e.b === sel.id); if (sel && !hot) alpha *= 0.35; if (hot) { alpha = Math.max(alpha, 0.85); lw += 0.8; if (!e.fb && !e.v1) col = '#ffffff'; }
      const c = ctrl(e, a, b); ctx.beginPath(); for (let s = 0; s <= 14; s++) { const p = bez(a, b, c, s / 14), q = proj(p[0], p[1], p[2]); if (s) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); }
      ctx.globalAlpha = alpha; ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.setLineDash(dash || []); ctx.stroke(); ctx.setLineDash([]);
      if (auto && (!e.thin || hot) && !(e.v1 && !S.v1Live)) { const tt = (t * (e.fb ? 0.16 : 0.24) + i * 0.137) % 1, p = bez(a, b, c, tt), q = proj(p[0], p[1], p[2]); ctx.globalAlpha = Math.min(1, alpha + 0.4); ctx.fillStyle = e.fb ? C.amber : e.v1 ? C.v1 : C.sky; ctx.beginPath(); ctx.arc(q[0], q[1], 2.2 * q[2] + 0.6, 0, 7); ctx.fill(); }
    });
    // nodes back to front
    const order = N.filter((n) => n.show).sort((a, b) => P[a.id][3] - P[b.id][3]); const small = W < 560;
    order.forEach((n) => {
      const p = P[n.id], r = Math.max(3, n.r * p[2]); n.sx = p[0]; n.sy = p[1]; n.sr = r;
      const dim = sel && !focus.has(n.id); ctx.globalAlpha = dim ? 0.45 : 1;
      if (n.id === 'v1') { const pulse = auto ? 1 + 0.08 * Math.sin(t * 2) : 1; ctx.globalAlpha = (dim ? 0.3 : 0.6) * 0.3; ctx.fillStyle = C.v1; ctx.beginPath(); ctx.arc(p[0], p[1], r * 1.55 * pulse, 0, 7); ctx.fill(); ctx.globalAlpha = dim ? 0.45 : 1; }
      ctx.beginPath(); ctx.arc(p[0], p[1], r, 0, 7);
      if (n.hollow) { ctx.fillStyle = C.space; ctx.fill(); ctx.setLineDash([3, 3]); ctx.strokeStyle = n.color; ctx.lineWidth = 1.6; ctx.stroke(); ctx.setLineDash([]); } else { const g = ctx.createRadialGradient(p[0] - r * 0.35, p[1] - r * 0.4, r * 0.1, p[0], p[1], r); g.addColorStop(0, '#ffffff'); g.addColorStop(0.25, n.color); g.addColorStop(1, n.color); ctx.fillStyle = g; ctx.fill(); }
      if (n.prog != null) { ctx.strokeStyle = n.color; ctx.globalAlpha = (dim ? 0.45 : 1) * 0.3; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p[0], p[1], r + 3.5, 0, 7); ctx.stroke(); ctx.globalAlpha = dim ? 0.45 : 1; ctx.beginPath(); ctx.arc(p[0], p[1], r + 3.5, -Math.PI / 2, -Math.PI / 2 + n.prog * Math.PI * 2); ctx.stroke(); }
      if (sel === n) { ctx.strokeStyle = C.ink; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p[0], p[1], r + (n.prog != null ? 7 : 4), 0, 7); ctx.stroke(); }
      const big = n.group !== 'les' && n.group !== 'src'; const quiet = small && n.group === 'inp'; if (small && (!big || quiet) && sel !== n && !(focus && focus.has(n.id) && n.group === 'src')) { ctx.globalAlpha = 1; return; }
      ctx.font = (big ? '600 ' : '500 ') + Math.round((n.group === 'les' ? 10 : big ? 12.5 : 11) * (small ? 0.9 : 1)) + 'px Inter, system-ui, sans-serif'; ctx.fillStyle = C.ink; ctx.globalAlpha = dim ? 0.45 : n.group === 'les' ? 0.85 : 1;
      const left = n.group === 'src'; ctx.textAlign = left ? 'right' : n.group === 'les' ? 'center' : 'left'; ctx.textBaseline = 'middle';
      if (n.group === 'les') { ctx.textAlign = 'left'; ctx.fillText(n.name, p[0] + r + 7, p[1]); } else { const tx = p[0] + (left ? -(r + 6) : r + 6); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(7,11,28,.85)'; ctx.strokeText(n.name, tx, p[1]); ctx.fillText(n.name, tx, p[1]); }
      ctx.globalAlpha = 1;
    });
    requestAnimationFrame(draw);
  }

  // ---------- panel ----------
  function line(k, v) { const p = el('p', 'pkmap-row'); p.append(el('span', null, k), el('b', null, v)); return p; }
  function showPanel() {
    panel.textContent = ''; const n = sel; if (!n) { panel.append(el('p', 'pkmap-muted', 'This is a live map of how the model works. Data flows left to right: sources, inputs, the model\u2019s line, lessons, picks and grading. The orange loop feeds results back into new lessons. Tap any dot to see what it is and what the data says about it.')); return; }
    const k = el('span', 'pkmap-kind', n.kind); k.style.color = ({ src: '#5f666e', inp: '#1f7fb3', core: '#224f6a', dec: '#3a9a4a', chk: '#224f6a', fb: '#b7791f', v1: '#7a4fb5', les: n.status === 'Keep' ? '#3a9a4a' : n.status === 'Dropped' ? '#c94545' : '#b7791f' })[n.group]; panel.append(k, el('h3', null, n.group === 'les' ? n.id + ': ' + (n.les.situation || 'Lesson') : n.name));
    if (n.id === 'v1') {
      if (S.v1Live && v1) { panel.append(el('p', null, 'Formula v1 is live. It was built on ' + fmtD(v1.built || asof) + ' from the logged data and now runs on new games without changes. Thicker purple lines mean an input carries more weight.'));
        (v1.inputs || []).forEach((i) => panel.append(line(i.name || String(i.features || ''), (i.coefficient > 0 ? '+' : '') + (+i.coefficient).toFixed(2)))); if (v1.official_rule) panel.append(el('p', 'pkmap-muted', 'Official plays: ' + (typeof v1.official_rule === 'string' ? v1.official_rule : JSON.stringify(v1.official_rule))));
      } else { panel.append(el('p', null, 'Not built yet. The target is December 7. On that date the logged inputs get fit into one written formula, tested against simple baselines, and then run on new games without changes.'), el('p', null, 'The dashed purple lines show which inputs could feed it. Once it’s built, they turn solid and their thickness shows how much each input counts.'), line('Games with full inputs so far', String(S.F.filter((g) => ['W', 'L', 'P'].includes(g.spread_result)).length)), line('Lessons that passed the tests', String(lessons.filter((l) => l.status === 'Keep').length))); }
    } else {
      panel.append(el('p', null, n.desc));
      if (n.group === 'inp') { panel.append(line('Logged on', n.cov + ' of ' + n.covN + ' games')); if (!n.cov) panel.append(el('p', 'pkmap-muted', 'Just added. It fills in as new games are logged.')); if (S.v1Live) panel.append(line('In Formula v1', S.v1in[n.id] ? 'Yes' : 'No')); }
      if (n.group === 'les') { const r = n.rec, kk = r.w + r.l; panel.append(line('Status', n.status), line('Record', r.s + (kk ? ' (' + pct(r.w, r.l) + ')' : '')), line('Progress', kk + ' of 50 picks needed'), line('Added', n.les.added ? fmtD(n.les.added) : '')); panel.append(el('p', 'pkmap-muted', 'A lesson is kept only if it beats break-even at 50+ picks after a correction for testing many ideas at once.')); }
      if (n.id === 'pick') panel.append(line('Games logged', String(S.G.length)), line('Against the spread', S.all.s + ' (' + pct(S.all.w, S.all.l) + ')'));
      if (n.id === 'official') panel.append(line('Official plays so far', String(S.offN)), line('Record', S.off.s + (S.off.w + S.off.l ? ' (' + pct(S.off.w, S.off.l) + ')' : '')));
      if (n.id === 'clv') panel.append(line('Beat the close', S.clvUp + ' picks'), line('Worse than the close', S.clvDn + ' picks'), line('Average', S.clvAvg == null ? 'n/a' : (S.clvAvg >= 0 ? '+' : '') + S.clvAvg.toFixed(2) + ' pts'));
      if (n.id === 'result') panel.append(line('Games graded', String(S.gr.length)));
      if (n.id === 'review') panel.append(line('Lessons created so far', String(N.filter((x) => x.group === 'les' && x.show).length)));
      if (n.id === 'base' || n.id === 'raw') panel.append(line('Games with ratings logged', String(S.F.length)));
    }
  }
  function refresh() { compute(); const les = N.filter((x) => x.group === 'les' && x.show); stage.textContent = ''; stage.append(el('b', null, S.v1Live ? 'Stage: Formula v1 live' : 'Stage: collecting data'), ' · ' + S.G.length + ' games logged · ' + les.length + ' lessons · ' + (S.v1Live ? 'out-of-sample test running' : 'Formula v1 target Dec 7')); dlab.textContent = 'As of ' + fmtD(asof); if (sel && !sel.show) sel = null; showPanel(); }

  // ---------- events ----------
  const pos = (ev) => { const r = cv.getBoundingClientRect(); return [ev.clientX - r.left, ev.clientY - r.top]; };
  cv.addEventListener('pointerdown', (ev) => { dragging = true; moved = 0; [lx, ly] = pos(ev); try { cv.setPointerCapture(ev.pointerId); } catch (e) {} });
  cv.addEventListener('pointermove', (ev) => { if (!dragging) return; const [x, y] = pos(ev); const dx = x - lx, dy = y - ly; moved += Math.abs(dx) + Math.abs(dy); if (moved > 4) { if (auto) { userYaw = yaw + 0.35; auto = false; spin.textContent = 'Play'; } yaw += dx * 0.006; pitch = Math.max(-0.9, Math.min(0.9, pitch + dy * 0.004)); hint.style.opacity = 0; } lx = x; ly = y; });
  cv.addEventListener('pointerup', (ev) => { dragging = false; if (moved > 4) return; const [x, y] = pos(ev); let best = null, bd = 1e9; N.forEach((n) => { if (!n.show) return; const d = Math.hypot(n.sx - x, n.sy - y) - n.sr; if (d < 12 && d < bd) { bd = d; best = n; } }); sel = best; showPanel(); });
  cv.style.touchAction = 'pan-y'; cv.style.cursor = 'grab';
  zin.onclick = () => { zoom = Math.min(2.2, zoom * 1.2); }; zout.onclick = () => { zoom = Math.max(0.6, zoom / 1.2); };
  spin.onclick = () => { auto = !auto; if (auto) { userYaw = 0; t0 = performance.now(); } spin.textContent = auto ? 'Pause' : 'Play'; };
  slider.oninput = () => { asof = days[+slider.value]; refresh(); };
  let timer = null; play.onclick = () => { if (timer) { clearInterval(timer); timer = null; play.textContent = '▶ Replay growth'; return; } let i = 0; play.textContent = '■ Stop'; timer = setInterval(() => { slider.value = i; asof = days[i]; refresh(); if (++i >= days.length) { clearInterval(timer); timer = null; play.textContent = '▶ Replay growth'; } }, 450); };
  if (window.ResizeObserver) new ResizeObserver(size).observe(wrap); else window.addEventListener('resize', size);
  size(); refresh(); requestAnimationFrame(draw);
};
