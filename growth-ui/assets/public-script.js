// Public blog functionality
document.addEventListener('DOMContentLoaded', function() {
    loadPosts();
});

async function loadPosts() {
    const postsGrid = document.getElementById('posts-grid');
    
    try {
        const response = await fetch('/api/growth/content?published=true');
        const data = await response.json();
        
        if (data.success && data.content && data.content.length > 0) {
            displayPosts(data.content);
        } else {
            displayEmptyState();
        }
    } catch (error) {
        console.error('Error loading posts:', error);
        postsGrid.innerHTML = '<div class="empty-state"><h3>Unable to load content</h3><p>Please try again later.</p></div>';
    }
}

function displayPosts(posts) {
    const postsGrid = document.getElementById('posts-grid');
    postsGrid.innerHTML = '';
    
    posts.forEach(post => {
        const postCard = createPostCard(post);
        postsGrid.appendChild(postCard);
    });
}

function createPostCard(post) {
    const card = document.createElement('article');
    card.className = 'post-card';
    card.onclick = () => window.location.href = `/story/${post.id}`;
    
    // Extract text content from HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = post.content;
    const textContent = tempDiv.textContent || tempDiv.innerText || '';
    const excerpt = textContent.substring(0, 150) + '...';
    
    card.innerHTML = `
        <div class="post-content">
            <h3 class="post-title">${escapeHtml(post.title)}</h3>
            <p class="post-excerpt">${escapeHtml(excerpt)}</p>
            <div class="post-meta">
                <span class="post-date">
                    📅 ${formatDate(post.created_at)}
                </span>
                ${post.page_views > 0 ? `
                    <span class="post-views">
                        👁️ ${post.page_views} views
                    </span>
                ` : ''}
            </div>
        </div>
    `;
    
    return card;
}

function displayEmptyState() {
    const postsGrid = document.getElementById('posts-grid');
    postsGrid.innerHTML = `
        <div class="empty-state">
            <h3>No posts yet</h3>
            <p>Check back soon for expert insights and valuations!</p>
        </div>
    `;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}