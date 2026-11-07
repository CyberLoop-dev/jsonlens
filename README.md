<p align="center"><img src="assets/banner.svg" alt="JSONLens banner" width="100%"></p>

<p align="center">
  <img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-f0b441?style=flat-square">
  <img alt="Dependencies: none" src="https://img.shields.io/badge/dependencies-none-6fd6a0?style=flat-square">
  <img alt="Built with vanilla JS" src="https://img.shields.io/badge/built%20with-vanilla%20JS-7fb4ff?style=flat-square">
</p>

**JSONLens** is a small, fast JSON workbench. Paste something messy, hit Format, and get a tidy document plus a tree you can fold, search and copy from. No build step, no accounts, no uploads. Your data never leaves the page.

## What you can do

| Action | How |
| --- | --- |
| Format or minify | Toolbar buttons, or `Ctrl/Cmd + Enter` to format |
| Validate | Happens as you type, with line and column when the parser reports one |
| Explore | Collapsible tree with colored keys, strings, numbers, booleans and nulls |
| Search | Filters the tree to matching keys or values and highlights them |
| Copy | Whole document from the toolbar, or any single value from the tree |
| Import | File picker or drag a `.json` file onto the page |
| Stats | Keys, objects, arrays, values and approximate size |
| Themes | Dark and light, remembered between visits |

## Run it

```bash
git clone https://github.com/CyberLoop-dev/jsonlens.git
cd jsonlens
# open index.html in your browser, or serve the folder:
python3 -m http.server 8000
```

There is nothing to install.

## How it fits together

```mermaid
flowchart LR
  A[Editor / file / example] --> B{JSON.parse}
  B -- ok --> C[Tree + stats]
  B -- error --> D[Line and column message]
  C --> E[Search, fold, copy]
```

## Project structure

```text
jsonlens/
├── index.html   # layout and toolbar
├── styles.css   # theme tokens and components
├── app.js       # parsing, tree, search, stats
└── assets/      # logo and README banner
```

## Known limitations

- The editor is a plain textarea, so syntax coloring lives in the inspector tree rather than the input.
- Very large files (tens of MB) will feel slow because the whole tree is built in the DOM.
- Numbers beyond JavaScript's safe integer range lose precision, as with any `JSON.parse`.

## Ideas for later

- Syntax-highlighted editor overlay
- JSON path display and copy
- Virtualized tree for huge documents

## Contributing

Issues and pull requests are welcome. Keep it dependency-free and keyboard accessible.

## License

[MIT](LICENSE)
