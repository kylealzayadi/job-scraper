# -------------------------
# Imports and Flask app initialization
# -------------------------
from flask import Flask, request, jsonify
from flask_cors import CORS
import gspread
import datetime
from oauth2client.service_account import ServiceAccountCredentials
import os


app = Flask(__name__)
CORS(app)

# -------------------------
# Helper functions
# -------------------------

def to_roman(num):
    if num <= 0:
        return str(num)
    val = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1]
    syb = ["M", "CM", "D", "CD", "C", "XC", "L", "XL", "X", "IX", "V", "IV", "I"]
    roman_num = ''
    i = 0
    while num > 0 and i < len(val):
        while num >= val[i]:
            roman_num += syb[i]
            num -= val[i]
        i += 1
    return roman_num

@app.route('/')
def home():
    return 'Backend is running 👍'

# -------------------------
# Google Sheets setup
# -------------------------

SCOPE = [
    'https://spreadsheets.google.com/feeds',
    'https://www.googleapis.com/auth/drive'
]

# Always load credentials.json from the same folder as this file
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CREDS_FILE = os.path.join(BASE_DIR, 'credentials.json')

# Your Google Sheet ID
SHEET_ID = '1g0VXteuoFceWUsztPemw_7Ixy33J5CxZQDjPePTgsko'

# Authorize Google Sheets
creds = ServiceAccountCredentials.from_json_keyfile_name(CREDS_FILE, SCOPE)
client = gspread.authorize(creds)

# Use the first tab in the spreadsheet
sheet = client.open_by_key(SHEET_ID).sheet1

# -------------------------
# API route
# -------------------------

@app.route('/api/job', methods=['POST'])
def add_job():
    data = request.get_json(force=True)

    company = data.get('company', '')
    link = data.get('link', '')
    role = data.get('role', '')
    pay = data.get('pay', '')
    date_applied = data.get('date_applied', '')

    # Count applications on this date and assign Roman numeral
    all_dates = sheet.col_values(4)[1:]  # Column D, skip header
    count = sum(1 for d in all_dates if d == date_applied)
    roman = to_roman(count + 1)

    # Find the first empty row (by WHERE column, which is B)
    def first_empty_row(sheet, col=2):
        col_values = sheet.col_values(col)
        return len(col_values) + 1

    row = first_empty_row(sheet, col=2)

    # Write each value to the correct column
    # B: WHERE, C: Role, D: Date Applied, F: Status, G: Salary, I: LINK, J: Out of 3 (Roman)
    updates = [
        (row, 2, company),      # B
        (row, 3, role),         # C
        (row, 4, date_applied), # D
        (row, 6, 'Sent'),       # F
        (row, 7, pay),          # G
        (row, 9, link),         # I
        (row, 10, roman),       # J
    ]
    for r, c, v in updates:
        sheet.update_cell(r, c, v)

    return jsonify({'status': 'success'})

# -------------------------
# Start server
# -------------------------

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
