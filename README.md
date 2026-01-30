job scraper

this is a chrome extension that lets you scrape job details from linkedin and indeed pages right from your browser. it grabs the company name, job role, salary, and link, then sends everything to a google sheet automatically.

## Most Recent Changes

This extension no longer relies on a local server or any running scripts. Instead of using a Python backend, job data is sent directly from the Chrome extension to a hosted Google Apps Script web app. The Apps Script acts as a lightweight API that appends job information to a Google Sheet and is always online, meaning the extension works anytime it is clicked without starting VS Code, running Flask, or using localhost.

To secure the endpoint, a shared secret token is defined in both the Google Apps Script and the extension's background script. Each request includes this token, and the Apps Script validates it before writing to the sheet, preventing unauthorized access. After deploying the Apps Script as a web app and adding the secret key to both sides, the extension functions like a normal Chrome extension—reload it after code changes, refresh the job page, and click the button to save the job.

how to set it up

1. Clone this repo
2. Set up your Google Apps Script web app (see instructions in the Apps Script editor)
3. Add the secret token to both the Apps Script and the extension's background.js
4. Load the chrome-extension folder as an unpacked extension in Chrome
5. Go to a job page on LinkedIn or Indeed, click the extension button, and it should work

what it does

- scrapes job info without messing with your page
- sends data to google sheets with roman numerals for daily counts
- keeps things simple and secure

notes

- make sure your google sheet has the right columns
- the extension only works on linkedin and indeed job pages
- no local server needed - everything runs in the cloud

if you have issues, check the console for errors.