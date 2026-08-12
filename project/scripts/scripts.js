
const THEME_KEY = 'skillswap-theme';
const PROFILE_KEY = 'skillswap-profile';
const SWAPS_KEY = 'skillswap-swaps';
const GITHUB_KEY = 'skillswap-github-username';


const defaultProfile = {
    name: 'Clive Musika',
    title: 'Software Development & Cybersecurity Student',
    offered: ['C#', 'SQL', 'Python', 'Git & Version Control'],
    wanted: ['Cloud Architecture', 'Penetration Testing', 'Network Security', 'DevOps']
};


const FALLBACK_PEOPLE = [
    { id: 'alex', name: 'Alex Smith', photo: null, place: 'Cape Town, South Africa', offers: ['Graphic Design'], wants: ['JavaScript'] },
    { id: 'sarah', name: 'Sarah Jenkins', photo: null, place: 'London, United Kingdom', offers: ['Python'], wants: ['UI/UX'] },
    { id: 'thando', name: 'Thando Nkosi', photo: null, place: 'Johannesburg, South Africa', offers: ['Cloud Architecture'], wants: ['SQL'] },
    { id: 'priya', name: 'Priya Naidoo', photo: null, place: 'Durban, South Africa', offers: ['Penetration Testing'], wants: ['Python'] },
    { id: 'michael', name: 'Michael Chen', photo: null, place: 'Sydney, Australia', offers: ['DevOps'], wants: ['C#'] },
    { id: 'lindiwe', name: 'Lindiwe Zulu', photo: null, place: 'Pretoria, South Africa', offers: ['Network Security'], wants: ['Git & Version Control'] }
];


const SKILL_POOL = [
    { offers: ['Graphic Design'], wants: ['JavaScript'] },
    { offers: ['Python'], wants: ['UI/UX'] },
    { offers: ['Cloud Architecture'], wants: ['SQL'] },
    { offers: ['Penetration Testing'], wants: ['Python'] },
    { offers: ['DevOps'], wants: ['C#'] },
    { offers: ['Network Security'], wants: ['Git & Version Control'] }
];

let state = {
    profile: loadJSON(PROFILE_KEY, defaultProfile),
    people: [],       // filled by fetchPartners() from the randomuser.me API
    swaps: loadJSON(SWAPS_KEY, [])
};

function loadJSON(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : JSON.parse(JSON.stringify(fallback));
    } catch (e) {
        return JSON.parse(JSON.stringify(fallback));
    }
}

function saveProfile() {
    try { localStorage.setItem(PROFILE_KEY, JSON.stringify(state.profile)); } catch (e) { /* ignore */ }
}

function saveSwaps() {
    try { localStorage.setItem(SWAPS_KEY, JSON.stringify(state.swaps)); } catch (e) { /* ignore */ }
}

function switchView(viewName) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('nav a').forEach(a => a.classList.remove('active'));

    document.getElementById('view-' + viewName).classList.add('active');
    document.getElementById('nav-' + viewName).classList.add('active');

    if (viewName === 'home') renderPeople();
    if (viewName === 'profile') renderProfile();
    if (viewName === 'swap') renderSwaps();
}


async function fetchPartners() {
    const loading = document.getElementById('peopleLoading');
    const apiNote = document.getElementById('peopleApiNote');
    if (loading) loading.style.display = 'grid';

    try {
        const res = await fetch('https://randomuser.me/api/?results=6&nat=us,gb,za,au,ca&inc=name,picture,location,email,login,nat');
        if (!res.ok) throw new Error('Bad response: ' + res.status);
        const data = await res.json();

        state.people = data.results.map((person, i) => {
            const pair = SKILL_POOL[i % SKILL_POOL.length];
            return {
                id: person.login.uuid,
                name: `${person.name.first} ${person.name.last}`,
                photo: person.picture.large,
                place: `${person.location.city}, ${person.location.country}`,
                email: person.email,
                nationality: person.nat,
                offers: pair.offers,
                wants: pair.wants
            };
        });

        if (apiNote) apiNote.textContent = 'Partners loaded live from randomuser.me';
    } catch (err) {
        console.error('randomuser.me fetch failed:', err);
        state.people = FALLBACK_PEOPLE;
        if (apiNote) apiNote.textContent = 'Could not reach the partner API — showing sample partners instead.';
        showToast('Partner API unreachable — showing sample data');
    } finally {
        if (loading) loading.style.display = 'none';
        renderPeople();
    }
}


function norm(str) {
    return str.trim().toLowerCase();
}

function overlaps(listA, listB) {
    const setB = listB.map(norm);
    return listA.some(item => setB.includes(norm(item)));
}

function isMutualMatch(person) {
    const iWantWhatTheyOffer = overlaps(state.profile.wanted, person.offers);
    const theyWantWhatIOffer = overlaps(person.wants, state.profile.offered);
    return iWantWhatTheyOffer && theyWantWhatIOffer;
}

function renderPeople() {
    const grid = document.getElementById('skillsGrid');
    const query = (document.getElementById('searchInput').value || '').toLowerCase();
    grid.innerHTML = '';

    let visibleCount = 0;

    state.people.forEach(person => {
        const text = (person.name + ' ' + person.offers.join(' ') + ' ' + person.wants.join(' ') + ' ' + (person.place || '')).toLowerCase();
        if (!text.includes(query)) return;
        visibleCount++;

        const match = isMutualMatch(person);
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="card-person">
                ${person.photo
                    ? `<img class="avatar-photo" src="${person.photo}" alt="${escapeHtml(person.name)}">`
                    : `<div class="avatar">${escapeHtml(person.name.charAt(0))}</div>`}
                <div>
                    <h3>${escapeHtml(person.name)}</h3>
                    ${person.place ? `<p class="person-place">${escapeHtml(person.place)}</p>` : ''}
                </div>
                ${match ? '<span class="match-badge">Great match ✓</span>' : ''}
            </div>
            <div class="exchange-row">
                <span class="tag offer">Offers: ${person.offers.map(escapeHtml).join(', ')}</span>
            </div>
            <div class="exchange-row">
                <span class="tag want">Wants: ${person.wants.map(escapeHtml).join(', ')}</span>
            </div>
            <button class="btn" onclick="requestSwap('${person.id}')">
                Request Swap
            </button>
        `;
        grid.appendChild(card);
    });

    const emptyState = document.getElementById('emptyState');
    if (emptyState) emptyState.style.display = visibleCount === 0 ? 'block' : 'none';
}

function filterSkills() {
    renderPeople();
}


function requestSwap(personId) {
    const person = state.people.find(p => p.id === personId);
    if (!person) return;

    const existing = state.swaps.find(s => s.personId === personId && s.status !== 'declined');
    if (!existing) {
        const iOffer = state.profile.offered.find(s => person.wants.map(norm).includes(norm(s))) || state.profile.offered[0] || 'a skill';
        const theyOffer = person.offers.find(s => state.profile.wanted.map(norm).includes(norm(s))) || person.offers[0] || 'a skill';

        state.swaps.push({
            id: 'swap-' + Date.now(),
            personId: person.id,
            personName: person.name,
            iOffer,
            theyOffer,
            status: 'proposed',
            messages: []
        });
        saveSwaps();
    }

    switchView('swap');
    showToast(`Swap requested with ${person.name}`);
}

function acceptSwap(swapId) {
    const swap = state.swaps.find(s => s.id === swapId);
    if (!swap) return;
    swap.status = 'accepted';
    saveSwaps();
    renderSwaps();
    showToast('Swap Accepted!');
}

function renderSwaps() {
    const container = document.getElementById('swapContainer');
    container.innerHTML = '';

    if (state.swaps.length === 0) {
        container.innerHTML = `<div class="empty-state">No active swaps yet — head to <a onclick="switchView('home')" style="color: var(--primary); cursor:pointer;">Home / Search</a> and request one.</div>`;
        return;
    }

    [...state.swaps].reverse().forEach(swap => {
        const card = document.createElement('div');
        card.className = 'card';
        card.style.marginBottom = '1.25rem';

        const statusLabel = swap.status === 'accepted' ? 'Accepted' : 'Proposed Match';
        const pillClass = swap.status === 'accepted' ? 'status-pill accepted' : 'status-pill';

        card.innerHTML = `
            <h3>Swap with ${escapeHtml(swap.personName)}</h3>
            <span class="${pillClass}">${statusLabel}</span>
            <div class="exchange-row" style="margin-top: 0.9rem;">
                <span class="tag offer">${escapeHtml(swap.iOffer)}</span>
                <svg class="swap-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 16V4M7 4L3 8M7 4l4 4"/><path d="M17 8v12M17 20l4-4M17 20l-4-4"/></svg>
                <span class="tag want">${escapeHtml(swap.theyOffer)}</span>
            </div>
            ${swap.status !== 'accepted'
                ? `<button class="btn success" onclick="acceptSwap('${swap.id}')">Accept Swap</button>`
                : renderChatThread(swap)}
        `;
        container.appendChild(card);
    });
}

function renderChatThread(swap) {
    const messagesHtml = swap.messages.length
        ? swap.messages.map(m => `
            <div class="chat-message ${m.from === 'me' ? 'from-me' : 'from-them'}">
                <span class="chat-author">${m.from === 'me' ? 'You' : escapeHtml(swap.personName)}</span>
                <span class="chat-text">${escapeHtml(m.text)}</span>
            </div>
        `).join('')
        : `<div class="chat-empty">Say hi to ${escapeHtml(swap.personName)} to kick off your swap.</div>`;

    return `
        <div class="chat-thread">
            <div class="chat-messages" id="chat-${swap.id}">
                ${messagesHtml}
            </div>
            <div class="chat-input-row">
                <input type="text" class="chat-input" id="chat-input-${swap.id}"
                    placeholder="Message ${escapeHtml(swap.personName)}..."
                    onkeydown="if(event.key==='Enter') sendMessage('${swap.id}')">
                <button class="btn chat-send" onclick="sendMessage('${swap.id}')">Send</button>
            </div>
        </div>
    `;
}

function sendMessage(swapId) {
    const input = document.getElementById('chat-input-' + swapId);
    const text = input.value.trim();
    if (!text) return;

    const swap = state.swaps.find(s => s.id === swapId);
    if (!swap) return;

    swap.messages.push({ from: 'me', text });
    saveSwaps();
    input.value = '';
    renderSwaps();

    requestAnimationFrame(() => {
        const newInput = document.getElementById('chat-input-' + swapId);
        if (newInput) newInput.focus();
    });
}


function renderProfile() {
    document.getElementById('profileName').textContent = state.profile.name;
    document.getElementById('profileTitle').textContent = state.profile.title;
    document.getElementById('profileAvatar').textContent = state.profile.name.charAt(0).toUpperCase();
    renderTagList('offeredTags', state.profile.offered, 'offer', 'offered');
    renderTagList('wantedTags', state.profile.wanted, 'want', 'wanted');
}

function renderTagList(containerId, items, tagClass, field) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    items.forEach((item, index) => {
        const chip = document.createElement('span');
        chip.className = 'tag ' + tagClass + ' removable';
        chip.innerHTML = `${escapeHtml(item)} <button class="tag-remove" aria-label="Remove ${escapeHtml(item)}" onclick="removeSkill('${field}', ${index})">&times;</button>`;
        container.appendChild(chip);
    });
}

function addSkill(field, inputId) {
    const input = document.getElementById(inputId);
    const value = input.value.trim();
    if (!value) return;
    if (state.profile[field].map(norm).includes(norm(value))) {
        input.value = '';
        return;
    }
    state.profile[field].push(value);
    saveProfile();
    input.value = '';
    renderProfile();
}

function removeSkill(field, index) {
    state.profile[field].splice(index, 1);
    saveProfile();
    renderProfile();
}


async function fetchGithubProfile() {
    const usernameInput = document.getElementById('githubUsernameInput');
    const username = usernameInput.value.trim();
    const statusEl = document.getElementById('githubStatus');
    const profileEl = document.getElementById('githubProfile');

    if (!username) {
        statusEl.textContent = 'Enter a GitHub username first.';
        return;
    }

    statusEl.textContent = 'Loading GitHub profile...';
    statusEl.classList.remove('error');
    profileEl.style.display = 'none';

    try {
        const [userRes, reposRes] = await Promise.all([
            fetch(`https://api.github.com/users/${encodeURIComponent(username)}`),
            fetch(`https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=5`)
        ]);

        if (userRes.status === 404) throw new Error('No GitHub user with that username.');
        if (!userRes.ok) throw new Error('GitHub API error: ' + userRes.status);

        const user = await userRes.json();
        const repos = reposRes.ok ? await reposRes.json() : [];

        renderGithubProfile(user, repos);
        try { localStorage.setItem(GITHUB_KEY, username); } catch (e) { /* ignore */ }
        statusEl.textContent = '';
    } catch (err) {
        console.error('GitHub fetch failed:', err);
        statusEl.textContent = err.message || 'Could not load that GitHub profile.';
        statusEl.classList.add('error');
        profileEl.style.display = 'none';
    }
}

function renderGithubProfile(user, repos) {
    const profileEl = document.getElementById('githubProfile');
    profileEl.style.display = 'block';

    const repoItems = repos.length
        ? repos.map(r => `
            <a class="repo-card" href="${r.html_url}" target="_blank" rel="noopener">
                <div class="repo-name">${escapeHtml(r.name)}</div>
                <div class="repo-desc">${escapeHtml(r.description || 'No description')}</div>
                <div class="repo-meta">
                    ${r.language ? `<span class="tag offer">${escapeHtml(r.language)}</span>` : ''}
                    <span class="repo-stars">★ ${r.stargazers_count}</span>
                </div>
            </a>
        `).join('')
        : `<div class="chat-empty">No public repos to show.</div>`;

    profileEl.innerHTML = `
        <div class="github-card">
            <img class="avatar-photo large" src="${user.avatar_url}" alt="${escapeHtml(user.login)}">
            <div>
                <h4 class="github-name">${escapeHtml(user.name || user.login)}</h4>
                <a href="${user.html_url}" target="_blank" rel="noopener" class="github-handle">@${escapeHtml(user.login)}</a>
                ${user.bio ? `<p class="github-bio">${escapeHtml(user.bio)}</p>` : ''}
                <div class="github-stats">
                    <span><strong>${user.public_repos}</strong> repos</span>
                    <span><strong>${user.followers}</strong> followers</span>
                    <span><strong>${user.following}</strong> following</span>
                    ${user.location ? `<span>${escapeHtml(user.location)}</span>` : ''}
                </div>
            </div>
        </div>
        <div class="repo-grid">${repoItems}</div>
    `;
}


let toastTimer = null;

function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toast.classList.remove('visible');
    }, 2600);
}


function applyTheme(theme) {
    document.body.classList.toggle('dark', theme === 'dark');
    const label = document.getElementById('themeLabel');
    const icon = document.getElementById('themeIcon');
    if (label) label.textContent = theme === 'dark' ? 'Dark Mode' : 'Light Mode';
    if (icon) icon.innerHTML = theme === 'dark' ? moonIcon() : sunIcon();
}

function toggleTheme() {
    const isDark = document.body.classList.contains('dark');
    const next = isDark ? 'light' : 'dark';
    applyTheme(next);
    try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* ignore */ }
}

function sunIcon() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>';
}

function moonIcon() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
}

function initTheme() {
    let saved = null;
    try { saved = localStorage.getItem(THEME_KEY); } catch (e) { /* ignore */ }
    if (!saved) {
        saved = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    applyTheme(saved);
}


function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}


document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    fetchPartners();
    renderProfile();
    renderSwaps();

    let savedGithubUser = 'octocat';
    try { savedGithubUser = localStorage.getItem(GITHUB_KEY) || 'octocat'; } catch (e) { /* ignore */ }
    document.getElementById('githubUsernameInput').value = savedGithubUser;
    fetchGithubProfile();
});
