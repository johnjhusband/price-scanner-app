const express = require('express');
const router = express.Router();

// Admin page for automation control
router.get('/admin/automation', (req, res) => {
  const html = `<!DOCTYPE html>
<html>
<head>
  <title>Marketing Automation Control</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 800px;
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
    .control-panel {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .status {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 20px;
    }
    .status-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }
    .running { background: #10B981; }
    .stopped { background: #EF4444; }
    button {
      padding: 10px 20px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 16px;
      margin-right: 10px;
    }
    .start { background: #10B981; color: white; }
    .stop { background: #EF4444; color: white; }
    .run { background: #3B82F6; color: white; }
    button:hover { opacity: 0.9; }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
    .stats {
      background: #F9FAFB;
      padding: 15px;
      border-radius: 8px;
      margin-top: 20px;
    }
    .message {
      padding: 10px;
      border-radius: 4px;
      margin-bottom: 10px;
    }
    .success { background: #D1FAE5; color: #065F46; }
    .error { background: #FEE2E2; color: #991B1B; }
    input[type="number"] {
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
      width: 80px;
      margin: 0 10px;
    }
    pre {
      background: #F3F4F6;
      padding: 10px;
      border-radius: 4px;
      overflow-x: auto;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🚀 Marketing Automation Control</h1>
    <p>Automatic Reddit monitoring and valuation generation</p>
  </div>

  <div id="message"></div>

  <div class="control-panel">
    <h2>Automation Status</h2>
    <div class="status">
      <div class="status-dot" id="statusDot"></div>
      <span id="statusText">Loading...</span>
    </div>
    
    <div id="statusDetails"></div>
    
    <h3>Controls</h3>
    <div>
      <button onclick="startAutomation()" class="start" id="startBtn">Start Automation</button>
      <label>Run every <input type="number" id="interval" value="30" min="5" max="1440"> minutes</label>
    </div>
    <div style="margin-top: 10px;">
      <button onclick="stopAutomation()" class="stop" id="stopBtn">Stop Automation</button>
      <button onclick="runManual()" class="run">Run Once Now</button>
    </div>
  </div>

  <div class="control-panel">
    <h2>📊 24-Hour Statistics</h2>
    <div id="stats">Loading...</div>
  </div>

  <div class="control-panel">
    <h2>🔍 Monitored Subreddits</h2>
    <ul style="columns: 2;">
      <li>r/ThriftStoreHauls</li>
      <li>r/whatsthisworth</li>
      <li>r/vintage</li>
      <li>r/Antiques</li>
      <li>r/Flipping</li>
      <li>r/GoodwillFinds</li>
      <li>r/DumpsterDiving</li>
      <li>r/yardsale</li>
      <li>r/estatesales</li>
      <li>r/AskCollectors</li>
    </ul>
    <p><em>Keywords: worth, value, "how much", "found this", thrift, authenticate, etc.</em></p>
  </div>

  <div class="control-panel">
    <h2>✋ Manual Blog Creation</h2>
    <p><a href="/admin/questions" style="color: #10B981; font-size: 18px;">Questions Found - Select Posts →</a></p>
    <p>Manually select Reddit posts to create blog entries</p>
  </div>

  <div class="control-panel">
    <h2>📈 Analytics</h2>
    <p><a href="/admin/automation/performance" style="color: #10B981; font-size: 18px;">View Performance Dashboard →</a></p>
    <p>Detailed metrics, trends, and error tracking</p>
  </div>

  <script>
    let isRunning = false;
    const adminKey = 'flippi-automate-2025';

    // Load status on page load
    loadStatus();
    setInterval(loadStatus, 10000); // Refresh every 10 seconds

    function showMessage(message, isError = false) {
      const messageEl = document.getElementById('message');
      messageEl.className = 'message ' + (isError ? 'error' : 'success');
      messageEl.textContent = message;
      messageEl.style.display = 'block';
      setTimeout(() => {
        messageEl.style.display = 'none';
      }, 5000);
    }

    async function loadStatus() {
      try {
        const response = await fetch('/api/automation/status');
        const data = await response.json();
        
        isRunning = data.running;
        
        // Update UI
        const statusDot = document.getElementById('statusDot');
        const statusText = document.getElementById('statusText');
        const statusDetails = document.getElementById('statusDetails');
        const startBtn = document.getElementById('startBtn');
        const stopBtn = document.getElementById('stopBtn');
        
        statusDot.className = 'status-dot ' + (isRunning ? 'running' : 'stopped');
        statusText.textContent = isRunning ? 'Automation Running' : 'Automation Stopped';
        
        startBtn.disabled = isRunning;
        stopBtn.disabled = !isRunning;
        
        // Status details
        let details = '';
        if (data.last_run) {
          details += '<p><strong>Last Run:</strong> ' + new Date(data.last_run.time).toLocaleString() + '</p>';
          if (data.last_run.stats) {
            details += '<p><strong>Processed:</strong> ' + data.last_run.stats.total_processed + ' posts</p>';
          }
        }
        if (data.next_run) {
          details += '<p><strong>Next Run:</strong> ' + new Date(data.next_run).toLocaleString() + '</p>';
        }
        statusDetails.innerHTML = details || '<p>No runs yet</p>';
        
        // Update stats
        const stats = document.getElementById('stats');
        if (data.stats_24h && data.stats_24h.total > 0) {
          let statsHtml = '<p><strong>Total Valuations (24h):</strong> ' + data.stats_24h.total + '</p>';
          if (data.stats_24h.by_subreddit && data.stats_24h.by_subreddit.length > 0) {
            statsHtml += '<p><strong>By Subreddit:</strong></p><ul>';
            data.stats_24h.by_subreddit.forEach(sub => {
              statsHtml += '<li>r/' + sub.source_subreddit + ': ' + sub.count + '</li>';
            });
            statsHtml += '</ul>';
          }
          stats.innerHTML = statsHtml;
        } else {
          stats.innerHTML = '<p>No valuations generated in the last 24 hours</p>';
        }
        
      } catch (error) {
        console.error('Error loading status:', error);
      }
    }

    async function startAutomation() {
      const interval = document.getElementById('interval').value;
      
      try {
        const response = await fetch('/api/automation/start', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Admin-Key': adminKey
          },
          body: JSON.stringify({ interval: parseInt(interval) })
        });
        
        const data = await response.json();
        
        if (data.success) {
          showMessage('Automation started! Running every ' + interval + ' minutes.');
          loadStatus();
        } else {
          showMessage(data.message || 'Failed to start', true);
        }
      } catch (error) {
        showMessage('Error: ' + error.message, true);
      }
    }

    async function stopAutomation() {
      if (!confirm('Are you sure you want to stop the automation?')) return;
      
      try {
        const response = await fetch('/api/automation/stop', {
          method: 'POST',
          headers: {
            'X-Admin-Key': adminKey
          }
        });
        
        const data = await response.json();
        
        if (data.success) {
          showMessage('Automation stopped.');
          loadStatus();
        } else {
          showMessage(data.message || 'Failed to stop', true);
        }
      } catch (error) {
        showMessage('Error: ' + error.message, true);
      }
    }

    async function runManual() {
      try {
        const response = await fetch('/api/automation/run', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Admin-Key': adminKey
          },
          body: JSON.stringify({})
        });
        
        const data = await response.json();
        
        if (data.success) {
          showMessage('Manual run started! Check back in a few minutes for results.');
        } else {
          showMessage(data.message || 'Failed to run', true);
        }
      } catch (error) {
        showMessage('Error: ' + error.message, true);
      }
    }
  </script>
</body>
</html>`;
  
  res.send(html);
});

// Manual selection page for blog posts
router.get('/admin/questions', async (req, res) => {
  const html = `<!DOCTYPE html>
<html>
<head>
  <title>Manual Blog Post Selection - Flippi.ai</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 0;
      background: #f5f5f5;
    }
    .header {
      background: #10B981;
      color: white;
      padding: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    .controls {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .posts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 20px;
    }
    .post-card {
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      transition: transform 0.2s;
    }
    .post-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.15);
    }
    .post-image {
      width: 100%;
      height: 200px;
      object-fit: cover;
      background: #f0f0f0;
    }
    .post-content {
      padding: 15px;
    }
    .post-title {
      font-weight: 600;
      font-size: 16px;
      margin-bottom: 8px;
      line-height: 1.3;
    }
    .post-meta {
      font-size: 12px;
      color: #666;
      margin-bottom: 10px;
    }
    .post-actions {
      display: flex;
      gap: 10px;
      margin-top: 15px;
    }
    .btn {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      text-decoration: none;
      display: inline-block;
      transition: background 0.2s;
    }
    .btn-primary {
      background: #10B981;
      color: white;
    }
    .btn-primary:hover {
      background: #059669;
    }
    .btn-secondary {
      background: #6B7280;
      color: white;
    }
    .btn-secondary:hover {
      background: #4B5563;
    }
    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .message {
      padding: 12px;
      border-radius: 4px;
      margin-bottom: 20px;
    }
    .success {
      background: #D1FAE5;
      color: #065F46;
      border: 1px solid #A7F3D0;
    }
    .error {
      background: #FEE2E2;
      color: #991B1B;
      border: 1px solid #FECACA;
    }
    .info {
      background: #DBEAFE;
      color: #1E40AF;
      border: 1px solid #BFDBFE;
    }
    .loading {
      text-align: center;
      padding: 40px;
      color: #666;
    }
    .no-image {
      height: 200px;
      background: #f0f0f0;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #999;
    }
    .status-badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .status-new {
      background: #DBEAFE;
      color: #1E40AF;
    }
    .status-processed {
      background: #D1FAE5;
      color: #065F46;
    }
    select {
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
    }
    .refresh-btn {
      float: right;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="container">
      <h1>📝 Questions Found - Manual Blog Post Selection</h1>
      <p style="margin: 5px 0 0 0; opacity: 0.9;">Select Reddit posts to create blog entries</p>
    </div>
  </div>

  <div class="container">
    <div id="message"></div>
    
    <div class="controls">
      <label>Subreddit: 
        <select id="subreddit" onchange="loadPosts()">
          <option value="ThriftStoreHauls">r/ThriftStoreHauls</option>
          <option value="whatsthisworth">r/whatsthisworth</option>
          <option value="vintage">r/vintage</option>
          <option value="Antiques">r/Antiques</option>
          <option value="Flipping">r/Flipping</option>
          <option value="GoodwillFinds">r/GoodwillFinds</option>
        </select>
      </label>
      <button class="btn btn-secondary refresh-btn" onclick="loadPosts()">🔄 Refresh</button>
    </div>
    
    <div id="posts-container">
      <div class="loading">Loading posts...</div>
    </div>
  </div>

  <script>
    let processingPosts = new Set();
    
    function showMessage(message, type = 'info') {
      const messageEl = document.getElementById('message');
      messageEl.className = 'message ' + type;
      messageEl.textContent = message;
      messageEl.style.display = 'block';
      setTimeout(() => {
        messageEl.style.display = 'none';
      }, 5000);
    }
    
    async function loadPosts() {
      const container = document.getElementById('posts-container');
      container.innerHTML = '<div class="loading">Loading posts from Reddit...</div>';
      
      const subreddit = document.getElementById('subreddit').value;
      
      try {
        const response = await fetch('/api/automation/posts/available?subreddit=' + subreddit);
        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.message || 'Failed to load posts');
        }
        
        if (!data.posts || data.posts.length === 0) {
          container.innerHTML = '<div class="loading">No posts found. Try a different subreddit.</div>';
          return;
        }
        
        const postsHtml = data.posts.map(post => createPostCard(post)).join('');
        container.innerHTML = '<div class="posts-grid">' + postsHtml + '</div>';
        
        showMessage('Loaded ' + data.posts.length + ' posts from r/' + subreddit, 'info');
      } catch (error) {
        container.innerHTML = '<div class="loading">Error loading posts: ' + error.message + '</div>';
        showMessage('Failed to load posts: ' + error.message, 'error');
      }
    }
    
    function createPostCard(post) {
      const isProcessing = processingPosts.has(post.id);
      const statusBadge = post.isProcessed 
        ? '<span class="status-badge status-processed">Processed</span>'
        : '<span class="status-badge status-new">New</span>';
      
      const imageHtml = post.image_url
        ? '<img src="' + post.image_url + '" alt="' + escapeHtml(post.title) + '" class="post-image" onerror="this.parentElement.innerHTML=\\'<div class=\\"no-image\\">No Image</div>\\'">'
        : '<div class="no-image">No Image Available</div>';
      
      return '<div class="post-card" id="post-' + post.id + '">' +
        imageHtml +
        '<div class="post-content">' +
          '<div class="post-title">' + escapeHtml(post.title) + '</div>' +
          '<div class="post-meta">' +
            'by u/' + post.author + ' • ' + new Date(post.created_utc * 1000).toLocaleDateString() +
            ' ' + statusBadge +
          '</div>' +
          (post.selftext ? '<p style="font-size: 14px; color: #666; margin: 10px 0;">' + escapeHtml(post.selftext.substring(0, 150)) + '...</p>' : '') +
          '<div class="post-actions">' +
            '<button class="btn btn-primary" onclick="createBlogPost(\'' + post.id + '\')" ' +
              (isProcessing || post.isProcessed ? 'disabled' : '') + '>' +
              (isProcessing ? 'Creating...' : (post.isProcessed ? 'Already Created' : 'Create Blog Post')) +
            '</button>' +
            '<a href="' + post.permalink + '" target="_blank" class="btn btn-secondary">View on Reddit</a>' +
          '</div>' +
        '</div>' +
      '</div>';
    }
    
    async function createBlogPost(postId) {
      if (processingPosts.has(postId)) return;
      
      processingPosts.add(postId);
      updatePostCard(postId);
      
      try {
        const response = await fetch('/api/automation/create-blog/' + postId, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Admin-Key': 'flippi-automate-2025'
          }
        });
        
        const data = await response.json();
        
        if (data.success) {
          showMessage('Blog post created successfully! View at: ' + data.url, 'success');
          // Mark as processed
          const card = document.getElementById('post-' + postId);
          if (card) {
            const badge = card.querySelector('.status-badge');
            badge.className = 'status-badge status-processed';
            badge.textContent = 'Processed';
            
            const btn = card.querySelector('.btn-primary');
            btn.textContent = 'Already Created';
            btn.disabled = true;
          }
        } else {
          throw new Error(data.message || 'Failed to create blog post');
        }
      } catch (error) {
        showMessage('Error: ' + error.message, 'error');
      } finally {
        processingPosts.delete(postId);
        updatePostCard(postId);
      }
    }
    
    function updatePostCard(postId) {
      const card = document.getElementById('post-' + postId);
      if (!card) return;
      
      const btn = card.querySelector('.btn-primary');
      if (processingPosts.has(postId)) {
        btn.textContent = 'Creating...';
        btn.disabled = true;
      }
    }
    
    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
    
    // Load posts on page load
    loadPosts();
  </script>
</body>
</html>`;
  
  res.send(html);
});

module.exports = router;