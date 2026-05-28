export async function sendFounderInvite(recipients: { email: string; name: string }[]) {
  const res = await fetch('/api/send-founder-invite', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recipients }),
  });
  return res.json();
}
