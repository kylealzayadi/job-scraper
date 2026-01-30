job scraper

this is a chrome extension that lets you scrape job details from linkedin and indeed pages right from your browser. it grabs the company name, job role, salary, and link, then sends everything to a google sheet automatically.

how to set it up

1. clone this repo
2. for the backend, go to the backend folder and install the python stuff: pip install -r requirements.txt
3. create a config.py file in the backend folder with your google sheet id: SHEET_ID = 'your_sheet_id'
4. put your google service account credentials.json in the backend folder
5. run the backend: python app.py
6. for the extension, load the chrome-extension folder as an unpacked extension in chrome
7. go to a job page on linkedin or indeed, click the extension button, and it should work

what it does

- scrapes job info without messing with your page
- sends data to google sheets with roman numerals for daily counts
- keeps things simple and secure

notes

- make sure your google sheet has the right columns
- the extension only works on linkedin and indeed job pages
- backend runs on localhost:5000

if you have issues, check the console for errors.