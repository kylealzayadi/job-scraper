(function() {
  console.log('content.js loaded on', window.location.href);
      // content script entry: collect job info from the page
      function getJobInfo() {
        let company = '';
        let role = '';
        let pay = null;
        let link = window.location.href || null;
        let dateApplied = new Date().toLocaleDateString();
      // Indeed selectors
      if (window.location.hostname.includes('indeed.com')) {
        // Role
        role = document.querySelector('h1.jobsearch-JobInfoHeader-title, h1')?.innerText || '';
        // Company
        company = document.querySelector('a.css-1h4l2d7.e19afand0')?.innerText ||
              document.querySelector('.jobsearch-CompanyInfoWithoutHeaderImage div.icl-u-lg-mr--sm, .jobsearch-InlineCompanyRating div, .jobsearch-CompanyReview--heading, .icl-u-lg-mr--sm.icl-u-xs-mr--xs')?.innerText || '';
        // Pay (try to capture a range displayed in job metadata)
        pay = Array.from(document.querySelectorAll('.jobsearch-JobMetadataHeader-item')).find(e => e.innerText.includes('$'))?.innerText || '';
      } else if (window.location.hostname.includes('linkedin.com')) {
        // Role
        const roleEl = document.querySelector('p._071fc875._5b2ad80d') || document.querySelector('h1') || document.querySelector('h2');
        role = roleEl?.innerText || '';
        console.log('Role element found:', !!roleEl);
        console.log('Role innerText:', role);
        console.log('Role element outerHTML:', roleEl?.outerHTML); // debug
        // Company
        company = document.querySelector('a.b964c9a7._06741cec')?.innerText || document.querySelector('.job-details-jobs-unified-top-card__company-name')?.innerText || '';
        // Pay
        const payEls = document.querySelectorAll('span[class*="_071fc875"]');
        for (const el of payEls) {
          if (el.innerText.includes('$')) {
            pay = el.innerText;
            break;
          }
        }
        console.log('Pay found:', pay);
      }

      // Fallbacks for other sites (try generic selectors)
      if (!company) company = document.querySelector('[data-company]')?.innerText || '';
      if (!role) role = document.querySelector('h1')?.innerText || '';
      if (!pay) pay = document.querySelector('[data-salary]')?.innerText || '';

      // Helper to clean titles like "Apply ... | Twitch | LinkedIn" or "Role | Company | LinkedIn"
      function cleanText(str) {
        if (!str) return '';
        let s = str.trim();
        // remove leading 'Apply' or other CTAs
        s = s.replace(/^Apply\s*[:\-–]?\s*/i, '');
        // split on common separators and take the most likely human title (first segment)
        const parts = s.split(/[|–—\-·•]/).map(p => p.trim()).filter(Boolean);
        if (parts.length > 1) s = parts[0]; // take first part if multiple
        // If still has comma, take the main title (e.g., "Software Engineer, Discovery (Feed)" -> "Software Engineer")
        if (s.includes(',')) {
          s = s.split(',')[0].trim();
        }
        // remove "at Company" pattern
        s = s.replace(/\s+at\s+.+$/i, '');
        // remove trailing platform names
        s = s.replace(/\b(LinkedIn|Indeed)\b/gi, '').trim();
        return s;
      }

      console.log('Raw role:', role); // debug
      role = cleanText(role);
      console.log('Cleaned role:', role); // debug
      company = cleanText(company) || (document.title || '').split('|').map(p => p.trim())[1] || '';

      console.log('Raw role before clean:', role); // debug
      console.log('Cleaned role:', role); // debug

      // Salary: try to capture ranges like "$16.49/hr - $23.92/hr" or single amounts
      if (!pay) {
        const bodyText = document.body.innerText || '';
        const rangeRegex = /(\$\s?\d{1,3}(?:[,\d]{0,})?(?:\.\d{1,2})?(?:\s?\/?\s?(?:hr|hour|per hour))?(?:\s*[-–]\s*\$\s?\d{1,3}(?:[,\d]{0,})?(?:\.\d{1,2})?(?:\s?\/?\s?(?:hr|hour|per hour))?))/i;
        const mRange = bodyText.match(rangeRegex);
        if (mRange) {
          pay = mRange[0].trim();
        } else {
          const singleRegex = /(\$\s?\d{1,3}(?:[,\d]{0,})?(?:\.\d{1,2})?)/g;
          const matches = bodyText.match(singleRegex);
          if (matches && matches.length) pay = matches[0].trim();
        }
      }

      // Normalize pay: if still empty, set to null; otherwise ensure exact text preserved for Sheets
      if (!pay) pay = null;
      else {
        pay = pay.trim();
        if (!pay.startsWith("'")) pay = '\'' + pay;
      }

        // Extra fallbacks using meta tags and document.title
        try {
          if (!role) {
            const ogTitle = document.querySelector('meta[property="og:title"]')?.content || document.querySelector('meta[name="og:title"]')?.content;
            if (ogTitle) {
              // ogTitle sometimes includes company too: "Role at Company"
              role = ogTitle.split(' at ')[0] || ogTitle;
            }
            if (!role) role = document.title || '';
          }

          if (!company) {
            const ogSite = document.querySelector('meta[property="og:site_name"]')?.content || document.querySelector('meta[name="og:site_name"]')?.content;
            if (ogSite) company = ogSite;
            // Try link text that looks like company
            if (!company) company = document.querySelector('a[aria-label*="company"]')?.innerText || '';
          }

          // If pay still missing, scan page text for $ amounts
          if (!pay) {
            const bodyText = document.body.innerText || '';
            const moneyMatches = bodyText.match(/\$\s?\d{1,3}(?:[,\d]{0,})?(?:\.\d{1,2})?(?:\s?\/\s?hour|\s?per\s?hour|\s?hr)?/gi);
            if (moneyMatches && moneyMatches.length) {
              // pick the first plausible salary string
              pay = moneyMatches[0].trim();
            }
          }
        } catch (e) {
          console.warn('Fallback parsing failed', e);
        }

        // Filter out unwanted text like 'Skip to search'
        if (company && company.toLowerCase().includes('skip to search')) company = '';
        if (role && role.toLowerCase().includes('skip to search')) role = '';
        if (pay && pay.toLowerCase().includes('skip to')) pay = null;

        return { company, pay, role, link, date_applied: dateApplied };
      }

      // Expose a message listener so popup can ping and request a scrape
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        try {
          if (message && message.type === 'PING') {
            sendResponse({ pong: true });
            return true;
          }

          if (message && message.action === 'scrape') {
            const jobInfo = getJobInfo();
            console.log('JobInfo extracted:', jobInfo);

            // Send to backend API (local Flask server) with timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 seconds

            fetch('http://localhost:5000/api/job', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(jobInfo),
              signal: controller.signal
            })
              .then(res => {
                clearTimeout(timeoutId);
                return res.ok ? 'Success!' : 'Failed to send';
              })
              .catch(err => {
                clearTimeout(timeoutId);
                if (err.name === 'AbortError') return 'Timeout (no response)';
                return 'Error sending';
              })
              .then(status => {
                sendResponse({ status });
              });

            return true; // Keep the message channel open for async response
          }
        } catch (e) {
          console.error('Message handler error', e);
          if (sendResponse) sendResponse({ status: 'Error' });
        }
      });
    })();
