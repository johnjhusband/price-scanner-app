const fetch = require('node-fetch');

// Copy the image extraction logic from redditMonitor.js
function extractImage(post) {
  // Check for direct image URL
  if (post.url && isImageUrl(post.url)) {
    return {
      url: post.url,
      thumbnail: post.thumbnail || null,
      source: 'reddit'
    };
  }
  
  // Check preview images
  if (post.preview && post.preview.images && post.preview.images.length > 0) {
    const image = post.preview.images[0];
    return {
      url: decodeHtmlEntities(image.source.url),
      thumbnail: image.resolutions?.[0]?.url ? decodeHtmlEntities(image.resolutions[0].url) : null,
      source: 'reddit'
    };
  }
  
  // Check media metadata
  if (post.media_metadata) {
    const firstKey = Object.keys(post.media_metadata)[0];
    if (firstKey && post.media_metadata[firstKey].s) {
      return {
        url: decodeHtmlEntities(post.media_metadata[firstKey].s.u),
        thumbnail: post.media_metadata[firstKey].p?.[0]?.u || null,
        source: 'reddit'
      };
    }
  }
  
  // No image found
  return {
    url: null,
    thumbnail: null,
    source: 'none'
  };
}

function isImageUrl(url) {
  return /\.(jpg|jpeg|png|gif|webp)$/i.test(url) || 
         url.includes('i.redd.it') || 
         url.includes('imgur.com');
}

function decodeHtmlEntities(text) {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");
}

async function testImageExtraction() {
  try {
    console.log('Testing image extraction...');
    
    const url = 'https://www.reddit.com/r/ThriftStoreHauls/new.json?limit=3';
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'FlippiBot/1.0 (price scanner research)'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Reddit API error: ${response.status}`);
    }
    
    const data = await response.json();
    const posts = data.data.children;
    
    console.log(`Found ${posts.length} posts`);
    
    posts.forEach((post, index) => {
      const postData = post.data;
      console.log(`\n--- Post ${index + 1} ---`);
      console.log(`Title: ${postData.title}`);
      console.log(`Original URL: ${postData.url}`);
      
      const imageData = extractImage(postData);
      console.log(`Extracted Image URL: ${imageData.url || 'None'}`);
      console.log(`Extracted Thumbnail: ${imageData.thumbnail || 'None'}`);
      console.log(`Source: ${imageData.source}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testImageExtraction();
