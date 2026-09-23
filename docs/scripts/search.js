(() => {
	const PAGE_INDEX = [
		{
			key: 'home',
			title: 'Inicio',
			description: 'Bienvenida, mapa de documentación y scripts.',
			terms: ['inicio', 'bienvenida', 'docs', 'documentacion', 'makeshop'],
			href: 'index.html',
		},
		{
			key: 'api',
			title: 'API',
			description: 'Gateway store-service, endpoints, puertos y bases.',
			terms: ['api', 'gateway', 'store-service', 'endpoint', 'puertos', 'backend'],
			href: 'pages/api.html',
		},
		{
			key: 'frontend',
			title: 'Frontend',
			description: 'React, Vite, TailwindCSS y login por rol.',
			terms: ['frontend', 'react', 'vite', 'tailwind', 'login', 'router'],
			href: 'pages/frontend.html',
		},
		{
			key: 'dataingest',
			title: 'Data ingest',
			description: 'Ingesta, boto3, S3 y Athena.',
			terms: ['ingesta', 'dataingest', 'boto3', 's3', 'athena', 'csv', 'json'],
			href: 'pages/dataingest.html',
		},
		{
			key: 'deployment',
			title: 'Deployment',
			description: 'CloudFormation, Docker y Docker Compose.',
			terms: ['deployment', 'cloudformation', 'docker', 'compose', 'amplify'],
			href: 'pages/deployment.html',
		},
		{
			key: 'infrastructure',
			title: 'Infrastructure',
			description: 'ER, arquitectura AWS y atributos de BD.',
			terms: ['infraestructura', 'er', 'aws', 'arquitectura', 'base de datos'],
			href: 'pages/infrastructure.html',
		},
	];

	const normalize = (value) =>
		value
			.toLowerCase()
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '')
			.trim();

	const scoreMatch = (query, page) => {
		const normalizedQuery = normalize(query);
		if (!normalizedQuery) {
			return 0;
		}

		let score = 0;
		if (normalize(page.title).includes(normalizedQuery)) score += 6;
		if (normalize(page.description).includes(normalizedQuery)) score += 4;
		for (const term of page.terms) {
			if (normalize(term).includes(normalizedQuery)) {
				score += 3;
			}
		}
		return score;
	};

	const renderResults = (resultsContainer, query, pages, resolveHref) => {
		resultsContainer.innerHTML = '';

		if (!query.trim()) {
			resultsContainer.innerHTML = '<div class="search-empty">Escribe una palabra y navega a la página relacionada.</div>';
			return;
		}

		if (pages.length === 0) {
			resultsContainer.innerHTML = '<div class="search-empty">No encontramos coincidencias.</div>';
			return;
		}

		const fragment = document.createDocumentFragment();
		pages.slice(0, 5).forEach((page) => {
			const link = document.createElement('a');
			link.className = 'search-result';
			link.href = resolveHref(page.href);
			link.innerHTML = `<span>${page.title}</span><small>${page.description}</small>`;
			fragment.appendChild(link);
		});
		resultsContainer.appendChild(fragment);
	};

	const init = ({ resolveHref } = {}) => {
		const resolver = resolveHref ?? ((target) => target);
		const form = document.querySelector('[data-doc-search-form]');
		const input = document.querySelector('[data-doc-search-input]');
		const results = document.querySelector('[data-doc-search-results]');

		if (!form || !input || !results) {
			return;
		}

		const update = () => {
			const query = input.value;
			const matches = PAGE_INDEX
				.map((page) => ({ page, score: scoreMatch(query, page) }))
				.filter((entry) => entry.score > 0)
				.sort((left, right) => right.score - left.score)
				.map((entry) => entry.page);

			renderResults(results, query, matches, resolver);
		};

		input.addEventListener('input', update);
		form.addEventListener('submit', (event) => {
			event.preventDefault();
			const query = input.value;
			const matches = PAGE_INDEX
				.map((page) => ({ page, score: scoreMatch(query, page) }))
				.filter((entry) => entry.score > 0)
				.sort((left, right) => right.score - left.score);

			if (matches.length > 0) {
				window.location.href = resolver(matches[0].page.href);
			}
		});

		update();
	};

	window.MakeShopDocsSearch = { init };
})();
