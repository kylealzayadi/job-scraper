const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzWALdIr1PE5TqzEqYahwh5Xn4FDFw-O-7wAK_sqzS4Sm8G-JCXmHwtZ2MuLTsAmdAGWg/exec";
const SECRET_TOKEN = "job-scraper-9f3a7c2b-PRIVATE";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'sendToSheets') {
    const { company, pay, role, link, date_applied } = message.data;

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
      .then(r => r.json())
      .then(data => {
        console.log('Response from Apps Script:', data);
        sendResponse({ status: 'Success!' });
      })
      .catch(err => {
        console.error('Error sending to Apps Script:', err);
        sendResponse({ status: 'Error sending' });
      });

    return true; // Keep channel open for async
  }
});
