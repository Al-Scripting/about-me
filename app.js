/* =========================================================
   AL SHIFAN · Portfolio app logic
   - Scroll reveal + scroll-spy nav + mobile menu
   - GitHub API: profile avatar (feed)
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
  removed: 'al.feed.removed',
  hash: 'al.adminHash',
  session: 'al.session',
};

// ----- DEFAULT POSTS (research-facing, recruiter-friendly) -----
const DEFAULT_POSTS = [
  {
    id: 'p9',
    author: 'Al Muqshith Shifan',
    role: 'CASCON 2026 · Poster',
    time: 'Nov 2026',
    content: "Presented my poster at CASCON 2026 this week! Evolved Neural Agents as Tireless Playtesters\n\nThe project starts with a simple problem: a designer edits a level, the code tests still pass, but nobody notices that the level now plays differently (or may no longer be completable) until someone playtests it again.\n\nTo address this, we developed Playtesting Regression Tests (PRTs). We evolve small neural agents using a genetic algorithm, freeze them, and replay them after every level edit. If key gameplay metrics change (completion, win rate, death hotspots, or the leading cause of failure), the PRT flags the edit.\n\nWhat's next?\nWe're looking to extend PRTs to Godot, Unity, and Unreal, evaluate them on procedurally generated levels, and compare the evolved agents against human players.\nA big thank you to everyone who stopped by the poster and shared their questions and feedback!\n\nKevin also presented TAST (Trait Activation Steering), exploring how to keep small-model NPCs in character.\n\nBeyond the research, it was an absolute blast getting to talk with professors, students, and members of the CSER community. I really enjoyed the conversations, questions, and opportunities to connect with people working across different areas of research.\n\nA special thank you to Jeremy Bradbury for taking the photos and helping introduce us to people throughout the event. It genuinely made the experience even better.\n\nI'm also grateful to my co-authors Kevin Christopher Chua, Ali Neshati, Loutfouz Zaman, and Cristiano Politowski\n\nProud to represent the Code & Sorcery Lab (Ontario Tech University Computer Science) at CASCON 2026!\n\n🔗 Projects and papers: https://lnkd.in/g2CbTqP7",
    image: 'assets/cascon26.webp',
    imageAlt: 'AL Shifan and Kevin Christopher Chua with two other attendees at CASCON 2026',
    link: 'https://www.linkedin.com/feed/update/urn:li:activity:7525757537548230656/',
    linkLabel: 'Read on LinkedIn',
    tags: '#CASCON2026 #GameDev #GameAI #SoftwareTesting #MachineLearning #OntarioTech',
  },
  {
    id: 'p8',
    author: 'Al Muqshith Shifan',
    role: 'CSER 2026 · Two posters',
    time: 'Nov 2026',
    content: "Kevin Christopher Chua and I both have posters accepted at CSER 2026.\n\nMine is \"Evolved Neural Agents as Tireless Playtesters\". Every level edit needs new playtests, and the code tests still pass when an edit makes a level harder or impossible. We train small evolved agents once, freeze them, and keep them as tests for the level. After an edit, the frozen agents play it again and flag what changed. Across 130 small edits to 28 levels in 4 games, they caught 70 of the 76 edits that changed play, with no false alarms on 54 unchanged controls.\n\nKevin's is \"Trait Activation Steering: Keeping Small-Model NPCs in Character\", and I am a co-author on it. Small language models drift out of character in long conversations. TAST steers the model's hidden state while it runs, so a small NPC stays in character through a 20-turn attack without fine-tuning.\n\nThanks to Cristiano Politowskio, Ali Neshati and Loutfouz Zaman, and to everyone at Code & Sorcery Lab, UXID Lab, and the GaMER Lab.",
    image: 'assets/cser26-accepted.webp',
    imageAlt: 'Accepted: two posters at CSER 2026, the PEAK poster by AL Shifan and the TAST poster by Kevin Christopher Chua',
    link: 'https://www.linkedin.com/feed/update/urn:li:activity:7524013338151002112/',
    linkLabel: 'Read on LinkedIn',
    tags: '#CSER2026 #GameAI #Playtesting #SoftwareEngineering #OntarioTech',
  },
  {
    id: 'p7',
    author: 'Al Muqshith Shifan',
    role: 'arXiv · RIDGE',
    time: 'Nov 2026',
    content: "My first paper is now on arXiv.\nRIDGE: State-Conditioned Reward Blending for Behavioral Coverage in Deep RL Game Agents\nhttps://lnkd.in/gUGcnnem\n\nI presented it as a short paper at IEEE CoG 2026 in Madrid in September. \n\nA game agent trained on one fixed reward plays one way. An Explorer keeps exploring while it starves, and a Survivor hoards on an empty map. So if you want to playtest four play styles, you usually train four agents. RIDGE trains one. It blends four persona rewards (Explorer, Survivor, Craftsman, Warrior), and the game state sets the blend while it plays. On Crafter it picked up both the crafting branch and the combat branch, which no single-persona agent did.\n\nThank you to my co-authors Kevin Christopher Chua, Ali Neshati, @Loutfouz Zaman and Cristiano Politowski.\n\nCode: https://lnkd.in/gGtCzkKf",
    image: 'assets/ridge-arxiv.webp',
    imageAlt: 'The arXiv logo',
    link: 'https://www.linkedin.com/feed/update/urn:li:activity:7524012431095013376/',
    linkLabel: 'Read on LinkedIn',
    tags: '#ReinforcementLearning #GameAI #MachineLearning #arXiv',
  },
  {
    id: 'p6',
    author: 'Al Muqshith Shifan',
    role: 'High School Science Day',
    time: 'Oct 2026',
    content: "Can AI really play video games properly?\n\nThat was the title of our session at Ontario Tech University's High School Science Day. Kevin Christopher Chua and I spent it trying to answer that question in front of a room of high school students.\n\nOur honest answer: sort of. The \"sort of\" is the interesting part.\n\nPEAK (Platformer Engine by AL & Kevin, yes, we named it after ourselves) does not run a big model. Each player is a tiny neural network, 291 numbers in total. Nobody teaches it with examples. We breed it: the players that get furthest through a level are copied with small random changes, and the rest are dropped. It does not need a GPU.\n\nThen we give the players personalities. On a Mario-style first level, our \"experienced\" player wins 91% of the time. Our \"clumsy\" one wins 3%. On the third level, almost none of them win at all.\n\nThat gap is what a game designer wants to see. If the clumsy player dies on the same jump every time, that jump is where real players will quit. The failures are the useful output.\nThanks to Cristiano Politowski, Ali Neshati, Usamn Mohammad for putting us in front of that room.\n\nI also gave the students a first look at my thesis, AFTERSTATE. It is about the characters you meet in games and what they get wrong about you. That is all I will say until the paper is out.",
    image: 'assets/science-day.webp',
    imageAlt: 'AL Shifan and Kevin Christopher Chua at the lecture hall podium for their High School Science Day session',
    link: 'https://www.linkedin.com/feed/update/urn:li:activity:7520548166019006464/',
    linkLabel: 'Read on LinkedIn',
    tags: '#PEAK #AFTERSTATE #OntarioTech #GameAI #Outreach',
  },
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
    id: 'p1784065117378',
    author: 'Al Muqshith Shifan',
    role: "RIDGE · CoG 2026",
    time: 'Jun 2026',
    content: "Our paper RIDGE has been accepted at IEEE CoG 2026! 🚀\n\nRIDGE = Reactive Inter-persona Dynamic Goal Engine. Instead of training a separate agent for every task, RIDGE uses a single PPO agent that blends Explorer, Survivor, Craftsman, and Warrior persona reward weights via smooth sigmoid functions conditioned on the internal game state, so one agent dynamically shifts its play style mid-episode.\n\nMy co-author Kevin Christopher Chua and I went from a spontaneous idea to an accepted paper in a single 20-hour sprint, during the very first month of our Master's. Huge thanks to Cristiano Politowski, Ali Neshati, and Dr. Loutfuz for the lightning-fast feedback.\n\nWe'll be presenting live at CoG 2026 in Madrid, Spain this September!",
    image: 'assets/ridge-accepted.webp',
    imageAlt: "The RIDGE title card: State-Conditioned Reward Blending for Behavioral Coverage in Deep RL Game Agents, with the five authors",
    link: 'https://www.linkedin.com/feed/update/urn:li:activity:7475903437470334976/',
    linkLabel: 'Read on LinkedIn',
    tags: '#DeepReinforcementLearning #GameAI #CoG2026 #RIDGE #PPO',
  },
  {
    id: 'p1784065154376',
    author: 'Al Muqshith Shifan',
    role: "Re;Animate 2026 · Game Jam",
    time: 'Jun 2026',
    content: "🏆 We won 1st place at the Re;Animate 2026 Game Jam!\n\nAt the 3rd Summer School on Retro Gaming at Concordia University, my team built a game the way it would've been made in 1990 and came out on top. The twist: we coded in AMOS BASIC, an Amiga language older than most of us in the room, using CRVJA (the school's browser-based AMOS editor and JavaScript transpiler).\n\nThe result was Park Bedlam, a turn-based tactics game where mammals face off against birds on a 24x30 grid, with dice-driven combat and a rock-paper-scissors advantage system.\n\nWe also presented our Deep Reinforcement Learning project, PEAK, to professors and organizers. Huge thanks to Cristiano Politowski, Yann-Gaël Guéhéneuc, Kevin Christopher Chua, and my teammates Aleks, Luca, and Sikander. Retro gaming isn't just nostalgia, it's a reminder that constraints breed creativity.",
    image: 'assets/reanimate-gamejam.webp',
    imageAlt: "The Re;Animate 2026 summer school group in front of the projected Re;Animate Summer School title",
    link: 'https://www.linkedin.com/feed/update/urn:li:activity:7471314433793933312/',
    linkLabel: 'Read on LinkedIn',
    tags: '#ReAnimate2026 #GameJam #RetroGaming #AMOS #Amiga #GameDevelopment',
  },
  {
    id: 'p1784065176378',
    author: 'Al Muqshith Shifan',
    role: "Graduation · Ontario Tech",
    time: 'Jun 2026',
    content: "Alhamdulillah. 🎓\n\nToday I officially graduated, and honestly there were moments I doubted this day would come. But here we are.\n\nThese years flew by. From struggling through networking concepts to competing in CTFs, from absorbing everything in lectures to standing at the front of a classroom passing it on as a TA, university was a full experience. To my students: you're next. And yes, I'm watching. 👀\n\nNone of this happens without the people who made the journey real, my closest friends, my professors who made the concepts worth learning, and Cristiano Politowski for seeing potential worth investing in and guiding me toward this next chapter.\n\nAnd to my parents, every sacrifice you made for my education lives in this degree. It belongs to you as much as it does to me.\n\nOn to the next chapter. The journey continues. 🚀",
    image: 'assets/graduation.webp',
    imageAlt: "AL Shifan in a graduation gown and cap, holding the diploma and roses beside a fountain on campus",
    link: 'https://www.linkedin.com/feed/update/urn:li:activity:7468452520521183232/',
    linkLabel: 'Read on LinkedIn',
    tags: '#Graduation #Alhamdulillah #OntarioTech #ComputerScience #NextChapter',
  },
  {
    id: 'p1784065200378',
    author: 'Al Muqshith Shifan',
    role: "Re;Animate 2026 · Countdown",
    time: 'Jun 2026',
    content: "Can't wait to attend, can't wait to see all the wonderful events and people.\n\nOne month to ReAnimate'26, the 3rd Summer School on Retro Gaming History, Critique, and Development, in Montréal, QC. It's going to be a great school with lots of retro-programming and discussions about retrocomputing.",
    image: 'assets/reanimate-countdown.webp',
    imageAlt: "The Re;Animate Summer School banner: pixel lettering next to a retro computer",
    link: 'https://www.linkedin.com/feed/update/urn:li:activity:7467714110491758592/',
    linkLabel: 'Read on LinkedIn',
    tags: '#ReAnimate #RetroGaming #Retrocomputing #Concordia',
  },
  {
    id: 'p1784065219379',
    author: 'Al Muqshith Shifan',
    role: "Grad Season · With Kevin",
    time: 'May 2026',
    content: "A close friend and my coding partner, Kevin Christopher Chua, and I are graduating this year. I owe him a lot for introducing me to the world of computer science and for all the projects and events we competed in together during our undergrad. Looking forward to what we accomplish during our master's programs.",
    image: 'assets/grad-with-kevin.webp',
    imageAlt: "Kevin Christopher Chua, AL Shifan and two friends standing in front of a whiteboard",
    link: 'https://www.linkedin.com/feed/update/urn:li:activity:7462983555216867330/',
    linkLabel: 'Read on LinkedIn',
    tags: '#Graduation #ComputerScience #OntarioTech #ClassOf2026',
  },
  {
    id: 'p2',
    author: 'Al Muqshith Shifan',
    role: 'Systematic Mapping Study',
    time: 'In progress',
    content: "I am deep in a systematic mapping study: Emotional Memory in LLM-Driven Non-Player Characters.\n\nThe result so far: the standard memory stream ranks the past by recency, importance, and relevance. It does not use emotion. Psychology says that emotion is one of the forces that decides what we keep and what comes back.\n\nOf 29 primary studies (from 87 screened): fewer than half link emotion to memory, only 9 base that link on a psychological method, and only 3 do both. None evaluates inside a commercial game. Only 2 measure latency, and none reports token cost.\n\nThe map shows where the next build must go.",
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
    content: "PEAK continues to grow. It is now a game-balancing engine. Small evolved neural agents play every level as cheap, repeatable playtesters.\n\n• Five deterministic 2D games: Mario-style, Meat Boy, Bomberman, and more\n• Agents with 291 weights, evolved by a genetic algorithm, no GPU needed\n• 7 player personas, from novice to speedrunner\n• Win rate with 95% confidence intervals, death causes, and routes for each level\n• Same seed and same search: after a level edit, any change comes from the level\n\nA regression test for game feel.",
    tags: '#Neuroevolution #GameBalancing #Playtesting #OpenSource',
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
  posts: loadPosts(),
};

// A copy saved by admin edits on this device must not hide posts added to the site later:
// default posts the copy has never seen go on top, unless the admin removed them here.
function loadPosts() {
  const saved = load(STORE_KEYS.posts, null);
  if (!saved) return structuredClone(DEFAULT_POSTS);
  const seen = new Set([...saved.map(p => p.id), ...load(STORE_KEYS.removed, [])]);
  return [...structuredClone(DEFAULT_POSTS.filter(p => !seen.has(p.id))), ...saved];
}

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
        ${p.link ? `<a class="btn btn-sm feed-link" href="${escapeAttr(p.link)}" target="_blank" rel="noopener"><i class="fab ${/linkedin\.com/.test(p.link) ? 'fa-linkedin-in' : 'fa-youtube'}" aria-hidden="true"></i> ${escapeHtml(p.linkLabel || 'Open Link')}</a>` : ''}
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

// Ring of 12 ticks. Adapted from Uiverse.io by elijahgummer (MIT)
const LOADER = '<svg class="loader" viewBox="0 0 48 48" aria-hidden="true">'
  + Array.from({ length: 12 }, (_, i) => `<line x1="24" y1="2" x2="24" y2="6" transform="rotate(${i * 30} 24 24)"/>`).join('')
  + '</svg>';

async function openReadme(repo) {
  const modal = document.getElementById('readme-modal');
  const title = document.getElementById('readme-title');
  const content = document.getElementById('readme-content');
  title.textContent = repo + ' · README';
  content.innerHTML = `<p class="md-loading">${LOADER}Fetching README…</p>`;
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
  const REPOS = { ridge: 'Code-SorceryLab/RIDGE', peak: 'Code-SorceryLab/PEAK-DRL-Tool', fathom: 'Al-Scripting/FATHOM' };
  const CMDS = {
    help: () => 'Commands: whoami, ls, cd <section>, cat skills, readme <ridge|peak|fathom>, ping github, neofetch, contact, motion <on|off>, clear',
    whoami: () => 'Al Muqshith Shifan. MSc Computer Science (Software Design), Ontario Tech.\nNetworking and security by training. Software design and AI by research.',
    ls: () => SECTIONS.map(s => s + '/').join('  '),
    cd: (a) => { if (!SECTIONS.includes(a)) return `cd: no such section: ${a || ''}. Try: ls`; document.getElementById(a).scrollIntoView(); return '-> ' + a; },
    cat: (a) => a === 'skills'
      ? [...document.querySelectorAll('.stack-col')].map(c => c.querySelector('h4').textContent + ': ' + [...c.querySelectorAll('li')].map(l => l.textContent).join(', ')).join('\n')
      : `cat: ${a || ''}: no such file. Try: cat skills`,
    readme: (a) => { const r = REPOS[(a || '').toLowerCase()]; if (!r) return 'readme: which one? ridge, peak, or fathom'; openReadme(r); return 'Opening ' + r + '…'; },
    ping: () => 'PING github.com: 64 bytes from Code-SorceryLab: time=1 ms\n--- 1 packet sent, 0% loss. The lab is up.',
    neofetch: () => 'al@sorcery\n----------\nOS: Ontario Tech University\nShell: Code & Sorcery Lab\nUptime: since 2016\nPackages: AFTERSTATE, PEAK, RIDGE, ROGUE, TAST, RAVEN, FATHOM, RAZE\nNetwork: P4 · Tofino · CCNA\nCPU: PPO, 4 persona heads',
    contact: () => 'Email: almuqshith.shifan@gmail.com\nLinkedIn: /in/al-mohamed-shifan-5266b924b\nGitHub: Al-Scripting\nScholar: scholar.google.ca/citations?user=0OwX660AAAAJ',
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
    btn.setAttribute('aria-checked', String(!still));
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
      save(STORE_KEYS.removed, [...load(STORE_KEYS.removed, []), id]);
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
  const deep = location.hash.match(/^#readme\/([\w.-]+\/[\w.-]+)$/);
  if (deep) openReadme(deep[1]);
});
