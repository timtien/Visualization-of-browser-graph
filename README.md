[README.md](https://github.com/user-attachments/files/26884265/README.md)
# Browser Journey Graph

A simple Chrome extension for visualizing browser page transitions as an interactive graph.

## Overview

- Tracks page-to-page navigation inside browser tabs
- Displays visited pages as nodes and transitions as directed edges
- Uses page titles and favicons for node display
- Supports reopening a page by double-clicking a node
- Lets you clear the recorded graph data
- Opens as a floating graph panel on normal web pages

## How It Works

- `background.js` listens for tab updates and stores nodes and edges in `chrome.storage.local`
- `content.js` injects the graph UI into the current page as a floating iframe
- `index.html` and `graph.js` render the graph using `vis-network`

The extension ignores internal browser pages such as:

- `chrome://`
- `edge://`
- `about:`
- `chrome-extension://`

## Installation

1. Open Chrome and go to `chrome://extensions/`
2. Enable `Developer mode`
3. Click `Load unpacked`
4. Select this project folder

## Usage

1. Click the extension icon
2. On a normal web page, a floating graph panel will appear in the bottom-right corner
3. Double-click a node to open that page in a new tab
4. Click `Clear Graph History` to reset the stored graph

If the current tab is not a regular web page, the extension opens its standalone graph page instead.

## Project Structure

```text
browser-graph/
├── manifest.json
├── background.js
├── content.js
├── graph.js
├── index.html
├── style.css
└── vis-network.min.js
```

## Data Storage

The extension stores data in `chrome.storage.local`:

- `nodes`: visited page nodes
- `edges`: navigation links between pages

Data persists until it is manually cleared.

## Current Limitations

- Only records navigation captured while the extension is active
- Not a full browser history analysis tool
- No export, search, filtering, or grouping yet
