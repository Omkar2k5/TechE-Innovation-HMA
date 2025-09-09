import nodemailer from "nodemailer";

// Create a reusable transporter using environment configuration
export function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error("SMTP configuration missing. Please set SMTP_HOST, SMTP_USER, SMTP_PASS.");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for other ports
    auth: { user, pass },
  });
}

export async function sendOwnerWelcomeEmail({ to, hotelId, hotelName, email, password, dashboardUrl }) {
  const transporter = createTransporter();

  const subject = `Welcome to ${hotelName} Dashboard`;
  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#0f172a">
      <h2 style="color:#0ea5e9;margin:0 0 8px">Hotel Created Successfully</h2>
      <p>Your hotel <strong>${hotelName}</strong> (ID: <strong>${hotelId}</strong>) has been set up.</p>
      <p>Here are your login credentials for the dashboard:</p>
      <ul>
        <li><strong>Email:</strong> ${email}</li>
        <li><strong>Password:</strong> ${password}</li>
      </ul>
      <p>You can sign in here: <a href="${dashboardUrl}" target="_blank">${dashboardUrl}</a></p>
      <p style="font-size:12px;color:#64748b">For security, please change your password on first login.</p>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.SMTP_FROM || `"HMA" <no-reply@hma.local>`,
    to,
    subject,
    html,
  });
}