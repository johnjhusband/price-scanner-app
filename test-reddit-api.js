const fetch = require('node-fetch');

async function testRedditAPI() {
  try {
    console.log('Testing Reddit API...');
    
    const url = 'https://www.reddit.com/r/ThriftStoreHauls/new.json?limit=5';
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
      console.log(`URL: ${postData.url}`);
      console.log(`Thumbnail: ${postData.thumbnail}`);
      console.log(`Preview: ${postData.preview ? 'Yes' : 'No'}`);
      console.log(`Media Metadata: ${postData.media_metadata ? 'Yes' : 'No'}`);
      
      // Check if it's an image post
      const isImage = postData.url && /\.(jpg|jpeg|png|gif|webp)$/i.test(postData.url);
      console.log(`Is Image URL: ${isImage}`);
      
      if (postData.preview && postData.preview.images) {
        console.log(`Preview images: ${postData.preview.images.length}`);
        if (postData.preview.images[0]) {
          console.log(`Preview source: ${postData.preview.images[0].source?.url}`);
        }
      }
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testRedditAPI();
