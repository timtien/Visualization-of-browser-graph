# CLAUDE.md — Browser Journey Graph

## Project Overview

Browser Journey Graph is a Chrome extension (Manifest v3) that tracks page-to-page navigation and visualizes the browsing history as an interactive directed graph. It uses no build tools or external dependencies beyond a bundled copy of vis-network.

## Repository Layout

```
Visualization-of-browser-graph/
├── README.md
└── browser-graph/          ← load this folder as an unpacked Chrome extension
    ├── manifest.json       ← extension config (Manifest v3)
    ├── background.js       ← service worker: tracks navigation, writes storage
    ├── content.js          ← injected into web pages: creates/removes the iframe
    ├── graph.js            ← runs inside the iframe: reads storage, renders graph
    ├── index.html          ← iframe/tab HTML shell
    ├── style.css           ← dark-theme styles
    └── vis-network.min.js  ← bundled vis-network v10.0.2 (do not modify)
```

All source lives in `browser-graph/`. There is no `src/`, no `dist/`, and no build step.

## Tech Stack

| Layer | Choice |
|---|---|
| Platform | Chrome Extension, Manifest v3 |
| Language | Vanilla JavaScript (ES6+) — no TypeScript, no transpiler |
| Graph rendering | vis-network v10.0.2 (bundled) |
| Persistence | `chrome.storage.local` |
| Styling | Plain CSS (no preprocessor) |
| Build tools | None |
| Tests | None |
| Package manager | None (no package.json) |

## Architecture & Data Flow

```
User clicks extension icon
        │
        ▼
background.js (service worker)
  ├─ tab on HTTP(S) URL → scripting.executeScript → content.js
  └─ tab on internal URL → tabs.create({ url: 'index.html' })

content.js (injected into the web page)
  ├─ no existing iframe → create <iframe src="index.html"> (400×560px, fixed bottom-right)
  └─ iframe already present → remove it (toggle behaviour)

iframe: index.html + graph.js
  ├─ reads chrome.storage.local {nodes, edges}
  ├─ renders vis-network graph
  ├─ double-click node → chrome.tabs.create({ url: node.url })
  ├─ "Clear Graph History" → chrome.storage.local.set({ nodes: {}, edges: [] })
  ├─ "✕" close button → postMessage("close-graph-iframe") → content.js removes iframe
  └─ chrome.storage.onChanged → updateGraph() (live refresh across tabs)

background.js navigation tracking (always running)
  ├─ tabs.onUpdated → record node + edge in chrome.storage.local
  └─ tabs.onRemoved → clean up tabHistory in-memory map
```

## Storage Schema

`chrome.storage.local` holds two keys:

```js
// nodes: object keyed by URL
nodes = {
  "https://example.com": { id: "https://example.com", title: "Example", url: "https://example.com" }
}

// edges: array of directed navigation links
edges = [
  { id: "https://a.com->https://b.com", from: "https://a.com", to: "https://b.com" }
]
```

Edge IDs are deterministic (`from->to`), preventing duplicate edges.

## Key Conventions

### URL filtering
`background.js` skips internal browser URLs. Any new URL prefix filter must be added to the guard at line 20:
```js
if (newUrl.startsWith("chrome://") || newUrl.startsWith("edge://") || ...)  return;
```

### Node label truncation
Labels are capped at 25 characters in `graph.js:71–72`. The full title appears as a tooltip (`title` property).

### Iframe toggle
`content.js` is wrapped in an IIFE and re-injected on every icon click. It checks for `IFRAME_ID` to decide whether to open or close the panel.

### Close signal
The iframe sends `window.parent.postMessage("close-graph-iframe", "*")`. `content.js` listens for this message to remove the iframe. If you add other postMessage channels, use a namespaced string or structured object to avoid collisions.

### Graph is read-only in the UI
All writes to storage happen in `background.js`. `graph.js` only reads and renders. The single write exception is the clear button, which resets storage to empty collections.

## Permissions (manifest.json)

| Permission | Why |
|---|---|
| `tabs` | Listen to `onUpdated`, `onCreated`, `onRemoved`; open new tabs |
| `storage` | `chrome.storage.local` for nodes/edges |
| `favicon` | `chrome.runtime.getURL("/_favicon/")` for node icons |
| `scripting` | `chrome.scripting.executeScript` to inject content.js |
| `activeTab` | Access the current tab's URL and title |

Do not add broad host permissions (`<all_urls>` in `permissions`) — the extension already covers all sites via `scripting` + `activeTab`.

## Visual Design

- Background: `#0b0f19` (dark navy)
- Text: `#e2e8f0`
- Node border: `#38bdf8` (cyan)
- Node background: `#1e293b` (dark blue)
- Edge color: `#475569` (slate), 80% opacity
- Button: gradient `#3b82f6` → `#4f46e5`
- Physics solver: `forceAtlas2Based` with `gravitationalConstant: -35`, `springLength: 120`
- Floating iframe: 400×560 px, bottom-right, `z-index: 2147483647`, 16px border-radius

## Loading the Extension During Development

1. Go to `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked** and select the `browser-graph/` folder
4. After editing any file, click the **⟳ refresh** button on the extension card
5. For `background.js` changes, also click **Service Worker** → inspect the service worker console

There is no hot-reload; every change requires a manual reload of the extension.

## Making Changes

### Add a new node property
1. Store it in `background.js` when building the node object (line 28).
2. Read and apply it in `graph.js` inside `updateGraph()` (lines 70–89).

### Change graph physics or appearance
All vis-network options are in `graph.js:initNetwork()` (lines 15–43). Node styling is in `updateGraph()`.

### Add a new UI control
Add the HTML element in `index.html`, wire the event listener in `graph.js`, and add any required CSS in `style.css`. Keep z-index above `#mynetwork` (z-index 1).

### Extend storage
Always read-then-write via `chrome.storage.local.get([...], callback)` followed by `chrome.storage.local.set(...)`. Never assume storage state without reading first.

## What Does Not Exist (Do Not Assume)

- No build system — do not introduce webpack, Vite, or npm
- No TypeScript — keep files as plain `.js`
- No test suite — manual testing via Chrome is the only method
- No linter config — no ESLint, Prettier, or Biome
- No CI/CD pipeline
- No backend or server component
- `chrome.storage.sync` is intentionally not used — data is device-local only

## Branch & Commit Workflow

- Development branch: `claude/claude-md-docs-OukTI`
- Commit messages should be short and imperative (e.g., `Add tooltip for edge weight`)
- Push with `git push -u origin <branch>`
- Do not push to `main` directly
