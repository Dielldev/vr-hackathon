# Resilient Echoes VR Exhibition App

Interactive web experience built with React, TypeScript, Vite, Three.js, and React Three Fiber.

The app includes:

- Public pages (home, about, gallery, exhibition world selector).
- Three exhibition world implementations.
- Desktop and optional WebXR VR flow.
- Admin tools for shader editor access and world/object transform editing.

## Tech Stack

- React 19
- TypeScript + JSX/TSX hybrid pages
- Vite 8
- React Router
- Three.js
- @react-three/fiber
- @react-three/drei

## Getting Started

### Prerequisites

- Node.js LTS (modern version, recommended for Vite 8)
- npm

### Install and Run

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

## Available Scripts

- `npm run dev`: Start local dev server.
- `npm run build`: Run TypeScript build (`tsc -b`) and Vite production build.
- `npm run preview`: Serve `dist/` locally.
- `npm run lint`: Run ESLint.

## Main Routes

Configured in `src/App.tsx`:

- `/`: Home page.
- `/about`: About page.
- `/gallery`: Story submission gallery page (client-side form).
- `/admin`: Admin home.
- `/admin/editor`: Shader/editor page.
- `/admin/map-editor`: 3D map/object transform editor.
- `/exhibition`: World selection landing page.
- `/exhibition/world/hotel-hall-prototype`: World 2 specialized implementation.
- `/exhibition/world/art-gallery`: World 3 specialized implementation.
- `/exhibition/world/:worldId`: Generic exhibition renderer.
- `/robots.txt`: React route (component-based page).

Redirects:

- `/editor` -> `/admin/editor`
- `/ADMIN` -> `/admin`
- `/exhibition/start` -> `/exhibition`

## Architecture Notes

### Hybrid Legacy + React Behavior

`src/App.tsx` dynamically imports `src/assets/js/index.js` on non-exhibition, non-admin, and non-gallery routes to keep legacy DOM-driven behavior available where needed.

### World System

- World registry: `src/pages/worlds/index.js`
- World data files: `src/pages/worlds/*.js`
- Generic world page: `src/pages/exb.jsx`
- Specialized world pages:
  - `src/pages/exb-world2.jsx`
  - `src/pages/exb-world3.jsx`

### 3D Assets

Runtime assets are primarily served from `public/assets/` (models, textures, data, images).

## Admin Map Editor

Route: `/admin/map-editor`

Capabilities:

- Select world and preview in a live 3D canvas.
- Move/rotate world transforms with gizmos.
- Switch to object edit mode (where exhibits are available) and reposition exhibits.
- Save and reset transforms.
- Open selected world directly from the editor.
- Copy helper position line for manual world config editing.

Persistence is local browser storage:

- World transforms key: `resilient.worldTransforms.v1`
- Exhibit transforms key: `resilient.exhibitTransforms.v1`

Relevant utilities:

- `src/utils/worldTransforms.js`
- `src/utils/exhibitTransforms.js`

## VR Mode Notes

- World selector includes links that append `?vr=true`.
- Exhibition pages check URL search params and can start immersive VR session when browser/headset support WebXR.
- If WebXR is unsupported, the UI shows a fallback message.

## Deployment

`vercel.json` is configured for SPA routing with rewrites:

- Static asset requests are served directly.
- Other routes rewrite to `index.html`.

## Current Limitations

- Gallery story submission is currently client-side only (no backend persistence in this repository).
- Admin routes are visible in-app (no authentication layer in this codebase).
- No automated test files are currently checked in.

## Troubleshooting

- Scene does not update after map edits:
  - Save in map editor, then reopen world route.
- You want to reset local map/object edits:
  - Use Reset in map editor, or clear localStorage keys above in browser devtools.
- VR button appears but immersive session does not start:
  - Verify headset/browser WebXR support and secure context requirements.
