import {Plugin, TFile, Notice, MarkdownView} from 'obsidian';
import {DEFAULT_SETTINGS, NoteThemerSettings, NoteThemerSettingTab} from "./settings";
import {ThemeModal} from "./ThemeModal";

export default class NoteThemerPlugin extends Plugin {
	settings: NoteThemerSettings;

	async onload() {
		await this.loadSettings();

		// Add our new settings tab
		this.addSettingTab(new NoteThemerSettingTab(this.app, this));

		// Add the Ribbon icon that triggers the Creation modal
		this.addRibbonIcon('paintbrush', 'Create note with theme', (evt: MouseEvent) => {
			new ThemeModal(this.app, this, false).open();
		});

		// Add a second Ribbon icon specifically for Editing the Active Note
		this.addRibbonIcon('palette', 'Edit active note theme', (evt: MouseEvent) => {
            const activeFile = this.app.workspace.getActiveFile();
            if (activeFile) {
                new ThemeModal(this.app, this, true).open();
            } else {
                new Notice("No active note to edit.");
            }
		});

		// Add a right-click Context Menu item inside all notes
		this.registerEvent(
			this.app.workspace.on('editor-menu', (menu, editor, view) => {
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
	}

    applyThemeToLeaf(file: TFile) {
        // Wait a brief moment to ensure the DOM is ready for styles
        setTimeout(() => {
            const cache = this.app.metadataCache.getFileCache(file);
            const frontmatter: Record<string, string> | undefined = cache?.frontmatter;
            
            this.app.workspace.iterateAllLeaves(leaf => {
                const view = leaf.view as MarkdownView;
                // Target specifically the container showing THIS file
                if (view.file && view.file.path === file.path && view.containerEl) {
                    // Clean up potential old pattern classes
                    view.containerEl.classList.remove('pattern-lined', 'pattern-dotted', 'pattern-grid', 'pattern-cornell', 'pattern-blueprint', 'pattern-woven', 'pattern-hexagonal', 'pattern-cosmos', 'pattern-checkerboard');

                    if (frontmatter && frontmatter['page-color']) {
                        view.containerEl.style.setProperty('--note-page-color', frontmatter['page-color']);
                        view.containerEl.style.setProperty('--note-pen-color', frontmatter['pen-color'] || 'inherit');
                        view.containerEl.style.setProperty('--note-link-color', frontmatter['link-color'] || 'var(--text-a)');
                        view.containerEl.style.setProperty('--note-accent-color', frontmatter['accent-color'] || 'var(--text-accent)');
                        if (frontmatter['grid-color']) {
                            view.containerEl.style.setProperty('--note-grid-color', frontmatter['grid-color']);
                        } else {
                            view.containerEl.style.removeProperty('--note-grid-color');
                        }
                        view.containerEl.classList.add('custom-note-theme');
                        
                        // Handle Page Pattern
                        const pattern = frontmatter['page-pattern'];
                        if (pattern && ['lined', 'dotted', 'grid', 'cornell', 'blueprint', 'woven', 'hexagonal', 'cosmos', 'checkerboard'].includes(pattern)) {
                            view.containerEl.classList.add(`pattern-${pattern}`);
                            
                            // Dynamic SVG Injection for Cosmos
                            if (pattern === 'cosmos') {
                                const penColor = frontmatter['pen-color'] || '#ffffff';
                                const penHex = penColor.toString().replace('#', '%23');
                                const svgStr = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'><circle cx='20' cy='20' r='2' fill='${penHex}' fill-opacity='0.2'/><circle cx='80' cy='40' r='3' fill='${penHex}' fill-opacity='0.15'/><circle cx='50' cy='80' r='1.5' fill='${penHex}' fill-opacity='0.3'/><path d='M70 15 L72 10 L74 15 L79 17 L74 19 L72 24 L70 19 L65 17 Z' fill='${penHex}' fill-opacity='0.25'/><circle cx='10' cy='60' r='1.5' fill='${penHex}' fill-opacity='0.25'/></svg>`;
                                view.containerEl.style.setProperty('--dynamic-svg', `url("${svgStr}")`);
                            } else {
                                view.containerEl.style.removeProperty('--dynamic-svg');
                            }
                        }
                    } else {
                        // If no theme properties, revert to default Obsidian behavior
                        view.containerEl.style.removeProperty('--note-page-color');
                        view.containerEl.style.removeProperty('--note-pen-color');
                        view.containerEl.style.removeProperty('--note-link-color');
                        view.containerEl.style.removeProperty('--note-accent-color');
                        view.containerEl.style.removeProperty('--note-grid-color');
                        view.containerEl.classList.remove('custom-note-theme');
                    }
                }
            });
        }, 100);
    }

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData()) as NoteThemerSettings;

		// Ensure preset themes are always up-to-date with defaults
		for (const preset of DEFAULT_SETTINGS.themes) {
			if (!preset.isPreset) continue;
			const idx = this.settings.themes.findIndex(t => t.id === preset.id);
			if (idx === -1) {
				this.settings.themes.push(preset);
			} else {
				this.settings.themes[idx] = preset;
			}
		}

		// Remove any preset themes from saved settings that no longer exist in defaults (e.g. Brooklyn)
		const defaultPresetIds = new Set(DEFAULT_SETTINGS.themes.map(t => t.id));
		this.settings.themes = this.settings.themes.filter(t => !t.isPreset || defaultPresetIds.has(t.id));
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
