const Parser = require('rss-parser');
const parser = new Parser({
  customFields: {
    item: ['content'],
  }
});
require('dotenv').config({ path: '.env.local' });

// We use the same environment variables as Next.js
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const APP_URL = process.env.APP_URL || 'https://feed.creedom.ai'; // In production, this should point to localhost if running on same server, or the actual domain

const SUBREDDITS = [
  'NewTubers',
  'PartneredYoutube',
  'youtubers',
  'Tiktokhelp',
  'TikTokCreators',
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
             .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); // Strip markdown links
  return text.trim();
}

async function supabaseQuery(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
    }
  };
  if (body) options.body = JSON.stringify(body);
  
  const fetch = (await import('node-fetch')).default;
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, options);
  if (!response.ok) {
    throw new Error(`Supabase query failed: ${response.status} ${await response.text()}`);
  }
  return response.json();
}

async function main() {
  console.log(`Starting Auto-Pilot Scraper at ${new Date().toISOString()}`);

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error("Missing Supabase credentials in environment.");
    process.exit(1);
  }

  // 1. Fetch existing threads to prevent duplicates
  console.log('Fetching existing threads to prevent duplicates...');
  const existingThreads = await supabaseQuery('threads?select=raw_submission');
  const existingSubmissions = new Set();
  if (Array.isArray(existingThreads)) {
    existingThreads.forEach(r => {
      if (r.raw_submission) existingSubmissions.add(r.raw_submission);
    });
  }
  console.log(`Found ${existingSubmissions.size} existing threads in DB.`);

  // 2. Fetch RSS feeds
  let allCandidates = [];

  for (const subreddit of SUBREDDITS) {
    console.log(`Fetching RSS for r/${subreddit}...`);
    try {
      // Use a custom user agent to avoid Reddit blocking default node agents
      const feed = await parser.parseURL(`https://www.reddit.com/r/${subreddit}/hot/.rss`);
      
      for (const item of feed.items) {
        const rawContent = item.content || item.contentSnippet || '';
        const cleanText = stripHtml(rawContent);
        
        // Quality checks
        const wordCount = cleanText.split(/\s+/).length;
        if (wordCount < MIN_WORDS) {
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
  }

  console.log(`Found ${allCandidates.length} high-quality candidate posts.`);

  if (allCandidates.length === 0) {
    console.log("No new candidates found. Exiting.");
    return;
  }

  // Shuffle and pick the top N
  allCandidates = allCandidates.sort(() => 0.5 - Math.random());
  const selectedPosts = allCandidates.slice(0, DAILY_LIMIT);

  console.log(`Injecting ${selectedPosts.length} posts into the AI Intake Pipeline...`);

  const fetch = (await import('node-fetch')).default;

  // 3. Inject into the pipeline
  let successCount = 0;
  for (const post of selectedPosts) {
    console.log(`\nProcessing: [r/${post.subreddit}] ${post.title}`);
    
    // Determine platform tag
    let platform = 'youtube';
    if (post.subreddit.toLowerCase().includes('tiktok')) platform = 'tiktok';
    if (post.subreddit.toLowerCase().includes('instagram')) platform = 'instagram';

    try {
      // Call the Intake API
      const intakeRes = await fetch(`${APP_URL}/api/intake`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-service-role': SUPABASE_SERVICE_KEY
        },
        body: JSON.stringify({
          rawSubmission: post.content,
          platform: platform,
          followerRange: '1K-10K', // Default guestimation for random posts
          userId: null, // Anonymous / Automated
          isSeeded: true
        })
      });

      if (!intakeRes.ok) {
        console.error(`Intake API failed: ${intakeRes.status}`);
        continue;
      }

      const intakeData = await intakeRes.json();
      console.log(`Generated Thread ID: ${intakeData.threadId}`);
      
      // Call the Debate generation endpoint directly
      console.log('Triggering AI Debate generation...');
      const debateRes = await fetch(`${APP_URL}/api/debate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-service-role': SUPABASE_SERVICE_KEY
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
          // link is e.g. https://www.reddit.com/r/subreddit/comments/id/title/
          const commentFeedUrl = post.link.endsWith('/') ? post.link.slice(0, -1) + '.rss' : post.link + '/.rss';
          const commentFeed = await parser.parseURL(commentFeedUrl);
          
          // Item 0 is usually the post itself. Items 1+ are comments.
          let insertedComments = 0;
          for (let i = 1; i < commentFeed.items.length; i++) {
            if (insertedComments >= 2) break; // Top 2 comments only
            const cItem = commentFeed.items[i];
            const rawComment = cItem.content || cItem.contentSnippet || '';
            const cleanComment = stripHtml(rawComment);
            
            // Skip AutoModerator or tiny comments
            if (cItem.author && cItem.author.includes('AutoModerator')) continue;
            if (cleanComment.split(' ').length < 10) continue;

            // Insert into human_replies directly
            await supabaseQuery('human_replies', 'POST', {
              thread_id: intakeData.threadId,
              user_id: null,
              author_name: "Community Perspective",
              reply_text: cleanComment
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
