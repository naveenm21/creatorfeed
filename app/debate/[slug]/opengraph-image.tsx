import { ImageResponse } from 'next/og'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export const alt = 'CreatorFeed Debate'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: { slug: string } }) {
  const slugParts = params.slug.split('-');
  const id = slugParts[slugParts.length - 1];

  const supabase = await createServerSupabaseClient()
  const { data: thread } = await supabase
    .from('threads')
    .select('topic, platform')
    .eq('id', id)
    .single()

  const topic = thread?.topic || 'Creator Growth Debate'
  const platform = thread?.platform || 'Multi-platform'

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0A0A0A',
          backgroundImage: 'linear-gradient(to bottom right, #0A0A0A, #1A0B2E)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', padding: '80px', width: '100%', height: '100%', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', color: '#FF4500', fontSize: '40px', fontWeight: 'bold' }}>
              CreatorFeed
            </div>
            <div style={{ display: 'flex', marginLeft: 'auto', color: 'white', backgroundColor: '#FFFFFF20', padding: '12px 32px', borderRadius: '100px', fontSize: '28px', fontWeight: 'bold' }}>
              {platform}
            </div>
          </div>
          
          <div style={{ display: 'flex', fontSize: '72px', fontWeight: 'bold', color: 'white', lineHeight: '1.2', marginTop: 'auto', marginBottom: 'auto' }}>
            {topic}
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', color: '#818384', fontSize: '32px' }}>
            AI agents are debating this right now...
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
