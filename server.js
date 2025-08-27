// ================== DEPENDENCIES ==================
require('dotenv').config(); // Load environment variables
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');
const xss = require('xss-clean');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;
const SUB_FILE = path.join(__dirname, 'submissions.json');

// ================== SECURITY HEADERS ==================
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https://images.unsplash.com", "https://plus.unsplash.com"],
        mediaSrc: ["*"],
        frameSrc: ["*"],
        connectSrc: ["'self'"],
        formAction: ["'self'"]
      },
    },
  })
);

app.use(cors());
app.use(bodyParser.json({ limit: '256kb' }));
app.use(xss());
app.use(express.static(path.join(__dirname, 'public')));

// ================== RATE LIMIT ==================
const contactLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 20,
  handler: (req, res) =>
    res.status(429).json({ ok: false, error: 'Too many requests, try again later.' }),
});

// ================== ENSURE SUBMISSIONS FILE ==================
if (!fs.existsSync(SUB_FILE)) fs.writeFileSync(SUB_FILE, '[]', 'utf8');

// ================== VALIDATION ==================
function validate(payload = {}) {
  const errors = [];
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
  const name = (payload.name || '').trim();
  const email = (payload.email || '').trim();
  const subject = (payload.subject || '').trim();
  const message = (payload.message || '').trim();

  if (!name || name.length < 2) errors.push('Name must be at least 2 characters.');
  if (!email || !emailRe.test(email)) errors.push('Valid email is required.');
  if (!subject || subject.length < 2) errors.push('Subject is required.');
  if (!message || message.length < 2) errors.push('Message must be at least 2 characters.');

  return { ok: errors.length === 0, errors, clean: { name, email, subject, message } };
}

// ================== NODEMAILER CONFIG ==================
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

const EMAIL_TO = process.env.EMAIL_TO;

// ================== CONTACT API ==================
app.post('/api/contact', contactLimiter, async (req, res) => {
  try {
    const { ok, errors, clean } = validate(req.body || {});
    if (!ok) return res.status(400).json({ ok: false, error: errors.join(", ") });

    // Save locally
    const submissions = JSON.parse(fs.readFileSync(SUB_FILE, 'utf8') || '[]');
    const entry = { id: Date.now(), receivedAt: new Date().toISOString(), ip: req.ip, ...clean };
    submissions.unshift(entry);
    fs.writeFileSync(SUB_FILE, JSON.stringify(submissions.slice(0, 1000), null, 2), 'utf8');

    // Build email
    const mailOptions = {
      from: `"Christ General Website" <${process.env.GMAIL_USER}>`,
      to: EMAIL_TO,
      replyTo: clean.email,
      subject: `📩 ${clean.subject} — New Message`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${clean.name}</p>
          <p><strong>Email:</strong> ${clean.email}</p>
          <p><strong>Subject:</strong> ${clean.subject}</p>
          <p><strong>Message:</strong></p>
          <div style="background:#f9f9f9;padding:10px;border-radius:5px;">
            ${clean.message.replace(/\n/g, '<br>')}
          </div>
          <hr>
          <small>Sent automatically from Christ General website.</small>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    console.log(`📬 New contact submission: ${clean.name} <${clean.email}> - ${clean.subject}`);
    return res.json({ ok: true, message: 'Message sent — thank you!' });

  } catch (err) {
    console.error('Contact error:', err);
    return res.status(500).json({ ok: false, error: err.message || 'Server error' });
  }
});

// ================== SPA FALLBACK ==================
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// ================== START SERVER ==================
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
