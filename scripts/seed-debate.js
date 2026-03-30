const Anthropic = require('@anthropic-ai/sdk')
const fs = require('fs')
const path = require('path')

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
})

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = 
  process.env.SUPABASE_SERVICE_ROLE_KEY
const APP_URL = process.env.APP_URL || 
  'https://feed.creedom.ai'

const PROBLEMS_FILE = path.join(
  __dirname, '..', 'problems.json'
)

async function supabaseQuery(
  endpoint, 
  method = 'GET', 
  body = null
) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Prefer': method === 'POST' 
        ? 'return=representation' : ''
    }
  }
  if (body) options.body = JSON.stringify(body)
  
  const fetch = (await import('node-fetch')).default
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/${endpoint}`,
    options
  )
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
        'x-service-role': SUPABASE_SERVICE_KEY
      },
      body: JSON.stringify({
        rawSubmission: problem.raw_submission,
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
          'x-service-role': SUPABASE_SERVICE_KEY
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
          'x-service-role': SUPABASE_SERVICE_KEY
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

  const unposted = problems.filter(
    p => !p.posted
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
