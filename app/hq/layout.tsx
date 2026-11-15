import { getSessionUser } from '@/auth';
import { queryOne } from '@/lib/db';
import { redirect } from 'next/navigation';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();

  if (!user) {
    redirect('/signin');
  }

  // Check if user is admin
  const profile = await queryOne<{ is_admin: boolean }>(
    `SELECT is_admin FROM users WHERE id = $1`,
    [user.id]
  );

  if (!profile || !profile.is_admin) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 fade-in">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-primary mb-2">Command Center</h1>
          <p className="text-secondary">CreatorFeed Internal Headquarters</p>
        </div>
        {children}
      </div>
    </div>
  );
}
