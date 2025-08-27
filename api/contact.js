import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";

const SUB_FILE = path.join(".vercel_build_output", "submissions.json");

// Ensure submissions file exists
if (!fs.existsSync(SUB_FILE)) fs.writeFileSync(SUB_FILE, "[]", "utf8");

function validate(payload = {}) {
  const errors = [];
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
  const name = (payload.name || "").trim();
  const email = (payload.email || "").trim();
  const subject = (payload.subject || "").trim();
  const message = (payload.message || "").trim();

  if (!name || name.length < 2) errors.push("Name must be at least 2 characters.");
  if (!email || !emailRe.test(email)) errors.push("Valid email is required.");
  if (!subject || subject.length < 2) errors.push("Subject is required.");
  if (!message || message.length < 2) errors.push("Message must be at least 2 characters.");

  return { ok: errors.length === 0, errors, clean: { name, email, subject, message } };
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { ok, errors, clean } = validate(req.body || {});
  if (!ok) return res.status(400).json({ ok: false, error: errors.join(", ") });

  // Save locally (serverless-friendly)
  try {
    const submissions = JSON.parse(fs.readFileSync(SUB_FILE, "utf8") || "[]");
    const entry = { id: Date.now(), receivedAt: new Date().toISOString(), ...clean };
    submissions.unshift(entry);
    fs.writeFileSync(SUB_FILE, JSON.stringify(submissions.slice(0, 1000), null, 2), "utf8");
  } catch (err) {
    console.warn("Could not save submissions locally:", err);
  }

  // Send email
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Christ General Website" <${process.env.GMAIL_USER}>`,
      to: process.env.EMAIL_TO,
      replyTo: clean.email,
      subject: `📩 ${clean.subject} — New Message`,
      html: `
        <p><strong>Name:</strong> ${clean.name}</p>
        <p><strong>Email:</strong> ${clean.email}</p>
        <p><strong>Subject:</strong> ${clean.subject}</p>
        <p><strong>Message:</strong></p>
        <p>${clean.message.replace(/\n/g, "<br>")}</p>
      `,
    });

    return res.status(200).json({ ok: true, message: "Message sent!" });
  } catch (err) {
    console.error("Email error:", err);
    return res.status(500).json({ ok: false, error: err.message || "Server error" });
  }
}
