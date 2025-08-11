const { getDatabase } = require('../database');
const { processRedditPost } = require('../services/valuationService');
const { generateSlug } = require('../database/valuationSchema');

// Reddit JSON API (no auth required)
const SUBREDDITS = [
  // Primary targets
  'ThriftStoreHauls',
  'whatsthisworth',
  'vintage',
  'Antiques',
  'Flipping',
  // Additional sources
  'GoodwillFinds',
  'DumpsterDiving',
  'yardsale',
  'estatesales',
  'AskCollectors'
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
    const url = `https://www.reddit.com/r/${subreddit}/new.json?limit=${limit}&raw_json=1`;
    
    console.log(`[Reddit] Fetching from r/${subreddit}...`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
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

// Process a single subreddit with retry logic
async function processSubreddit(subreddit, retries = 3) {
  console.log(`\n[Reddit] Processing r/${subreddit}...`);
  
  let posts = [];
  let attempt = 0;
  
  // Retry fetching posts if needed
  while (attempt < retries && posts.length === 0) {
    posts = await fetchRedditPosts(subreddit);
    if (posts.length === 0) {
      attempt++;
      if (attempt < retries) {
        console.log(`[Reddit] No posts fetched, retrying in ${attempt * 5} seconds...`);
        await new Promise(resolve => setTimeout(resolve, attempt * 5000));
      }
    }
  }
  
  const relevantPosts = posts.filter(isRelevantPost);
  
  console.log(`[Reddit] Found ${relevantPosts.length} relevant posts out of ${posts.length}`);
  
  let processed = 0;
  let skipped = 0;
  let errors = 0;
  const errorDetails = [];
  
  for (const post of relevantPosts) {
    // Check if already processed
    if (await isProcessed(post.id)) {
      skipped++;
      continue;
    }
    
    let processAttempt = 0;
    let success = false;
    
    // Retry processing with exponential backoff
    while (processAttempt < 2 && !success) {
      try {
        // Process the post
        console.log(`[Reddit] Processing: "${post.title.substring(0, 60)}..."`);
        
        const result = await processRedditPost(post);
        
        if (result && result.id) {
          processed++;
          success = true;
          console.log(`[Reddit] ✓ Created valuation: /value/${result.slug}`);
          
          // Track successful processing
          trackProcessingSuccess(post, result);
        }
        
        // Rate limit: wait 2 seconds between processing
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        processAttempt++;
        console.error(`[Reddit] Error processing post ${post.id} (attempt ${processAttempt}):`, error.message);
        
        if (processAttempt < 2) {
          // Wait before retry with exponential backoff
          await new Promise(resolve => setTimeout(resolve, processAttempt * 3000));
        } else {
          errors++;
          errorDetails.push({
            post_id: post.id,
            title: post.title.substring(0, 60),
            error: error.message
          });
        }
      }
    }
  }
  
  console.log(`[Reddit] Processed ${processed} new posts, skipped ${skipped} existing, ${errors} errors`);
  return { processed, skipped, errors, errorDetails };
}

// Track successful processing for analytics
function trackProcessingSuccess(post, result) {
  try {
    const db = getDatabase();
    
    // Store processing metadata
    db.prepare(`
      INSERT OR IGNORE INTO reddit_questions (
        post_id, subreddit, title, author, 
        valuation_id, processed_at
      ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(
      post.id,
      post.subreddit,
      post.title.substring(0, 200),
      post.author,
      result.id
    );
  } catch (error) {
    console.error('[Reddit] Error tracking success:', error.message);
  }
}

// Main automation loop with enhanced error handling
async function runRedditAutomation() {
  console.log('\n=== Starting Reddit Automation ===');
  console.log('Time:', new Date().toISOString());
  
  const stats = {
    total_processed: 0,
    total_skipped: 0,
    total_errors: 0,
    subreddits: {},
    start_time: new Date().toISOString(),
    end_time: null,
    duration_seconds: 0
  };
  
  const startTime = Date.now();
  
  // Process each subreddit
  for (const subreddit of SUBREDDITS) {
    try {
      const result = await processSubreddit(subreddit);
      stats.subreddits[subreddit] = result;
      stats.total_processed += result.processed;
      stats.total_skipped += result.skipped;
      stats.total_errors += result.errors || 0;
      
      // Log any errors for review
      if (result.errorDetails && result.errorDetails.length > 0) {
        console.log(`[Reddit] Errors in r/${subreddit}:`, result.errorDetails);
        storeErrorsForReview(subreddit, result.errorDetails);
      }
      
      // Wait between subreddits
      await new Promise(resolve => setTimeout(resolve, 5000));
      
    } catch (error) {
      console.error(`[Reddit] Failed to process r/${subreddit}:`, error);
      stats.subreddits[subreddit] = { 
        error: error.message,
        processed: 0,
        skipped: 0,
        errors: 1
      };
      stats.total_errors++;
    }
  }
  
  // Calculate duration
  const endTime = Date.now();
  stats.end_time = new Date().toISOString();
  stats.duration_seconds = Math.round((endTime - startTime) / 1000);
  
  // Store run statistics
  storeRunStatistics(stats);
  
  // Log summary
  console.log('\n=== Reddit Automation Complete ===');
  console.log(`Duration: ${stats.duration_seconds} seconds`);
  console.log(`Total processed: ${stats.total_processed}`);
  console.log(`Total skipped: ${stats.total_skipped}`);
  console.log(`Total errors: ${stats.total_errors}`);
  console.log('Details:', JSON.stringify(stats.subreddits, null, 2));
  
  return stats;
}

// Store errors for manual review
function storeErrorsForReview(subreddit, errorDetails) {
  try {
    const db = getDatabase();
    
    errorDetails.forEach(error => {
      db.prepare(`
        INSERT INTO automation_errors (
          subreddit, post_id, title, error_message, created_at
        ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(
        subreddit,
        error.post_id,
        error.title,
        error.error
      );
    });
  } catch (dbError) {
    console.error('[Reddit] Error storing errors:', dbError.message);
  }
}

// Store run statistics for monitoring
function storeRunStatistics(stats) {
  try {
    const db = getDatabase();
    
    db.prepare(`
      INSERT INTO automation_runs (
        start_time, end_time, duration_seconds,
        total_processed, total_skipped, total_errors,
        stats_json, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(
      stats.start_time,
      stats.end_time,
      stats.duration_seconds,
      stats.total_processed,
      stats.total_skipped,
      stats.total_errors,
      JSON.stringify(stats)
    );
  } catch (dbError) {
    console.error('[Reddit] Error storing run stats:', dbError.message);
  }
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