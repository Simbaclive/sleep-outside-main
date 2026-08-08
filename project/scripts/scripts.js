function switchView(viewName) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('nav a').forEach(a => a.classList.remove('active'));
    
    document.getElementById('view-' + viewName).classList.add('active');
    document.getElementById('nav-' + viewName).classList.add('active');
}

function filterSkills() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const cards = document.querySelectorAll('#skillsGrid .card');
    
    cards.forEach(card => {
        const text = card.getAttribute('data-name') + ' ' + card.getAttribute('data-skill');
        if(text.includes(query)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}