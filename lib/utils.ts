export function getSeededViews(threadId: string, actualViews: number | string | null | undefined = 0): number {
  // If actualViews is passed as string, parse it, otherwise default to 0
  const parsedActual = typeof actualViews === 'string' ? parseInt(actualViews, 10) : (actualViews || 0);
  const actual = isNaN(parsedActual) ? 0 : parsedActual;

  // Simple string hash function
  let hash = 0;
  for (let i = 0; i < threadId.length; i++) {
    const char = threadId.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Make hash positive and map to a range between 150 and 800
  const positiveHash = Math.abs(hash);
  const baseOffset = (positiveHash % 650) + 150;
  
  return actual + baseOffset;
}

export function formatViews(views: number): string {
  return views > 1000 ? `${(views / 1000).toFixed(0)}K` : views.toString();
}
