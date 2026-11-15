import { getSessionUser } from '@/auth';
import { query, queryOne, isUuid } from '@/lib/db';
import { notFound } from 'next/navigation';
import { ProfileContent, type Profile, type Debate, type Reply } from './ProfileContent';

type Props = {
  params: { id: string }
};

export default async function ProfilePage({ params }: Props) {
  const { id } = params;
  if (!isUuid(id)) {
    notFound();
  }

  // Profiles are public. Unpublished debates are only listed to their owner
  // (same rule the Supabase RLS policies enforced).
  const viewer = await getSessionUser();
  const viewerId = viewer?.id ?? null;

  // 2. Fetch User Info
  const profile = await queryOne<Profile & { id: string }>(
    `SELECT id, full_name, karma, badges, avatar_url FROM users WHERE id = $1`,
    [id]
  );

  if (!profile) {
    notFound();
  }

  // 3. Fetch Debates Started
  const startedDebates = await query<Debate>(
    `SELECT id, topic, platform, created_at, status FROM threads
      WHERE user_id = $1 AND (status = 'published' OR user_id = $2::uuid)
      ORDER BY created_at DESC`,
    [id, viewerId]
  );

  // 4. Fetch Recent Replies (thread is null when the viewer can't see it)
  const replies = await query<Reply>(
    `SELECT hr.*,
            CASE WHEN t.id IS NULL THEN NULL
                 ELSE json_build_object('topic', t.topic, 'id', t.id) END AS thread
       FROM human_replies hr
       LEFT JOIN threads t ON t.id = hr.thread_id
            AND (t.status = 'published' OR t.user_id = $2::uuid)
      WHERE hr.user_id = $1
      ORDER BY hr.created_at DESC`,
    [id, viewerId]
  );

  return (
    <div className="bg-black min-h-screen">
      <ProfileContent 
        profile={profile} 
        debates={startedDebates || []} 
        replies={replies || []} 
      />
    </div>
  );
}
