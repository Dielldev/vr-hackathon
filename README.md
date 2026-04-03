# hackathontheme

CineShader-based web experience with local assets and static pages.

## Project Structure

- index.html
- about.html
- gallery.html
- editor.html
- assets/css/index.css
- assets/js/index.js
- assets/models/
- assets/textures/
- assets/data/

## How To Run Locally

This project must be served over HTTP (not opened with file://).

### Option 1: Serve with npx

1. Open terminal in project root.
2. Run:

```bash
npx serve . -l 8080
```

3. Open:

```text
http://localhost:8080
```

### Option 2: VS Code Live Server

1. Open project in VS Code.
2. Right click index.html.
3. Click "Open with Live Server".

## Notes

- If the loader gets stuck, verify these folders exist and contain files:
  - assets/models
  - assets/textures
  - assets/data
- Use hard refresh after edits:
  - Windows/Linux: Ctrl+F5
  - macOS: Cmd+Shift+R

