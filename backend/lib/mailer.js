import nodemailer from 'nodemailer';

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;

// Enabled only when SMTP credentials are present (like Firebase/Razorpay).
export const mailerEnabled = !!(SMTP_HOST && SMTP_USER && SMTP_PASS);

const transporter = mailerEnabled
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT) || 587,
      secure: Number(SMTP_PORT) === 465, // true for 465, false for 587/25
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    })
  : null;

// Fire-and-forget email; never throws (a mail failure must not break signup).
export const sendMail = async ({ to, subject, html, text }) => {
  if (!mailerEnabled) {
    console.log(`[mailer disabled] would email "${subject}" to ${to}`);
    return;
  }
  try {
    await transporter.sendMail({ from: SMTP_FROM || SMTP_USER, to, subject, html, text });
  } catch (err) {
    console.error('Email send failed:', err.message);
  }
};
