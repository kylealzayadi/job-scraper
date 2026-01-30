document.getElementById('scrapeBtn').addEventListener('click', async () => {
  const statusDiv = document.getElementById('status');
  statusDiv.textContent = 'Sending...';
  const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
  // Only attempt if the active tab looks like an Indeed or LinkedIn job page
  const url = tab?.url || '';
  if (!(url.includes('indeed.com') || url.includes('linkedin.com'))) {
    statusDiv.textContent = 'Open an Indeed or LinkedIn job page and try again.';
    return;
  }

  // First ping the content script to ensure it's injected and listening
  chrome.tabs.sendMessage(tab.id, {type: 'PING'}, (pong) => {
    if (chrome.runtime.lastError) {
      console.warn('PING failed:', chrome.runtime.lastError.message);
      // Try to inject the content script as a fallback (requires "scripting" permission)
      chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] }, () => {
        if (chrome.runtime.lastError) {
          statusDiv.textContent = 'Content script not available on this page. Reload extension or page.';
          console.warn('Injection failed:', chrome.runtime.lastError.message);
          return;
        }
        // After injecting, request a scrape
        chrome.tabs.sendMessage(tab.id, {action: 'scrape'}, (response) => {
          if (response && response.status) {
            statusDiv.textContent = response.status;
            setTimeout(() => window.close(), 2000);
          } else if (chrome.runtime.lastError) {
            statusDiv.textContent = 'Error: ' + chrome.runtime.lastError.message;
          }
        });
      });
      return;
    }
    // Content script is present — request a scrape
    chrome.tabs.sendMessage(tab.id, {action: 'scrape'}, (response) => {
      if (response && response.status) {
        statusDiv.textContent = response.status;
        setTimeout(() => window.close(), 2000);
      } else if (chrome.runtime.lastError) {
        statusDiv.textContent = 'Error: ' + chrome.runtime.lastError.message;
      }
    });
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.status) {
    const statusDiv = document.getElementById('status');
    statusDiv.textContent = message.status;
    // Keep the popup open for 2 seconds to show the result
    setTimeout(() => {
      window.close();
    }, 2000);
  }
});
