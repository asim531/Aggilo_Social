const { loadEnvConfig } = require('@next/env');
loadEnvConfig(process.cwd());

const { Resend } = require('resend');
const { readFileSync } = require('fs');
const { join } = require('path');

const resend = new Resend(process.env.RESEND_API_KEY);

async function test() {
  const email = 'tasneem.bano@gmail.com';
  const name = 'Tas';
  const founder = 'tas';
  const tasEmail = 'tasneem.bano@gmail.com';
  const gender = 'female';
  const birthYear = '1999';
  const country = 'India';
  
  console.log('Using API KEY:', process.env.RESEND_API_KEY ? 'Set' : 'Missing');
  
  try {
    const baseHtml = readFileSync(
      join(process.cwd(), 'emails/clio-invite-email.html'),
      'utf-8'
    );
    
    let html = baseHtml.replace('Hey Tas,', `Hey ${name},`);
    
    // Replace CTA link with Tas's specific params
    const ctaUrl = `https://mvp.aggilo.in/c/long-conversation?founder=${founder}&email=${encodeURIComponent(tasEmail)}&gender=${gender}&birth_year=${birthYear}&country=${country}`;
    html = html.replace(/href="https:\/\/mvp\.aggilo\.in\/c\/long-conversation\/cluster\?[^"]*"/, `href="${ctaUrl}"`);
    
    console.log('Sending email to:', email);
    const result = await resend.emails.send({
      from: 'Clio <clio@aggilo.in>',
      to: email,
      replyTo: 'clio@aggilo.in',
      subject: 'Your room is ready.',
      html,
    });
    
    console.log('Result:', result);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

test();
