const express = require('express');
const router = express.Router();
const { getDatabase } = require('../database');

// Performance dashboard for automation
router.get('/admin/automation/performance', (req, res) => {
  const html = `<!DOCTYPE html>
<html>
<head>
  <title>Automation Performance Dashboard</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
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
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .metric-card {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      text-align: center;
    }
    .metric-value {
      font-size: 36px;
      font-weight: bold;
      color: #10B981;
      margin: 10px 0;
    }
    .metric-label {
      color: #666;
      font-size: 14px;
    }
    .chart-container {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin-bottom: 20px;
      height: 400px;
    }
    .error-list {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .error-item {
      border-bottom: 1px solid #eee;
      padding: 10px 0;
    }
    .error-item:last-child {
      border-bottom: none;
    }
    .subreddit-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 10px;
      margin-top: 10px;
    }
    .subreddit-card {
      background: #F9FAFB;
      padding: 10px;
      border-radius: 4px;
      text-align: center;
    }
    .refresh-btn {
      background: #3B82F6;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      float: right;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📊 Automation Performance Dashboard</h1>
    <p>Real-time metrics and analytics for Reddit automation</p>
  </div>

  <button class="refresh-btn" onclick="location.reload()">Refresh Data</button>

  <div class="metrics-grid" id="metrics">
    <div class="metric-card">
      <div class="metric-label">Total Runs (7 days)</div>
      <div class="metric-value" id="totalRuns">-</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Success Rate</div>
      <div class="metric-value" id="successRate">-</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Avg Processing Time</div>
      <div class="metric-value" id="avgTime">-</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Total Valuations</div>
      <div class="metric-value" id="totalValuations">-</div>
    </div>
  </div>

  <div class="chart-container">
    <h2>Processing Trend (Last 7 Days)</h2>
    <canvas id="trendChart"></canvas>
  </div>

  <div class="chart-container">
    <h2>Success by Subreddit</h2>
    <canvas id="subredditChart"></canvas>
  </div>

  <div class="error-list">
    <h2>Recent Errors (Last 24h)</h2>
    <div id="errorList">Loading...</div>
  </div>

  <script>
    // Fetch performance data
    async function loadPerformanceData() {
      try {
        const response = await fetch('/api/automation/performance');
        const data = await response.json();
        
        // Update metrics
        document.getElementById('totalRuns').textContent = data.metrics.total_runs;
        document.getElementById('successRate').textContent = data.metrics.success_rate + '%';
        document.getElementById('avgTime').textContent = data.metrics.avg_duration + 's';
        document.getElementById('totalValuations').textContent = data.metrics.total_valuations;
        
        // Render trend chart
        renderTrendChart(data.daily_stats);
        
        // Render subreddit chart
        renderSubredditChart(data.subreddit_stats);
        
        // Render error list
        renderErrors(data.recent_errors);
        
      } catch (error) {
        console.error('Error loading performance data:', error);
      }
    }

    function renderTrendChart(dailyStats) {
      const ctx = document.getElementById('trendChart').getContext('2d');
      
      new Chart(ctx, {
        type: 'line',
        data: {
          labels: dailyStats.map(d => d.date),
          datasets: [
            {
              label: 'Processed',
              data: dailyStats.map(d => d.processed),
              borderColor: '#10B981',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              tension: 0.4
            },
            {
              label: 'Errors',
              data: dailyStats.map(d => d.errors),
              borderColor: '#EF4444',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              tension: 0.4
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: 'top'
            }
          },
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
    }

    function renderSubredditChart(subredditStats) {
      const ctx = document.getElementById('subredditChart').getContext('2d');
      
      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: subredditStats.map(s => 'r/' + s.subreddit),
          datasets: [{
            label: 'Valuations Created',
            data: subredditStats.map(s => s.count),
            backgroundColor: '#10B981'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
    }

    function renderErrors(errors) {
      const errorList = document.getElementById('errorList');
      
      if (errors.length === 0) {
        errorList.innerHTML = '<p style="color: #666;">No errors in the last 24 hours 🎉</p>';
        return;
      }
      
      errorList.innerHTML = errors.map(error => \`
        <div class="error-item">
          <strong>r/\${error.subreddit}</strong> - \${new Date(error.created_at).toLocaleString()}
          <br>Post: \${error.title}
          <br><span style="color: #EF4444;">\${error.error_message}</span>
        </div>
      \`).join('');
    }

    // Load data on page load
    loadPerformanceData();
  </script>
</body>
</html>`;
  
  res.send(html);
});

// API endpoint for performance data
router.get('/api/automation/performance', async (req, res) => {
  try {
    const db = getDatabase();
    
    // Overall metrics (7 days)
    const metrics = db.prepare(`
      SELECT 
        COUNT(*) as total_runs,
        AVG(duration_seconds) as avg_duration,
        SUM(total_processed) as total_processed,
        SUM(total_errors) as total_errors,
        ROUND(100.0 * SUM(total_processed) / NULLIF(SUM(total_processed + total_errors), 0), 1) as success_rate
      FROM automation_runs
      WHERE created_at > datetime('now', '-7 days')
    `).get();
    
    // Daily stats for trend chart
    const dailyStats = db.prepare(`
      SELECT 
        DATE(created_at) as date,
        SUM(total_processed) as processed,
        SUM(total_errors) as errors,
        COUNT(*) as runs
      FROM automation_runs
      WHERE created_at > datetime('now', '-7 days')
      GROUP BY DATE(created_at)
      ORDER BY date
    `).all();
    
    // Stats by subreddit
    const subredditStats = db.prepare(`
      SELECT 
        source_subreddit as subreddit,
        COUNT(*) as count
      FROM valuations
      WHERE source_type = 'reddit'
      AND created_at > datetime('now', '-7 days')
      GROUP BY source_subreddit
      ORDER BY count DESC
      LIMIT 10
    `).all();
    
    // Recent errors
    const recentErrors = db.prepare(`
      SELECT *
      FROM automation_errors
      WHERE created_at > datetime('now', '-24 hours')
      AND resolved = 0
      ORDER BY created_at DESC
      LIMIT 20
    `).all();
    
    // Total valuations
    const totalValuations = db.prepare(`
      SELECT COUNT(*) as count
      FROM valuations
      WHERE source_type = 'reddit'
      AND created_at > datetime('now', '-7 days')
    `).get();
    
    res.json({
      metrics: {
        total_runs: metrics.total_runs || 0,
        avg_duration: Math.round(metrics.avg_duration || 0),
        success_rate: metrics.success_rate || 0,
        total_valuations: totalValuations.count || 0
      },
      daily_stats: dailyStats,
      subreddit_stats: subredditStats,
      recent_errors: recentErrors
    });
    
  } catch (error) {
    console.error('[Performance] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;