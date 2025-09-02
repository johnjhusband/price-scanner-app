const express = require('express');
const router = express.Router();
const { processRedditPost } = require('../services/valuationService');
const { getDatabase } = require('../database');

// Admin page for Reddit processing
router.get('/admin/reddit', (req, res) => {
  const html = `<!DOCTYPE html>
<html>
<head>
  <title>Reddit Valuation Admin</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .header {
      background: #10B981;
      color: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    .section {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .form-group {
      margin-bottom: 15px;
    }
    label {
      display: block;
      margin-bottom: 5px;
      font-weight: bold;
    }
    input, textarea {
      width: 100%;
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
    }
    textarea {
      min-height: 100px;
      font-family: monospace;
    }
    button {
      background: #10B981;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 16px;
    }
    button:hover {
      background: #0D9668;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-bottom: 20px;
    }
    .stat-card {
      background: #F9FAFB;
      padding: 15px;
      border-radius: 8px;
      text-align: center;
    }
    .stat-value {
      font-size: 24px;
      font-weight: bold;
      color: #10B981;
    }
    .stat-label {
      color: #666;
      font-size: 14px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      padding: 8px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    th {
      background: #F3F4F6;
      font-weight: bold;
    }
    .success {
      background: #D1FAE5;
      color: #065F46;
      padding: 10px;
      border-radius: 4px;
      margin-bottom: 10px;
    }
    .error {
      background: #FEE2E2;
      color: #991B1B;
      padding: 10px;
      border-radius: 4px;
      margin-bottom: 10px;
    }
    .actions {
      display: flex;
      gap: 10px;
    }
    .secondary {
      background: #6B7280;
    }
    .secondary:hover {
      background: #4B5563;
    }
    .url-link {
      color: #10B981;
      text-decoration: none;
    }
    .url-link:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Reddit Valuation Admin</h1>
    <p>Process Reddit posts and manage valuations</p>
  </div>

  <div id="message"></div>

  <div class="section">
    <h2>Quick Actions</h2>
    <div class="actions">
      <button onclick="testValuation()">Create Test Valuation</button>
      <button onclick="loadStats()" class="secondary">Refresh Stats</button>
      <button onclick="fetchSubreddit('ThriftStoreHauls')" class="secondary">Fetch r/ThriftStoreHauls</button>
      <button onclick="fetchSubreddit('whatsthisworth')" class="secondary">Fetch r/whatsthisworth</button>
    </div>
  </div>

  <div class="section">
    <h2>Process Reddit Post</h2>
    <form id="processForm" onsubmit="processPost(event)">
      <div class="form-group">
        <label>Reddit Post Data (JSON)</label>
        <textarea name="postData" placeholder='{
  "id": "abc123",
  "title": "Found this Coach bag at Goodwill",
  "selftext": "Brown leather, looks vintage...",
  "author": "username",
  "subreddit": "ThriftStoreHauls",
  "url": "https://reddit.com/...",
  "created_utc": 1704067200
}'></textarea>
      </div>
      <button type="submit">Process Post</button>
    </form>
  </div>

  <div class="section">
    <h2>Valuation Statistics</h2>
    <div id="stats" class="stats">
      <div class="stat-card">
        <div class="stat-value">-</div>
        <div class="stat-label">Total Valuations</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">-</div>
        <div class="stat-label">Total Views</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">-</div>
        <div class="stat-label">Total Clicks</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">-</div>
        <div class="stat-label">Avg Confidence</div>
      </div>
    </div>
  </div>

  <div class="section">
    <h2>Recent Valuations</h2>
    <table id="valuations">
      <thead>
        <tr>
          <th>Created</th>
          <th>Title</th>
          <th>Value</th>
          <th>Views</th>
          <th>CTR</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr><td colspan="6">Loading...</td></tr>
      </tbody>
    </table>
  </div>

  <script>
    // Load stats on page load
    loadStats();
    loadValuations();

    function showMessage(message, isError = false) {
      const messageEl = document.getElementById('message');
      messageEl.className = isError ? 'error' : 'success';
      messageEl.textContent = message;
      messageEl.style.display = 'block';
      setTimeout(() => {
        messageEl.style.display = 'none';
      }, 5000);
    }

    async function testValuation() {
      try {
        const response = await fetch('/api/reddit/test');
        const data = await response.json();
        
        if (data.success) {
          showMessage('Test valuation created! URL: ' + data.valuation.url);
          loadValuations();
          loadStats();
        } else {
          showMessage('Error: ' + data.error, true);
        }
      } catch (error) {
        showMessage('Error: ' + error.message, true);
      }
    }

    async function processPost(event) {
      event.preventDefault();
      
      const formData = new FormData(event.target);
      const postData = formData.get('postData');
      
      try {
        const post = JSON.parse(postData);
        
        const response = await fetch('/api/reddit/process', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ post })
        });
        
        const data = await response.json();
        
        if (data.success) {
          showMessage('Valuation created! URL: ' + data.valuation.url);
          event.target.reset();
          loadValuations();
          loadStats();
        } else {
          showMessage('Error: ' + data.error, true);
        }
      } catch (error) {
        showMessage('Error: ' + error.message, true);
      }
    }

    async function loadStats() {
      try {
        const response = await fetch('/api/valuations/stats');
        const data = await response.json();
        
        if (data.success) {
          const stats = data.stats;
          document.querySelector('.stat-card:nth-child(1) .stat-value').textContent = 
            stats.total_valuations || 0;
          document.querySelector('.stat-card:nth-child(2) .stat-value').textContent = 
            stats.total_views || 0;
          document.querySelector('.stat-card:nth-child(3) .stat-value').textContent = 
            stats.total_clicks || 0;
          document.querySelector('.stat-card:nth-child(4) .stat-value').textContent = 
            stats.avg_confidence ? stats.avg_confidence.toFixed(1) : '0';
        }
      } catch (error) {
        console.error('Error loading stats:', error);
      }
    }

    async function loadValuations() {
      try {
        const response = await fetch('/api/valuations/recent?limit=10');
        const data = await response.json();
        
        if (data.success) {
          const tbody = document.querySelector('#valuations tbody');
          
          if (data.valuations.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6">No valuations yet</td></tr>';
            return;
          }
          
          tbody.innerHTML = data.valuations.map(v => {
            const ctr = v.view_count > 0 ? ((v.click_count / v.view_count) * 100).toFixed(1) : 0;
            const date = new Date(v.created_at).toLocaleDateString();
            
            return \`<tr>
              <td>\${date}</td>
              <td>\${v.title.substring(0, 50)}...</td>
              <td>$\${v.value_low}-$\${v.value_high}</td>
              <td>\${v.view_count}</td>
              <td>\${ctr}%</td>
              <td>
                <a href="/value/\${v.slug}" target="_blank" class="url-link">View</a> |
                <a href="/qr/value/\${v.slug}/print" target="_blank" class="url-link">QR</a>
              </td>
            </tr>\`;
          }).join('');
        }
      } catch (error) {
        console.error('Error loading valuations:', error);
      }
    }

    async function fetchSubreddit(subreddit) {
      try {
        showMessage(\`Fetching posts from r/\${subreddit}...\`);
        
        // Fetch from Reddit JSON API
        const response = await fetch(\`https://www.reddit.com/r/\${subreddit}/new.json?limit=10\`);
        const data = await response.json();
        
        const posts = data.data.children.map(child => child.data);
        
        // Filter for posts with "worth" related keywords
        const worthPosts = posts.filter(post => {
          const text = (post.title + ' ' + post.selftext).toLowerCase();
          return text.includes('worth') || text.includes('value') || 
                 text.includes('found') || text.includes('thrift');
        });
        
        showMessage(\`Found \${worthPosts.length} relevant posts from r/\${subreddit}\`);
        
        // Show first post in form
        if (worthPosts.length > 0) {
          const textarea = document.querySelector('textarea[name="postData"]');
          textarea.value = JSON.stringify(worthPosts[0], null, 2);
        }
        
      } catch (error) {
        showMessage('Error fetching subreddit: ' + error.message, true);
      }
    }
  </script>
</body>
</html>`;
  
  res.send(html);
});

module.exports = router;