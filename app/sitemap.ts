/* eslint-disable @typescript-eslint/no-explicit-any */
import { query } from '@/lib/db'
import { MetadataRoute } from 'next'
import { slugify } from '@/lib/slug'

export const revalidate = 3600 // Revalidate sitemap at most every hour, but can be forced via revalidatePath

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const allThreads: any[] = await query(
    `SELECT id, topic, created_at, updated_at FROM threads
      WHERE status = 'published' ORDER BY created_at DESC`
  );

  const threadUrls = allThreads.map(thread => ({
    url: `https://feed.creedom.ai/debate/${slugify(thread.topic || '')}-${thread.id}`,
    lastModified: new Date(thread.updated_at || thread.created_at),
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
