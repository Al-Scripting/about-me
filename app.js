/* =========================================================
   AL SHIFAN · Portfolio app logic
   - Scroll reveal + scroll-spy nav + mobile menu
   - GitHub API: profile avatar (feed), latest pushed repo
   - README renderer (libs loaded on first open): raw README
     -> marked -> DOMPurify -> highlight.js; images/links rebased
     to the repo's raw.githubusercontent.com / github.com HEAD roots
   - LinkedIn feed: curated posts, admin-editable, localStorage
   - Admin mode: SHA-256 password gate (client-side)
   ========================================================= */

// ----- CONFIG -----
const CONFIG = {
  githubUser: 'Al-Scripting',
  // SHA-256 of the admin password. Default = sha256("password").
  defaultHash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
};

// ----- STORAGE KEYS -----
const STORE_KEYS = {
  posts: 'al.feed.posts',
  hash: 'al.adminHash',
  session: 'al.session',
};

// ----- DEFAULT POSTS (research-facing, recruiter-friendly) -----
const DEFAULT_POSTS = [
  {
    id: 'p0',
    author: 'Al Muqshith Shifan',
    role: 'Code & Sorcery Lab',
    time: 'Sep 2026',
    content: "Late night in the lab. We make a last-minute video for our CHI 2027 submission. Four people, one laptop, one deadline.",
    image: 'assets/lab-chi27.webp',
    imageAlt: 'Four members of Code & Sorcery Lab in the lab at night, one at a laptop with the video script open',
    link: 'https://youtu.be/xPYE_X-sH0Q',
    linkLabel: 'Watch the Video',
    tags: '#CHI2027 #CodeAndSorceryLab #GameAI #Research',
  },
  {
    id: 'p1',
    author: 'Al Muqshith Shifan',
    role: 'MSc CS · First author',
    time: 'Summer 2026',
    content: "I presented RIDGE at IEEE CoG 2026 in Madrid as a short paper. I am the main author. 🎓\n\nRIDGE (Reactive Inter-persona Dynamic Goal Engine) trains one PPO agent to blend four persona rewards: Explorer, Survivor, Craftsman, and Warrior. Smooth sigmoid functions over the game state set the blend. One agent changes its play style in one episode. There is no need to train one agent for each persona.\n\nHighlights:\n• A multi-head critic keeps each value head on a stable reward\n• RIDGE is the only condition that reaches both wood-tier crafting branches on Crafter\n• Value loss stays at about 0.04 across 1M steps\n\nWith Kevin Christopher Chua, Ali Neshati, Loutfouz Zaman, and Cristiano Politowski. Code and camera-ready paper: Code-SorceryLab/RIDGE",
    tags: '#IEEE #CoG2026 #DeepRL #PPO #GameAI #MachineLearning',
  },
  {
    id: 'p2',
    author: 'Al Muqshith Shifan',
    role: 'Systematic Mapping Study',
    time: 'In progress',
    content: "I am deep in a systematic mapping study: Emotional Memory in LLM-Driven Non-Player Characters.\n\nThe result so far: the standard memory stream ranks the past by recency, importance, and relevance. It does not use emotion. Psychology says that emotion is one of the forces that decides what we keep and what comes back.\n\nOf 30 primary studies (from 66 screened): fewer than half link emotion to memory, only 9 base that link on a psychological method, and only 3 do both. None evaluates inside a commercial game. None reports latency or token cost.\n\nThe map shows where the next build must go.",
    tags: '#LLM #NPC #AffectiveComputing #SystematicReview #GameAI',
  },
  {
    id: 'p3',
    author: 'Al Muqshith Shifan',
    role: 'Code & Sorcery Lab',
    time: '2026',
    content: "I am building TAST (Trait Activation Steering).\n\nSmall local models drift. Twenty turns into a conversation, the dwarf blacksmith starts to explain that it is an AI assistant. TAST works at the activation level. It uses cartridges, capping, linear axes, and a rotational dial to keep authored persona traits stable. It does not fine-tune the model. It does not touch the prompt.\n\nI measure everything on a 20-turn adversarial benchmark. Three local LLMs through Ollama judge the results. Every number points to a session JSON on disk.",
    tags: '#LLM #ActivationSteering #Interpretability #GameNPC #Research',
  },
  {
    id: 'p4',
    author: 'Al Muqshith Shifan',
    role: 'PEAK · Research',
    time: '2026',
    content: "PEAK continues to grow. It is a deterministic, high-performance 2D platformer engine for benchmarks of Deep RL agents.\n\n• Custom SMB1-style physics, fully reproducible\n• Dual spatial hashing: O(C) collision queries, more than 1000 env steps per second\n• 11 progressive stages, ASCII level format\n• Modular 'persona' reward system for different play styles\n• Real-time debug overlays that show what the agent sees\n\nDesign a level and train an agent in the same tool.",
    tags: '#ReinforcementLearning #GameEngine #Benchmarking #OpenSource',
  },
  {
    id: 'p5',
    author: 'Al Muqshith Shifan',
    role: 'HackHive 2026 · Team CSS',
    time: 'Jan 2026',
    content: "We built Gestura at HackHive 2026. It is a real-time, AI body-mapping tool for telehealth. No wearables, no special hardware, only a webcam.\n\nIt is hard to describe pain. Language barriers, physical limits, and the lack of touch in video calls cause wrong diagnoses. Gestura turns gestures into structured clinical data on a 3D digital twin. Gemini turns that data into SOAP-style summaries for the clinician.\n\nTechnology must make healthcare more human, not less.\n\nTeam CSS (Code & Sorcery Students): Kevin Christopher Chua, Alex Lowe, Adrian Fudge, and I.",
    tags: '#Hackathon #ComputerVision #Telehealth #Gemini #ThreeJS',
  },
];

const State = {
  posts: load(STORE_KEYS.posts, DEFAULT_POSTS),
};

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : structuredClone(fallback);
  } catch (e) { return structuredClone(fallback); }
}
function save(key, value) { localStorage.setItem(key, JSON.stringify(value)); }

// ponytail: sessionStorage cache keyed by URL; GitHub allows 60 unauthenticated req/hr per IP
async function getJSON(url) {
  const k = 'gh:' + url;
  const hit = sessionStorage.getItem(k);
  if (hit) return JSON.parse(hit);
  const r = await fetch(url);
  if (!r.ok) throw new Error(String(r.status));
  const j = await r.json();
  sessionStorage.setItem(k, JSON.stringify(j));
  return j;
}

// ----- HASH -----
async function sha256(text) {
  const buf = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, '0')).join('');
}

// ----- ESCAPE -----
function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
const escapeAttr = escapeHtml;

// ================= RENDER: feed =================
function renderPosts() {
  const grid = document.getElementById('feed-grid');
  if (!grid) return;
  const avatar = sessionStorage.getItem('githubAvatar') || 'assets/profile.webp';
  if (!State.posts.length) { grid.innerHTML = '<p class="feed-empty">No updates yet.</p>'; return; }
  grid.innerHTML = State.posts.map(p => `
    <article class="feed-card" data-id="${escapeAttr(p.id)}">
      <div class="feed-card-inner">
        <div class="feed-head-row">
          <div class="feed-avatar"><img src="${escapeAttr(avatar)}" width="36" height="36" alt="" loading="lazy"></div>
          <div class="feed-id">
            <h3>${escapeHtml(p.author)}</h3>
            <span>${escapeHtml(p.role)} · ${escapeHtml(p.time)}</span>
          </div>
          <i class="fab fa-linkedin feed-li" aria-hidden="true"></i>
        </div>
        ${p.image ? `<img class="feed-img" src="${escapeAttr(p.image)}" width="1000" height="750" alt="${escapeAttr(p.imageAlt || '')}" loading="lazy">` : ''}
        <p class="feed-content">${escapeHtml(p.content)}</p>
        ${p.link ? `<a class="btn btn-sm feed-link" href="${escapeAttr(p.link)}" target="_blank" rel="noopener"><i class="fab fa-youtube" aria-hidden="true"></i> ${escapeHtml(p.linkLabel || 'Open Link')}</a>` : ''}
        <div class="feed-tags">${escapeHtml(p.tags)}</div>
      </div>
      <div class="admin-row">
        <button type="button" class="btn btn-sm" data-act="edit-post" data-id="${escapeAttr(p.id)}"><i class="fas fa-pen" aria-hidden="true"></i> Edit Post</button>
        <button type="button" class="btn btn-sm" data-act="del-post" data-id="${escapeAttr(p.id)}"><i class="fas fa-trash" aria-hidden="true"></i> Remove Post</button>
      </div>
    </article>
  `).join('');
}

// ================= ADMIN =================
function isLoggedIn() { return sessionStorage.getItem(STORE_KEYS.session) === '1'; }
function setLoggedIn(v) {
  if (v) sessionStorage.setItem(STORE_KEYS.session, '1');
  else sessionStorage.removeItem(STORE_KEYS.session);
  document.body.classList.toggle('admin-on', v);
}

// Native <dialog>: focus trap, Esc, focus return and inert page come for free.
function openModal(id) { const d = document.getElementById(id); if (!d.open) d.showModal(); }
function closeModal(id) { const d = document.getElementById(id); if (d.open) d.close(); }
const setMsg = (id, text) => { document.getElementById(id).textContent = text; };

function openLogin() { openModal('login-modal'); }
function closeLogin() { closeModal('login-modal'); }
async function attemptLogin() {
  const pw = document.getElementById('login-pw');
  const want = localStorage.getItem(STORE_KEYS.hash) || CONFIG.defaultHash;
  const got = await sha256(pw.value);
  if (got === want) { setLoggedIn(true); closeLogin(); }
  else { setMsg('login-err', 'Incorrect password. Try again.'); pw.select(); }
}

function openChangePw() {
  ['pw-current', 'pw-new', 'pw-confirm'].forEach(id => document.getElementById(id).value = '');
  setMsg('pw-err', ''); setMsg('pw-ok', '');
  openModal('pw-modal');
}
function closeChangePw() { closeModal('pw-modal'); }

async function submitChangePw() {
  const cur = document.getElementById('pw-current');
  const nw = document.getElementById('pw-new');
  const cf = document.getElementById('pw-confirm');
  setMsg('pw-err', ''); setMsg('pw-ok', '');
  const fail = (msg, field) => { setMsg('pw-err', msg); field.focus(); };

  const want = localStorage.getItem(STORE_KEYS.hash) || CONFIG.defaultHash;
  const got = await sha256(cur.value);
  if (got !== want) return fail('Current password is incorrect. Try again.', cur);
  if (nw.value.length < 4) return fail('New password must be at least 4 characters. Choose a longer one.', nw);
  if (nw.value !== cf.value) return fail('New passwords do not match. Type the same password in both fields.', cf);

  localStorage.setItem(STORE_KEYS.hash, await sha256(nw.value));
  [cur, nw, cf].forEach(f => f.value = '');
  setMsg('pw-ok', 'Password updated.');
  setTimeout(closeChangePw, 1200);
}

function openEdit(kind, item) {
  const modal = document.getElementById('edit-modal');
  modal.dataset.kind = kind;
  modal.dataset.id = item ? item.id : '';
  document.getElementById('edit-title').textContent = item ? 'Edit Post' : 'New Post';
  document.getElementById('edit-fields').innerHTML = `
    <div class="modal-field"><label for="f-role">Role / Headline</label>
      <input id="f-role" name="role" autocomplete="off" autofocus value="${escapeAttr(item?.role || 'MSc Student')}"></div>
    <div class="modal-field"><label for="f-time">Time</label>
      <input id="f-time" name="time" autocomplete="off" value="${escapeAttr(item?.time || 'just now')}"></div>
    <div class="modal-field"><label for="f-content">Content</label>
      <textarea id="f-content" name="content">${escapeHtml(item?.content || '')}</textarea></div>
    <div class="modal-field"><label for="f-tags">Hashtags</label>
      <input id="f-tags" name="tags" autocomplete="off" value="${escapeAttr(item?.tags || '#AI')}"></div>
  `;
  openModal('edit-modal');
}
function closeEdit() { closeModal('edit-modal'); }
function editIsDirty() {
  return [...document.querySelectorAll('#edit-fields input, #edit-fields textarea')].some(f => f.value !== f.defaultValue);
}

function saveEdit() {
  const modal = document.getElementById('edit-modal');
  if (modal.dataset.kind !== 'post') return closeEdit();
  const id = modal.dataset.id;
  const data = {
    ...(State.posts.find(p => p.id === id) || {}), // keep image/link fields the form does not edit
    id: id || 'p' + Date.now(),
    author: 'Al Muqshith Shifan',
    role: document.getElementById('f-role').value,
    time: document.getElementById('f-time').value,
    content: document.getElementById('f-content').value,
    tags: document.getElementById('f-tags').value,
  };
  if (id) {
    const i = State.posts.findIndex(p => p.id === id);
    if (i >= 0) State.posts[i] = data;
  } else { State.posts.unshift(data); }
  save(STORE_KEYS.posts, State.posts);
  renderPosts();
  closeEdit();
}

// ================= GitHub =================
async function fetchProfile() {
  try {
    const j = await getJSON(`https://api.github.com/users/${CONFIG.githubUser}`);
    if (sessionStorage.getItem('githubAvatar') === j.avatar_url) return;
    sessionStorage.setItem('githubAvatar', j.avatar_url);
    renderPosts();
  } catch (e) { /* offline: keep local defaults */ }
}

async function fetchLatestRepo() {
  const el = document.getElementById('latest-repo');
  const showFallback = () => {
    if (el) el.innerHTML = `
      <h3>Latest GitHub Push</h3>
      <p>GitHub is not available now. <a class="link-verm" href="https://github.com/${escapeAttr(CONFIG.githubUser)}" target="_blank" rel="noopener">View the profile</a></p>
    `;
  };
  try {
    const list = await getJSON(`https://api.github.com/users/${CONFIG.githubUser}/repos?sort=pushed&per_page=1`);
    if (!Array.isArray(list) || !list.length) { showFallback(); return; }
    const repo = list[0];
    if (!el) return;
    el.innerHTML = `
      <div class="proj-tags" style="margin-bottom:12px;">
        <span class="tag">${escapeHtml(repo.language || 'CODE')}</span>
        <span class="tag">Just pushed</span>
      </div>
      <h3>${escapeHtml(repo.name)}</h3>
      <p>${escapeHtml(repo.description || 'No description.')}</p>
      <div class="proj-foot">
        <span>UPDATED ${new Date(repo.pushed_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}</span>
        <div class="proj-icons"><a href="${escapeAttr(repo.html_url)}" target="_blank" rel="noopener" aria-label="Open ${escapeAttr(repo.name)} on GitHub"><i class="fas fa-arrow-up-right-from-square" aria-hidden="true"></i></a></div>
      </div>
    `;
  } catch (e) { showFallback(); }
}

// ================= README renderer =================
let libsReady = null;
function loadReadmeLibs() {
  const add = (tag, attrs) => new Promise((res, rej) => {
    const el = Object.assign(document.createElement(tag), attrs);
    el.onload = res; el.onerror = rej;
    document.head.appendChild(el);
  });
  return libsReady ||= Promise.all([
    add('link', { rel: 'stylesheet', href: 'https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/styles/github.min.css' }),
    add('script', { src: 'https://cdn.jsdelivr.net/npm/marked@12.0.2/marked.min.js' }),
    add('script', { src: 'https://cdn.jsdelivr.net/npm/dompurify@3.1.5/dist/purify.min.js' }),
    add('script', { src: 'https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/highlight.min.js' }),
  ]).catch(() => { libsReady = null; }); // renderMarkdown falls back to <pre> if libs are missing
}

async function fetchReadme(repo) {
  // API first (raw body); raw CDN second. HEAD = default branch, so no lookup request.
  try {
    const r = await fetch(`https://api.github.com/repos/${repo}/readme`, {
      headers: { Accept: 'application/vnd.github.raw+json' },
    });
    if (r.ok) return r.text();
  } catch (e) { /* continue to raw */ }
  const r = await fetch(`https://raw.githubusercontent.com/${repo}/HEAD/README.md`);
  if (!r.ok) throw new Error(`${r.status} fetching README`);
  return r.text();
}

function renderMarkdown(md, repo) {
  if (typeof marked === 'undefined' || typeof DOMPurify === 'undefined') {
    const pre = document.createElement('pre');
    pre.textContent = md;
    return pre.outerHTML;
  }
  marked.setOptions({
    gfm: true,
    breaks: false,
    highlight(code, lang) {
      try {
        if (window.hljs && lang && hljs.getLanguage(lang)) {
          return hljs.highlight(code, { language: lang }).value;
        }
        return window.hljs ? hljs.highlightAuto(code).value : escapeHtml(code);
      } catch (e) { return escapeHtml(code); }
    },
  });
  const dirty = marked.parse(md);
  const clean = DOMPurify.sanitize(dirty, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ['target', 'align'],
  });

  // Rebase relative image/link URLs against the repo root.
  const wrap = document.createElement('div');
  wrap.innerHTML = clean;
  const rawBase = `https://raw.githubusercontent.com/${repo}/HEAD/`;
  const blobBase = `https://github.com/${repo}/blob/HEAD/`;
  wrap.querySelectorAll('img').forEach(img => {
    const src = img.getAttribute('src') || '';
    if (!/^(https?:|data:|blob:)/i.test(src) && src && !src.startsWith('#')) {
      img.src = rawBase + src.replace(/^\.?\//, '');
    }
    img.setAttribute('loading', 'lazy');
  });
  wrap.querySelectorAll('a').forEach(a => {
    const href = a.getAttribute('href') || '';
    if (href && !/^(https?:|mailto:|#)/i.test(href) && !href.startsWith('#')) {
      a.href = blobBase + href.replace(/^\.?\//, '');
    }
    if (/^https?:/i.test(a.getAttribute('href') || '')) {
      a.target = '_blank';
      a.rel = 'noopener';
    }
  });
  return wrap.innerHTML;
}

async function openReadme(repo) {
  const modal = document.getElementById('readme-modal');
  const title = document.getElementById('readme-title');
  const content = document.getElementById('readme-content');
  title.textContent = repo + ' · README';
  content.innerHTML = '<p class="md-loading">Fetching README…</p>';
  history.replaceState(null, '', '#readme/' + repo); // deep link
  openModal('readme-modal');
  try {
    const [text] = await Promise.all([fetchReadme(repo), loadReadmeLibs()]);
    content.innerHTML = renderMarkdown(text, repo);
  } catch (e) {
    content.innerHTML = `<p class="md-loading">The README did not load. <a class="link-verm" href="https://github.com/${escapeAttr(repo)}" target="_blank" rel="noopener">Open it on GitHub</a></p>`;
  }
}

// ================= Reveal =================
function initReveal() {
  const opts = { threshold: 0.1, rootMargin: '0px 0px -32px 0px' };
  const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('still');
  const io = new IntersectionObserver((ents) => {
    ents.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in-view');
      // demo loops load only when their card scrolls in; reduced-motion users get controls instead of autoplay
      e.target.querySelectorAll('video[data-src]').forEach(v => { v.src = v.dataset.src; if (still()) v.controls = true; else v.play(); });
      io.unobserve(e.target);
    });
  }, opts);
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
  document.addEventListener('click', (e) => { const v = e.target.closest('video'); if (v && !v.controls) v.paused ? v.play() : v.pause(); });
}

// ================= Terminal =================
function initTerminal() {
  const out = document.getElementById('term-out');
  const input = document.getElementById('term-in');
  if (!out || !input) return;
  const SECTIONS = ['research', 'about', 'networks', 'projects', 'sorcery', 'experience', 'updates', 'contact'];
  const REPOS = { ridge: 'Code-SorceryLab/RIDGE', peak: 'Code-SorceryLab/PEAK-DRL-Tool', embr: 'Code-SorceryLab/EMBR', fathom: 'Al-Scripting/FATHOM' };
  const CMDS = {
    help: () => 'Commands: whoami, ls, cd <section>, cat skills, readme <ridge|peak|embr|fathom>, ping github, neofetch, contact, motion <on|off>, clear',
    whoami: () => 'Al Muqshith Shifan. MSc Computer Science (Software Design), Ontario Tech.\nNetworking and security by training. Software design and AI by research.',
    ls: () => SECTIONS.map(s => s + '/').join('  '),
    cd: (a) => { if (!SECTIONS.includes(a)) return `cd: no such section: ${a || ''}. Try: ls`; document.getElementById(a).scrollIntoView(); return '-> ' + a; },
    cat: (a) => a === 'skills'
      ? [...document.querySelectorAll('.stack-col')].map(c => c.querySelector('h4').textContent + ': ' + [...c.querySelectorAll('li')].map(l => l.textContent).join(', ')).join('\n')
      : `cat: ${a || ''}: no such file. Try: cat skills`,
    readme: (a) => { const r = REPOS[(a || '').toLowerCase()]; if (!r) return 'readme: which one? ridge, peak, embr, or fathom'; openReadme(r); return 'Opening ' + r + '…'; },
    ping: () => 'PING github.com: 64 bytes from Code-SorceryLab: time=1 ms\n--- 1 packet sent, 0% loss. The lab is up.',
    neofetch: () => 'al@sorcery\n----------\nOS: Ontario Tech University\nShell: Code & Sorcery Lab\nUptime: since 2016\nPackages: PEAK, RIDGE, TAST, EMBR, FATHOM\nNetwork: P4 · Tofino · CCNA\nCPU: PPO, 4 persona heads',
    contact: () => 'Email: almuqshith.shifan@gmail.com\nLinkedIn: /in/al-mohamed-shifan-5266b924b\nGitHub: Al-Scripting',
    motion: (a) => { const still = document.documentElement.classList.contains('still'); if ((a === 'off') !== still) document.getElementById('motion-toggle').click(); return a === 'off' ? 'Motion paused.' : 'Motion playing.'; },
    clear: () => { out.textContent = ''; return null; },
    sudo: () => 'Permission denied. Nice try.',
  };
  const print = (s) => { out.textContent += s + '\n'; out.scrollTop = out.scrollHeight; };
  const history = []; let hi = 0;
  print('Type help to start.');
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      hi = Math.max(0, Math.min(history.length, hi + (e.key === 'ArrowUp' ? -1 : 1)));
      input.value = history[hi] || ''; e.preventDefault(); return;
    }
    if (e.key !== 'Enter') return;
    const line = input.value.trim(); input.value = '';
    if (!line) return;
    history.push(line); hi = history.length;
    print('al@sorcery:~$ ' + line);
    const [cmd, ...args] = line.split(/\s+/);
    const fn = CMDS[cmd.toLowerCase()];
    const res = fn ? fn(args.join(' ')) : cmd + ': command not found. Type help.';
    if (res !== null) print(res);
  });
  document.getElementById('terminal').addEventListener('click', () => input.focus());
}

// ================= Motion toggle (WCAG 2.2.2: pause for the orbs, ensō, and demo loops) =================
function initMotionToggle() {
  const btn = document.getElementById('motion-toggle');
  const apply = (still) => {
    document.documentElement.classList.toggle('still', still);
    btn.setAttribute('aria-pressed', String(still));
    btn.querySelector('span').textContent = still ? 'Play Motion' : 'Pause Motion';
    document.querySelectorAll('video').forEach(v => { if (still) v.pause(); else if (v.src && !v.controls) v.play().catch(() => {}); });
  };
  let still = false;
  try { still = localStorage.getItem('al.still') === '1'; } catch (e) { /* storage blocked */ }
  apply(still);
  btn.addEventListener('click', () => {
    still = !still;
    try { localStorage.setItem('al.still', still ? '1' : '0'); } catch (e) { /* storage blocked */ }
    apply(still);
  });
}

// ================= Parallax =================
function initParallax() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const orbs = [...document.querySelectorAll('.orb, .hero-kanji, .float-win')];
  let mx = 0, my = 0, sy = 0, raf = 0;
  const paint = () => {
    raf = 0;
    orbs.forEach((o, i) => {
      const d = (i % 3 + 1) * 0.35; // three depth layers
      o.style.setProperty('--px', (mx * 26 * d).toFixed(1) + 'px');
      o.style.setProperty('--py', (my * 26 * d + Math.sin(sy / 700) * 34 * d).toFixed(1) + 'px');
    });
  };
  const queue = () => { if (!raf) raf = requestAnimationFrame(paint); };
  addEventListener('pointermove', (e) => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; queue(); }, { passive: true });
  addEventListener('scroll', () => { sy = scrollY; queue(); }, { passive: true });
}

// ================= Nav =================
function initNav() {
  const links = document.querySelectorAll('.nav-links a');
  const sections = [...document.querySelectorAll('section[id]')];
  const io = new IntersectionObserver((ents) => {
    ents.forEach(e => {
      if (e.isIntersecting) {
        links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + e.target.id));
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  sections.forEach(s => io.observe(s));

  const menuBtn = document.getElementById('menu-btn');
  const navLinks = document.getElementById('nav-links');
  if (menuBtn && navLinks) {
    const setMenu = (open) => { navLinks.classList.toggle('open', open); menuBtn.setAttribute('aria-expanded', String(open)); };
    menuBtn.addEventListener('click', () => setMenu(!navLinks.classList.contains('open')));
    links.forEach(l => l.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && navLinks.classList.contains('open')) { setMenu(false); menuBtn.focus(); } });
  }
}

// ================= Wire =================
function wire() {
  const $ = (id) => document.getElementById(id);
  $('login-link').addEventListener('click', openLogin);
  $('login-close').addEventListener('click', closeLogin);
  $('login-form').addEventListener('submit', (e) => { e.preventDefault(); attemptLogin(); }); // Enter submits
  $('login-modal').addEventListener('click', (e) => { if (e.target.id === 'login-modal') closeLogin(); });
  $('login-modal').addEventListener('close', () => { $('login-pw').value = ''; setMsg('login-err', ''); });

  $('admin-logout').addEventListener('click', () => setLoggedIn(false));
  $('admin-change-pw').addEventListener('click', openChangePw);
  $('pw-close').addEventListener('click', closeChangePw);
  $('pw-form').addEventListener('submit', (e) => { e.preventDefault(); submitChangePw(); });
  $('pw-modal').addEventListener('click', (e) => { if (e.target.id === 'pw-modal') closeChangePw(); });

  $('edit-close').addEventListener('click', closeEdit);
  $('edit-cancel').addEventListener('click', closeEdit);
  $('edit-form').addEventListener('submit', (e) => { e.preventDefault(); saveEdit(); });
  // unsaved changes: backdrop clicks are ignored, Esc asks first
  $('edit-modal').addEventListener('cancel', (e) => { if (editIsDirty() && !confirm('Discard your changes?')) e.preventDefault(); });

  $('readme-close').addEventListener('click', () => closeModal('readme-modal'));
  $('readme-modal').addEventListener('click', (e) => { if (e.target.id === 'readme-modal') closeModal('readme-modal'); });
  $('readme-modal').addEventListener('close', () => { if (location.hash.startsWith('#readme/')) history.replaceState(null, '', location.pathname + location.search); });

  // README buttons + admin card actions (delegated)
  document.addEventListener('click', (e) => {
    const readmeBtn = e.target.closest('.readme-btn');
    if (readmeBtn && readmeBtn.dataset.repo) { openReadme(readmeBtn.dataset.repo); return; }

    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    const id = btn.dataset.id;
    const act = btn.dataset.act;
    if (act === 'edit-post') openEdit('post', State.posts.find(p => p.id === id));
    if (act === 'del-post' && confirm('Remove this post?')) {
      State.posts = State.posts.filter(p => p.id !== id);
      save(STORE_KEYS.posts, State.posts);
      renderPosts();
    }
  });
}

// ================= Init =================
document.addEventListener('DOMContentLoaded', () => {
  if (isLoggedIn()) document.body.classList.add('admin-on');
  renderPosts();
  initMotionToggle();
  initTerminal();
  initReveal();
  initParallax();
  initNav();
  wire();
  fetchProfile();
  fetchLatestRepo();
  const deep = location.hash.match(/^#readme\/([\w.-]+\/[\w.-]+)$/);
  if (deep) openReadme(deep[1]);
});
