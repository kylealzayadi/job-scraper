const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwgh-kvwwWvb7HMaRcfDcLrf2tOPfakqEezcIMxgM9vU3-aLVworR274D_AeRA5sixR/exec";
const SECRET_TOKEN = "job-scraper-9f3a7c2b-PRIVATE";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'sendToSheets') {
    const { company, pay, role, link, date_applied } = message.data;

    console.log('Sending to Apps Script:', {
      company, pay, role, link, date_applied
    });

    fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: SECRET_TOKEN,
        company: company || "",
        pay: pay || "",
        role: role || "",
        link: link || "",
        date_applied: date_applied || ""
      })
    })
      .then(r => {
        console.log('HTTP Status:', r.status);
        return r.json();
      })
      .then(data => {
        console.log('Response from Apps Script:', data);
        if (data.status === 'success') {
          sendResponse({ status: 'Success! Data saved to sheet' });
        } else {
          sendResponse({ status: 'Error: ' + (data.message || 'Unknown error') });
        }
      })
      .catch(err => {
        console.error('Error sending to Apps Script:', err);
        sendResponse({ status: 'Error: ' + err.message });
      });

    return true; // Keep channel open for async
  }
});
