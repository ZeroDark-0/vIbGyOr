import {App, Modal, Setting, Notice, TFile, ColorComponent, DropdownComponent} from "obsidian";
import VibgyorPlugin from "./main";

export class ThemeModal extends Modal {
    plugin: VibgyorPlugin;
    noteTitle: string = "";
    selectedThemeId: string = "custom";
    customPageColor: string = "#ffffff";
    customLinkColor: string = "#3366cc";
    customAccentColor: string = "#ff9900";
    customPenColor: string = "#000000";
    customPagePattern: string = "none";
    selectedCategory: string = "all";
    isEditMode: boolean = false;

    constructor(app: App, plugin: VibgyorPlugin, isEditMode: boolean = false) {
        super(app);
        this.plugin = plugin;
        this.isEditMode = isEditMode;
    }

    onOpen() {
        const {contentEl} = this;
        contentEl.empty();

        contentEl.createEl("h2", {text: this.isEditMode ? "Edit current note theme" : "Create themed note"});

        // Note Title
        if (!this.isEditMode) {
            new Setting(contentEl)
                .setName("Note title")
                .setDesc("Enter the name for the new note.")
                .addText(text => text
                    .setPlaceholder("Untitled")
                    .onChange(value => {
                        this.noteTitle = value;
                    }));
        } else {
            const activeFile = this.app.workspace.getActiveFile();
            if (activeFile) {
                contentEl.createEl("p", {text: `Editing theme for: ${activeFile.name}`});
                
                // Preload current frontmatter values if they exist
                const cache = this.app.metadataCache.getFileCache(activeFile);
                const frontmatter: any = cache?.frontmatter;
                if (frontmatter) {
                    if (frontmatter['page-color']) this.customPageColor = frontmatter['page-color'];
                    if (frontmatter['link-color']) this.customLinkColor = frontmatter['link-color'];
                    if (frontmatter['accent-color']) this.customAccentColor = frontmatter['accent-color'];
                    if (frontmatter['pen-color']) this.customPenColor = frontmatter['pen-color'];
                    if (frontmatter['page-pattern']) this.customPagePattern = frontmatter['page-pattern'];
                    if (frontmatter['theme-id']) {
                        this.selectedThemeId = frontmatter['theme-id'];
                    } else {
                        // Fallback: Try to identify the theme by matching colors/pattern
                        const matchingTheme = this.plugin.settings.themes.find(t => 
                            t.pageColor === this.customPageColor &&
                            t.penColor === this.customPenColor &&
                            t.linkColor === this.customLinkColor &&
                            t.accentColor === this.customAccentColor &&
                            (t.pagePattern || "none") === this.customPagePattern
                        );
                        if (matchingTheme) this.selectedThemeId = matchingTheme.id;
                    }
                }
            } else {
                contentEl.createEl("p", {text: `No active note open to edit.`});
                return;
            }
        }
        
        const selectionContainer = contentEl.createDiv();
        this.renderThemeSelection(selectionContainer);
    }

    private renderThemeSelection(containerEl: HTMLElement) {
        containerEl.empty();

        // Theme Category Selection
        new Setting(containerEl)
            .setName("Theme type")
            .setDesc("Filter presets by category.")
            .addDropdown(dropdown => {
                dropdown.addOptions({
                    "all": "All categories",
                    "normal": "Minimal themes",
                    "advanced": "Advanced themes",
                    "custom": "Custom palettes"
                });
                dropdown.setValue(this.selectedCategory);
                dropdown.onChange(value => {
                    this.selectedCategory = value;
                    this.renderThemeSelection(containerEl);
                });
            });

        const isAdvancedOnly = this.selectedCategory === "advanced";

        // Theme Selection Dropdown
        const options: Record<string, string> = isAdvancedOnly ? {} : { "custom": "Custom Colors..." };
        this.plugin.settings.themes
            .filter(t => this.selectedCategory === "all" || t.category === this.selectedCategory)
            .forEach(t => {
                options[t.id] = t.name;
            });

        // If advanced only and no themes exist, show a message
        if (isAdvancedOnly && Object.keys(options).length === 0) {
            containerEl.createEl('p', {text: 'Coming soon...', cls: 'theme-empty-state'});
            return;
        }

        // If advanced, auto-select first available theme
        if (isAdvancedOnly && this.selectedThemeId === "custom") {
            this.selectedThemeId = Object.keys(options)[0] || "";
        }

        let pgSetting: Setting | null = null;
        let cPage: ColorComponent = null!;
        let cLink: ColorComponent = null!;
        let cAcc: ColorComponent = null!;
        let cPen: ColorComponent = null!;
        let patDropdown: DropdownComponent | null = null;

        new Setting(containerEl)
            .setName("Theme preset")
            .setDesc(isAdvancedOnly ? "Choose an advanced theme preset." : "Choose a preset or define custom colors.")
            .addDropdown(dropdown => {
                dropdown.addOptions(options);
                
                // If the currently selected theme is no longer in the filtered list, reset to custom
                if (this.selectedThemeId !== "custom" && !options[this.selectedThemeId]) {
                    this.selectedThemeId = isAdvancedOnly ? (Object.keys(options)[0] || "") : "custom";
                }
                
                dropdown.setValue(this.selectedThemeId);
                dropdown.onChange(value => {
                    this.selectedThemeId = value;
                    if (!isAdvancedOnly) {
                        this.updatePreview(value, pgSetting, cPage, cLink, cAcc, cPen, patDropdown);
                    }
                });
            });

        // For advanced themes, skip color pickers and page pattern entirely
        if (!isAdvancedOnly) {
            // Custom Settings
            pgSetting = new Setting(containerEl).setName("Custom theme colors")
                .setDesc('Left to right: page → link → accent → pen')
                .addColorPicker(c => { cPage = c; c.setValue(this.customPageColor).onChange(v => this.customPageColor = v); })
                .addColorPicker(c => { cLink = c; c.setValue(this.customLinkColor).onChange(v => this.customLinkColor = v); })
                .addColorPicker(c => { cAcc = c; c.setValue(this.customAccentColor).onChange(v => this.customAccentColor = v); })
                .addColorPicker(c => { cPen = c; c.setValue(this.customPenColor).onChange(v => this.customPenColor = v); });
                
            new Setting(containerEl).setName("Page pattern")
                .addDropdown(d => {
                    patDropdown = d;
                    d.addOptions({
                        "none": "None",
                        "lined": "Lined",
                        "dotted": "Dotted",
                        "grid": "Grid",
                        "cornell": "Cornell",
                        "blueprint": "Blueprint",
                        "woven": "Woven",
                        "hexagonal": "Hexagonal",
                        "cosmos": "Space / Cosmos (Icon)",
                        "stars": "Starfield"
                    }).setValue(this.customPagePattern).onChange(v => this.customPagePattern = v);
                });

            // Initialize preview based on current selection
            this.updatePreview(this.selectedThemeId, pgSetting, cPage, cLink, cAcc, cPen, patDropdown);
        }

        // Create/Save Button
        new Setting(containerEl)
            .addButton(btn => btn
                .setButtonText(this.isEditMode ? "Save theme" : "Create note")
                .setCta()
                .onClick(async () => {
                    await this.handleApply();
                }));
    }

    private updatePreview(value: string, pgSetting: Setting | null, cPage: ColorComponent, cLink: ColorComponent, cAcc: ColorComponent, cPen: ColorComponent, patDropdown: DropdownComponent | null) {
        if (value === "custom") {
            if (pgSetting) {
                pgSetting.nameEl.innerText = "Custom theme colors";
                pgSetting.settingEl.setCssProps({ "pointer-events": "auto", "opacity": "1" });
            }
            if (cPage !== null) cPage.setValue(this.customPageColor);
            if (cLink !== null) cLink.setValue(this.customLinkColor);
            if (cAcc !== null) cAcc.setValue(this.customAccentColor);
            if (cPen !== null) cPen.setValue(this.customPenColor);
            if (patDropdown) patDropdown.setDisabled(false);
        } else {
            const theme = this.plugin.settings.themes.find(t => t.id === value);
            if (theme && pgSetting) {
                pgSetting.nameEl.innerText = "Preset preview (read-only)";
                pgSetting.settingEl.setCssProps({ "pointer-events": "none", "opacity": "0.5" });
                if (cPage !== null) cPage.setValue(theme.pageColor);
                if (cLink !== null) cLink.setValue(theme.linkColor);
                if (cAcc !== null) cAcc.setValue(theme.accentColor);
                if (cPen !== null) cPen.setValue(theme.penColor);
                if (patDropdown) {
                    if (theme.pagePattern) {
                        patDropdown.setValue(theme.pagePattern);
                        patDropdown.setDisabled(true);
                    } else {
                        patDropdown.setValue(this.customPagePattern);
                        patDropdown.setDisabled(false);
                    }
                }
            }
        }
    }

    private async handleApply() {
        let pg = this.customPageColor, lnk = this.customLinkColor;
        let acc = this.customAccentColor, pen = this.customPenColor;
        let pat = this.customPagePattern;
        let gridCol = "";

        if (this.selectedThemeId !== "custom") {
            const theme = this.plugin.settings.themes.find(t => t.id === this.selectedThemeId);
            if (theme) {
                pg = theme.pageColor; lnk = theme.linkColor;
                acc = theme.accentColor; pen = theme.penColor;
                if (theme.pagePattern) pat = theme.pagePattern;
                if (theme.gridColor) gridCol = theme.gridColor;
            }
        }

        if (this.isEditMode) {
            const activeFile = this.app.workspace.getActiveFile();
            if (activeFile) {
                await this.app.fileManager.processFrontMatter(activeFile, (frontmatter: any) => {
                    frontmatter['page-color'] = pg;
                    frontmatter['link-color'] = lnk;
                    frontmatter['accent-color'] = acc;
                    frontmatter['pen-color'] = pen;
                    frontmatter['page-pattern'] = pat;
                    frontmatter['theme-id'] = this.selectedThemeId;
                    if (gridCol) {
                        frontmatter['grid-color'] = gridCol;
                    } else {
                        delete frontmatter['grid-color'];
                    }
                });
                new Notice("Theme rules updated!");
                this.close();
            }
        } else {
            if (!this.noteTitle) {
                new Notice("Please enter a note title.");
                return;
            }
            const fileName = `${this.noteTitle}.md`;
            const gridLine = gridCol ? `\ngrid-color: "${gridCol}"` : '';
            const themeIdLine = `\ntheme-id: "${this.selectedThemeId}"`;
            const fileContent = `---\npage-color: "${pg}"\nlink-color: "${lnk}"\naccent-color: "${acc}"\npen-color: "${pen}"\npage-pattern: "${pat}"${gridLine}${themeIdLine}\n---\n\n`;

            try {
                const file = await this.app.vault.create(fileName, fileContent);
                if (file instanceof TFile) {
                    const leaf = this.app.workspace.getLeaf(false);
                    await leaf.openFile(file);
                }
                this.close();
            } catch (err) {
                new Notice("Failed to create file: " + (err as Error).message);
            }
        }
    }

    onClose() {
        this.contentEl.empty();
    }
}
