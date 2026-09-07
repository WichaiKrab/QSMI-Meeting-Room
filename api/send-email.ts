import type { VercelRequest, VercelResponse } from '@vercel/node';
import nodemailer from 'nodemailer';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const { to, from, subject, text, html } = req.body || {};

    if (!to || !subject || (!text && !html)) {
      return res.status(400).json({ error: 'Missing required fields: to, subject, text or html' });
    }

    // Validate recipient email address format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (typeof to !== 'string' || !emailRegex.test(to.trim()) || to.length > 254) {
      return res.status(400).json({ error: 'Invalid recipient email format' });
    }

    // Validate lengths to prevent oversized payload abuse
    if (typeof subject !== 'string' || subject.length > 500) {
      return res.status(400).json({ error: 'Subject must be less than 500 characters' });
    }

    if ((text && typeof text !== 'string') || (html && typeof html !== 'string')) {
      return res.status(400).json({ error: 'Invalid content format' });
    }

    const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
    const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS || process.env.EMAIL_APP_PASSWORD;
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = Number(process.env.SMTP_PORT) || 465;
    const defaultFrom = `"ระบบจองห้องประชุม" <${smtpUser || 'wsritangkum@gmail.com'}>`;
    const smtpFrom = process.env.EMAIL_FROM || from || defaultFrom;

    if (!smtpUser || !smtpPass) {
      return res.status(200).json({
        success: false,
        message: 'SMTP credentials (SMTP_USER/SMTP_PASS) not configured yet in Vercel Environment Variables. Email saved in Firestore mail collection.',
      });
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const info = await transporter.sendMail({
      from: smtpFrom,
      to,
      subject,
      text,
      html,
    });

    return res.status(200).json({
      success: true,
      messageId: info.messageId,
      message: 'Email sent successfully via SMTP',
    });
  } catch (error: any) {
    console.error('Error sending email:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to send email',
    });
  }
}
