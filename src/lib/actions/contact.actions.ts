"use server";

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export async function sendContactEmail(data: ContactFormData) {
  try {
    await resend.emails.send({
      from: "Contact Form <contact@iacaiace.ro>",
      to: "your-email@iacaiace.ro", // Replace with your email
      subject: `Contact Form: ${data.subject}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 5px; }
              .content { padding: 20px; background-color: white; border-radius: 5px; }
              .message-box { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; }
              .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="color: #6366f1; margin: 0;">New Contact Form Submission</h1>
              </div>
              <div class="content">
                <div class="message-box">
                  <p><strong>From:</strong> ${data.name} (${data.email})</p>
                  <p><strong>Subject:</strong> ${data.subject}</p>
                  <h2>Message:</h2>
                  <p style="white-space: pre-wrap;">${data.message}</p>
                </div>
              </div>
              <div class="footer">
                <p>&copy; ${new Date().getFullYear()} iaCaiace.ro. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to send email",
    };
  }
}
