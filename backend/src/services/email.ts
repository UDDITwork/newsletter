import { env } from '../config/env.js';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface SendResult {
  success: boolean;
  id?: string;
  error?: string;
}

const RESEND_API_URL = 'https://api.resend.com/emails';
const FROM_EMAIL = 'Newsletter <newsletter@uddit.site>';

export async function sendEmail(options: EmailOptions): Promise<SendResult> {
  try {
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Resend API error:', data);
      return { success: false, error: data.message || 'Failed to send email' };
    }

    return { success: true, id: data.id };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

export async function sendConfirmationEmail(
  email: string,
  token: string,
  name?: string
): Promise<SendResult> {
  const confirmUrl = `${env.FRONTEND_URL}/confirm/${token}`;
  const greeting = name ? `Hi ${name}` : 'Hi there';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm your subscription</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Welcome to the Newsletter!</h1>
  </div>
  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px;">${greeting},</p>
    <p style="font-size: 16px;">Thanks for subscribing! Please confirm your email address by clicking the button below:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${confirmUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Confirm Subscription</a>
    </div>
    <p style="font-size: 14px; color: #666;">Or copy and paste this link into your browser:</p>
    <p style="font-size: 14px; color: #666; word-break: break-all;">${confirmUrl}</p>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    <p style="font-size: 12px; color: #999;">If you didn't subscribe to this newsletter, you can safely ignore this email.</p>
  </div>
</body>
</html>
  `.trim();

  const text = `
${greeting},

Thanks for subscribing! Please confirm your email address by clicking the link below:

${confirmUrl}

If you didn't subscribe to this newsletter, you can safely ignore this email.
  `.trim();

  return sendEmail({
    to: email,
    subject: 'Confirm your newsletter subscription',
    html,
    text,
  });
}

export async function sendMagicLinkEmail(
  email: string,
  token: string,
  returnUrl?: string
): Promise<SendResult> {
  const verifyUrl = `${env.FRONTEND_URL}/auth/verify?token=${token}${returnUrl ? `&returnUrl=${encodeURIComponent(returnUrl)}` : ''}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sign in to Newsletter</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Sign in to Newsletter</h1>
  </div>
  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px;">Click the button below to sign in to your account. This link will expire in 15 minutes.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${verifyUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Sign In</a>
    </div>
    <p style="font-size: 14px; color: #666;">Or copy and paste this link into your browser:</p>
    <p style="font-size: 14px; color: #666; word-break: break-all;">${verifyUrl}</p>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    <p style="font-size: 12px; color: #999;">If you didn't request this email, you can safely ignore it.</p>
  </div>
</body>
</html>
  `.trim();

  const text = `
Sign in to Newsletter

Click the link below to sign in to your account. This link will expire in 15 minutes.

${verifyUrl}

If you didn't request this email, you can safely ignore it.
  `.trim();

  return sendEmail({
    to: email,
    subject: 'Sign in to Newsletter',
    html,
    text,
  });
}

export async function sendUnsubscribeConfirmationEmail(
  email: string
): Promise<SendResult> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Unsubscribed from Newsletter</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #f3f4f6; padding: 30px; border-radius: 10px;">
    <h1 style="color: #374151; margin: 0 0 20px 0; font-size: 24px;">You've been unsubscribed</h1>
    <p style="font-size: 16px; color: #4b5563;">You have been successfully unsubscribed from our newsletter. We're sorry to see you go!</p>
    <p style="font-size: 16px; color: #4b5563;">If this was a mistake, you can always subscribe again at <a href="${env.FRONTEND_URL}" style="color: #667eea;">${env.FRONTEND_URL}</a></p>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    <p style="font-size: 12px; color: #999;">This is a confirmation that you will no longer receive emails from us.</p>
  </div>
</body>
</html>
  `.trim();

  const text = `
You've been unsubscribed

You have been successfully unsubscribed from our newsletter. We're sorry to see you go!

If this was a mistake, you can always subscribe again at ${env.FRONTEND_URL}
  `.trim();

  return sendEmail({
    to: email,
    subject: 'You have been unsubscribed',
    html,
    text,
  });
}

export async function sendNewsletterEmail(
  email: string,
  subject: string,
  content: string,
  unsubscribeToken: string
): Promise<SendResult> {
  const unsubscribeUrl = `${env.FRONTEND_URL}/unsubscribe/${unsubscribeToken}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  ${content}
  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
  <div style="text-align: center;">
    <p style="font-size: 12px; color: #999;">
      <a href="${unsubscribeUrl}" style="color: #999;">Unsubscribe</a>
    </p>
  </div>
</body>
</html>
  `.trim();

  return sendEmail({
    to: email,
    subject,
    html,
  });
}
