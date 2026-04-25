import {Plugin, TFile, Notice, MarkdownView, setIcon} from 'obsidian';
import {DEFAULT_SETTINGS, VibgyorSettings, VibgyorSettingTab} from "./settings";
import {ThemeModal} from "./ThemeModal";

export default class VibgyorPlugin extends Plugin {
	settings: VibgyorSettings;
	private toggleBtn: HTMLDivElement | null = null;

	async onload() {
		await this.loadSettings();

		// Add our new settings tab
		this.addSettingTab(new VibgyorSettingTab(this.app, this));

		// Add the Ribbon icon that triggers the Creation modal
		this.addRibbonIcon('paintbrush', 'Create note with theme', () => {
			new ThemeModal(this.app, this, false).open();
		});

		// Add a second Ribbon icon specifically for Editing the Active Note
		this.addRibbonIcon('palette', 'Edit active note theme', () => {
			const activeFile = this.app.workspace.getActiveFile();
			if (activeFile) {
				new ThemeModal(this.app, this, true).open();
			} else {
				new Notice("No active note to edit.");
			}
		});

		// Add a right-click Context Menu item inside all notes
		this.registerEvent(
			this.app.workspace.on('editor-menu', (menu) => {
				menu.addItem((item) => {
					item.setTitle("Edit note theme/pattern")
						.setIcon("palette")
						.onClick(() => {
							new ThemeModal(this.app, this, true).open();
						});
				});
			})
		);

		// Add a command in the palette as an alternative
		this.addCommand({
			id: 'create-themed-note',
			name: 'Create themed note',
			callback: () => {
				new ThemeModal(this.app, this, false).open();
			}
		});

		// Add a command for editing the current note theme
		this.addCommand({
			id: 'edit-current-note-theme',
			name: 'Edit current note theme',
			callback: () => {
				const activeFile = this.app.workspace.getActiveFile();
				if (activeFile) {
					new ThemeModal(this.app, this, true).open();
				} else {
					new Notice("No active note to edit.");
				}
			}
		});

		// When a new file is opened, apply its theme
		this.registerEvent(this.app.workspace.on('file-open', (file) => {
			if (file) this.applyThemeToLeaf(file);
		}));

		// When the frontmatter changes (user edits YAML properties), instantly refresh
		this.registerEvent(this.app.metadataCache.on('changed', (file) => {
			if (file === this.app.workspace.getActiveFile()) {
				this.applyThemeToLeaf(file);
			}
		}));

		// On startup, style whatever is currently active
		this.app.workspace.onLayoutReady(() => {
			const file = this.app.workspace.getActiveFile();
			if (file) this.applyThemeToLeaf(file);
		});

		this.setupImageToggle();
	}

	onunload() {
		// Remove the floating toggle button from the DOM
		if (this.toggleBtn) {
			this.toggleBtn.remove();
			this.toggleBtn = null;
		}

		// Clean up all themed leaf containers
		this.app.workspace.iterateAllLeaves(leaf => {
			if (!(leaf.view instanceof MarkdownView)) return;
			const view = leaf.view;
			if (view.containerEl) {
				view.containerEl.style.removeProperty('--note-page-color');
				view.containerEl.style.removeProperty('--note-pen-color');
				view.containerEl.style.removeProperty('--note-link-color');
				view.containerEl.style.removeProperty('--note-accent-color');
				view.containerEl.style.removeProperty('--note-grid-color');
				view.containerEl.style.removeProperty('--img-recolor-filter');
				view.containerEl.style.removeProperty('--dynamic-svg');
				view.containerEl.classList.remove('custom-note-theme',
					'pattern-lined', 'pattern-dotted', 'pattern-grid',
					'pattern-cornell', 'pattern-blueprint', 'pattern-woven',
					'pattern-hexagonal', 'pattern-cosmos', 'pattern-stars',
					'pattern-waves', 'pattern-maze', 'pattern-circuit',
					'pattern-checkerboard');
			}
		});
	}

	setupImageToggle() {
		this.toggleBtn = document.createElement('div');
		const toggleBtn = this.toggleBtn;
		toggleBtn.classList.add('vibgyor-img-toggle-btn');
		setIcon(toggleBtn, 'arrow-up-down');
		toggleBtn.title = 'Toggle image colors';
		document.body.appendChild(toggleBtn);

		let currentImg: HTMLImageElement | null = null;

		this.registerDomEvent(document, 'mouseover', (e: MouseEvent) => {
			const target = e.target as HTMLElement;
			if (target.tagName === 'IMG' && target.closest('.custom-note-theme')) {
				const img = target as HTMLImageElement;
				currentImg = img;

				const rect = img.getBoundingClientRect();
				toggleBtn.style.top = `${rect.top + 8}px`;
				toggleBtn.style.left = `${rect.left + 8}px`;
				toggleBtn.classList.add('is-visible');

				const isOriginal = img.getAttribute('data-original-mode') === 'true';
				toggleBtn.title = isOriginal ? 'Re-apply theme color' : 'View original colors';
			} else if (target === toggleBtn || toggleBtn.contains(target)) {
				// Keep visible
			} else {
				toggleBtn.classList.remove('is-visible');
				currentImg = null;
			}
		});

		this.registerDomEvent(document, 'scroll', () => {
			if (currentImg && toggleBtn.classList.contains('is-visible')) {
				const rect = currentImg.getBoundingClientRect();
				if (rect.top > window.innerHeight || rect.bottom < 0 || rect.left > window.innerWidth || rect.right < 0) {
					toggleBtn.classList.remove('is-visible');
					currentImg = null;
				} else {
					toggleBtn.style.top = `${rect.top + 8}px`;
					toggleBtn.style.left = `${rect.left + 8}px`;
				}
			}
		}, true);

		this.registerDomEvent(toggleBtn, 'click', async (e: MouseEvent) => {
			e.stopPropagation();
			if (currentImg) {
				const src = currentImg.getAttribute('src');
				if (!src) return;

				const isOriginal = currentImg.getAttribute('data-original-mode') === 'true';

				if (isOriginal) {
					currentImg.removeAttribute('data-original-mode');
					toggleBtn.title = 'View original colors';
					if (this.settings.originalImages) {
						this.settings.originalImages = this.settings.originalImages.filter(s => s !== src);
					}
				} else {
					currentImg.setAttribute('data-original-mode', 'true');
					toggleBtn.title = 'Re-apply theme color';
					if (!this.settings.originalImages) this.settings.originalImages = [];
					if (!this.settings.originalImages.includes(src)) {
						this.settings.originalImages.push(src);
					}
				}
				await this.saveSettings();
			}
		});
	}

	/**
	 * Safely extract a string value from frontmatter by key.
	 */
	private getFrontmatterString(frontmatter: Record<string, unknown> | undefined, key: string): string | undefined {
		if (!frontmatter) return undefined;
		const val: unknown = frontmatter[key];
		return typeof val === 'string' ? val : undefined;
	}

	applyThemeToLeaf(file: TFile) {
		// Wait a brief moment to ensure the DOM is ready for styles
		setTimeout(() => {
			const cache = this.app.metadataCache.getFileCache(file);
			const frontmatter = (cache?.frontmatter ?? {}) as Record<string, unknown>;
			const gs = (key: string) => this.getFrontmatterString(frontmatter, key);

			this.app.workspace.iterateAllLeaves(leaf => {
				if (!(leaf.view instanceof MarkdownView)) return;
				const view = leaf.view;
				// Target specifically the container showing THIS file
				if (view.file && view.file.path === file.path && view.containerEl) {
					// Clean up potential old pattern classes
					view.containerEl.classList.remove('pattern-lined', 'pattern-dotted', 'pattern-grid', 'pattern-cornell', 'pattern-blueprint', 'pattern-woven', 'pattern-hexagonal', 'pattern-cosmos', 'pattern-stars', 'pattern-waves', 'pattern-maze', 'pattern-circuit', 'pattern-checkerboard');

					let pg = gs('page-color');
					let pen = gs('pen-color');
					let lnk = gs('link-color');
					let acc = gs('accent-color');
					let pat = gs('page-pattern');
					let gridCol = gs('grid-color');

					const themeId = gs('theme-id');
					const themeName = gs('theme-name');
					if (themeId || themeName) {
						const theme = this.settings.themes.find(t =>
							(themeId && themeId !== "custom" && t.id === themeId) ||
							(themeName && themeName !== "Custom Colors" && t.name === themeName)
						);
						if (theme) {
							pg = pg || theme.pageColor;
							pen = pen || theme.penColor;
							lnk = lnk || theme.linkColor;
							acc = acc || theme.accentColor;
							pat = pat || theme.pagePattern;
							gridCol = gridCol || theme.gridColor;
						}
					}

					if (pg) {
						view.containerEl.style.setProperty('--note-page-color', pg);
						view.containerEl.style.setProperty('--note-pen-color', pen || 'inherit');
						view.containerEl.style.setProperty('--note-link-color', lnk || 'var(--text-a)');
						view.containerEl.style.setProperty('--note-accent-color', acc || 'var(--text-accent)');
						if (gridCol) {
							view.containerEl.style.setProperty('--note-grid-color', gridCol);
						} else {
							view.containerEl.style.removeProperty('--note-grid-color');
						}
						view.containerEl.classList.add('custom-note-theme');

						// Handle Page Pattern
						const pattern = pat || gs('page-pattern');
						if (pattern && ['lined', 'dotted', 'grid', 'cornell', 'blueprint', 'woven', 'hexagonal', 'cosmos', 'stars', 'waves', 'maze', 'circuit', 'checkerboard'].includes(pattern)) {
							view.containerEl.classList.add(`pattern-${pattern}`);

							// Dynamic SVG Injection for Cosmos
							if (pattern === 'cosmos') {
								const penColor = pen || '#ffffff';
								const penHex = penColor.replace('#', '%23');
								const svgStr = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'><circle cx='20' cy='20' r='2' fill='${penHex}' fill-opacity='0.2'/><circle cx='80' cy='40' r='3' fill='${penHex}' fill-opacity='0.15'/><circle cx='50' cy='80' r='1.5' fill='${penHex}' fill-opacity='0.3'/><path d='M70 15 L72 10 L74 15 L79 17 L74 19 L72 24 L70 19 L65 17 Z' fill='${penHex}' fill-opacity='0.25'/><circle cx='10' cy='60' r='1.5' fill='${penHex}' fill-opacity='0.25'/></svg>`;
								view.containerEl.style.setProperty('--dynamic-svg', `url("${svgStr}")`);
							}
							// Dynamic SVG Injection for Stars
							else if (pattern === 'stars') {
								const penColor = pen || '#ffffff';
								const c = penColor.replace('#', '%23');
								// 4-pointed star path helper
								const sp = (cx: number, cy: number, s: number, op: number) => {
									const i = s * 0.25;
									return `<path d='M${cx} ${cy-s} L${cx+i} ${cy-i} L${cx+s} ${cy} L${cx+i} ${cy+i} L${cx} ${cy+s} L${cx-i} ${cy+i} L${cx-s} ${cy} L${cx-i} ${cy-i} Z' fill='${c}' fill-opacity='${op}'/>`;
								};
								const dp = (cx: number, cy: number, r: number, op: number) =>
									`<circle cx='${cx}' cy='${cy}' r='${r}' fill='${c}' fill-opacity='${op}'/>`;
								const svgStr = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 300' width='300' height='300'>` +
									// Large stars
									sp(45,40,15,0.2) + sp(250,35,13,0.18) + sp(150,100,18,0.22) +
									sp(40,170,14,0.2) + sp(270,160,16,0.15) + sp(100,250,15,0.2) +
									sp(230,250,12,0.18) +
									// Medium stars
									sp(145,35,8,0.25) + sp(200,70,7,0.2) + sp(80,100,9,0.22) +
									sp(260,100,7,0.2) + sp(170,170,10,0.18) + sp(55,260,8,0.25) +
									sp(160,230,7,0.2) + sp(290,240,6,0.22) +
									// Small dots
									dp(110,55,2,0.2) + dp(210,25,1.5,0.25) + dp(30,85,1,0.3) +
									dp(295,60,1.5,0.2) + dp(185,135,2,0.15) + dp(20,135,1.5,0.25) +
									dp(120,150,1,0.3) + dp(225,130,2,0.2) + dp(70,200,1.5,0.25) +
									dp(130,190,1,0.2) + dp(215,195,1.5,0.25) + dp(280,200,1,0.3) +
									dp(30,290,2,0.2) + dp(190,280,1.5,0.25) + dp(270,285,1,0.2) +
									dp(145,280,1,0.3) +
									`</svg>`;
								view.containerEl.style.setProperty('--dynamic-svg', `url("${svgStr}")`);
							}
							// Dynamic SVG Injection for Zen Waves
							else if (pattern === 'waves') {
								const penColor = pen || '#ffffff';
								const c = penColor.replace('#', '%23');
								const svgStr = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 50' width='100' height='50'>` +
									`<circle cx='50' cy='50' r='40' fill='none' stroke='${c}' stroke-width='2' stroke-opacity='0.15'/>` +
									`<circle cx='50' cy='50' r='30' fill='none' stroke='${c}' stroke-width='2' stroke-opacity='0.15'/>` +
									`<circle cx='50' cy='50' r='20' fill='none' stroke='${c}' stroke-width='2' stroke-opacity='0.15'/>` +
									`<circle cx='50' cy='50' r='10' fill='none' stroke='${c}' stroke-width='2' stroke-opacity='0.15'/>` +
									`<circle cx='0' cy='0' r='40' fill='none' stroke='${c}' stroke-width='2' stroke-opacity='0.15'/>` +
									`<circle cx='0' cy='0' r='30' fill='none' stroke='${c}' stroke-width='2' stroke-opacity='0.15'/>` +
									`<circle cx='0' cy='0' r='20' fill='none' stroke='${c}' stroke-width='2' stroke-opacity='0.15'/>` +
									`<circle cx='0' cy='0' r='10' fill='none' stroke='${c}' stroke-width='2' stroke-opacity='0.15'/>` +
									`<circle cx='100' cy='0' r='40' fill='none' stroke='${c}' stroke-width='2' stroke-opacity='0.15'/>` +
									`<circle cx='100' cy='0' r='30' fill='none' stroke='${c}' stroke-width='2' stroke-opacity='0.15'/>` +
									`<circle cx='100' cy='0' r='20' fill='none' stroke='${c}' stroke-width='2' stroke-opacity='0.15'/>` +
									`<circle cx='100' cy='0' r='10' fill='none' stroke='${c}' stroke-width='2' stroke-opacity='0.15'/>` +
									`</svg>`;
								view.containerEl.style.setProperty('--dynamic-svg', `url("${svgStr}")`);
							}
							// Dynamic SVG Injection for Cyber Maze
							else if (pattern === 'maze') {
								const penColor = pen || '#ffffff';
								const c = penColor.replace('#', '%23');
								const svgStr = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200' width='200' height='200'>` +
									`<path d='M0 20 L40 20 L40 60 L10 60 L10 100 L60 100 L60 40 L100 40 L100 0 M120 0 L120 60 L80 60 L80 120 L20 120 L20 160 L80 160 L80 200 M140 200 L140 140 L100 140 L100 80 L160 80 L160 120 L200 120 M200 160 L160 160 L160 200 M0 180 L40 180 L40 140 L0 140 M180 0 L180 40 L140 40 L140 60 L200 60' fill='none' stroke='${c}' stroke-width='12' stroke-linecap='square' stroke-linejoin='miter' stroke-opacity='0.15'/>` +
									`<path d='M40 0 L40 10 M80 0 L80 20 M160 0 L160 20 M200 20 L180 20 M200 100 L180 100 M0 80 L20 80 M120 200 L120 180 M180 200 L180 180 M0 40 L20 40' fill='none' stroke='${c}' stroke-width='12' stroke-linecap='square' stroke-linejoin='miter' stroke-opacity='0.15'/>` +
									`</svg>`;
								view.containerEl.style.setProperty('--dynamic-svg', `url("${svgStr}")`);
							}
							// Dynamic SVG Injection for Cyber Circuit
							else if (pattern === 'circuit') {
								const penColor = pen || '#ffffff';
								const c = penColor.replace('#', '%23');
								const svgStr = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'>` +
									`<path d='M0 50 L30 50 L40 60 L40 100 M60 0 L60 40 L70 50 L100 50 M20 0 L20 20 L30 30 L70 30 L80 20 L80 0 M0 80 L20 80 L30 70 L70 70 L80 80 L80 100' fill='none' stroke='${c}' stroke-width='2' stroke-opacity='0.15'/>` +
									`<circle cx='40' cy='60' r='3' fill='${c}' fill-opacity='0.2'/>` +
									`<circle cx='60' cy='40' r='3' fill='${c}' fill-opacity='0.2'/>` +
									`<circle cx='30' cy='30' r='3' fill='${c}' fill-opacity='0.2'/>` +
									`<circle cx='70' cy='70' r='3' fill='${c}' fill-opacity='0.2'/>` +
									`</svg>`;
								view.containerEl.style.setProperty('--dynamic-svg', `url("${svgStr}")`);
							}
							else {
								view.containerEl.style.removeProperty('--dynamic-svg');
							}
						}

						// Auto-recolor images: generate an SVG filter that
						// floods the pen color and composites with SourceAlpha,
						// so only opaque pixels (ink) get the pen color.
						const penColorForFilter = (pen || '#000000').replace('#', '%23');
						const svgFilter = `url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg'><filter id='recolor'><feFlood flood-color='${penColorForFilter}' result='flood'/><feComposite in='flood' in2='SourceAlpha' operator='in'/></filter></svg>#recolor")`;
						view.containerEl.style.setProperty('--img-recolor-filter', svgFilter);

						const imgs = view.containerEl.querySelectorAll('img');
						imgs.forEach(img => {
							const src = img.getAttribute('src');
							if (src && this.settings.originalImages && this.settings.originalImages.includes(src)) {
								img.setAttribute('data-original-mode', 'true');
							} else {
								img.removeAttribute('data-original-mode');
							}
						});
					} else {
						// If no theme properties, revert to default Obsidian behavior
						view.containerEl.style.removeProperty('--note-page-color');
						view.containerEl.style.removeProperty('--note-pen-color');
						view.containerEl.style.removeProperty('--note-link-color');
						view.containerEl.style.removeProperty('--note-accent-color');
						view.containerEl.style.removeProperty('--note-grid-color');
						view.containerEl.style.removeProperty('--img-recolor-filter');
						view.containerEl.classList.remove('custom-note-theme');
					}
				}
			});
		}, 100);
	}

	async loadSettings() {
		const loadedData = await this.loadData() as Partial<VibgyorSettings> | null;
		this.settings = Object.assign({}, DEFAULT_SETTINGS, loadedData) as VibgyorSettings;

		// Extract custom themes from loaded settings (ignore old presets from data.json)
		const customThemes = (this.settings.themes || []).filter(t => !t.isPreset);

		// Guarantee that presets match the exact order and content of DEFAULT_SETTINGS, followed by custom themes
		this.settings.themes = [...DEFAULT_SETTINGS.themes, ...customThemes];
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
