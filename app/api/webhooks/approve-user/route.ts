import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const action = searchParams.get('action'); // 'approve' or 'reject'
  const secret = searchParams.get('secret');

  // El secreto es obligatorio: sin CRON_SECRET configurado el endpoint queda cerrado.
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return new NextResponse('Not configured', { status: 503 });
  }
  const a = Buffer.from(secret ?? '');
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  if (!userId || !action) {
    return new NextResponse('Missing userId or action', { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const status = action === 'approve' ? 'approved' : 'rejected';

    const { error } = await supabase
      .from('profiles')
      .update({ access_status: status })
      .eq('id', userId);

    if (error) {
      console.error('Error updating user status:', error);
      return new NextResponse(`Error: ${error.message}`, { status: 500 });
    }

    // Return a simple HTML page confirming the action
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>User ${action === 'approve' ? 'Approved' : 'Rejected'}</title>
          <style>
            body { font-family: system-ui, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background-color: #030712; color: white; margin: 0; }
            .container { text-align: center; padding: 2rem; border-radius: 1rem; background-color: #0a0f1a; border: 1px solid rgba(6, 182, 212, 0.2); }
            h1 { color: ${action === 'approve' ? '#22c55e' : '#ef4444'}; }
            p { color: #9ca3af; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>User Successfully ${action === 'approve' ? 'Approved' : 'Rejected'}</h1>
            <p>The user's access status has been updated to <strong>${status}</strong>.</p>
            <p>You can close this window.</p>
          </div>
        </body>
      </html>
    `;

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html' },
    });

  } catch (error) {
    console.error('Server error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
