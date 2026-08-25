/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerSupabaseClient } from '@/lib/supabase-server';

function extractIdFromSlug(slug: string) {
  const parts = slug.split('-');
  return parts.slice(-5).join('-'); // UUIDs have 5 parts
}

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const supabase = await createServerSupabaseClient();
  const id = extractIdFromSlug(params.slug);

  const { data: thread } = await supabase
    .from('threads')
    .select('*')
    .eq('id', id)
    .single();

  if (!thread) {
    return new Response('Debate not found', { status: 404 });
  }

  const { data: responses } = await supabase
    .from('agent_responses')
    .select('*')
    .eq('thread_id', id)
    .order('created_at', { ascending: true });

  const { data: verdict } = await supabase
    .from('verdicts')
    .select('*')
    .eq('thread_id', id)
    .single();

  let markdown = `# ${thread.topic}\n\n`;
  markdown += `**Platform:** ${thread.platform || 'Multi-platform'}\n`;
  markdown += `**Posted By:** ${thread.submitted_by || 'Anonymous'}\n`;
  markdown += `**Date:** ${new Date(thread.created_at).toUTCString()}\n\n`;
  markdown += `## Original Context\n\n${thread.raw_submission || thread.topic}\n\n`;

  if (verdict) {
    markdown += `## AI Debate TL;DR\n\n`;
    if (verdict.key_takeaway_1) markdown += `- ${verdict.key_takeaway_1}\n`;
    if (verdict.key_takeaway_2) markdown += `- ${verdict.key_takeaway_2}\n`;
    if (verdict.key_takeaway_3) markdown += `- ${verdict.key_takeaway_3}\n`;
    markdown += `\n## Final AI Verdict\n\n${verdict.verdict_text}\n\n`;
  }

  if (responses && responses.length > 0) {
    markdown += `## AI Agent Debate\n\n`;
    const regular = responses.filter((r: any) => !r.is_final_position);
    
    for (const r of regular) {
      markdown += `### ${r.agent_name}\n\n${r.response_text}\n\n`;
    }

    const finals = responses.filter((r: any) => r.is_final_position);
    if (finals.length > 0) {
      markdown += `## Final Positions\n\n`;
      for (const f of finals) {
        markdown += `### ${f.agent_name}\n\n${f.response_text}\n\n`;
      }
    }
  }

  return new Response(markdown, {
    headers: {
      'Content-Type': 'text/markdown',
      'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
