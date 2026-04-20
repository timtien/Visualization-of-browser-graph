// background.js

let tabHistory = {}; 

chrome.tabs.query({}, (tabs) => {
  tabs.forEach(tab => {
    if (tab.url) tabHistory[tab.id] = tab.url;
  });
});

chrome.tabs.onCreated.addListener((tab) => {
  if (tab.openerTabId && tabHistory[tab.openerTabId]) {
    tabHistory[tab.id] = tabHistory[tab.openerTabId];
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tab.url && tab.url !== tabHistory[tabId]) {
    const newUrl = tab.url;
    if (newUrl.startsWith("chrome://") || newUrl.startsWith("edge://") || newUrl.startsWith("about:") || newUrl.startsWith("chrome-extension://")) return;

    chrome.storage.local.get(['nodes', 'edges'], (result) => {
      let nodes = result.nodes || {};
      let edges = result.edges || [];

      let added = false;
      if (!nodes[newUrl]) {
        nodes[newUrl] = { id: newUrl, title: tab.title || newUrl, url: newUrl };
        added = true;
      } else if (tab.title && nodes[newUrl].title !== tab.title) {
        nodes[newUrl].title = tab.title; 
        added = true;
      }

      const prevUrl = tabHistory[tabId];
      if (prevUrl && prevUrl !== newUrl) {
        const edgeId = `${prevUrl}->${newUrl}`;
        const edgeExists = edges.some(e => e.id === edgeId);
        if (!edgeExists) {
          edges.push({ id: edgeId, from: prevUrl, to: newUrl });
          added = true;
        }
      }

      tabHistory[tabId] = newUrl;

      if (added) {
        chrome.storage.local.set({ nodes, edges });
      }
    });
  } else if (changeInfo.title && tabHistory[tabId] && tab.url) {
    chrome.storage.local.get(['nodes'], (result) => {
      let nodes = result.nodes || {};
      if (nodes[tab.url] && nodes[tab.url].title !== changeInfo.title) {
        nodes[tab.url].title = changeInfo.title;
        chrome.storage.local.set({ nodes });
      }
    });
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  delete tabHistory[tabId];
});

// Handle clicking on the extension icon to toggle floating window
chrome.action.onClicked.addListener((tab) => {
  if (tab.url && tab.url.startsWith("http")) {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });
  } else {
    chrome.tabs.create({ url: 'index.html' });
  }
});
