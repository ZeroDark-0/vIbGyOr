# Welcome to vIbGyOr 🎨

After each update, you'll see these release notes so you know what's new (you can turn this off in the plugin settings).

I build this plugin as a passion project -> the idea that every note can have its own personality through colors and patterns is what drives vIbGyOr forward. If you run into bugs or have ideas, reach out on [GitHub Issues](https://github.com/ZeroDark-0/vIbGyOr/issues) or [Discord](https://discordapp.com/users/659447909208686632). If you find it valuable, say THANK YOU or...

<div align="center">

[![Buy Me a Coffee](https://img.buymeacoffee.com/button-api/?text=Buy%20me%20a%20coffee&emoji=☕&slug=ZeroDark&button_colour=1a1a1a&font_colour=ffffff&font_family=Poppins&outline_colour=ffffff&coffee_colour=FFDD00)](https://www.buymeacoffee.com/ZeroDark)

</div>

---

## 1.1.0

### ✨ New Features
- **Pattern Color Customization:** Background patterns now have their own independent color! Previously, patterns always inherited the pen (text) color. Now you can set a completely separate `pattern-color` via frontmatter or the theme modal, giving you full creative control -> for example, a dark page with white text but subtle gold grid lines
- **Pattern Scale Slider:** A new slider in the theme modal lets you adjust the size and density of any background pattern in real-time. Go from tight fine grids to large spacious ones with a simple drag. The scale value is saved per-note via the `pattern-scale` frontmatter property
- **Release Notes Modal:** You're looking at it! After every update, vIbGyOr will show you what changed so you never miss a new feature

### 🐛 Fixes
- Fixed background pattern shifting position when scrolling in long notes
- Pattern color now properly falls back to pen color when not explicitly set

### 🎯 Improvements
- Theme presets now support `patternColor` and `patternScale` fields
- Smoother SVG rendering for Cosmos, Stars, and Waves patterns

---

## 1.0.2

### 🐛 Fixes
- Fixed an issue where the image recolor toggle button would sometimes appear at incorrect positions after scrolling
- Resolved a rare crash when opening the theme modal on a note with malformed frontmatter

### 🎯 Improvements
- Better handling of edge cases in frontmatter parsing

---

## 1.0.1

### 🐛 Fixes
- Fixed theme not applying immediately when switching between notes quickly
- Improved performance of the metadata change listener to avoid unnecessary re-renders

---

## 1.0.0

### 🎉 Initial Public Release
- **Per-note theming:** Apply unique page, pen, link, and accent colors to any note via frontmatter
- **13 background patterns:** Lined, Dotted, Grid, Cornell, Blueprint, Woven, Hexagonal, Cosmos, Starfield, Zen Waves, Cyber Maze, Cyber Circuit, and Checkerboard
- **10 built-in presets:** Dark Mode, Light Mode, Vampire Palette, Sepia Palette, Nord Dark, Neon Noir, Crimson Ember, Twilight Harbor, Imperial Noir, and Midnight Mint
- **Custom palettes:** Create, edit, and save your own reusable color combinations in plugin settings
- **Image auto-recoloring:** Transparent-background images automatically tint to match the pen color, with a hover toggle to view originals
- **Theme modal:** Visual interface for creating new themed notes and editing existing ones
- **Context menu integration:** Right-click any note to quickly edit its theme
- **Command palette support:** Create or edit themed notes from the command palette

---

## 0.9.0 (Beta)

### ✨ Features
- Added Cyber Maze and Cyber Circuit patterns with dynamic SVG injection
- Added Zen Waves pattern with concentric ripple circles
- Implemented the image color toggle button -> hover over images in themed notes to switch between themed and original colors
- Plugin now remembers image toggle state per-image across sessions

### 🐛 Fixes
- Fixed hexagonal pattern alignment at certain zoom levels
- Cornell margin line now properly scales with pattern scale

---

## 0.8.0 (Beta)

### ✨ Features
- Added Cosmos and Starfield patterns -> dynamically generated SVG star fields that respect the pen color
- Added the Checkerboard pattern with a readable text overlay
- Introduced the `grid-color` frontmatter property for checkerboard customization
- New theme presets: Imperial Noir, Midnight Mint, and Twilight Harbor

### 🎯 Improvements
- Rewrote pattern rendering to use CSS custom properties for better performance
- All patterns now use `background-attachment: local` for proper scroll behavior
