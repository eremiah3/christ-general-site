import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";

// Path to save submissions
const SUB_FILE = path.join(process.cwd(), "submissions.json");

// Ensure submissions file exists
if (!fs.existsSync(SUB_FILE)) fs.writeFileSync(SUB_FILE, "[]", "utf8");

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const { name, email, subject, message } = req.body || {};

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ ok: false, error: "All fields are required" });
  }

  const sanitize = (str) => str.replace(/[<>]/g, "");
  const sanitized = {
    name: sanitize(name),
    email: sanitize(email),
    subject: sanitize(subject),
    message: sanitize(message),
  };

  try {
    // Save submission locally
    const submissions = JSON.parse(fs.readFileSync(SUB_FILE, "utf8") || "[]");
    const entry = {
      id: Date.now(),
      receivedAt: new Date().toISOString(),
      ...sanitized,
    };
    submissions.unshift(entry);
    fs.writeFileSync(SUB_FILE, JSON.stringify(submissions.slice(0, 1000), null, 2), "utf8");

    // Send email
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
      replyTo: sanitized.email,
      subject: `📩 ${sanitized.subject} — New Message`,
      html: `
        <p><strong>Name:</strong> ${sanitized.name}</p>
        <p><strong>Email:</strong> ${sanitized.email}</p>
        <p><strong>Subject:</strong> ${sanitized.subject}</p>
        <p><strong>Message:</strong></p>
        <p>${sanitized.message.replace(/\n/g, "<br>")}</p>
      `,
    });

    return res.status(200).json({ ok: true, message: "Message sent!" });
  } catch (err) {
    console.error("Email error:", err);
    return res.status(500).json({ ok: false, error: "Failed to send email." });
  }
}
