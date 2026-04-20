const container = document.getElementById('mynetwork');

let nodesDataset = new vis.DataSet();
let edgesDataset = new vis.DataSet();
let network = null;

// Helper to construct the Chrome internal favicon URL
function getFaviconUrl(u) {
  const url = new URL(chrome.runtime.getURL("/_favicon/"));
  url.searchParams.set("pageUrl", u);
  url.searchParams.set("size", "32");
  return url.toString();
}

function initNetwork() {
  const data = {
    nodes: nodesDataset,
    edges: edgesDataset
  };

  const options = {
    edges: {
      color: { color: '#475569', opacity: 0.8 },
      arrows: { to: { enabled: true, scaleFactor: 0.6 } },
      smooth: { type: 'continuous' },
      width: 1.5
    },
    physics: {
      solver: 'forceAtlas2Based',
      forceAtlas2Based: {
        gravitationalConstant: -35,
        centralGravity: 0.005,
        springLength: 120,
        springConstant: 0.15
      }
    },
    interaction: {
      hover: true,
      tooltipDelay: 200
    }
  };

  network = new vis.Network(container, data, options);

  // Double-click to open history page
  network.on("doubleClick", function (params) {
    if (params.nodes.length > 0) {
      const nodeId = params.nodes[0];
      const selectedNode = nodesDataset.get(nodeId);
      if (selectedNode && selectedNode.url) {
        chrome.tabs.create({ url: selectedNode.url });
      }
    }
  });

  // Cursor pointer on hover over node
  network.on("hoverNode", function () {
    network.canvas.body.container.style.cursor = 'pointer';
  });
  network.on("blurNode", function () {
    network.canvas.body.container.style.cursor = 'default';
  });
}

function updateGraph() {
  chrome.storage.local.get(['nodes', 'edges'], (result) => {
    const storedNodes = result.nodes || {};
    const storedEdges = result.edges || [];

    const nodesArr = Object.values(storedNodes).map(n => {
      let label = n.title || n.url;
      if (label.length > 25) label = label.substring(0, 25) + "...";
      
      return {
        id: n.id,
        label: label,
        title: n.title, // tooltip shown on hover
        shape: 'circularImage',
        image: getFaviconUrl(n.url),
        url: n.url,
        // Style overrides per node to make them look nice
        borderWidth: 2,
        color: {
          border: '#38bdf8',
          background: '#1e293b'
        },
        font: { color: '#e2e8f0', size: 12 }
      };
    });

    nodesDataset.update(nodesArr);

    // Filter out old edges that might be missing in edgesDataset or add new ones
    // DataSet update merges items by id automatically
    edgesDataset.update(storedEdges);
  });
}

document.getElementById('clearBtn').addEventListener('click', () => {
  // Clear storage and redraw
  chrome.storage.local.set({ nodes: {}, edges: [] }, () => {
    nodesDataset.clear();
    edgesDataset.clear();
  });
});

const closeBtn = document.getElementById('closeBtn');
if (window.top === window.self) {
  closeBtn.style.display = 'none';
} else {
  closeBtn.addEventListener('click', () => {
    window.parent.postMessage("close-graph-iframe", "*");
  });
}

// Initial draw
initNetwork();
updateGraph();

// Auto-refresh graph if another tab navigates (storage changes)
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && (changes.nodes || changes.edges)) {
    updateGraph();
  }
});
