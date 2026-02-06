document.getElementById('scrapeBtn').addEventListener('click', async () => {
  const statusDiv = document.getElementById('status');
  statusDiv.textContent = 'Sending...';
  const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
  
  // Try to send message, inject script if needed
  chrome.tabs.sendMessage(tab.id, {action: 'scrape'}, (response) => {
    if (chrome.runtime.lastError) {
      // Content script not loaded - inject it
      console.log('Content script not present, injecting...');
      chrome.scripting.executeScript({ 
        target: { tabId: tab.id }, 
        files: ['content.js'] 
      }, () => {
        if (chrome.runtime.lastError) {
          statusDiv.textContent = 'Error: ' + chrome.runtime.lastError.message;
          return;
        }
        // Wait a moment for script to initialize, then try again
        setTimeout(() => {
          chrome.tabs.sendMessage(tab.id, {action: 'scrape'}, (response) => {
            if (response && response.status) {
              statusDiv.textContent = response.status;
              setTimeout(() => window.close(), 2000);
            } else {
              statusDiv.textContent = 'No response - try again';
            }
          });
        }, 200);
      });
      return;
    }
    
    if (response && response.status) {
      statusDiv.textContent = response.status;
      setTimeout(() => window.close(), 2000);
    } else {
      statusDiv.textContent = 'No response - refresh the page';
    }
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
