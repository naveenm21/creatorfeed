// Using rss2json API to bypass Reddit's datacenter IP bans
require('dotenv').config({ path: '.env.local' });

// We use the same environment variables as Next.js
// Internal API key: authorizes calls to /api/intake, /api/debate and /api/internal/*
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

const SUBREDDITS = [
  'NewTubers',
  'PartneredYoutube',
  'youtubers',
  'TikTok',
  'InstagramMarketing',
  'Instagram'
];

const DAILY_LIMIT = 10;
const MIN_WORDS = 50;

// Helper to strip HTML tags from Reddit's RSS content
function stripHtml(html) {
  if (!html) return '';
  // Reddit RSS content is often wrapped in CDATA or escaped HTML
  // Replace <br> and <p> with newlines for readable formatting
  let text = html.replace(/<br\s*[\/]?>/gi, '\n');
  text = text.replace(/<\/p>/gi, '\n\n');
  // Remove all other HTML tags
  text = text.replace(/<[^>]+>/g, '');
  // Decode HTML entities
  text = text.replace(/&amp;/g, '&')
             .replace(/&lt;/g, '<')
             .replace(/&gt;/g, '>')
             .replace(/&quot;/g, '"')
             .replace(/&#39;/g, "'")
             .replace(/&nbsp;/g, ' ')
             .replace(/&#32;/g, ' ')
             .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); // Strip markdown links
             
  // Remove Reddit RSS signature footer to hide scraping source
  text = text.replace(/\s*submitted by\s+\/?u\/[\s\S]*$/gi, '');
  text = text.replace(/\s*\[link\]\s*\[comments\]\s*$/gi, '');
  text = text.replace(/\[link\]/gi, '');
  text = text.replace(/\[comments\]/gi, '');
  
  // Scrub any remaining Reddit username mentions in the body
  text = text.replace(/\b\/?u\/[a-zA-Z0-9_-]+\b/gi, '[user]');
             
  return text.trim();
}

async function internalApi(apiPath, method = 'GET', body = null) {
  const fetch = (await import('node-fetch')).default;
  const response = await fetch(`${API_BASE_URL}${apiPath}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${INTERNAL_API_KEY}`
    },
    body: body ? JSON.stringify(body) : undefined
  });
  if (!response.ok) {
    throw new Error(`${method} ${apiPath} failed: ${response.status} ${await response.text()}`);
  }
  return response.json();
}

async function main() {
  console.log(`Starting Auto-Pilot Scraper at ${new Date().toISOString()}`);

  if (!INTERNAL_API_KEY) {
    console.error("Missing INTERNAL_API_KEY in environment.");
    process.exit(1);
  }

  // 1. Fetch existing threads to prevent duplicates
  console.log('Fetching existing threads to prevent duplicates...');
  const { submissions } = await internalApi('/api/internal/submissions');
  const existingSubmissions = new Set();
  if (Array.isArray(submissions)) {
    submissions.forEach(text => {
      if (text) existingSubmissions.add(text);
    });
  }
  console.log(`Found ${existingSubmissions.size} existing threads in DB.`);

  // 2. Fetch RSS feeds
  let allCandidates = [];
  const Parser = require('rss-parser');
  const parser = new Parser({
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });

  for (const subreddit of SUBREDDITS) {
    console.log(`Fetching RSS for r/${subreddit}...`);
    try {
      // Use rss-parser with a valid User-Agent to fetch Reddit RSS natively
      const feed = await parser.parseURL(`https://www.reddit.com/r/${subreddit}/hot.rss`);
      
      for (const item of feed.items) {
        const rawContent = item.content || item.contentSnippet || '';
        const cleanText = stripHtml(rawContent);
        
        // Quality checks - dynamically adjust based on platform typical length
        let currentMinWords = MIN_WORDS; // Default 50 for YouTube
        const lowerSub = subreddit.toLowerCase();
        if (lowerSub.includes('tiktok') || lowerSub.includes('instagram')) {
          currentMinWords = 20; // Short-form platforms often have shorter text questions
        }
        
        const wordCount = cleanText.split(/\s+/).length;
        if (wordCount < currentMinWords) {
          continue; // Too short
        }

        // Check for duplicates
        if (existingSubmissions.has(cleanText)) {
          continue; // Already processed
        }

        allCandidates.push({
          title: item.title,
          content: cleanText,
          subreddit: subreddit,
          link: item.link
        });
      }
    } catch (error) {
      console.error(`Failed to fetch r/${subreddit}:`, error.message);
    }
    // Delay to avoid Reddit rate limits (429)
    await new Promise(r => setTimeout(r, 12000));
  }

  console.log(`Found ${allCandidates.length} high-quality candidate posts.`);

  if (allCandidates.length === 0) {
    console.log("No new candidates found. Exiting.");
    return;
  }

  // Group candidates by platform to ensure even distribution
  const platformGroups = {
    YouTube: [],
    TikTok: [],
    Instagram: []
  };

  for (const post of allCandidates) {
    let platform = 'YouTube';
    if (post.subreddit.toLowerCase().includes('tiktok')) platform = 'TikTok';
    if (post.subreddit.toLowerCase().includes('instagram')) platform = 'Instagram';
    
    platformGroups[platform].push(post);
  }

  // Shuffle each group
  for (const platform in platformGroups) {
    platformGroups[platform] = platformGroups[platform].sort(() => 0.5 - Math.random());
  }

  // Pick evenly from platforms until we hit DAILY_LIMIT
  const selectedPosts = [];
  const platforms = ['YouTube', 'TikTok', 'Instagram'];
  let i = 0;
  
  while (selectedPosts.length < DAILY_LIMIT && platforms.some(p => platformGroups[p].length > 0)) {
    const platform = platforms[i % platforms.length];
    if (platformGroups[platform].length > 0) {
      selectedPosts.push(platformGroups[platform].shift());
    }
    i++;
  }

  console.log(`Injecting ${selectedPosts.length} posts into the AI Intake Pipeline...`);

  const fetch = (await import('node-fetch')).default;

  // 3. Inject into the pipeline
  let successCount = 0;
  for (const post of selectedPosts) {
    console.log(`\nProcessing: [r/${post.subreddit}] ${post.title}`);
    
    // Determine platform tag
    let platform = 'YouTube';
    if (post.subreddit.toLowerCase().includes('tiktok')) platform = 'TikTok';
    if (post.subreddit.toLowerCase().includes('instagram')) platform = 'Instagram';

    try {
      // Call the Intake API
      const intakeRes = await fetch(`${API_BASE_URL}/api/intake`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${INTERNAL_API_KEY}`
        },
        body: JSON.stringify({
          rawSubmission: post.content,
          platform: platform,
          followerRange: '1K-10K', // Default guestimation for random posts
          sourceUrl: post.link,
          userId: null, // Anonymous / Automated
          isSeeded: true
        })
      });

      if (!intakeRes.ok) {
        const errorText = await intakeRes.text();
        console.error(`Intake API failed: ${intakeRes.status} - ${errorText}`);
        continue;
      }

      const intakeData = await intakeRes.json();
      console.log(`Generated Thread ID: ${intakeData.threadId}`);
      
      // Call the Debate generation endpoint directly
      console.log('Triggering AI Debate generation...');
      const debateRes = await fetch(`${API_BASE_URL}/api/debate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${INTERNAL_API_KEY}`
        },
        body: JSON.stringify({
          threadId: intakeData.threadId
        })
      });

      if (!debateRes.ok) {
        console.error(`Debate API failed: ${debateRes.status}`);
      } else {
        console.log('Debate successfully generated!');
        successCount++;

        // --- NEW: Hybrid Content Scraping (Comments) ---
        try {
          console.log('Fetching community comments for SEO hybrid content...');
          // we use rss2json for comments feed as well
          let commentFeedUrl = post.link.endsWith('/') ? post.link.slice(0, -1) + '.rss' : post.link + '/.rss';
          
          const cRes = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(commentFeedUrl)}`);
          const commentFeed = await cRes.json();
          
          if (commentFeed.status !== 'ok' || !commentFeed.items) {
            throw new Error(`rss2json comments failed: ${commentFeed.message || 'unknown error'}`);
          }
          
          // Item 0 is usually the post itself. Items 1+ are comments.
          let insertedComments = 0;
          for (let i = 1; i < commentFeed.items.length; i++) {
            if (insertedComments >= 2) break; // Top 2 comments only
            const cItem = commentFeed.items[i];
            const rawComment = cItem.content || cItem.description || '';
            const cleanComment = stripHtml(rawComment);
            
            // Skip AutoModerator or tiny comments
            if (cItem.author && cItem.author.includes('AutoModerator')) continue;
            if (cleanComment.split(' ').length < 10) continue;

            // Insert into human_replies directly
            await internalApi('/api/internal/replies', 'POST', {
              threadId: intakeData.threadId,
              authorName: "Community Perspective",
              replyText: cleanComment
            });
            console.log(`Injected human comment ${insertedComments + 1}/2`);
            insertedComments++;
          }
        } catch (commentErr) {
          console.error('Failed to scrape/inject comments:', commentErr.message);
        }
      }
      
      // Wait slightly between requests to not overload the AI or DB
      await new Promise(r => setTimeout(r, 10000));

    } catch (err) {
      console.error('Failed to process post:', err.message);
    }
  }

  console.log(`\nAuto-Pilot complete. Successfully injected ${successCount}/${selectedPosts.length} debates.`);
}

main().catch(console.error);
