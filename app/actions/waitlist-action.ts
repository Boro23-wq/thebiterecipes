"use server";

import { db } from "@/db";
import { waitlist } from "@/db/schema";
import { eq } from "drizzle-orm";

export type WaitlistResult =
  | { success: true }
  | {
      success: false;
      error: "already_joined" | "invalid_email" | "server_error";
    };

export async function joinWaitlist(email: string): Promise<WaitlistResult> {
  const trimmed = email.trim().toLowerCase();

  if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return { success: false, error: "invalid_email" };
  }

  try {
    const existing = await db
      .select()
      .from(waitlist)
      .where(eq(waitlist.email, trimmed))
      .limit(1);

    if (existing.length > 0) {
      return { success: false, error: "already_joined" };
    }

    await db.insert(waitlist).values({ email: trimmed });

    if (process.env.RESEND_API_KEY) {
      await sendConfirmationEmail(trimmed).catch((e) =>
        console.error("[waitlist] resend failed:", e),
      );
    }

    return { success: true };
  } catch (err) {
    console.error("[waitlist] error:", err);
    return { success: false, error: "server_error" };
  }
}

async function sendConfirmationEmail(email: string) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>You're on the Bite waitlist</title>
</head>
<body style="margin:0; padding:0; background:#FEFEFE; font-family: 'Georgia', serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FEFEFE; padding: 48px 24px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

          <!-- Logo row -->
          <tr>
            <td style="padding-bottom: 40px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width:30px; height:30px; background:#FF6B35; border-radius:4px; text-align:center; vertical-align:middle; font-size:14px; line-height:30px;">
                    🍴
                  </td>
                  <td style="padding-left:10px; font-size:20px; font-weight:700; color:#1a1a1a; vertical-align:middle; font-family:Georgia,serif;">
                    bite
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Headline -->
          <tr>
            <td style="padding-bottom:16px;">
              <h1 style="margin:0; font-size:36px; font-weight:900; color:#1a1a1a; line-height:1.08; letter-spacing:-1px; font-family:Georgia,serif;">
                You're in line.
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding-bottom:36px;">
              <p style="margin:0; font-size:16px; color:#555; line-height:1.75; font-family:Georgia,serif;">
                Thanks for joining the Bite waitlist. We're putting the finishing touches on early access — you'll be among the first to know the moment it opens.
              </p>
            </td>
          </tr>

          <!-- What to expect block -->
          <tr>
            <td style="padding-bottom:40px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #F0EDE9; border-radius:4px; overflow:hidden;">
                <tr>
                  <td style="background:#FAFAFA; padding:20px 24px; border-bottom:1px solid #F0EDE9;">
                    <p style="margin:0; font-size:11px; text-transform:uppercase; letter-spacing:0.1em; color:#999; font-family:'Courier New',monospace;">
                      What's coming
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="background:#fff; padding:20px 24px;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-bottom:12px;">
                          <span style="color:#FF6B35; margin-right:10px; font-size:14px;">→</span>
                          <span style="font-size:14px; color:#444;">Import recipes from TikTok, YouTube, Instagram + 100 sites</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom:12px;">
                          <span style="color:#FF6B35; margin-right:10px; font-size:14px;">→</span>
                          <span style="font-size:14px; color:#444;">AI extraction powered by Gemini 2.5 Flash</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom:12px;">
                          <span style="color:#FF6B35; margin-right:10px; font-size:14px;">→</span>
                          <span style="font-size:14px; color:#444;">Cook Mode with timers, voice commands and Wake Lock</span>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <span style="color:#FF6B35; margin-right:10px; font-size:14px;">→</span>
                          <span style="font-size:14px; color:#444;">Meal planning + auto-generated grocery lists</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Divider + footer -->
          <tr>
            <td style="border-top:1px solid #F0EDE9; padding-top:24px;">
              <p style="margin:0; font-size:12px; color:#aaa; line-height:1.6; font-family:'Courier New',monospace;">
                Bite · biterecipes.app<br/>
                You received this because you joined the waitlist at biterecipes.app.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Bite <hello@biterecipes.app>",
      to: email,
      subject: "You're on the Bite waitlist 🍴",
      html,
    }),
  });

  if (!res.ok) throw new Error(await res.text());
}
