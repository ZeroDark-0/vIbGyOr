import {App, PluginSettingTab, Setting} from "obsidian";
import NoteThemerPlugin from "./main";

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

export interface NoteThemerSettings {
    themes: ThemeEntry[];
}

export const DEFAULT_SETTINGS: NoteThemerSettings = {
    themes: [
        { id: "vampire-palette", name: "Vampire Palette", category: "normal", pageColor: "#1a1112", linkColor: "#d74241", accentColor: "#85161a", penColor: "#eeefef", isPreset: true },
        { id: "default-light", name: "Light Mode Preset", category: "normal", pageColor: "#ffffff", linkColor: "#3366cc", accentColor: "#ff9900", penColor: "#000000", isPreset: true },
        { id: "default-dark", name: "Dark Mode Preset", category: "normal", pageColor: "#202020", linkColor: "#5588ff", accentColor: "#ff9900", penColor: "#ffffff", isPreset: true }
    ]
}

export class NoteThemerSettingTab extends PluginSettingTab {
    plugin: NoteThemerPlugin;

    constructor(app: App, plugin: NoteThemerPlugin) {
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
        const isPreset = theme.isPreset || ["vampire-palette", "default-light", "default-dark"].includes(theme.id);

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
