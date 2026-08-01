// Copy-to-clipboard for the QuickStart block, and a lightweight mobile-nav
// disclosure. No external dependencies, no browser storage.
document.documentElement.dataset.js = 'ready';

document.addEventListener('DOMContentLoaded', () => {
  const code = document.getElementById('quickstart-code');
  if (code) {
    // Capture the prompt before the button is inserted. The button lives
    // inside the block for positioning, so reading textContent afterwards
    // would append its own label ("复制") to everything the user copies.
    const prompt = code.textContent.trim();

    const btn = document.createElement('button');
    btn.className = 'copy-btn';
    btn.type = 'button';
    btn.textContent = '复制';
    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(prompt);
        btn.textContent = '已复制';
      } catch (err) {
        btn.textContent = '复制失败';
      }
      setTimeout(() => { btn.textContent = '复制'; }, 1800);
    });
    code.style.position = 'relative';
    code.appendChild(btn);
  }

  // Scroll reveal. Elements are opaque by default in CSS unless this runs, so
  // a failed script or a no-JS browser still shows every section.
  const targets = document.querySelectorAll('[data-reveal]');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!targets.length) return;
  if (reduce || !('IntersectionObserver' in window)) {
    targets.forEach((el) => el.classList.add('is-visible'));
    return;
  }
  targets.forEach((el) => el.classList.add('reveal'));
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      io.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -12% 0px' });
  targets.forEach((el) => io.observe(el));
});
