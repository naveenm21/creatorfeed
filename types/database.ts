export interface User {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export type Platform = 'YouTube' | 'Instagram' | 'TikTok' | 'Multi-platform'

export type AgentName = 'Riya' | 'Marcus' | 'Priya' | 'Dev' | 'Karan'

export interface Thread {
  id: string
  creator_name: string
  creator_handle: string | null
  platform: Platform
  topic: string
  problem_description: string
  what_tried: string | null
  submitted_by: string | null
  follower_range: string
  status: 'pending' | 'debating' | 'published'
  views: number
  created_at: string
  updated_at: string
}

export interface AgentResponse {
  id: string
  thread_id: string
  agent_name: AgentName
  expertise: string
  response_text: string
  response_order: number
  agreed_count: number
  disagreed_count: number
  created_at: string
}

export interface Verdict {
  id: string
  thread_id: string
  verdict_text: string
  key_takeaway_1: string
  key_takeaway_2: string
  key_takeaway_3: string
  community_agree_percent: number
  created_at: string
}

export interface HumanReply {
  id: string
  thread_id: string
  agent_referenced: AgentName | null
  sentiment: 'agreed' | 'disagreed' | null
  reply_text: string
  author_name: string
  created_at: string
}

export interface CommunityReaction {
  id: string
  thread_id: string
  agent_response_id: string
  reaction: 'agreed' | 'disagreed'
  created_at: string
}
