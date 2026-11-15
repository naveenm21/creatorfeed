const Anthropic = require('@anthropic-ai/sdk')
const fs = require('fs')
const path = require('path')

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
})

// Internal API key: authorizes calls to /api/intake, /api/debate and /api/internal/*
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY
const APP_URL = process.env.APP_URL || 
  'https://feed.creedom.ai'

const PROBLEMS_FILE = path.join(
  __dirname, '..', 'problems.json'
)

async function internalApi(apiPath, method = 'GET', body = null) {
  const fetch = (await import('node-fetch')).default
  const response = await fetch(`${APP_URL}${apiPath}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${INTERNAL_API_KEY}`
    },
    body: body ? JSON.stringify(body) : undefined
  })
  if (!response.ok) {
    throw new Error(`${method} ${apiPath} failed: ${response.status}`)
  }
  return response.json()
}

async function generateAnswers(
  rawSubmission,
  questions
) {
  const answers = []

  for (const question of questions) {
    if (question.question_type === 
        'multiple_choice' && 
        question.options?.length > 0) {

      const message = await anthropic
        .messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 100,
          messages: [{
            role: 'user',
            content: `Given this creator problem:
"${rawSubmission}"

For this multiple choice question:
"${question.question_text}"

Options: ${question.options.join(', ')}

Reply with ONLY the exact text of the 
most appropriate option. Nothing else.`
          }]
        })

      const answer = 
        message.content[0].text.trim()
      const matchedOption = 
        question.options.find(opt =>
          answer.toLowerCase()
            .includes(opt.toLowerCase())
        ) || question.options[0]

      answers.push({
        question_order: question.question_order,
        answer: matchedOption
      })

    } else {

      const message = await anthropic
        .messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 200,
          messages: [{
            role: 'user',
            content: `Given this creator problem:
"${rawSubmission}"

Answer this intake question in 2-3 specific 
sentences. Be realistic and specific.

Question: "${question.question_text}"

Reply with only the answer. No preamble.`
          }]
        })

      answers.push({
        question_order: question.question_order,
        answer: message.content[0].text.trim()
      })
    }
  }

  return answers
}

async function submitProblem(problem) {
  console.log(
    `Submitting problem ${problem.id}...`
  )

  const fetch = (await import('node-fetch')).default

  // Step 1: Call intake API with 
  // service role header
  const intakeRes = await fetch(
    `${APP_URL}/api/intake`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${INTERNAL_API_KEY}`
      },
      body: JSON.stringify({
        rawSubmission: problem.raw_submission,
        platform: problem.platform,
        followerRange: problem.follower_range,
        userId: null,
        isSeeded: true
      })
    }
  )

  if (!intakeRes.ok) {
    throw new Error(
      `Intake failed: ${intakeRes.status}`
    )
  }

  const intakeData = await intakeRes.json()
  console.log(`Thread: ${intakeData.threadId}`)
  console.log(
    `Questions: ${intakeData.questions?.length}`
  )

  if (intakeData.needsQuestions &&
      intakeData.questions?.length > 0) {

    console.log('Generating answers...')
    const answers = await generateAnswers(
      problem.raw_submission,
      intakeData.questions
    )

    // Step 2: Submit answers with 
    // service role header
    const answersRes = await fetch(
      `${APP_URL}/api/intake/answers`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${INTERNAL_API_KEY}`
        },
        body: JSON.stringify({
          threadId: intakeData.threadId,
          answers,
          isSeeded: true
        })
      }
    )

    if (!answersRes.ok) {
      throw new Error(
        `Answers failed: ${answersRes.status}`
      )
    }

    console.log('Debate triggered.')

  } else {
    await fetch(
      `${APP_URL}/api/debate`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${INTERNAL_API_KEY}`
        },
        body: JSON.stringify({
          threadId: intakeData.threadId
        })
      }
    )
    console.log('Debate triggered directly.')
  }

  return intakeData.threadId
}

async function main() {
  const batchSize = parseInt(
    process.env.BATCH_SIZE || '1'
  )

  const problems = JSON.parse(
    fs.readFileSync(PROBLEMS_FILE, 'utf8')
  )

  console.log('Syncing with remote database to prevent duplicate seeding...')
  let existingSubmissions = new Set()
  try {
    const { submissions } = await internalApi('/api/internal/submissions')
    if (Array.isArray(submissions)) {
      submissions.forEach(text => {
        if (text) existingSubmissions.add(text)
      })
      console.log(`Found ${existingSubmissions.size} existing threads in DB.`)
    }
  } catch (err) {
    console.warn('Failed to query existing threads from DB. Seeding may produce duplicates if git push fails.', err.message)
  }

  // Auto-sync local problems.json with DB
  let syncCount = 0
  problems.forEach(p => {
    if (!p.posted && existingSubmissions.has(p.raw_submission)) {
      p.posted = true
      p.posted_at = p.posted_at || new Date().toISOString()
      syncCount++
    }
  })

  if (syncCount > 0) {
    fs.writeFileSync(
      PROBLEMS_FILE,
      JSON.stringify(problems, null, 2)
    )
    console.log(`Sync complete: Marked ${syncCount} already-inserted problems as posted in problems.json.`)
  }

  const unposted = problems.filter(
    p => !p.posted && !existingSubmissions.has(p.raw_submission)
  )

  if (unposted.length === 0) {
    console.log('All problems posted.')
    return
  }

  console.log(
    `${unposted.length} remaining. ` +
    `Posting ${batchSize} now.`
  )

  const batch = unposted.slice(0, batchSize)

  for (const problem of batch) {
    try {
      const threadId = 
        await submitProblem(problem)

      const index = problems.findIndex(
        p => p.id === problem.id
      )
      problems[index].posted = true
      problems[index].posted_at = 
        new Date().toISOString()
      problems[index].thread_id = threadId

      fs.writeFileSync(
        PROBLEMS_FILE,
        JSON.stringify(problems, null, 2)
      )

      console.log(
        `Problem ${problem.id} done.`
      )

      if (batch.indexOf(problem) < 
          batch.length - 1) {
        await new Promise(
          r => setTimeout(r, 30000)
        )
      }

    } catch (error) {
      console.error(
        `Failed ${problem.id}:`,
        error.message
      )
    }
  }
}

main().catch(console.error)
