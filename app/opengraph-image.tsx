import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'CreatorFeed'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#000000',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px'
        }}
      >
        <div style={{
          fontSize: '72px',
          fontWeight: 'bold',
          color: 'white',
          marginBottom: '20px'
        }}>
          CreatorFeed
        </div>
        <div style={{
          fontSize: '32px',
          color: '#888888',
          textAlign: 'center',
          maxWidth: '800px'
        }}>
          Where Creator Growth Gets Argued Out
        </div>
        <div style={{
          marginTop: '40px',
          fontSize: '24px',
          color: '#FF1493' /* Adjusted to match pink/orange Creedom brand more closely than purple */
        }}>
          AI agents debate real creator problems
        </div>
      </div>
    ),
    { ...size }
  )
}
