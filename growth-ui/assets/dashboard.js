// Growth Dashboard JavaScript
const API_BASE = '/api/growth';

// State
let state = {
    activeTab: 'overview',
    questions: [],
    content: [],
    stats: {},
    monitoring: false
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeTabs();
    initializeButtons();
    loadData();
    
    // Auto-refresh every 30 seconds
    setInterval(loadData, 30000);
});

// Tab Management
function initializeTabs() {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            switchTab(tabName);
        });
    });
}

function switchTab(tabName) {
    // Update tabs
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Update content
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.getElementById(tabName).classList.add('active');
    
    state.activeTab = tabName;
    
    // Load tab-specific data
    if (tabName === 'analytics') {
        loadAnalytics();
    }
}

// Button Handlers
function initializeButtons() {
    // Monitor Reddit button
    document.getElementById('monitor-reddit').addEventListener('click', async () => {
        if (state.monitoring) return;
        
        state.monitoring = true;
        const btn = document.getElementById('monitor-reddit');
        btn.disabled = true;
        btn.innerHTML = '<span class="icon">⏳</span> Monitoring...';
        
        try {
            const response = await fetch(`${API_BASE}/monitor/reddit`, {
                method: 'POST'
            });
            
            if (response.ok) {
                showNotification('Reddit monitoring started', 'success');
                setTimeout(() => {
                    loadData();
                }, 3000);
            }
        } catch (error) {
            showNotification('Failed to start monitoring', 'error');
        } finally {
            state.monitoring = false;
            btn.disabled = false;
            btn.innerHTML = '<span class="icon">🔍</span> Monitor Reddit';
        }
    });
    
    // Refresh button
    document.getElementById('refresh').addEventListener('click', () => {
        loadData();
    });
}

// Data Loading
async function loadData() {
    try {
        // Load status
        const statusResponse = await fetch(`${API_BASE}/status`);
        const statusData = await statusResponse.json();
        
        if (statusData.success) {
            updateStats(statusData);
        }
        
        // Load questions
        const questionsResponse = await fetch(`${API_BASE}/questions?limit=10`);
        const questionsData = await questionsResponse.json();
        
        if (questionsData.success) {
            state.questions = questionsData.questions;
            renderQuestions();
        }
        
        // Load content
        const contentResponse = await fetch(`${API_BASE}/content?limit=20`);
        const contentData = await contentResponse.json();
        
        if (contentData.success) {
            state.content = contentData.content;
            renderContent();
        }
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

// Update Stats
function updateStats(data) {
    state.stats = data;
    
    // Update overview stats
    document.getElementById('total-questions').textContent = data.reddit?.total_questions || 0;
    document.getElementById('processed').textContent = data.reddit?.processed || 0;
    document.getElementById('content-created').textContent = data.content?.total_content || 0;
    document.getElementById('conversions').textContent = data.content?.total_conversions || 0;
    
    // Update recent questions
    if (data.reddit?.recent_questions) {
        renderRecentQuestions(data.reddit.recent_questions);
    }
}

// Render Functions
function renderRecentQuestions(questions) {
    const container = document.getElementById('recent-questions');
    
    if (questions.length === 0) {
        container.innerHTML = '<div class="empty-state">No recent questions found</div>';
        return;
    }
    
    container.innerHTML = questions.map(q => `
        <div class="question-item">
            <div class="question-title">${escapeHtml(q.title)}</div>
            <div class="question-meta">r/${q.subreddit} • Score: ${q.score}</div>
        </div>
    `).join('');
}

function renderQuestions() {
    const container = document.getElementById('questions-list');
    
    if (state.questions.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="icon">📭</div>
                <p>No unprocessed questions found</p>
                <p>Click "Monitor Reddit" to find new questions</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = state.questions.map(q => `
        <div class="question-card">
            <h3>${escapeHtml(q.title)}</h3>
            <div class="question-meta">r/${q.subreddit} • u/${q.author} • ${formatDate(q.created_utc)}</div>
            ${q.selftext ? `<div class="question-body">${escapeHtml(q.selftext.substring(0, 200))}...</div>` : ''}
            <button class="generate-btn" onclick="generateContent('${q.post_id}')">
                <span class="icon">✨</span> Generate Content
            </button>
        </div>
    `).join('');
}

function renderContent() {
    const container = document.getElementById('content-list');
    
    if (state.content.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="icon">📝</div>
                <p>No content generated yet</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = state.content.map(c => `
        <div class="content-card">
            <div class="content-header">
                <h3>${escapeHtml(c.title)}</h3>
                <span class="content-type">${getContentTypeIcon(c.type)} ${formatContentType(c.type)}</span>
            </div>
            <div class="content-stats">
                <div class="content-stat">
                    <div class="content-stat-value">${c.page_views || 0}</div>
                    <div class="content-stat-label">Views</div>
                </div>
                <div class="content-stat">
                    <div class="content-stat-value">${c.conversions || 0}</div>
                    <div class="content-stat-label">Conversions</div>
                </div>
                <div class="content-stat">
                    <div class="content-stat-value">${c.published ? '✅' : '📝'}</div>
                    <div class="content-stat-label">Status</div>
                </div>
            </div>
            <div class="content-preview">
                ${escapeHtml(stripHtml(c.content).substring(0, 150))}...
            </div>
        </div>
    `).join('');
}

// Analytics
async function loadAnalytics() {
    try {
        const response = await fetch(`${API_BASE}/analytics/summary`);
        const data = await response.json();
        
        if (data.success) {
            renderAnalyticsChart(data);
        }
    } catch (error) {
        console.error('Error loading analytics:', error);
    }
}

function renderAnalyticsChart(data) {
    const ctx = document.getElementById('performance-chart').getContext('2d');
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.dates || [],
            datasets: [{
                label: 'Views',
                data: data.views || [],
                borderColor: '#6A4DFF',
                backgroundColor: 'rgba(106, 77, 255, 0.1)',
                tension: 0.4
            }, {
                label: 'Conversions',
                data: data.conversions || [],
                borderColor: '#10B981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
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

// Actions
async function generateContent(postId) {
    try {
        const response = await fetch(`${API_BASE}/generate/${postId}`, {
            method: 'POST'
        });
        
        if (response.ok) {
            showNotification('Content generation started', 'success');
            setTimeout(() => {
                loadData();
            }, 2000);
        } else {
            showNotification('Failed to generate content', 'error');
        }
    } catch (error) {
        showNotification('Error generating content', 'error');
    }
}

// Utilities
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function stripHtml(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
}

function formatDate(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString();
}

function formatContentType(type) {
    const types = {
        'blog_post': 'Blog Post',
        'social_post': 'Social Media',
        'marketplace_listing': 'Marketplace',
        'email_campaign': 'Email Campaign'
    };
    return types[type] || 'Content';
}

function getContentTypeIcon(type) {
    const icons = {
        'blog_post': '📝',
        'social_post': '📱',
        'marketplace_listing': '🛍️',
        'email_campaign': '✉️'
    };
    return icons[type] || '📄';
}

function showNotification(message, type = 'info') {
    // Simple notification - could be enhanced with a toast library
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        background: ${type === 'success' ? '#10B981' : '#EF4444'};
        color: white;
        border-radius: 8px;
        font-weight: 600;
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}