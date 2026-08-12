const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

const PROBLEMS_FILE = path.join(__dirname, '..', 'problems.json');

async function generateBatch(startId, count) {
  const prompt = `Generate ${count} unique and realistic creator growth problems for a platform called CreatorFeed.
Each problem should represent a specific challenge an Instagram content creator faces in 2026.
Focus ONLY on these 5 themes:
1. The "Aggregator Penalty": Deprioritization of curation/meme accounts in favor of original creators.
2. Shift from Likes to "Sends/DMs" & Watch Time: Aesthetic posts failing, while relatable/shareable content thrives.
3. Content Fatigue vs. Authenticity: Audiences bored of aesthetic reels and trending audios, rewarding distinct points of view.
4. The High-Frequency Burnout Trap: The cycle of posting more to combat falling reach, leading to algorithmic penalties and burnout.
5. Community Management Overwhelm: Scaling DM and comment replies, which the algorithm now heavily weighs.

Niches: Tech, Beauty, Finance, Gaming, History, Cooking, Comedy, Politics, ASMR, Fitness, E-commerce, Education.
Follower ranges: 1K-10K, 10K-100K, 100K-1M, 1M+.
Categories: plateau, reach, viral, algorithm, monetization, pivot, community, burnout.

Platform Distribution Rules:
- 100% of the generated problems MUST have "Instagram" as the platform.
- The raw submission must be a unique, first-person detailed story (3-5 sentences) so it does not match existing internet searches.

Return ONLY a JSON array of objects with this schema:
{
  "id": number (starting from ${startId}),
  "raw_submission": "A detailed 3-5 sentence first-person description of the problem",
  "platform": "Instagram",
  "follower_range": "The follower range",
  "category": "The problem category",
  "posted": false,
  "posted_at": null
}

No preamble, no markdown formatting. Just the raw JSON.`;

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4000,
    messages: [{ role: 'user', content: prompt }]
  });

  const text = response.content[0].text.trim().replace(/```json\s*|\s*```/g, '');
  return JSON.parse(text);
}

async function main() {
  const currentProblems = JSON.parse(fs.readFileSync(PROBLEMS_FILE, 'utf8'));
  let nextId = currentProblems[currentProblems.length - 1].id + 1;
  const targetCount = currentProblems.length + 50;
  let generatedTotal = 0;
  const totalToGenerate = 50;

  console.log(`Starting generation from ID ${nextId} to reach ${targetCount} total problems...`);

  while (generatedTotal < totalToGenerate) {
    const batchSize = Math.min(20, totalToGenerate - generatedTotal);
    console.log(`Generating batch of ${batchSize}...`);
    
    try {
      const batch = await generateBatch(nextId, batchSize);
      currentProblems.push(...batch);
      nextId += batch.length; // use actual length in case AI gives fewer
      generatedTotal += batch.length;
      
      fs.writeFileSync(PROBLEMS_FILE, JSON.stringify(currentProblems, null, 2));
      console.log(`Progress: ${generatedTotal}/${totalToGenerate}`);
      
      // Delay to avoid rate limits
      await new Promise(r => setTimeout(r, 2000));
    } catch (error) {
      console.error('Batch failed:', error.message);
      // Wait longer on error
      await new Promise(r => setTimeout(r, 10000));
    }
  }

  console.log('Generation complete!');
}

main().catch(console.error);
