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

  if (currentFile === 'sponsoraanvraag.html') {
    initSponsoraanvraagForm();
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

    // electron-builder names vary: "Bingo Setup 1.3.0.exe" or "Bingo.Setup.1.0.0.exe"
    const winAsset = assets.find((a) =>
      /^Bingo[\s._-]+Setup[\s._-]+.+\.exe$/i.test(a.name) && !/\.blockmap$/i.test(a.name)
    );
    const macAsset = assets.find((a) =>
      /^Bingo-.+-arm64\.dmg$/i.test(a.name) && !/\.blockmap$/i.test(a.name)
    );

    if (winLink) {
      winLink.href = winAsset?.browser_download_url || BINGO_RELEASES_FALLBACK;
    }
    if (macLink) {
      macLink.href = macAsset?.browser_download_url || BINGO_RELEASES_FALLBACK;
    }
  } catch {
    if (winLink) winLink.href = BINGO_RELEASES_FALLBACK;
    if (macLink) macLink.href = BINGO_RELEASES_FALLBACK;
  }
}

function initSponsoraanvraagForm() {
  const form = document.getElementById('sponsoraanvraag-form');
  if (!form) return;

  const datumAanvraag = document.getElementById('datum-aanvraag');
  if (datumAanvraag && !datumAanvraag.value) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    datumAanvraag.value = `${yyyy}-${mm}-${dd}`;
  }

  const statusEl = document.getElementById('form-status');
  const submitBtn = document.getElementById('sponsor-submit');
  const submitLabel = submitBtn?.querySelector('.submit-label');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      showSponsorStatus(statusEl, 'error', 'Controleer de verplichte velden en probeer opnieuw.');
      return;
    }

    const data = Object.fromEntries(new FormData(form).entries());
    const apiUrl = (form.dataset.apiUrl || '').trim();

    if (!apiUrl) {
      showSponsorStatus(
        statusEl,
        'error',
        'Het verzenden is nog niet geconfigureerd. Mail je aanvraag naar info@arkastro.be.'
      );
      return;
    }

    if (submitBtn) submitBtn.disabled = true;
    if (submitLabel) submitLabel.textContent = 'Bezig met versturen…';
    showSponsorStatus(statusEl, 'pending', 'Je aanvraag wordt verstuurd…');

    const organisatie = String(data.organisatie || '').trim();
    const payload = {
      subject: `Sponsoraanvraag — ${organisatie || 'Standaard Boekhandel Putte'}`,
      text: buildSponsoraanvraagText(data),
      html: buildSponsoraanvraagHtml(data),
      replyTo: String(data.email || '').trim(),
      tag: 'sponsoraanvraag',
      website: String(data.website || '').trim(),
    };

    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(result.error || 'Versturen mislukt.');
      }

      form.reset();
      if (datumAanvraag) {
        const today = new Date();
        datumAanvraag.value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      }

      showSponsorStatus(
        statusEl,
        'success',
        'Bedankt! Je sponsoraanvraag is verstuurd. We nemen zo snel mogelijk contact op.'
      );
    } catch (err) {
      showSponsorStatus(
        statusEl,
        'error',
        err?.message || 'Versturen mislukt. Probeer later opnieuw of mail naar info@arkastro.be.'
      );
    } finally {
      if (submitBtn) submitBtn.disabled = false;
      if (submitLabel) submitLabel.textContent = 'Verstuur aanvraag';
    }
  });
}

function buildSponsoraanvraagText(data) {
  const line = (label, value) => {
    const text = String(value ?? '').trim();
    return `${label}: ${text || '—'}`;
  };

  const bedrag = String(data.bedrag || '').trim();
  const bedragLine = bedrag ? `Gevraagd bedrag: € ${bedrag}` : 'Gevraagd bedrag: —';

  return [
    'Sponsoraanvraag',
    'Winkel: Standaard Boekhandel Putte (uitgebaat door Arkastro BV)',
    '',
    '1. Gegevens van de aanvrager',
    line('Naam vereniging of organisatie', data.organisatie),
    line('Naam contactpersoon', data.contactpersoon),
    line('Functie', data.functie),
    line('Telefoonnummer', data.telefoon),
    line('E-mailadres', data.email),
    '',
    '2. Details van het evenement',
    line('Naam van het evenement/project', data.evenement),
    line('Datum van het evenement', data['datum-evenement']),
    line('Locatie', data.locatie),
    line('Verwacht aantal deelnemers/bezoekers', data.deelnemers),
    '',
    '3. Gevraagde sponsoring',
    bedragLine,
    line('Gevraagde goederen', data.goederen),
    line('Andere vragen', data['andere-vragen']),
    '',
    '4. Tegenprestatie (visibiliteit)',
    line('Beschrijving', data.tegenprestatie),
    '',
    '5. Ondertekening',
    line('Naam aanvrager', data.handtekening),
    line('Datum aanvraag', data['datum-aanvraag']),
  ].join('\n');
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildSponsoraanvraagHtml(data) {
  const row = (label, value) =>
    `<tr><td style="padding:6px 12px 6px 0;color:#666;vertical-align:top;white-space:nowrap;">${escapeHtml(label)}</td><td style="padding:6px 0;color:#001F3F;">${escapeHtml(String(value || '—')).replace(/\n/g, '<br>')}</td></tr>`;

  const bedrag = String(data.bedrag || '').trim() ? `€ ${data.bedrag}` : '';

  return `
    <div style="font-family:Montserrat,Arial,sans-serif;max-width:640px;color:#001F3F;">
      <h1 style="color:#001F3F;font-size:22px;margin:0 0 4px;">Sponsoraanvraag</h1>
      <p style="color:#666;margin:0 0 24px;">Standaard Boekhandel Putte (Arkastro BV)</p>
      <h2 style="font-size:16px;border-bottom:2px solid #D4AF37;padding-bottom:6px;">1. Gegevens van de aanvrager</h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        ${row('Organisatie', data.organisatie)}
        ${row('Contactpersoon', data.contactpersoon)}
        ${row('Functie', data.functie)}
        ${row('Telefoon', data.telefoon)}
        ${row('E-mail', data.email)}
      </table>
      <h2 style="font-size:16px;border-bottom:2px solid #D4AF37;padding-bottom:6px;">2. Evenement</h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        ${row('Naam', data.evenement)}
        ${row('Datum', data['datum-evenement'])}
        ${row('Locatie', data.locatie)}
        ${row('Deelnemers', data.deelnemers)}
      </table>
      <h2 style="font-size:16px;border-bottom:2px solid #D4AF37;padding-bottom:6px;">3. Gevraagde sponsoring</h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        ${row('Bedrag', bedrag)}
        ${row('Goederen', data.goederen)}
        ${row('Andere vragen', data['andere-vragen'])}
      </table>
      <h2 style="font-size:16px;border-bottom:2px solid #D4AF37;padding-bottom:6px;">4. Tegenprestatie</h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        ${row('Beschrijving', data.tegenprestatie)}
      </table>
      <h2 style="font-size:16px;border-bottom:2px solid #D4AF37;padding-bottom:6px;">5. Ondertekening</h2>
      <table style="width:100%;border-collapse:collapse;">
        ${row('Naam', data.handtekening)}
        ${row('Datum', data['datum-aanvraag'])}
      </table>
    </div>
  `.trim();
}

function showSponsorStatus(el, type, message) {
  if (!el) return;
  el.classList.remove(
    'hidden',
    'bg-red-50', 'text-red-800',
    'bg-emerald-50', 'text-emerald-800',
    'bg-amber-50', 'text-amber-900'
  );

  if (type === 'error') {
    el.classList.add('bg-red-50', 'text-red-800');
  } else if (type === 'success') {
    el.classList.add('bg-emerald-50', 'text-emerald-800');
  } else {
    el.classList.add('bg-amber-50', 'text-amber-900');
  }

  el.textContent = message;
}
