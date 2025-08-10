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
    <ul>
      <li>r/ThriftStoreHauls</li>
      <li>r/whatsthisworth</li>
      <li>r/vintage</li>
      <li>r/Antiques</li>
      <li>r/Flipping</li>
    </ul>
    <p><em>Keywords: worth, value, "how much", "found this", thrift, authenticate, etc.</em></p>
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

module.exports = router;