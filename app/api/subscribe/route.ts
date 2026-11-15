import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string' || !email.includes('@') || email.length > 320) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    const rows = await query(
      `INSERT INTO subscribers (email) VALUES ($1) ON CONFLICT (email) DO NOTHING RETURNING id`,
      [email.trim()]
    );

    if (rows.length === 0) {
      return NextResponse.json({ success: true, message: 'Already subscribed' });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Subscription error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
