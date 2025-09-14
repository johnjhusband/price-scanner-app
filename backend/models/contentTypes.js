/**
 * Content Type Definitions for Growth Analytics
 * Issue #150: Clear content definition for analytics
 */

const CONTENT_TYPES = {
  BLOG_POST: {
    id: 'blog_post',
    name: 'Blog Post',
    description: 'Long-form educational content about flipping strategies',
    icon: '📝',
    metrics: ['views', 'read_time', 'shares', 'comments']
  },
  SOCIAL_POST: {
    id: 'social_post', 
    name: 'Social Media Post',
    description: 'Short-form content for social platforms',
    icon: '📱',
    subtypes: {
      TWITTER: 'Twitter/X post',
      INSTAGRAM: 'Instagram post/story',
      FACEBOOK: 'Facebook post',
      TIKTOK: 'TikTok video script',
      REDDIT: 'Reddit post/comment'
    },
    metrics: ['impressions', 'engagements', 'shares', 'clicks']
  },
  MARKETPLACE_LISTING: {
    id: 'marketplace_listing',
    name: 'Marketplace Listing',
    description: 'Product listings for selling platforms',
    icon: '🛍️',
    subtypes: {
      WHATNOT: 'Whatnot listing',
      EBAY: 'eBay listing',
      MERCARI: 'Mercari listing',
      POSHMARK: 'Poshmark listing',
      DEPOP: 'Depop listing'
    },
    metrics: ['views', 'saves', 'offers', 'sold']
  },
  EMAIL_CAMPAIGN: {
    id: 'email_campaign',
    name: 'Email Campaign',
    description: 'Email marketing content',
    icon: '✉️',
    metrics: ['opens', 'clicks', 'conversions', 'unsubscribes']
  },
  VIDEO_CONTENT: {
    id: 'video_content',
    name: 'Video Content',
    description: 'Video tutorials and demonstrations',
    icon: '🎥',
    subtypes: {
      YOUTUBE: 'YouTube video',
      TIKTOK: 'TikTok video',
      INSTAGRAM_REEL: 'Instagram Reel',
      YOUTUBE_SHORT: 'YouTube Short'
    },
    metrics: ['views', 'watch_time', 'likes', 'comments', 'shares']
  },
  GUIDE_TUTORIAL: {
    id: 'guide_tutorial',
    name: 'Guide/Tutorial',
    description: 'Step-by-step educational content',
    icon: '📚',
    metrics: ['views', 'completion_rate', 'bookmarks', 'shares']
  },
  QUESTION_ANSWER: {
    id: 'question_answer',
    name: 'Q&A Content',
    description: 'Answers to community questions',
    icon: '❓',
    metrics: ['views', 'helpful_votes', 'shares', 'follow_ups']
  }
};

// Content categorization helper
const categorizeContent = (content) => {
  // Auto-categorize based on content properties
  if (content.platform) {
    const platform = content.platform.toLowerCase();
    
    // Social platforms
    if (['twitter', 'x', 'instagram', 'facebook', 'tiktok', 'reddit'].includes(platform)) {
      return CONTENT_TYPES.SOCIAL_POST.id;
    }
    
    // Marketplace platforms
    if (['whatnot', 'ebay', 'mercari', 'poshmark', 'depop'].includes(platform)) {
      return CONTENT_TYPES.MARKETPLACE_LISTING.id;
    }
    
    // Video platforms
    if (['youtube', 'vimeo'].includes(platform)) {
      return CONTENT_TYPES.VIDEO_CONTENT.id;
    }
  }
  
  // Check content length for blog posts
  if (content.content && content.content.length > 1000) {
    return CONTENT_TYPES.BLOG_POST.id;
  }
  
  // Check for question patterns
  if (content.title && content.title.includes('?')) {
    return CONTENT_TYPES.QUESTION_ANSWER.id;
  }
  
  // Default to social post
  return CONTENT_TYPES.SOCIAL_POST.id;
};

// Get metrics for a content type
const getMetricsForType = (contentTypeId) => {
  const type = Object.values(CONTENT_TYPES).find(t => t.id === contentTypeId);
  return type ? type.metrics : ['views', 'clicks', 'shares'];
};

// Get all content types for dropdown/selection
const getAllContentTypes = () => {
  return Object.values(CONTENT_TYPES).map(type => ({
    id: type.id,
    name: type.name,
    description: type.description,
    icon: type.icon,
    subtypes: type.subtypes || null
  }));
};

module.exports = {
  CONTENT_TYPES,
  categorizeContent,
  getMetricsForType,
  getAllContentTypes
};