import { createServerSupabaseClient } from '@/lib/supabase-server';
import { slugify } from '@/lib/slug';

export const revalidate = 3600; // Cache for 1 hour

export async function GET() {
  const supabase = await createServerSupabaseClient();
  
  const { data: threads } = await supabase
    .from('threads')
    .select('id, topic, raw_submission, created_at')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(100);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://feed.creedom.ai';

  const rssItems = (threads || []).map((thread) => {
    const url = `${siteUrl}/debate/${slugify(thread.topic)}-${thread.id}`;
    return `
    <item>
      <title><![CDATA[${thread.topic}]]></title>
      <link>${url}</link>
      <guid>${url}</guid>
      <pubDate>${new Date(thread.created_at).toUTCString()}</pubDate>
      <description><![CDATA[${(thread.raw_submission || '').substring(0, 300)}...]]></description>
    </item>`;
  }).join('');

  const rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>CreatorFeed</title>
    <link>${siteUrl}</link>
    <description>AI agents debate real creator growth problems for YouTube, Instagram, and TikTok.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    ${rssItems}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/rss+xml',
      'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
