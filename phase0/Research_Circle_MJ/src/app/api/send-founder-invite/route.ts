import { Resend } from 'resend';
import { readFileSync } from 'fs';
import { join } from 'path';

// Prevent Next.js from evaluating this route at build time
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const resend = new Resend(process.env.RESEND_API_KEY!);
  const { recipients } = await req.json();

  if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
    return Response.json({ error: 'No recipients provided' }, { status: 400 });
  }

  const baseHtml = readFileSync(
    join(process.cwd(), 'emails/clio-invite-email.html'),
    'utf-8'
  );

  const { createAdminClient } = await import('@/lib/supabase-admin');
  const admin = createAdminClient();

  const results = await Promise.allSettled(
    recipients.map(async ({ email, name }: { email: string; name: string }) => {
      let html = baseHtml.replace('Hey Tas,', `Hey ${name},`);
      
      return resend.emails.send({
        from: 'Clio <clio@aggilo.in>',
        to: email,
        replyTo: 'clio@aggilo.in',
        subject: 'Your room is ready.',
        html,
      });
    })
  );

  const summary = results.map((r, i) => ({
    email: recipients[i].email,
    status: r.status,
    ...(r.status === 'rejected' ? { error: (r as PromiseRejectedResult).reason } : {}),
  }));

  return Response.json({ summary });
}
