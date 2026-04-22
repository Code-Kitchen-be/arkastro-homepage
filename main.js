// Mobile Menu Logic
const menuBtn = document.getElementById('mobileMenuBtn');
menuBtn?.addEventListener('click', () => {
  // Simplified for demo
  console.log('Menu toggled');
});

// Navbar active page highlighting
document.addEventListener('DOMContentLoaded', () => {
  const currentFile = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const currentHash = (window.location.hash || '').toLowerCase();

  document.querySelectorAll('a.nav-link').forEach((a) => {
    a.removeAttribute('aria-current');

    const href = (a.getAttribute('href') || '').trim();
    if (!href) return;

    // Hash links: only mark active when hash matches (on index page)
    if (href.startsWith('#')) {
      if (currentFile === 'index.html' && currentHash === href.toLowerCase()) {
        a.setAttribute('aria-current', 'page');
      }
      return;
    }

    // Compare normalized filename from href (supports "index.html#over-ons")
    const hrefFile = href.split('#')[0].split('?')[0].toLowerCase();
    if (hrefFile && hrefFile === currentFile) {
      a.setAttribute('aria-current', 'page');
    }
  });
});
