const { getDatabase } = require('../database');
const { processRedditPost } = require('../services/valuationService');
const { generateSlug } = require('../database/valuationSchema');

// Reddit JSON API (no auth required)
const SUBREDDITS = [
  'ThriftStoreHauls',
  'whatsthisworth',
  'vintage',
  'Antiques',
  'Flipping'
];

// Keywords that indicate valuation questions
const WORTH_KEYWORDS = [
  'worth',
  'value',
  'how much',
  'what is this',
  'found this',
  'thrift',
  'goodwill',
  'estate sale',
  'garage sale',
  'yard sale',
  'flea market',
  'authenticate',
  'real or fake',
  'legit check'
];

// Fetch posts from Reddit
async function fetchRedditPosts(subreddit, limit = 25) {
  try {
    const fetch = (await import('node-fetch')).default;
    const url = `https://www.reddit.com/r/${subreddit}/new.json?limit=${limit}`;
    
    console.log(`[Reddit] Fetching from r/${subreddit}...`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'flippi-bot/1.0 (monitoring for valuation questions)'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Reddit API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data.children.map(child => child.data);
    
  } catch (error) {
    console.error(`[Reddit] Error fetching r/${subreddit}:`, error.message);
    return [];
  }
}

// Check if post is relevant for valuation
function isRelevantPost(post) {
  const text = `${post.title} ${post.selftext || ''}`.toLowerCase();
  
  // Must have an image
  if (!post.url || (!post.url.includes('i.redd.it') && !post.url.includes('imgur'))) {
    return false;
  }
  
  // Check for worth keywords
  return WORTH_KEYWORDS.some(keyword => text.includes(keyword));
}

// Check if we've already processed this post
async function isProcessed(postId) {
  const db = getDatabase();
  const existing = db.prepare(
    'SELECT id FROM valuations WHERE source_id = ? AND source_type = ?'
  ).get(postId, 'reddit');
  
  return !!existing;
}

// Process a single subreddit
async function processSubreddit(subreddit) {
  console.log(`\n[Reddit] Processing r/${subreddit}...`);
  
  const posts = await fetchRedditPosts(subreddit);
  const relevantPosts = posts.filter(isRelevantPost);
  
  console.log(`[Reddit] Found ${relevantPosts.length} relevant posts out of ${posts.length}`);
  
  let processed = 0;
  let skipped = 0;
  
  for (const post of relevantPosts) {
    // Check if already processed
    if (await isProcessed(post.id)) {
      skipped++;
      continue;
    }
    
    try {
      // Process the post
      console.log(`[Reddit] Processing: "${post.title.substring(0, 60)}..."`);
      
      const result = await processRedditPost(post);
      
      if (result && result.id) {
        processed++;
        console.log(`[Reddit] ✓ Created valuation: /value/${result.slug}`);
        
        // Optional: Reply to the post (requires OAuth)
        // For now, just log what we would reply
        console.log(`[Reddit] Would reply: "Hi! I analyzed your item and created a valuation page: https://flippi.ai/value/${result.slug}"`);
      }
      
      // Rate limit: wait 2 seconds between processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error(`[Reddit] Error processing post ${post.id}:`, error.message);
    }
  }
  
  console.log(`[Reddit] Processed ${processed} new posts, skipped ${skipped} existing`);
  return { processed, skipped };
}

// Main automation loop
async function runRedditAutomation() {
  console.log('\n=== Starting Reddit Automation ===');
  console.log('Time:', new Date().toISOString());
  
  const stats = {
    total_processed: 0,
    total_skipped: 0,
    subreddits: {}
  };
  
  // Process each subreddit
  for (const subreddit of SUBREDDITS) {
    try {
      const result = await processSubreddit(subreddit);
      stats.subreddits[subreddit] = result;
      stats.total_processed += result.processed;
      stats.total_skipped += result.skipped;
      
      // Wait between subreddits
      await new Promise(resolve => setTimeout(resolve, 5000));
      
    } catch (error) {
      console.error(`[Reddit] Failed to process r/${subreddit}:`, error);
      stats.subreddits[subreddit] = { error: error.message };
    }
  }
  
  // Log summary
  console.log('\n=== Reddit Automation Complete ===');
  console.log(`Total processed: ${stats.total_processed}`);
  console.log(`Total skipped: ${stats.total_skipped}`);
  console.log('Details:', JSON.stringify(stats.subreddits, null, 2));
  
  return stats;
}

// Run automation on a schedule
function startAutomation(intervalMinutes = 30) {
  console.log(`[Reddit] Starting automation with ${intervalMinutes} minute interval`);
  
  // Run immediately
  runRedditAutomation();
  
  // Then run on interval
  setInterval(() => {
    runRedditAutomation();
  }, intervalMinutes * 60 * 1000);
}

// Export functions
module.exports = {
  runRedditAutomation,
  startAutomation,
  processSubreddit,
  fetchRedditPosts
};