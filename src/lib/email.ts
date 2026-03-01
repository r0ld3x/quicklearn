import { Resend } from "resend";
import { SITE_URL } from "@/lib/constants";

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

export async function sendOtpEmail(email: string, code: string): Promise<void> {
  if (process.env.SEND_EMAIL !== "true") {
    console.log(
      `[DEV] OTP for ${email}: ${code} (email sending disabled — set SEND_EMAIL=true to enable)`,
    );
    return;
  }

  const resend = getResendClient();
  if (!resend) {
    throw new Error("Email service not configured. Set RESEND_API_KEY.");
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 20px;">
          <tr>
            <td align="center">
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width:460px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
                <tr>
                  <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 40px;text-align:center;">
                    <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:-0.5px;">QuickLearn</h1>
                    <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">AI-Powered Learning Platform</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:40px;">
                    <h2 style="margin:0 0 8px;color:#18181b;font-size:20px;font-weight:600;">Verify your email</h2>
                    <p style="margin:0 0 24px;color:#71717a;font-size:15px;line-height:1.6;">
                      Enter the code below to sign in to your QuickLearn account. This code expires in 5 minutes.
                    </p>
                    <div style="background-color:#f4f4f5;border-radius:8px;padding:20px;text-align:center;margin-bottom:24px;">
                      <span style="font-size:32px;font-weight:700;letter-spacing:6px;color:#18181b;">${code}</span>
                    </div>
                    <p style="margin:0;color:#a1a1aa;font-size:13px;line-height:1.5;">
                      If you didn't request this code, you can safely ignore this email.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 40px;background-color:#fafafa;border-top:1px solid #f4f4f5;text-align:center;">
                    <p style="margin:0;color:#a1a1aa;font-size:12px;">
                      <a href="${SITE_URL}" style="color:#6366f1;text-decoration:none;">QuickLearn</a> — ${SITE_URL}
                    </p>
                    <p style="margin:8px 0 0;color:#a1a1aa;font-size:12px;">&copy; ${new Date().getFullYear()} QuickLearn. All rights reserved.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  const from = process.env.MAIL_FROM || "QuickLearn <noreply@quicklearn.me>";
  const { data, error } = await resend.emails.send({
    from,
    to: email,
    subject: `${code} is your QuickLearn verification code`,
    html,
  });

  if (error) {
    console.error("[EMAIL] Resend error:", error);
    throw new Error(`Failed to send email: ${error.message}`);
  }

  console.log("[EMAIL] Sent OTP to", email, "| id:", data?.id);
}
