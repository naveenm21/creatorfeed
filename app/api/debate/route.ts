import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import Anthropic from '@anthropic-ai/sdk'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { 
  AGENT_PERSONAS,
  AGENT_EXPERTISE,
  AGENT_ROUTING,
  MODERATOR_PROMPT,
  VERDICT_PROMPT,
  ORCHESTRATOR_PROMPT,
  AgentName
} from '@/lib/agents'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
})

const HARD_CAP = 15

interface AgentResponseRecord {
  agentName: AgentName
  responseText: string
  position: string
  roundNumber: number
  responseOrder: number
}

function selectAgents(
  platform: string | null, 
  topic: string | null
): AgentName[] {
  const topicLower = (topic || '').toLowerCase()
  
  if (topicLower.includes('monetiz') || 
      topicLower.includes('brand deal') || 
      topicLower.includes('revenue') ||
      topicLower.includes('income')) {
    return AGENT_ROUTING['monetization']
  }
  
  if (platform && AGENT_ROUTING[platform]) {
    return AGENT_ROUTING[platform]
  }
  
  return AGENT_ROUTING['default']
}

function extractPosition(responseText: string): string {
  if (responseText.includes('[POSITION: agree]')) 
    return 'agree'
  if (responseText.includes('[POSITION: partial]')) 
    return 'partial'
  if (responseText.includes('[POSITION: disagree]')) 
    return 'disagree'
  return 'partial'
}

function cleanResponse(responseText: string): string {
  return responseText
    .replace(/\[POSITION: agree\]/g, '')
    .replace(/\[POSITION: partial\]/g, '')
    .replace(/\[POSITION: disagree\]/g, '')
    .trim()
}

async function runAgentResponse(
  agent: AgentName,
  persona: string,
  expertise: string,
  context: string,
  previousResponses: AgentResponseRecord[],
  roundNumber: number,
  responseOrder: number,
  threadId: string
): Promise<AgentResponseRecord> {
  const previousText = previousResponses.map(r =>
    `${r.agentName} (Round ${r.roundNumber}): ${r.responseText}`
  ).join('\n\n')

  const userMessage = `${context}

${previousText ? 
  `Previous agents have said:\n${previousText}\n\n
  React to what they said. Agree, disagree, 
  or add a new dimension they missed.` 
  : 'You are the first agent to respond.\nGive your initial analysis.'
}

This is Round ${roundNumber}. 
Be direct and specific.`

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 400,
    system: persona,
    messages: [{ role: 'user', content: userMessage }]
  })

  const rawText = message.content[0].type === 'text'
    ? message.content[0].text : ''
  
  const position = extractPosition(rawText)
  const responseText = cleanResponse(rawText)

  const { error: insertError } = await supabaseAdmin.from('agent_responses').insert({
    thread_id: threadId,
    agent_name: agent,
    expertise: expertise || 'Guest Specialist',
    response_text: responseText,
    round_number: roundNumber,
    response_order: responseOrder,
    position,
    is_final_position: false,
    agreed_count: 0,
    disagreed_count: 0
  })

  if (insertError) {
    console.error(`FAILED to insert response for ${agent}:`, insertError)
  }

  return { 
    agentName: agent, 
    responseText, 
    position, 
    roundNumber,
    responseOrder 
  }
}

async function checkConsensus(
  responses: AgentResponseRecord[],
  totalExchanges: number
): Promise<{
  consensus: string
  continueWith: AgentName[]
}> {
  if (totalExchanges >= HARD_CAP) {
    return { consensus: 'reached', continueWith: [] }
  }

  const positions = responses
    .filter(r => !r.responseText.includes('FINAL'))
    .slice(-6)
    .map(r => `${r.agentName}: ${r.responseText} 
      [Position: ${r.position}]`)
    .join('\n\n')

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 200,
    system: MODERATOR_PROMPT,
    messages: [{
      role: 'user',
      content: `Total exchanges so far: ${totalExchanges}
Hard cap: ${HARD_CAP}

Recent responses:
${positions}

Has consensus been reached?`
    }]
  })

  const rawText = message.content[0].type === 'text'
    ? message.content[0].text : '{}'

  try {
    const clean = rawText
      .replace(/```json\n?|\n?```/g, '')
      .trim()
    const result = JSON.parse(clean)
    return {
      consensus: result.consensus || 'none',
      continueWith: result.continue_with || []
    }
  } catch {
    return { consensus: 'none', continueWith: [] }
  }
}

async function collectFinalPositions(
  agents: AgentName[],
  personas: Record<string, string>,
  expertise: Record<string, string>,
  context: string,
  allResponses: AgentResponseRecord[],
  threadId: string
): Promise<string> {
  const finalPositions: string[] = []

  for (const agent of agents) {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 150,
      system: personas[agent],
      messages: [{ role: 'user', content: `${context}

After this full debate, give your FINAL position 
in ONE sentence. Be direct and specific.
What is your single most important recommendation?`
      }]
    })

    const finalText = message.content[0].type === 'text'
      ? message.content[0].text : ''

    finalPositions.push(`${agent}: ${finalText}`)

    await supabaseAdmin
      .from('agent_responses')
      .insert({
        thread_id: threadId,
        agent_name: agent,
        expertise: expertise[agent],
        response_text: finalText,
        round_number: 99,
        response_order: 99,
        position: 'agree',
        final_position: finalText,
        is_final_position: true,
        agreed_count: 0,
        disagreed_count: 0
      })
  }

  return finalPositions.join('\n')
}

async function generateVerdict(
  context: string,
  finalPositions: string,
  threadId: string,
  totalExchanges: number,
  totalRounds: number,
  consensusReached: boolean
): Promise<void> {
  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 500,
    system: VERDICT_PROMPT,
    messages: [{
      role: 'user',
      content: `${context}

Final positions from all agents:
${finalPositions}

Generate the verdict based on these final positions.`
    }]
  })

  const rawText = message.content[0].type === 'text'
    ? message.content[0].text : '{}'

  let verdictData
  try {
    const clean = rawText
      .replace(/```json\n?|\n?```/g, '')
      .trim()
    verdictData = JSON.parse(clean)
  } catch {
    verdictData = {
      verdict_text: rawText,
      key_takeaway_1: 'Focus on your specific platform',
      key_takeaway_2: 'Consistency matters more than volume',
      key_takeaway_3: 'Avoid copying strategies blindly'
    }
  }

  let finalVerdictText = verdictData.verdict_text || '';
  
  if (verdictData.disclaimer) {
    finalVerdictText += `\n\n${verdictData.disclaimer}`;
  }
  
  if (verdictData.reference_links && verdictData.reference_links.length > 0) {
    finalVerdictText += `\n\nReference Links:\n` + verdictData.reference_links.join('\n');
  }

  await supabaseAdmin.from('verdicts').insert({
    thread_id: threadId,
    verdict_text: finalVerdictText,
    key_takeaway_1: verdictData.key_takeaway_1,
    key_takeaway_2: verdictData.key_takeaway_2,
    key_takeaway_3: verdictData.key_takeaway_3,
    total_exchanges: totalExchanges,
    total_rounds: totalRounds,
    consensus_reached: consensusReached,
    forced_by_cap: totalExchanges >= HARD_CAP,
    community_agree_percent: 0
  })

  await supabaseAdmin
    .from('threads')
    .update({ status: 'published' })
    .eq('id', threadId)

  // Revalidate sitemap and homepage when a new debate is published
  revalidatePath('/sitemap.xml')
  revalidatePath('/')
  revalidatePath('/trending')
}

export async function POST(request: NextRequest) {
  let threadId: string | undefined;
  try {
    // Basic protection for internal trigger
    const isSeeded = 
      request.headers.get('x-service-role') === 
      process.env.SUPABASE_SERVICE_ROLE_KEY

    const authHeader = request.headers.get('authorization')
    if (!isSeeded && process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.INTERNAL_API_KEY}`) {
      console.warn('Unauthorized attempt to trigger debate engine')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json();
    threadId = body.threadId;

    if (!threadId) {
      return NextResponse.json(
        { error: 'Thread ID required' },
        { status: 400 }
      )
    }

    const { data: thread, error: threadError } = 
      await supabaseAdmin
        .from('threads')
        .select('*')
        .eq('id', threadId)
        .single()

    if (threadError || !thread) {
      return NextResponse.json(
        { error: 'Thread not found' },
        { status: 404 }
      )
    }

    await supabaseAdmin
      .from('threads')
      .update({ status: 'debating' })
      .eq('id', threadId)

    const { data: intakeQuestions } = await supabaseAdmin
      .from('intake_questions')
      .select('*')
      .eq('thread_id', threadId)
      .order('question_order')

    const answersContext = intakeQuestions
      ?.filter(q => q.answer)
      .map(q => `${q.question_text}: ${q.answer}`)
      .join('\n') || ''

    const context = `Creator problem submitted to CreatorFeed:

Platform: ${thread.platform || 'Not specified'}
Follower range: ${thread.follower_range || 'Not specified'}
Topic: ${thread.topic}

Original submission:
${thread.raw_submission}

${answersContext ? 
  `Additional context from intake:\n${answersContext}` 
  : ''}`

    // Guest Star Orchestration
    console.log('Summoning orchestrator for potential Guest Star...')
    const orchestratorMessage = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      system: ORCHESTRATOR_PROMPT,
      messages: [{ role: 'user', content: context }]
    })

    const orchRaw = orchestratorMessage.content[0].type === 'text'
      ? orchestratorMessage.content[0].text : '{}'
    
    let dynamicAgent: { name: string, expertise: string, persona: string } | null = null
    try {
      const cleanedJson = orchRaw.replace(/```json\n?|\n?```/g, '').trim()
      const orchResult = JSON.parse(cleanedJson)
      if (orchResult.needs_specialist && orchResult.specialist) {
        dynamicAgent = orchResult.specialist
        console.log(`Guest Star Summoned: ${orchResult.specialist.name} (${orchResult.specialist.expertise})`)
      }
    } catch (e) {
      console.warn('Orchestrator failed to parse JSON or no specialist needed:', e)
    }

    // Local metadata merge
    const localPersonas = { ...AGENT_PERSONAS }
    const localExpertise = { ...AGENT_EXPERTISE }

    const selectedAgents = selectAgents(
      thread.platform, 
      thread.topic
    )

    if (dynamicAgent) {
      selectedAgents.push(dynamicAgent.name)
      localPersonas[dynamicAgent.name] = dynamicAgent.persona
      localExpertise[dynamicAgent.name] = dynamicAgent.expertise
    }

    const allResponses: AgentResponseRecord[] = []
    let totalExchanges = 0
    let totalRounds = 0
    let consensusReached = false
    let activeAgents = [...selectedAgents]

    while (totalExchanges < HARD_CAP) {
      totalRounds++
      
      for (const agent of activeAgents) {
        if (totalExchanges >= HARD_CAP) break
        
        const response = await runAgentResponse(
          agent,
          localPersonas[agent],
          localExpertise[agent],
          context,
          allResponses,
          totalRounds,
          totalExchanges + 1,
          threadId
        )
        
        allResponses.push(response)
        totalExchanges++
      }

      const { consensus, continueWith } = 
        await checkConsensus(allResponses, totalExchanges)

      if (consensus === 'reached') {
        consensusReached = true
        break
      }

      if (consensus === 'partial' && 
          continueWith.length > 0) {
        activeAgents = continueWith as AgentName[]
      }

      if (totalRounds >= 4) {
        break
      }
    }

    const finalPositions = await collectFinalPositions(
      selectedAgents,
      localPersonas,
      localExpertise,
      context,
      allResponses,
      threadId
    )

    await generateVerdict(
      context,
      finalPositions,
      threadId,
      totalExchanges,
      totalRounds,
      consensusReached
    )

    return NextResponse.json({
      success: true,
      threadId,
      totalExchanges,
      totalRounds,
      consensusReached,
      agentCount: selectedAgents.length
    })

  } catch (error) {
    console.error('Debate engine error:', error)
    
    if (threadId) {
      await supabaseAdmin
        .from('threads')
        .update({ status: 'failed' })
        .eq('id', threadId)
    }

    return NextResponse.json(
      { error: 'Debate engine failed' },
      { status: 500 }
    )
  }
}
