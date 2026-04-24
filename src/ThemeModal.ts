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
    selectedCategory: string = "";
    selectedPatternCategory: string = "";
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
                    } else if (frontmatter['theme-name']) {
                        const theme = this.plugin.settings.themes.find(t => t.name === frontmatter['theme-name']);
                        if (theme) this.selectedThemeId = theme.id;
                    }

                    // Auto-identify categories for progressive disclosure
                    if (this.selectedThemeId !== "custom") {
                        const theme = this.plugin.settings.themes.find(t => t.id === this.selectedThemeId);
                        if (theme) this.selectedCategory = theme.category || "normal";
                    } else if (frontmatter['page-color']) {
                        this.selectedCategory = "custom";
                    }

                    if (this.customPagePattern !== "none") {
                        const allPatterns: Record<string, string> = {
                            "lined": "basic", "dotted": "basic", "grid": "basic", "cornell": "basic", "blueprint": "basic",
                            "woven": "geometry", "hexagonal": "geometry",
                            "cosmos": "artistic", "stars": "artistic", "waves": "artistic", "maze": "artistic", "circuit": "artistic"
                        };
                        this.selectedPatternCategory = allPatterns[this.customPagePattern] || "";
                    } else {
                        this.selectedPatternCategory = "basic"; // Default to basic if none
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
        new Setting(containerEl).setName("Theme type")
            .addDropdown(dropdown => {
                dropdown.addOptions({
                    "": "Select theme type...",
                    "normal": "Minimal themes (Normal)",
                    "advanced": "Advanced themes",
                    "custom": "Custom palettes"
                });
                dropdown.setValue(this.selectedCategory);
                dropdown.onChange(value => {
                    this.selectedCategory = value;
                    this.renderThemeSelection(containerEl);
                });
            });

        if (!this.selectedCategory) return;

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
            .setClass("theme-dropdown-setting")
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
                
            new Setting(containerEl).setName("Pattern type")
                .setDesc("Filter patterns by style.")
                .addDropdown(dropdown => {
                    dropdown.addOptions({
                        "": "Select pattern type...",
                        "basic": "Note / Paper",
                        "geometry": "Geometric",
                        "artistic": "Artistic / Space"
                    });
                    dropdown.setValue(this.selectedPatternCategory);
                    dropdown.onChange(value => {
                        this.selectedPatternCategory = value;
                        this.renderThemeSelection(containerEl);
                    });
                });

            if (this.selectedPatternCategory) {
                const patternOptions: Record<string, string> = { "none": "None" };
                const allPatterns: Record<string, {name: string, cat: string}> = {
                    "lined": {name: "Lined", cat: "basic"},
                    "dotted": {name: "Dotted", cat: "basic"},
                    "grid": {name: "Grid", cat: "basic"},
                    "cornell": {name: "Cornell", cat: "basic"},
                    "blueprint": {name: "Blueprint", cat: "basic"},
                    "woven": {name: "Woven", cat: "geometry"},
                    "hexagonal": {name: "Hexagonal", cat: "geometry"},
                    "cosmos": {name: "Space / Cosmos (Icon)", cat: "artistic"},
                    "stars": {name: "Starfield", cat: "artistic"},
                    "waves": {name: "Zen Waves", cat: "artistic"},
                    "maze": {name: "Cyber Maze", cat: "artistic"},
                    "circuit": {name: "Cyber Circuit", cat: "artistic"}
                };

                for (const [id, info] of Object.entries(allPatterns)) {
                    if (info.cat === this.selectedPatternCategory) {
                        patternOptions[id] = info.name;
                    }
                }

                new Setting(containerEl).setName("Page pattern")
                    .setClass("theme-dropdown-setting")
                    .addDropdown(d => {
                        patDropdown = d;
                        d.addOptions(patternOptions).setValue(this.customPagePattern).onChange(v => this.customPagePattern = v);
                    });
            }

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

        let themeName = "Custom Colors";
        if (this.selectedThemeId !== "custom") {
            const theme = this.plugin.settings.themes.find(t => t.id === this.selectedThemeId);
            if (theme) {
                themeName = theme.name;
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
                    // Delete old properties first to help with cleanup/ordering
                    const keysToDelete = ['page-color', 'link-color', 'accent-color', 'pen-color', 'grid-color', 'theme-id', 'theme-name', 'page-pattern', 'theme-images'];
                    keysToDelete.forEach(k => delete frontmatter[k]);

                    // Set properties in desired order: 1. theme-name, 2. page-pattern
                    frontmatter['theme-name'] = themeName;
                    frontmatter['page-pattern'] = pat;

                    // If custom, we still need the colors to function
                    if (this.selectedThemeId === "custom") {
                        frontmatter['page-color'] = pg;
                        frontmatter['link-color'] = lnk;
                        frontmatter['accent-color'] = acc;
                        frontmatter['pen-color'] = pen;
                        if (gridCol) frontmatter['grid-color'] = gridCol;
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
            
            let fileContent = `---\n`;
            fileContent += `theme-name: "${themeName}"\n`;
            fileContent += `page-pattern: "${pat}"\n`;
            
            if (this.selectedThemeId === "custom") {
                fileContent += `page-color: "${pg}"\nlink-color: "${lnk}"\naccent-color: "${acc}"\npen-color: "${pen}"\n`;
                if (gridCol) fileContent += `grid-color: "${gridCol}"\n`;
            }
            fileContent += `---\n\n`;

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
