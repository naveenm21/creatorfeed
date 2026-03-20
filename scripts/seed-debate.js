const fetch = (...args) => 
  import('node-fetch')
    .then(({default: fetch}) => fetch(...args))

const Anthropic = require('@anthropic-ai/sdk')
const fs = require('fs')
const path = require('path')

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
})

const APP_URL = process.env.APP_URL || 
  'https://feed.creedom.ai'

const PROBLEMS_FILE = path.join(
  __dirname, '..', 'problems.json'
)

async function generateAnswers(
  rawSubmission, 
  questions
) {
  const answers = []
  
  for (const question of questions) {
    if (question.question_type === 'multiple_choice' 
      && question.options?.length > 0) {
      
      const message = await anthropic.messages.create({
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
      
      const answer = message.content[0].text.trim()
      const matchedOption = question.options.find(
        opt => answer.toLowerCase()
          .includes(opt.toLowerCase())
      ) || question.options[0]
      
      answers.push({
        question_order: question.question_order,
        answer: matchedOption
      })
      
    } else {
      
      const message = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        messages: [{
          role: 'user',
          content: `Given this creator problem:
"${rawSubmission}"

Answer this intake question in 2-3 specific 
sentences. Be realistic and specific to 
the problem described. Do not be generic.

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
  console.log(`Submitting problem ${problem.id}: 
    ${problem.raw_submission.substring(0, 60)}...`)
  
  const intakeResponse = await fetch(
    `${APP_URL}/api/intake`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rawSubmission: problem.raw_submission,
        userId: null
      })
    }
  )
  
  if (!intakeResponse.ok) {
    throw new Error(
      `Intake failed: ${intakeResponse.status}`
    )
  }
  
  const intakeData = await intakeResponse.json()
  console.log(`Thread created: ${intakeData.threadId}`)
  console.log(`Questions: ${intakeData.questions?.length || 0}`)
  
  if (intakeData.needsQuestions && 
      intakeData.questions?.length > 0) {
    
    console.log('Generating answers with Claude Haiku...')
    const answers = await generateAnswers(
      problem.raw_submission,
      intakeData.questions
    )
    
    const answersResponse = await fetch(
      `${APP_URL}/api/intake/answers`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId: intakeData.threadId,
          answers
        })
      }
    )
    
    if (!answersResponse.ok) {
      throw new Error(
        `Answers failed: ${answersResponse.status}`
      )
    }
    
    console.log('Answers submitted. Debate triggered.')
    
  } else {
    await fetch(
      `${APP_URL}/api/debate`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
  
  const unposted = problems.filter(p => !p.posted)
  
  if (unposted.length === 0) {
    console.log('All problems have been posted.')
    return
  }
  
  console.log(`${unposted.length} problems remaining.`)
  console.log(`Posting ${batchSize} problem(s) now.`)
  
  const batch = unposted.slice(0, batchSize)
  
  for (const problem of batch) {
    try {
      const threadId = await submitProblem(problem)
      
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
        `Problem ${problem.id} posted successfully.`
      )
      
      if (batch.indexOf(problem) < batch.length - 1) {
        console.log('Waiting 30 seconds before next...')
        await new Promise(r => setTimeout(r, 30000))
      }
      
    } catch (error) {
      console.error(
        `Failed to post problem ${problem.id}:`, 
        error.message
      )
    }
  }
  
  const remaining = problems.filter(p => !p.posted)
  console.log(
    `Done. ${remaining.length} problems remaining.`
  )
}

main().catch(console.error)
