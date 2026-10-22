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

  window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)},plausible.init=plausible.init||function(i){plausible.o=i||{}};
  plausible.init()

  if (currentFile === 'bingo.html') {
    resolveBingoDownloads();
  }
});

const BINGO_RELEASES_FALLBACK = 'https://github.com/Tseberechts/bingo/releases/latest';

async function resolveBingoDownloads() {
  const winLink = document.getElementById('bingo-download-win');
  const macLink = document.getElementById('bingo-download-mac');
  if (!winLink && !macLink) return;

  try {
    const res = await fetch('https://api.github.com/repos/Tseberechts/bingo/releases/latest');
    if (!res.ok) throw new Error(`GitHub API ${res.status}`);
    const release = await res.json();
    const assets = Array.isArray(release.assets) ? release.assets : [];

    const winAsset = assets.find((a) =>
      /Bingo[.\-]Setup[.\-].*\.exe$/i.test(a.name) && !/\.blockmap$/i.test(a.name)
    );
    const macAsset = assets.find((a) =>
      /Bingo-.*-arm64\.dmg$/i.test(a.name) && !/\.blockmap$/i.test(a.name)
    );

    if (winLink && winAsset?.browser_download_url) {
      winLink.href = winAsset.browser_download_url;
    }
    if (macLink && macAsset?.browser_download_url) {
      macLink.href = macAsset.browser_download_url;
    }
  } catch {
    if (winLink) winLink.href = BINGO_RELEASES_FALLBACK;
    if (macLink) macLink.href = BINGO_RELEASES_FALLBACK;
  }
}
