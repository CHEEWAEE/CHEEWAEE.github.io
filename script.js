// Theme toggle functionality
const themeToggle = document.getElementById('themeToggle');
const themeIcon = themeToggle.querySelector('.theme-icon');
const htmlElement = document.documentElement;

const currentTheme = localStorage.getItem('theme') || 'light';
htmlElement.setAttribute('data-theme', currentTheme);
updateThemeIcon(currentTheme);

themeToggle.addEventListener('click', () => {
    const currentTheme = htmlElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    htmlElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
});

function updateThemeIcon(theme) {
    themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
}

// Typewriter effect for bio
const bio = document.querySelector('.about-section p');
const bioText = bio.textContent.replace(/\s+/g, ' ').trim();
bio.textContent = '';

const cursor = document.createElement('span');
cursor.textContent = '|';
cursor.style.cssText = 'animation: blink 1s step-end infinite; opacity: 1; color: var(--accent-1);';
bio.after(cursor);

const blinkStyle = document.createElement('style');
blinkStyle.textContent = '@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }';
document.head.appendChild(blinkStyle);

let i = 0;
function typeWriter() {
    if (i < bioText.length) {
        bio.textContent += bioText[i];
        i++;
        setTimeout(typeWriter, 28);
    } else {
        setTimeout(() => { cursor.style.display = 'none'; }, 2000);
    }
}

// Start after the container fade-in finishes (~600ms) + small buffer
setTimeout(typeWriter, 700);
