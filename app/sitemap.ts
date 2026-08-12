/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { MetadataRoute } from 'next'
import { slugify } from '@/lib/slug'

export const revalidate = 3600 // Revalidate sitemap at most every hour, but can be forced via revalidatePath

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createServerSupabaseClient()

  let allThreads: any[] = [];
  let from = 0;
  let hasMore = true;

  while (hasMore) {
    const { data: threads } = await supabase
      .from('threads')
      .select('id, topic, created_at, updated_at')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .range(from, from + 999);

    if (threads && threads.length > 0) {
      allThreads = [...allThreads, ...threads];
      from += 1000;
      if (threads.length < 1000) {
        hasMore = false;
      }
    } else {
      hasMore = false;
    }
  }

  const threadUrls = allThreads.map(thread => ({
    url: `https://feed.creedom.ai/debate/${slugify(thread.topic || '')}-${thread.id}`,
    lastModified: new Date(thread.updated_at),
    changeFrequency: 'daily' as const,
    priority: 0.8
  }))

  return [
    {
      url: 'https://feed.creedom.ai',
      lastModified: new Date(),
      changeFrequency: 'hourly' as const,
      priority: 1.0
    },
    {
      url: 'https://feed.creedom.ai/trending',
      lastModified: new Date(),
      changeFrequency: 'hourly' as const,
      priority: 0.9
    },
    {
      url: 'https://feed.creedom.ai/how-it-works',
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6
    },
    {
      url: 'https://feed.creedom.ai/submit',
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7
    },
    ...threadUrls
  ]
}
