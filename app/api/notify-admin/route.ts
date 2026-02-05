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

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const approveUrl = `${baseUrl}/api/webhooks/approve-user?userId=${userId}&action=approve&secret=${process.env.CRON_SECRET || 'default-secret'}`;
    const rejectUrl = `${baseUrl}/api/webhooks/approve-user?userId=${userId}&action=reject&secret=${process.env.CRON_SECRET || 'default-secret'}`;

    const { data, error } = await resend.emails.send({
      from: 'Atlas One <onboarding@resend.dev>',
      to: ['lic.germancardenas@gmail.com'],
      replyTo: 'atlasonecontact@gmail.com',
      subject: `Nuevo Usuario Registrado: ${businessName} (${name})`,
      html: `
        <h1>Nuevo Registro en Atlas One</h1>
        <p>Un nuevo usuario se ha registrado y requiere aprobación.</p>
        
        <ul>
          <li><strong>Nombre:</strong> ${name}</li>
          <li><strong>Empresa:</strong> ${businessName}</li>
          <li><strong>Email:</strong> ${email}</li>
          <li><strong>User ID:</strong> ${userId}</li>
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
