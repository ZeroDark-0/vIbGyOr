# v i b g y o r

A customizable Obsidian plugin that enables per-note theming through frontmatter properties and global UI enhancements.

## Features

- **Per-note theming**: Set unique background colors, text colors, and link colors for each note.
- **Custom Patterns**: Apply textures and geometric patterns to your notes (Lined, Dotted, Grid, Cornell, Blueprint, Woven, Diagonal, Hexagonal, Cosmos).
- **Interactive Preset Modal**: Easily create new themed notes or edit existing ones using a visual interface.
- **Real-time Updates**: Changes to frontmatter are applied instantly to the note's appearance.

## Getting Started

### 1. Ribbon Icons & Usage
The plugin provides two main entry points in your left ribbon:

| Icon | Name | Purpose |
| :--- | :--- | :--- |
| ![paintbrush](assets/icon-brush.svg) | **Create Themed Note** | Opens a modal to name a new note and pick its initial theme/pattern. |
| ![palette](assets/icon-palette.svg) | **Edit Active Theme** | Modifies the theme and pattern of the note you are currently viewing. |

### 2. How to Create a Themed Note
1. Click the **Paintbrush** icon in the ribbon.
2. **Title**: Enter the name for your new note.
3. **Theme Preset**: Choose from "Vampire", "Light Mode", "Dark Mode", or your own "Custom Palettes".
4. **Custom Colors**: If you want something unique, pick "Custom Colors" and use the color pickers (Page, Link, Accent, Pen).
5. **Pattern**: Select a background texture (e.g., Grid, Dot, Cosmos).
6. Click **Create note**.

### 3. How to Change the Current Note Theme
There are three ways to modify a note's appearance:
- **Ribbon**: Click the **Palette** icon.
- **Context Menu**: Right-click anywhere in the note and select **Edit note theme/pattern**.
- **Manual**: Directly edit the YAML frontmatter at the top of the file.

### 4. Creating Custom Palettes
Make your favorite color combinations reusable!
1. Open **Settings** > **v i b g y o r**.
2. Scroll to **Custom Palettes** and click **Add custom palette**.
3. Customize the colors and name it.
4. Your new palette will now appear in the theme selection dropdown whenever you create or edit a note.

---

## Technical Details

### Frontmatter Properties
The plugin looks for the following keys in your note's frontmatter:

```yaml
---
page-color: "#1a1a1a"    # Main background color
pen-color: "#ffffff"     # Text color
link-color: "#3366cc"    # Link color
accent-color: "#ff9900"  # Accent/UI color
page-pattern: "grid"     # Pattern type (none, lined, dotted, grid, etc.)
---
```

### Supported Patterns
- `lined`, `dotted`, `grid`, `cornell`, `blueprint`, `woven`, `hexagonal`, `cosmos`, `stars`, `waves`, `maze`, `circuit`, `checkerboard`

## Installation

### Manual Installation
1. Download the latest release (`main.js`, `manifest.json`, `styles.css`).
2. Create a folder named `vIbGyOr` in your vault's `.obsidian/plugins/` directory.
3. Move the downloaded files into that folder.
4. Reload Obsidian and enable the plugin in settings.

### Development
1. Clone this repo.
2. `npm i` to install dependencies.
3. `npm run dev` to start compilation in watch mode.
