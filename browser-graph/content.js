(function() {
  const IFRAME_ID = "browser-graph-floating-iframe";
  let existingIframe = document.getElementById(IFRAME_ID);

  if (existingIframe) {
    existingIframe.remove();
    return;
  }

  const iframe = document.createElement("iframe");
  iframe.id = IFRAME_ID;
  iframe.src = chrome.runtime.getURL("index.html");
  
  // Styling the floating window
  iframe.style.position = "fixed";
  iframe.style.bottom = "24px";
  iframe.style.right = "24px";
  iframe.style.width = "400px";
  iframe.style.height = "560px";
  iframe.style.zIndex = "2147483647"; 
  iframe.style.border = "1px solid rgba(255,255,255,0.1)";
  iframe.style.borderRadius = "16px";
  iframe.style.boxShadow = "0 20px 50px rgba(0, 0, 0, 0.5)";
  iframe.style.backgroundColor = "#0b0f19";
  iframe.style.colorScheme = "normal";
  
  document.body.appendChild(iframe);

  window.addEventListener("message", (event) => {
    if (event.data === "close-graph-iframe") {
      const el = document.getElementById(IFRAME_ID);
      if (el) el.remove();
    }
  });
})();
