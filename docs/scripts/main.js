(() => {
  const getRoot = () => document.body?.dataset.docsRoot ?? './';

  const resolveHref = (target) => {
    const root = new URL(getRoot(), document.baseURI);
    return new URL(target, root).href;
  };

  // ─── Wire doc links ───────────────────────────────────────
  const wireDocLinks = () => {
    document.querySelectorAll('[data-doc-href]').forEach((el) => {
      const t = el.getAttribute('data-doc-href');
      if (t) el.setAttribute('href', resolveHref(t));
    });
    const page = document.body?.dataset.page;
    if (page) {
      document.querySelectorAll('[data-nav-link]').forEach((el) => {
        if (el.getAttribute('data-nav-link') === page) el.classList.add('is-active');
      });
    }
  };

  // ─── Sidebar toggle (persisted in localStorage) ───────────
  const SIDEBAR_KEY = 'opendocs-sidebar-collapsed';

  const initSidebar = () => {
    const sidebar = document.querySelector('.docs-sidebar');
    const main = document.querySelector('.docs-main');
    const toggleBtn = document.querySelector('.sidebar-toggle');
    if (!sidebar || !toggleBtn) return;

    const isMobile = () => window.innerWidth <= 900;

    // Restore saved state (desktop only; mobile always starts closed)
    let collapsed = !isMobile() && localStorage.getItem(SIDEBAR_KEY) === 'true';

    const apply = () => {
      if (isMobile()) {
        sidebar.classList.toggle('mobile-open', !collapsed);
        sidebar.classList.remove('is-collapsed');
        main?.classList.remove('sidebar-collapsed');
      } else {
        sidebar.classList.toggle('is-collapsed', collapsed);
        main?.classList.toggle('sidebar-collapsed', collapsed);
        sidebar.classList.remove('mobile-open');
      }
    };

    // Apply saved state immediately on load (no animation flash)
    sidebar.style.transition = 'none';
    main && (main.style.transition = 'none');
    apply();
    // Re-enable transitions after first paint
    requestAnimationFrame(() => {
      sidebar.style.transition = '';
      main && (main.style.transition = '');
    });

    toggleBtn.addEventListener('click', () => {
      collapsed = !collapsed;
      localStorage.setItem(SIDEBAR_KEY, String(collapsed));
      apply();
    });

    window.addEventListener('resize', () => {
      // On resize to mobile, reset collapsed so it behaves naturally
      if (isMobile()) collapsed = false;
      apply();
    });
  };

  // ─── Navbar search ────────────────────────────────────────
  const pages = [
    { title: 'Inicio', page: 'home', href: 'index.html', keywords: ['inicio', 'home', 'bienvenida', 'makeshop', 'microservicios'] },
    { title: 'API & Gateway', page: 'api', href: 'pages/api.html', keywords: ['api', 'gateway', 'store-service', 'endpoint', 'http', 'puerto', 'rest'] },
    { title: 'Frontend', page: 'frontend', href: 'pages/frontend.html', keywords: ['frontend', 'react', 'vite', 'tailwind', 'typescript', 'router', 'login'] },
    { title: 'Data Ingest', page: 'dataingest', href: 'pages/dataingest.html', keywords: ['data', 'ingest', 'ingesta', 'boto3', 's3', 'athena', 'csv', 'python'] },
    { title: 'Deployment', page: 'deployment', href: 'pages/deployment.html', keywords: ['deploy', 'docker', 'cloudformation', 'compose', 'amplify', 'aws'] },
    { title: 'Infrastructure', page: 'infrastructure', href: 'pages/infrastructure.html', keywords: ['infraestructura', 'er', 'diagrama', 'ec2', 'alb', 'base de datos', 'modelo'] },
  ];

  const initSearch = () => {
    const input = document.querySelector('[data-navbar-search]');
    const dropdown = document.querySelector('.search-results-dropdown');
    if (!input || !dropdown) return;

    const render = (results) => {
      dropdown.innerHTML = '';
      if (!results.length) {
        dropdown.innerHTML = '<div class="search-empty-msg">Sin resultados</div>';
        dropdown.classList.add('is-open');
        return;
      }
      results.forEach(({ title, href, page }) => {
        const el = document.createElement('a');
        el.className = 'search-result-item';
        el.href = resolveHref(href);
        el.innerHTML = `<span>${title}</span><span class="result-page">${page}</span>`;
        dropdown.appendChild(el);
      });
      dropdown.classList.add('is-open');
    };

    input.addEventListener('input', () => {
      const q = input.value.toLowerCase().trim();
      if (!q) { dropdown.classList.remove('is-open'); return; }
      const hits = pages.filter(p =>
        p.title.toLowerCase().includes(q) || p.keywords.some(k => k.includes(q))
      );
      render(hits);
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.navbar-search')) dropdown.classList.remove('is-open');
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { dropdown.classList.remove('is-open'); input.blur(); }
    });
  };

  // ─── Year ─────────────────────────────────────────────────
  const syncYear = () => {
    document.querySelectorAll('[data-current-year]').forEach(n => {
      n.textContent = new Date().getFullYear();
    });
  };

  // ─── Boot ─────────────────────────────────────────────────
  const boot = () => {
    wireDocLinks();
    initSidebar();
    initSearch();
    syncYear();
    window.MakeShopImageZoom?.init?.();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
