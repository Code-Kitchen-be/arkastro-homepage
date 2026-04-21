// File input list display
const fileInput = document.getElementById('fileInput');
const fileList = document.getElementById('fileList');

fileInput?.addEventListener('change', (e) => {
  const target = e.target;
  const files = target?.files;

  if (files && files.length > 0) {
    const names = Array.from(files).map((f) => f.name);
    if (fileList) fileList.innerHTML = names.join('<br>');
  } else {
    if (fileList) fileList.textContent = '';
  }
});

// Mobile Menu Logic
const menuBtn = document.getElementById('mobileMenuBtn');
menuBtn?.addEventListener('click', () => {
  // Simplified for demo
  console.log('Menu toggled');
});
