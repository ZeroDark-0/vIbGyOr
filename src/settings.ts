import {App, PluginSettingTab, Setting} from "obsidian";
import VibgyorPlugin from "./main";

export interface ThemeEntry {
    id: string;
    name: string;
    category: "normal" | "advanced" | "custom";
    pageColor: string;
    linkColor: string;
    accentColor: string;
    penColor: string;
    pagePattern?: string;
    gridColor?: string;
    isPreset?: boolean;
}

export interface VibgyorSettings {
    themes: ThemeEntry[];
}

export const DEFAULT_SETTINGS: VibgyorSettings = {
    themes: [
        { id: "default-dark", name: "Dark Mode Preset", category: "custom", pageColor: "#202020", linkColor: "#5588ff", accentColor: "#ff9900", penColor: "#ffffff", isPreset: true },
        { id: "default-light", name: "Light Mode Preset", category: "custom", pageColor: "#ffffff", linkColor: "#4f46e5", accentColor: "#ff9900", penColor: "#000000", isPreset: true },
        { id: "vampire-palette", name: "Vampire Palette", category: "normal", pageColor: "#1a1112", linkColor: "#d74241", accentColor: "#85161a", penColor: "#eeefef", isPreset: true },
        { id: "sepia-palette", name: "Sepia Palette", category: "normal", pageColor: "#f4ecd8", linkColor: "#5c4331", accentColor: "#d97742", penColor: "#433422", isPreset: true },
        { id: "nord-dark", name: "Nord Dark", category: "normal", pageColor: "#2e3440", linkColor: "#88c0d0", accentColor: "#5e81ac", penColor: "#eceff4", isPreset: true },
        { id: "neon-noir", name: "Neon Noir", category: "normal", pageColor: "#000000", linkColor: "#00e5ff", accentColor: "#ffffff", penColor: "#cfffe2", isPreset: true },
        { id: "crimson-ember", name: "Crimson Ember", category: "normal", pageColor: "#0c0c0c", linkColor: "#ff7b54", accentColor: "#481e14", penColor: "#f2613f", isPreset: true },
        { id: "twilight-harbor", name: "Twilight Harbor", category: "normal", pageColor: "#fbe4d6", linkColor: "#4338ca", accentColor: "#261fb3", penColor: "#0c0950", isPreset: true },
        { id: "imperial-noir", name: "Imperial Noir", category: "normal", pageColor: "#121312", linkColor: "#ad0013", accentColor: "#ad0013", penColor: "#a67d43", isPreset: true }
    ]
}

export class VibgyorSettingTab extends PluginSettingTab {
    plugin: VibgyorPlugin;

    constructor(app: App, plugin: VibgyorPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const {containerEl} = this;
        containerEl.empty();

        // ── Header ──
        new Setting(containerEl)
            .setName('Theme presets')
            .setHeading()
            .setDesc('Manage note theme presets organized by category.');

        // ── Custom palettes section ──
        new Setting(containerEl)
            .setName('Custom palettes')
            .setHeading()
            .setDesc('Your own personal color palettes.');
        
        const customSection = containerEl.createDiv({cls: 'theme-category-section'});


        const customThemes = this.plugin.settings.themes.filter(t => t.category === "custom");
        const customScrollArea = customSection.createDiv({cls: 'theme-scroll-area'});

        if (customThemes.length === 0) {
            customScrollArea.createEl('p', {text: 'No custom palettes yet. Add one below!', cls: 'theme-empty-state'});
        } else {
            customThemes.forEach((theme: ThemeEntry) => {
                const index = this.plugin.settings.themes.indexOf(theme);
                this.renderThemeCard(customScrollArea, theme, index);
            });
        }

        // Add custom theme button
        new Setting(customSection)
            .addButton(btn => btn
                .setButtonText('Add custom palette')
                .setCta()
                .onClick(async () => {
                    this.plugin.settings.themes.push({
                        id: Date.now().toString(),
                        name: 'My Palette',
                        category: 'custom',
                        pageColor: '#ffffff',
                        linkColor: '#3366cc',
                        accentColor: '#ff9900',
                        penColor: '#000000'
                    });
                    await this.plugin.saveSettings();
                    this.display();
                }));

        // ── Normal themes section ──
        new Setting(containerEl)
            .setName('Minimal themes')
            .setHeading()
            .setDesc('Simple, clean color presets for everyday note-taking.');

        const normalSection = containerEl.createDiv({cls: 'theme-category-section'});


        const normalThemes = this.plugin.settings.themes.filter(t => t.category === "normal");
        const normalScrollArea = normalSection.createDiv({cls: 'theme-scroll-area'});

        if (normalThemes.length === 0) {
            normalScrollArea.createEl('p', {text: 'No minimal themes yet. Add one below!', cls: 'theme-empty-state'});
        } else {
            normalThemes.forEach((theme: ThemeEntry) => {
                const index = this.plugin.settings.themes.indexOf(theme);
                this.renderThemeCard(normalScrollArea, theme, index);
            });
        }

        // ── Advanced themes section ──
        new Setting(containerEl)
            .setName('Advanced themes')
            .setHeading()
            .setDesc('Complex themes with extended customization options.');

        const advancedSection = containerEl.createDiv({cls: 'theme-category-section'});


        const advancedThemes = this.plugin.settings.themes.filter(t => t.category === "advanced");

        if (advancedThemes.length === 0) {
            const emptyDiv = advancedSection.createDiv({cls: 'theme-empty-state-box'});
            emptyDiv.createEl('p', {text: 'Coming soon', cls: 'theme-empty-title'});
            emptyDiv.createEl('p', {text: 'Advanced themes with gradients, animations, and more will be available in a future update.', cls: 'theme-empty-subtitle'});
        } else {
            advancedThemes.forEach((theme: ThemeEntry) => {
                const index = this.plugin.settings.themes.indexOf(theme);
                this.renderThemeCard(advancedSection, theme, index);
            });
        }
    }

    private renderThemeCard(parentEl: HTMLElement, theme: ThemeEntry, index: number): void {
        const themeDiv = parentEl.createDiv({cls: 'theme-card'});
        const isPreset = theme.isPreset || ["default-dark", "default-light", "vampire-palette", "sepia-palette", "nord-dark", "neon-noir", "crimson-ember", "twilight-harbor", "imperial-noir"].includes(theme.id);

        // Color preview strip at the top
        const previewStrip = themeDiv.createDiv({cls: 'theme-preview-strip'});
        const colors = [theme.pageColor, theme.linkColor, theme.accentColor, theme.penColor];
        colors.forEach(color => {
            const swatch = previewStrip.createDiv({cls: 'theme-preview-swatch'});
            swatch.style.backgroundColor = color;
        });

        // Single combined setting: Name + Colors + Remove
        new Setting(themeDiv)
            .setName(isPreset ? 'Page → link → accent → pen (preset)' : 'Page → link → accent → pen')
            .addText(text => text
                .setPlaceholder('Theme name')
                .setValue(theme.name)
                .setDisabled(isPreset)
                .onChange(async (value) => {
                    const themes = this.plugin.settings.themes;
                    if (themes[index]) themes[index].name = value;
                    await this.plugin.saveSettings();
                }))
            .addColorPicker(color => color
                .setValue(theme.pageColor)
                .setDisabled(isPreset)
                .onChange(async (value) => {
                    if (this.plugin.settings.themes[index]) this.plugin.settings.themes[index].pageColor = value;
                    await this.plugin.saveSettings();
                    this.display();
                }))
            .addColorPicker(color => color
                .setValue(theme.linkColor || "#3366cc")
                .setDisabled(isPreset)
                .onChange(async (value) => {
                    if (this.plugin.settings.themes[index]) this.plugin.settings.themes[index].linkColor = value;
                    await this.plugin.saveSettings();
                    this.display();
                }))
            .addColorPicker(color => color
                .setValue(theme.accentColor || "#ff9900")
                .setDisabled(isPreset)
                .onChange(async (value) => {
                    if (this.plugin.settings.themes[index]) this.plugin.settings.themes[index].accentColor = value;
                    await this.plugin.saveSettings();
                    this.display();
                }))
            .addColorPicker(color => color
                .setValue(theme.penColor)
                .setDisabled(isPreset)
                .onChange(async (value) => {
                    if (this.plugin.settings.themes[index]) this.plugin.settings.themes[index].penColor = value;
                    await this.plugin.saveSettings();
                    this.display();
                }))
            .then(setting => {
                if (!isPreset) {
                    setting.addButton(btn => btn
                        .setButtonText('Remove')
                        .setWarning()
                        .onClick(async () => {
                            this.plugin.settings.themes.splice(index, 1);
                            await this.plugin.saveSettings();
                            this.display();
                        }));
                }
            });
    }
}
