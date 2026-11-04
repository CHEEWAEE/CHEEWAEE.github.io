const html = document.documentElement;

/* ---------- theme ---------- */

const themeToggle = document.getElementById('themeToggle');
const themeIcon = themeToggle.querySelector('.theme-icon');

const sunSVG = `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
const moonSVG = `<svg viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;

function store(key, value) {
    try {
        if (value === undefined) return localStorage.getItem(key);
        localStorage.setItem(key, value);
    } catch (e) {
        return null;
    }
}

function applyTheme(theme) {
    html.setAttribute('data-theme', theme);
    themeIcon.innerHTML = theme === 'dark' ? sunSVG : moonSVG;
}

applyTheme(html.getAttribute('data-theme') || 'light');

themeToggle.addEventListener('click', () => {
    const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    store('theme', next);

    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!document.startViewTransition || reduce) {
        applyTheme(next);
        return;
    }

    const r = themeToggle.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));

    document.startViewTransition(() => applyTheme(next)).ready.then(() => {
        html.animate(
            { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
            { duration: 450, easing: 'cubic-bezier(.4,0,.2,1)', pseudoElement: '::view-transition-new(root)' }
        );
    });
});

/* ---------- email copy ---------- */

const copyBtn = document.getElementById('copyEmail');
const copiedLabel = copyBtn.querySelector('.copied');
let copiedTimer;

copyBtn.addEventListener('click', async () => {
    const email = copyBtn.dataset.email;
    try {
        await navigator.clipboard.writeText(email);
        copiedLabel.textContent = 'copied';
    } catch (e) {
        location.href = `mailto:${email}`;
        return;
    }
    clearTimeout(copiedTimer);
    copiedTimer = setTimeout(() => { copiedLabel.textContent = ''; }, 1600);
});

/* ---------- live repo activity ---------- */

const USER = 'CHEEWAEE';
const CACHE_KEY = 'repos:v1';
const CACHE_MS = 10 * 60 * 1000;

function ago(iso) {
    const s = (Date.now() - new Date(iso).getTime()) / 1000;
    const steps = [[60, 's'], [60, 'm'], [24, 'h'], [30, 'd'], [12, 'mo'], [Infinity, 'y']];
    let n = s;
    for (const [size, unit] of steps) {
        if (n < size) return `${Math.max(1, Math.floor(n))}${unit} ago`;
        n /= size;
    }
}

async function loadRepos() {
    try {
        const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) || 'null');
        if (cached && Date.now() - cached.t < CACHE_MS) return cached.repos;
    } catch (e) {}

    const res = await fetch(`https://api.github.com/users/${USER}/repos?per_page=100&sort=pushed`, {
        headers: { Accept: 'application/vnd.github+json' }
    });
    if (!res.ok) throw new Error(res.status);

    const repos = (await res.json()).map(r => ({ name: r.name, pushed: r.pushed_at }));
    try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), repos })); } catch (e) {}
    return repos;
}

loadRepos().then(repos => {
    const byName = new Map(repos.map(r => [r.name.toLowerCase(), r]));

    document.querySelectorAll('.projects li[data-repo]').forEach(li => {
        const repo = byName.get(li.dataset.repo.toLowerCase());
        if (!repo) return;
        const el = li.querySelector('.pushed');
        el.textContent = ago(repo.pushed);
        el.title = new Date(repo.pushed).toLocaleString();
    });

    const latest = repos
        .filter(r => r.name.toLowerCase() !== `${USER}.github.io`.toLowerCase())
        .sort((a, b) => new Date(b.pushed) - new Date(a.pushed))[0];
    if (!latest) return;

    const status = document.getElementById('status');
    const fresh = Date.now() - new Date(latest.pushed).getTime() < 3 * 24 * 3600 * 1000;
    status.innerHTML = `<span class="dot${fresh ? ' fresh' : ''}"></span>last push ${ago(latest.pushed)} · ${latest.name.toLowerCase()}`;
    status.hidden = false;
}).catch(() => { /* offline or rate-limited: rows just show no timestamp */ });
