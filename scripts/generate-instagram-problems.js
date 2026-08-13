require('dotenv').config({ path: '.env.local' });
const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');


const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function generateProblems() {
  const problemsFile = path.join(__dirname, '..', 'problems.json');
  let existingProblems = [];
  
  if (fs.existsSync(problemsFile)) {
    existingProblems = JSON.parse(fs.readFileSync(problemsFile, 'utf8'));
  }

  const newProblems = [];
  console.log('Starting to generate 100 highly specific, unsearchable Instagram problems...');

  // 5 batches of 20
  for (let i = 0; i < 5; i++) {
    console.log(`Generating batch ${i + 1}/5...`);
    
    try {
      const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4000,
        temperature: 0.9,
        messages: [{
          role: 'user',
          content: `Generate 20 unique, highly specific, and unsearchable problems that an Instagram creator might face. 
These should be things that are NOT commonly searched on Google. Avoid generic problems like "how to get more followers" or "why are my reels not getting views". 

Examples of unsearchable, highly specific problems:
- "My Story views drop by 80% specifically on days when I post a 'Questions' sticker after a 'Poll' sticker, but not the other way around. My audience is 60k but my sticker sequence kills my entire 24h story reach."
- "A brand deal is demanding I archive my best performing reel because it features a competitor's product in the deep background for 2 seconds, but archiving it will ruin my current algorithmic momentum on a 30-day streak."
- "I'm a fitness creator (120k) and whenever I post form-correction videos, my 'Saves' go through the roof but the algorithm doesn't push it to the explore page because the initial 'Watch Time' is low since people just save it and leave immediately."
- "I run a local restaurant review page. I've noticed that tagging the actual location of the restaurant reduces my reach compared to tagging the broader city. If I tag the restaurant, I get 500 views, if I tag the city, I get 15k, but the restaurants are getting angry I'm not tagging their specific geo-location."

Output ONLY a raw JSON array of objects with the following schema:
[
  { 
    "raw_submission": "The problem description in first person, 2-5 sentences", 
    "platform": "Instagram", 
    "follower_range": "Pick randomly from 1K-10K, 10K-100K, 100K-1M, 1M+", 
    "category": "Pick randomly from: reach, monetization, community, burnout, plateau" 
  }
]

Do not include any markdown formatting, just the JSON.`
        }]
      });

      let text = response.content[0].text.trim();
      
      // Clean up markdown block if present
      if (text.startsWith('```json')) {
        text = text.replace(/^```json\n/, '').replace(/\n```$/, '');
      } else if (text.startsWith('```')) {
        text = text.replace(/^```\n/, '').replace(/\n```$/, '');
      }
      
      const batch = JSON.parse(text);
      newProblems.push(...batch);
      
      console.log(`Successfully parsed ${batch.length} problems for batch ${i + 1}`);
      
    } catch (error) {
      console.error(`Error generating batch ${i + 1}:`, error.message);
    }
  }

  console.log(`Generated a total of ${newProblems.length} problems.`);

  // Append new problems to existing ones, calculating IDs correctly
  let maxId = 0;
  existingProblems.forEach(p => {
    if (p.id > maxId) maxId = p.id;
  });

  const finalProblems = newProblems.map((p, index) => ({
    id: maxId + index + 1,
    raw_submission: p.raw_submission,
    platform: p.platform || 'Instagram',
    follower_range: p.follower_range,
    category: p.category,
    posted: false,
    posted_at: null,
    thread_id: null
  }));

  const allProblems = [...existingProblems, ...finalProblems];

  fs.writeFileSync(problemsFile, JSON.stringify(allProblems, null, 2));
  console.log(`Saved ${finalProblems.length} new problems to problems.json! You can now seed them using seed-debate.js`);
}

generateProblems();
