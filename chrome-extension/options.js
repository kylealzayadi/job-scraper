// Load saved settings when page opens
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.sync.get(['appsScriptUrl', 'secretToken'], (result) => {
    if (result.appsScriptUrl) {
      document.getElementById('appsScriptUrl').value = result.appsScriptUrl;
    }
    if (result.secretToken) {
      document.getElementById('secretToken').value = result.secretToken;
    }
  });
});

// Save settings when button is clicked
document.getElementById('saveBtn').addEventListener('click', () => {
  const appsScriptUrl = document.getElementById('appsScriptUrl').value.trim();
  const secretToken = document.getElementById('secretToken').value.trim();
  const statusDiv = document.getElementById('status');

  if (!appsScriptUrl) {
    statusDiv.textContent = 'Error: Apps Script URL is required';
    statusDiv.className = 'status error';
    return;
  }

  if (!appsScriptUrl.includes('script.google.com')) {
    statusDiv.textContent = 'Error: Invalid URL. Must be a Google Apps Script URL';
    statusDiv.className = 'status error';
    return;
  }

  chrome.storage.sync.set({
    appsScriptUrl: appsScriptUrl,
    secretToken: secretToken || 'job-scraper-9f3a7c2b-PRIVATE'
  }, () => {
    statusDiv.textContent = '✓ Settings saved successfully!';
    statusDiv.className = 'status success';
    setTimeout(() => {
      statusDiv.className = 'status';
    }, 3000);
  });
});
