/* =========================================================
   AL SHIFAN — Portfolio app logic
   - Scroll reveal + timeline in-view
   - GitHub API: profile avatar, latest personal repo,
     and lab repos from Code-SorceryLab organization
   - LinkedIn feed: admin-curated, persisted to localStorage
   - Admin mode: client-side password gate, in-app password
     change, edit/add/remove LinkedIn posts and Code & Sorcery
     cards inline
   ========================================================= */

// ----- CONFIG -----
const CONFIG = {
  githubUser: 'Al-Scripting',
  githubLabOrg: 'Code-SorceryLab',
  // SHA-256 of the admin password. Default = sha256("password").
  // Generate a new one in DevTools:  crypto.subtle.digest('SHA-256', new TextEncoder().encode('YOUR_PW'))
  defaultHash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
};

// ----- STORAGE KEYS -----
const STORE_KEYS = {
  posts: 'al.feed.posts',
  sorcery: 'al.sorcery.items',
  sorceryOverride: 'al.sorcery.useOverride', // when true, show admin-edited list instead of GitHub
  hash: 'al.adminHash',
  session: 'al.session',
};

// ----- DEFAULTS -----
const DEFAULT_POSTS = [
  {
    id: 'p1',
    author: 'Al Muqshith Shifan',
    role: 'PEAK · Research',
    time: '2w ago',
    content: "Our paper on PEAK has been submitted to IEEE CoG 2026 and is currently pending review. 🚀\n\nPEAK is a lightweight 2D platformer engine with a fully integrated DRL experimentation environment. What we built:\n\n🎮 A custom visual level editor from scratch\n🧠 Custom reward personas that shape how agents learn\n🔁 A branched CNN and MLP policy architecture we designed\n🐛 Real-time debug overlays so you can see what the agent perceives\n⚔️ A boss battle stage inspired by Mega Man\n\nThe evaluation ran 8 agent configurations across two Super Mario Bros levels, with win rates ranging from 0% to 41.6%, by changing only reward design, architecture, or training budget — zero changes to the engine itself.\n\nMassive thanks to Kevin Christopher Chua and Cristiano Politowski.",
    tags: '#DeepReinforcementLearning #GameAI #IEEE #CoG2026 #PEAK #MachineLearning',
  },
  {
    id: 'p2',
    author: 'Al Muqshith Shifan',
    role: 'Re;coders · CTF Team',
    time: '1mo ago',
    content: "TAC Ops 2026 — proud to say Re;coders finished 2nd place. 🥈\n\nWe led the scoreboard through the entire first day and only fell short by a small margin in the end. The challenges this year were genuinely some of the hardest I've faced — every one demanded full focus and creativity.\n\nBig shoutout to my teammates Arshia Mortazavinezhad, Yousif Iskander, and Kevin Christopher Chua. The best teammates I could've had by my side. 2nd place isn't where Re;coders wants to stay, but we'll take it, smile about it, and come back stronger next year.",
    tags: '#CTF #Cybersecurity #TACOps #InfoSec',
  },
  {
    id: 'p3',
    author: 'Al Muqshith Shifan',
    role: 'Outreach · Ontario Tech',
    time: '2mo ago',
    content: "Had an incredible time hosting a Computer Science event for an awesome group of Grade 11 students alongside my partner Kevin Christopher Chua. 🎓\n\nA massive thank you to my professor Cristiano Politowski for arranging this opportunity. We walked through:\n\n• Level Design — the architecture and creativity behind game levels\n• AI in Game Testing — how AI is changing how developers find bugs\n• Live Model Training — real models training in real time\n\nThe next generation of computer scientists is sharp, curious, and ready to build.",
    tags: '#ComputerScience #STEM #GameDev #TechEducation #Mentorship',
  },
  {
    id: 'p4',
    author: 'Al Muqshith Shifan',
    role: 'Code & Sorcery Lab',
    time: '3mo ago',
    content: "Research is as much about people as it is about ideas. Grateful to be part of a group that values both.\n\nThanks again to my mentor Cristiano Politowski, and to my wonderful colleagues and friends Alex Lowe, Daniel Baba, and Kevin Christopher Chua.",
    tags: '#Research #OntarioTech #GradLife',
  },
  {
    id: 'p5',
    author: 'Al Muqshith Shifan',
    role: "Master's Student · Day One",
    time: 'Sep 2025',
    content: "Officially starting my Master's in Computer Science at Ontario Tech University. 🎓\n\nHonestly? This wasn't the path I mapped out. But here I am, and I think that's kind of the point. I've spent years building a foundation in Networking and IT — learning how the invisible architecture of the internet actually works. Now I get to layer Software Design on top of that, and suddenly a lot of doors I didn't even know existed are starting to open.\n\nGrateful to be working under Dr. Cristiano Politowski as my primary supervisor, alongside Dr. Loutfouz Zaman.\n\nTo future me: I hope you look back at this and smile. This was the beginning.",
    tags: '#MastersStudent #ComputerScience #OntarioTech #GradSchool #ResearchLife',
  },
];

// Fallback content if the GitHub fetch fails or the org is empty
const DEFAULT_SORCERY = [
  {
    id: 's1',
    cat: 'The Research Core',
    title: 'Post-conference team sync',
    desc: 'Collaborating on the intersection of Software Engineering and AI agents for game testing.',
    img: 'assets/team.jpg',
    href: 'https://github.com/Code-SorceryLab',
  },
  {
    id: 's2',
    cat: 'Architecting PEAK',
    title: 'DRL benchmarking environment',
    desc: 'Defining reward functions and state spaces for our custom Deep Reinforcement Learning environment.',
    img: 'assets/white.jpg',
    href: 'https://github.com/Code-SorceryLab',
  },
  {
    id: 's3',
    cat: 'Applied Computer Vision',
    title: 'Injury Painter prototype',
    desc: 'Translating physical gestures into digital coordinates for telehealth pain mapping.',
    img: 'assets/proto.jpg',
    href: 'https://github.com/Code-SorceryLab',
  },
];

// Rotate through these local placeholders for repos without their own image
const LAB_PLACEHOLDERS = ['assets/team.jpg', 'assets/white.jpg', 'assets/proto.jpg'];

const State = {
  posts: load(STORE_KEYS.posts, DEFAULT_POSTS),
  sorcery: load(STORE_KEYS.sorcery, DEFAULT_SORCERY),
  sorceryFromGitHub: null, // populated by fetchLabRepos
};

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : structuredClone(fallback);
  } catch (e) { return structuredClone(fallback); }
}
function save(key, value) { localStorage.setItem(key, JSON.stringify(value)); }

// ----- HASH -----
async function sha256(text) {
  const buf = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2,'0')).join('');
}

// ----- ESCAPE -----
function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
const escapeAttr = escapeHtml;

// ----- RENDER: feed -----
function renderPosts() {
  const grid = document.getElementById('feed-grid');
  if (!grid) return;
  const avatar = sessionStorage.getItem('githubAvatar') || 'assets/profile.png';
  grid.innerHTML = State.posts.map(p => `
    <article class="feed-card" data-id="${p.id}">
      <div class="feed-card-inner">
        <div class="feed-head-row">
          <div class="feed-avatar"><img src="${escapeAttr(avatar)}" alt=""></div>
          <div class="feed-id">
            <h4>${escapeHtml(p.author)}</h4>
            <span>${escapeHtml(p.role)} · ${escapeHtml(p.time)}</span>
          </div>
          <i class="fab fa-linkedin feed-li"></i>
        </div>
        <p class="feed-content">${escapeHtml(p.content)}</p>
        <div class="feed-tags">${escapeHtml(p.tags)}</div>
      </div>
      <div class="admin-row">
        <button class="btn btn-sm" data-act="edit-post" data-id="${p.id}"><i class="fas fa-pen"></i> Edit</button>
        <button class="btn btn-sm" data-act="del-post" data-id="${p.id}"><i class="fas fa-trash"></i> Remove</button>
      </div>
    </article>
  `).join('');
}

// ----- RENDER: Code & Sorcery -----
function renderSorcery() {
  const grid = document.getElementById('sorcery-grid');
  if (!grid) return;

  const useOverride = localStorage.getItem(STORE_KEYS.sorceryOverride) === '1';
  const list = (!useOverride && State.sorceryFromGitHub) ? State.sorceryFromGitHub : State.sorcery;
  const source = (!useOverride && State.sorceryFromGitHub) ? 'github' : 'manual';

  // Update lab data source indicator (if present)
  const indicator = document.getElementById('lab-source-indicator');
  if (indicator) {
    indicator.textContent = source === 'github'
      ? `live · ${list.length} repos from @Code-SorceryLab`
      : `manual · ${list.length} entries`;
  }

  grid.innerHTML = list.map(s => `
    <article class="sorc-card" data-id="${s.id}">
      <a href="${escapeAttr(s.href || '#')}" target="_blank" rel="noopener" style="display:block;">
        <div class="sorc-img"><img src="${escapeAttr(s.img)}" alt="${escapeAttr(s.title)}" onerror="this.src='assets/team.jpg'"></div>
        <div class="sorc-body">
          <div class="sorc-cat">${escapeHtml(s.cat)}${s.stars != null ? ` · ★ ${s.stars}` : ''}</div>
          <h3>${escapeHtml(s.title)}</h3>
          <p>${escapeHtml(s.desc)}</p>
        </div>
      </a>
      <div class="admin-row">
        <button class="btn btn-sm" data-act="edit-sorc" data-id="${s.id}"><i class="fas fa-pen"></i> Edit</button>
        <button class="btn btn-sm" data-act="del-sorc" data-id="${s.id}"><i class="fas fa-trash"></i> Remove</button>
      </div>
    </article>
  `).join('');
}

// ----- ADMIN -----
function isLoggedIn() { return sessionStorage.getItem(STORE_KEYS.session) === '1'; }
function setLoggedIn(v) {
  if (v) sessionStorage.setItem(STORE_KEYS.session, '1');
  else sessionStorage.removeItem(STORE_KEYS.session);
  document.body.classList.toggle('admin-on', v);
}

function openLogin() {
  document.getElementById('login-modal').classList.add('open');
  setTimeout(() => document.getElementById('login-pw').focus(), 100);
}
function closeLogin() {
  document.getElementById('login-modal').classList.remove('open');
  document.getElementById('login-pw').value = '';
  document.getElementById('login-err').classList.remove('show');
}
async function attemptLogin() {
  const pw = document.getElementById('login-pw').value;
  const want = localStorage.getItem(STORE_KEYS.hash) || CONFIG.defaultHash;
  const got = await sha256(pw);
  if (got === want) { setLoggedIn(true); closeLogin(); }
  else { document.getElementById('login-err').classList.add('show'); }
}

// ----- Change password -----
function openChangePw() {
  document.getElementById('pw-modal').classList.add('open');
  ['pw-current','pw-new','pw-confirm'].forEach(id => { document.getElementById(id).value = ''; });
  document.getElementById('pw-err').classList.remove('show');
  document.getElementById('pw-ok').classList.remove('show');
  setTimeout(() => document.getElementById('pw-current').focus(), 100);
}
function closeChangePw() {
  document.getElementById('pw-modal').classList.remove('open');
}
async function submitChangePw() {
  const cur = document.getElementById('pw-current').value;
  const nw  = document.getElementById('pw-new').value;
  const cf  = document.getElementById('pw-confirm').value;
  const err = document.getElementById('pw-err');
  const ok  = document.getElementById('pw-ok');
  err.classList.remove('show');
  ok.classList.remove('show');

  const want = localStorage.getItem(STORE_KEYS.hash) || CONFIG.defaultHash;
  const got  = await sha256(cur);
  if (got !== want) {
    err.textContent = 'Current password is incorrect.';
    err.classList.add('show'); return;
  }
  if (nw.length < 4) {
    err.textContent = 'New password must be at least 4 characters.';
    err.classList.add('show'); return;
  }
  if (nw !== cf) {
    err.textContent = 'New passwords do not match.';
    err.classList.add('show'); return;
  }

  const newHash = await sha256(nw);
  localStorage.setItem(STORE_KEYS.hash, newHash);
  ['pw-current','pw-new','pw-confirm'].forEach(id => { document.getElementById(id).value = ''; });
  ok.textContent = 'Password updated.';
  ok.classList.add('show');
  setTimeout(closeChangePw, 1200);
}

function openEdit(kind, item) {
  const modal = document.getElementById('edit-modal');
  modal.classList.add('open');
  modal.dataset.kind = kind;
  modal.dataset.id = item ? item.id : '';
  const titleEl = document.getElementById('edit-title');
  const fields = document.getElementById('edit-fields');

  if (kind === 'post') {
    titleEl.textContent = item ? 'Edit Post' : 'New LinkedIn Post';
    fields.innerHTML = `
      <div class="admin-field"><label>Role / Headline</label>
        <input id="f-role" value="${escapeAttr(item?.role || 'MSc Student')}"></div>
      <div class="admin-field"><label>Time</label>
        <input id="f-time" value="${escapeAttr(item?.time || 'just now')}"></div>
      <div class="admin-field"><label>Content</label>
        <textarea id="f-content">${escapeHtml(item?.content || '')}</textarea></div>
      <div class="admin-field"><label>Hashtags</label>
        <input id="f-tags" value="${escapeAttr(item?.tags || '#AI')}"></div>
    `;
  } else if (kind === 'sorc') {
    titleEl.textContent = item ? 'Edit Lab Entry' : 'New Lab Entry';
    fields.innerHTML = `
      <p style="font-family:var(--mono); font-size:11px; color:var(--ink-3); margin-bottom:14px;">
        Editing switches the lab view to manual override. Toggle back via the GitHub button in the bar.
      </p>
      <div class="admin-field"><label>Category / Caption</label>
        <input id="f-cat" value="${escapeAttr(item?.cat || 'Research')}"></div>
      <div class="admin-field"><label>Title</label>
        <input id="f-title" value="${escapeAttr(item?.title || '')}"></div>
      <div class="admin-field"><label>Description</label>
        <textarea id="f-desc">${escapeHtml(item?.desc || '')}</textarea></div>
      <div class="admin-field"><label>Link URL</label>
        <input id="f-href" value="${escapeAttr(item?.href || 'https://github.com/Code-SorceryLab')}"></div>
      <div class="admin-field"><label>Image URL</label>
        <input id="f-img" value="${escapeAttr(item?.img || 'assets/team.jpg')}"></div>
    `;
  }
}
function closeEdit() { document.getElementById('edit-modal').classList.remove('open'); }

function saveEdit() {
  const modal = document.getElementById('edit-modal');
  const kind = modal.dataset.kind;
  const id = modal.dataset.id;

  if (kind === 'post') {
    const data = {
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
  } else if (kind === 'sorc') {
    const data = {
      id: id || 's' + Date.now(),
      cat: document.getElementById('f-cat').value,
      title: document.getElementById('f-title').value,
      desc: document.getElementById('f-desc').value,
      href: document.getElementById('f-href').value,
      img: document.getElementById('f-img').value,
    };
    // Editing forces manual override mode
    localStorage.setItem(STORE_KEYS.sorceryOverride, '1');
    if (id) {
      const i = State.sorcery.findIndex(s => s.id === id);
      if (i >= 0) State.sorcery[i] = data;
      else State.sorcery.push(data);
    } else { State.sorcery.push(data); }
    save(STORE_KEYS.sorcery, State.sorcery);
    renderSorcery();
  }
  closeEdit();
}

function toggleSorcerySource() {
  const cur = localStorage.getItem(STORE_KEYS.sorceryOverride) === '1';
  localStorage.setItem(STORE_KEYS.sorceryOverride, cur ? '0' : '1');
  renderSorcery();
}

// ----- GitHub fetch -----
async function fetchProfile() {
  try {
    const r = await fetch(`https://api.github.com/users/${CONFIG.githubUser}`);
    if (!r.ok) return;
    const j = await r.json();
    sessionStorage.setItem('githubAvatar', j.avatar_url);
    // Hero portrait stays as the local asset; only feed avatars use the GitHub one.
    renderPosts();
  } catch (e) { /* network/offline — keep local defaults */ }
}

async function fetchLatestRepo() {
  const el = document.getElementById('latest-repo');
  const showFallback = () => {
    if (el) el.innerHTML = `
      <h3>Latest GitHub Push</h3>
      <p>Couldn&rsquo;t reach GitHub right now. <a href="https://github.com/${escapeAttr(CONFIG.githubUser)}" target="_blank" rel="noopener">View profile &rarr;</a></p>
    `;
  };
  try {
    const r = await fetch(`https://api.github.com/users/${CONFIG.githubUser}/repos?sort=pushed&per_page=1`);
    if (!r.ok) { showFallback(); return; }
    const list = await r.json();
    if (!Array.isArray(list) || !list.length) { showFallback(); return; }
    const repo = list[0];
    if (!el) return;
    el.innerHTML = `
      <div class="proj-tags">
        <span class="tag">${escapeHtml(repo.language || 'CODE')}</span>
        <span class="tag">Just pushed</span>
      </div>
      <h3><a href="${escapeAttr(repo.html_url)}" target="_blank" rel="noopener">${escapeHtml(repo.name)}</a></h3>
      <p>${escapeHtml(repo.description || 'No description.')}</p>
      <div class="proj-foot">
        <span>UPDATED ${new Date(repo.pushed_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}</span>
        <a href="${escapeAttr(repo.html_url)}" target="_blank" rel="noopener" class="icons"><i class="fas fa-arrow-right"></i></a>
      </div>
    `;
  } catch (e) {
    showFallback();
  }
}

// Fetch Code-SorceryLab organization repos for the lab section
async function fetchLabRepos() {
  try {
    const r = await fetch(`https://api.github.com/orgs/${CONFIG.githubLabOrg}/repos?sort=pushed&per_page=12`);
    if (!r.ok) throw new Error('Org fetch failed');
    const repos = await r.json();
    if (!Array.isArray(repos) || !repos.length) throw new Error('No repos');

    // Sort: not-fork, then by stars desc then pushed desc
    repos.sort((a, b) => {
      if (a.fork !== b.fork) return a.fork ? 1 : -1;
      if ((b.stargazers_count || 0) !== (a.stargazers_count || 0))
        return (b.stargazers_count || 0) - (a.stargazers_count || 0);
      return new Date(b.pushed_at) - new Date(a.pushed_at);
    });

    State.sorceryFromGitHub = repos.slice(0, 6).map((repo, i) => ({
      id: 'gh-' + repo.id,
      cat: `${(repo.language || 'CODE').toUpperCase()} · ${repo.fork ? 'FORK' : 'SOURCE'}`,
      title: repo.name.replace(/[-_]/g, ' '),
      desc: repo.description || 'No description provided yet.',
      href: repo.html_url,
      img: LAB_PLACEHOLDERS[i % LAB_PLACEHOLDERS.length],
      stars: repo.stargazers_count || 0,
    }));
    renderSorcery();
  } catch (e) {
    // fall back to manual list silently
    console.warn('Lab repo fetch failed, using manual list', e);
    State.sorceryFromGitHub = null;
    renderSorcery();
  }
}

// ----- Reveal -----
function initReveal() {
  const opts = { threshold: 0.12, rootMargin: '0px 0px -40px 0px' };
  const io = new IntersectionObserver((ents) => {
    ents.forEach(e => { if (e.isIntersecting) e.target.classList.add('in-view'); });
  }, opts);
  document.querySelectorAll('.reveal, .tl-row').forEach(el => io.observe(el));
}

// ----- Nav scroll spy + mobile menu -----
function initNav() {
  const links = document.querySelectorAll('.nav-links a');
  const sections = [...document.querySelectorAll('section[id]')];
  const io = new IntersectionObserver((ents) => {
    ents.forEach(e => {
      if (e.isIntersecting) {
        links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + e.target.id));
      }
    });
  }, { threshold: 0.35 });
  sections.forEach(s => io.observe(s));

  document.getElementById('menu-btn').addEventListener('click', () => {
    document.getElementById('nav-links').classList.toggle('open');
  });
  links.forEach(l => l.addEventListener('click', () => document.getElementById('nav-links').classList.remove('open')));
}

// ----- Wire -----
function wire() {
  document.getElementById('login-link').addEventListener('click', (e) => { e.preventDefault(); openLogin(); });
  document.getElementById('login-close').addEventListener('click', closeLogin);
  document.getElementById('login-submit').addEventListener('click', attemptLogin);
  document.getElementById('login-pw').addEventListener('keydown', (e) => { if (e.key === 'Enter') attemptLogin(); });
  document.getElementById('login-modal').addEventListener('click', (e) => { if (e.target.id === 'login-modal') closeLogin(); });

  document.getElementById('admin-logout').addEventListener('click', () => setLoggedIn(false));
  document.getElementById('admin-change-pw').addEventListener('click', openChangePw);
  document.getElementById('pw-close').addEventListener('click', closeChangePw);
  document.getElementById('pw-submit').addEventListener('click', submitChangePw);
  document.getElementById('pw-confirm').addEventListener('keydown', (e) => { if (e.key === 'Enter') submitChangePw(); });
  document.getElementById('pw-modal').addEventListener('click', (e) => { if (e.target.id === 'pw-modal') closeChangePw(); });
  const toggleBtn = document.getElementById('toggle-sorc-src');
  if (toggleBtn) toggleBtn.addEventListener('click', toggleSorcerySource);

  document.getElementById('edit-close').addEventListener('click', closeEdit);
  document.getElementById('edit-cancel').addEventListener('click', closeEdit);
  document.getElementById('edit-save').addEventListener('click', saveEdit);
  document.getElementById('edit-modal').addEventListener('click', (e) => { if (e.target.id === 'edit-modal') closeEdit(); });

  document.getElementById('add-post-btn').addEventListener('click', () => openEdit('post', null));
  document.getElementById('add-sorc-btn').addEventListener('click', () => openEdit('sorc', null));

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    const id = btn.dataset.id;
    const act = btn.dataset.act;
    if (act === 'edit-post') openEdit('post', State.posts.find(p => p.id === id));
    if (act === 'del-post') { State.posts = State.posts.filter(p => p.id !== id); save(STORE_KEYS.posts, State.posts); renderPosts(); }
    if (act === 'edit-sorc') {
      const useOverride = localStorage.getItem(STORE_KEYS.sorceryOverride) === '1';
      const src = (!useOverride && State.sorceryFromGitHub) ? State.sorceryFromGitHub : State.sorcery;
      openEdit('sorc', src.find(s => s.id === id));
    }
    if (act === 'del-sorc') {
      localStorage.setItem(STORE_KEYS.sorceryOverride, '1');
      State.sorcery = State.sorcery.filter(s => s.id !== id);
      save(STORE_KEYS.sorcery, State.sorcery);
      renderSorcery();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeLogin(); closeEdit(); closeChangePw(); }
  });
}

// ----- Init -----
document.addEventListener('DOMContentLoaded', () => {
  setLoggedIn(isLoggedIn());
  renderPosts();
  renderSorcery();        // shows manual defaults immediately
  fetchProfile();
  fetchLatestRepo();
  fetchLabRepos();        // upgrades sorcery to live GitHub data
  initReveal();
  initNav();
  wire();
});