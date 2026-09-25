import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@/lib/supabase/client';

// Resend client will be initialized inside the handler

export async function POST(req: Request) {
  const resendApiKey = process.env.RESEND_API_KEY;
  
  if (!resendApiKey) {
    console.error("Missing RESEND_API_KEY");
    return NextResponse.json({ error: "Configuration Error: Missing Email API Key" }, { status: 500 });
  }

  const resend = new Resend(resendApiKey);

  try {
    const { email, name, businessName, userId } = await req.json();

    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      console.error("Missing CRON_SECRET");
      return NextResponse.json({ error: "Configuration Error: Missing CRON_SECRET" }, { status: 503 });
    }

    const esc = (v: unknown) =>
      String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
    const safeUserId = encodeURIComponent(String(userId ?? ''));

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const approveUrl = `${baseUrl}/api/webhooks/approve-user?userId=${safeUserId}&action=approve&secret=${encodeURIComponent(cronSecret)}`;
    const rejectUrl = `${baseUrl}/api/webhooks/approve-user?userId=${safeUserId}&action=reject&secret=${encodeURIComponent(cronSecret)}`;

    const { data, error } = await resend.emails.send({
      from: 'Atlas One <onboarding@resend.dev>',
      to: ['lic.germancardenas@gmail.com'],
      replyTo: 'atlasonecontact@gmail.com',
      subject: `Nuevo Usuario Registrado: ${String(businessName ?? '').slice(0, 80)} (${String(name ?? '').slice(0, 80)})`,
      html: `
        <h1>Nuevo Registro en Atlas One</h1>
        <p>Un nuevo usuario se ha registrado y requiere aprobación.</p>
        
        <ul>
          <li><strong>Nombre:</strong> ${esc(name)}</li>
          <li><strong>Empresa:</strong> ${esc(businessName)}</li>
          <li><strong>Email:</strong> ${esc(email)}</li>
          <li><strong>User ID:</strong> ${esc(userId)}</li>
        </ul>

        <div style="margin-top: 20px;">
          <a href="${approveUrl}" style="background-color: #06b6d4; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-right: 10px;">Aprobar Usuario</a>
          <a href="${rejectUrl}" style="background-color: #ef4444; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Rechazar Usuario</a>
        </div>
      `,
    });

    if (error) {
      console.error('Error sending email:', error);
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ message: 'Notification sent successfully', data });
  } catch (error) {
    console.error('Error in notify-admin:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
