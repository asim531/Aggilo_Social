# Coding Agent Instructions — Clio Founder Invite Email
## Location: `phase0/Research_Circle_MJ/`

---

## Goal
Implement a founder invite email feature for the Research Circle MJ cluster. Email sends only when explicitly triggered by the command: `send email to founder: [email1, email2, ...]`

---

## 1. Install dependency
```bash
npm install resend
```

---

## 2. Environment variable
Add to `.env.local`:
```
RESEND_API_KEY=re_xxxxxxxxxx
```

---

## 3. File structure to create inside `phase0/Research_Circle_MJ/`
```
phase0/Research_Circle_MJ/
├── emails/
│   └── clio-invite-email.html     ← copy the HTML file here (provided separately)
└── app/
    └── api/
        └── send-founder-invite/
            └── route.ts
```

---

## 4. Create `phase0/Research_Circle_MJ/app/api/send-founder-invite/route.ts`

```typescript
import { Resend } from 'resend';
import { readFileSync } from 'fs';
import { join } from 'path';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  const { recipients } = await req.json();
  // recipients = [{ email: string, name: string }]

  if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
    return Response.json({ error: 'No recipients provided' }, { status: 400 });
  }

  const baseHtml = readFileSync(
    join(process.cwd(), 'phase0/Research_Circle_MJ/emails/clio-invite-email.html'),
    'utf-8'
  );

  const results = await Promise.allSettled(
    recipients.map(({ email, name }: { email: string; name: string }) => {
      const html = baseHtml.replace('Hey Tasneem,', `Hey ${name},`);
      return resend.emails.send({
        from: 'Clio <clio@aggilo.in>',
        to: email,
        reply_to: 'clio@aggilo.in',
        subject: 'Your room is ready.',
        html,
      });
    })
  );

  const summary = results.map((r, i) => ({
    email: recipients[i].email,
    status: r.status,
    ...(r.status === 'rejected' ? { error: r.reason } : {}),
  }));

  return Response.json({ summary });
}
```

---

## 5. Create the trigger utility `phase0/Research_Circle_MJ/lib/sendFounderInvite.ts`

```typescript
export async function sendFounderInvite(recipients: { email: string; name: string }[]) {
  const res = await fetch('/api/send-founder-invite', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recipients }),
  });
  return res.json();
}
```

---

## 6. Usage — only call when command is explicitly given

```typescript
// ONLY trigger this when the command "send email to founder: [emails]" is received
// Do NOT call on page load, user signup, or any automatic event

import { sendFounderInvite } from '@/phase0/Research_Circle_MJ/lib/sendFounderInvite';

// Example trigger:
await sendFounderInvite([
  { email: 'tasneem.bano@gmail.com', name: 'Tasneem' },
  { email: 'another@example.com', name: 'Another' },
]);
```

---

## 7. Validation rules for the agent
- **Never** call `send-founder-invite` automatically
- **Never** call on user signup, page load, or any background job
- **Only** call when the explicit string `send email to founder:` is received followed by a list of emails
- Parse the email list from the command string, default `name` to the part before `@` if no name is provided
- Log the summary response — success and failures both

---

## 8. HTML file
Place `clio-invite-email.html` (provided) at:
```
phase0/Research_Circle_MJ/emails/clio-invite-email.html
```
No modifications to the HTML file — the route handles name replacement dynamically.
