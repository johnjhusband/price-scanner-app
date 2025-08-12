const express = require('express');
const router = express.Router();

// Manual selection page for blog posts - moved from /admin/questions
router.get('/growth/questions', async (req, res) => {
  const html = `<!DOCTYPE html>
<html>
<head>
  <title>Questions Found - Manual Blog Post Selection | Flippi.ai</title>
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
    .nav-link {
      margin-bottom: 20px;
    }
    .nav-link a {
      color: #10B981;
      text-decoration: none;
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
    <div class="nav-link">
      <a href="#" onclick="window.history.back(); return false;">← Back to Growth Dashboard</a>
    </div>
    
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
          container.innerHTML = '<div class="loading">No posts found. Reddit may be blocking server access.<br><br>Note: Reddit blocks many cloud server IPs. The automation runs on a schedule but manual selection may be limited.</div>';
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
        ? '<img src="' + post.image_url + '" alt="' + escapeHtml(post.title) + '" class="post-image" onerror="this.style.display=\\'none\\'; this.parentElement.innerHTML=\\'<div class=\\\\\\'no-image\\\\\\'>No Image</div>\\'">'
        : '<div class="no-image">No Image Available</div>';
      
      return '<div class="post-card" id="post-' + post.id + '">' +
        imageHtml +
        '<div class="post-content">' +
          '<div class="post-title">' + escapeHtml(post.title) + '</div>' +
          '<div class="post-meta">' +
            'by u/' + post.author + ' • ' + (post.created_utc ? new Date(post.created_utc * 1000).toLocaleDateString() : 'Date unknown') +
            ' ' + statusBadge +
          '</div>' +
          (post.selftext ? '<p style="font-size: 14px; color: #666; margin: 10px 0;">' + escapeHtml(post.selftext.substring(0, 150)) + '...</p>' : '') +
          '<div class="post-actions">' +
            '<button class="btn btn-primary" onclick="createBlogPost(' + "'" + post.id.replace(/'/g, "\\'") + "'" + ')" ' +
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