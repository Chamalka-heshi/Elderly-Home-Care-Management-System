/* eslint-disable prettier/prettier */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST') || 'smtp.gmail.com',
      port: this.configService.get<number>('SMTP_PORT') || 587,
      secure: this.configService.get<string>('SMTP_SECURE') === 'true',
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });
  }

  /**
   * Sends account credentials email to a newly created Admin / Doctor / Caregiver.
   *
   * The password shown in the email is composed of the fixed prefix "CareHome@"
   * followed by the user's contact number  —  e.g.  CareHome@0771234567
   * The full password is NOT displayed; only its structure is revealed so the
   * recipient can reconstruct it from their contact number.
   */
  async sendAccountCredentials(
    email: string,
    fullName: string,
    role: string,
    contactNumber: string,
  ): Promise<void> {
    const systemName =
      this.configService.get<string>('SYSTEM_NAME') || 'Care Home System';
    const fromAddress =
      this.configService.get<string>('MAIL_FROM') ||
      `${systemName} <${this.configService.get<string>('SMTP_USER')}>`;

    const appUrl =
      this.configService.get<string>('APP_URL') || 'http://localhost:5173';

    const htmlBody = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>Account Created – Care Home</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f1f5f9; margin: 0; padding: 0; }
          .wrapper { max-width: 560px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
          .header  { background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 32px 40px; text-align: center; }
          .header h1 { color: #fff; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
          .header p  { color: rgba(255,255,255,0.85); margin: 6px 0 0; font-size: 14px; }
          .body { padding: 36px 40px; }
          .body p { color: #475569; font-size: 15px; line-height: 1.7; margin: 0 0 16px; }
          .cred-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px 24px; margin: 24px 0; }
          .cred-row { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
          .cred-row:last-child { margin-bottom: 0; }
          .cred-label { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; color: #94a3b8; width: 90px; flex-shrink: 0; }
          .cred-value { font-size: 14px; font-weight: 600; color: #0f172a; word-break: break-all; }
          .pw-hint { background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 10px; padding: 14px 18px; margin: 0 0 24px; }
          .pw-hint p { color: #065f46; font-size: 13px; margin: 0; }
          .pw-hint strong { display: block; font-size: 15px; letter-spacing: 0.3px; margin-top: 6px; color: #047857; }
          .btn { display: inline-block; background: linear-gradient(135deg,#059669,#047857); color: #fff !important; padding: 13px 28px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 14px; margin: 8px 0 20px; }
          .warning { background: #fff7ed; border: 1px solid #fed7aa; border-radius: 10px; padding: 14px 18px; color: #9a3412; font-size: 13px; }
          .footer { background: #f8fafc; padding: 20px 40px; text-align: center; color: #94a3b8; font-size: 12px; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="header">
            <h1>🏥 Care Home System</h1>
            <p>Your ${role} account is ready</p>
          </div>
          <div class="body">
            <p>Hello <strong>${fullName}</strong>,</p>
            <p>
              An administrator has created a <strong>${role}</strong> account for you on the
              Care Home Management System. Your login credentials are below.
            </p>

            <div class="cred-box">
              <div class="cred-row">
                <span class="cred-label">Email</span>
                <span class="cred-value">${email}</span>
              </div>
              <div class="cred-row">
                <span class="cred-label">Password</span>
                <span class="cred-value">CareHome@"contactNumber"</span>
              </div>
            </div>

            <div class="pw-hint">
              <p>
                Your temporary password follows this pattern:
                <strong>CareHome@ + your contact number</strong>
              </p>
            </div>

            <a href="${appUrl}/login" class="btn">Login to Care Home →</a>

            <div class="warning">
              ⚠️ <strong>Action required:</strong> You will be asked to set a new
              password immediately after your first login. Please do not share
              these credentials with anyone.
            </div>
          </div>
          <div class="footer">
            © ${new Date().getFullYear()} Care Home Management System &nbsp;·&nbsp; This is an automated message — please do not reply.
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await this.transporter.sendMail({
        from: fromAddress,
        to: email,
        subject: `Your Care Home ${role} Account – Login Credentials`,
        html: htmlBody,
      });
      this.logger.log(`Credentials email sent to ${email} (${role})`);
    } catch (err) {
      // Log but don't throw — account creation should still succeed even if
      // the mail server is temporarily unavailable.
      this.logger.error(`Failed to send credentials email to ${email}`, err);
    }
  }


  async buildReplyEmailHtml(opts: {
    recipientName: string;
    reply:         string;
    originalMsg:   string;
    systemName:    string;
    phonePrimary:  string;
    systemEmail:   string;
  }): Promise<string> {
    const safeReply = opts.reply.replace(/\n/g, '<br>');
    const safeMsg   = opts.originalMsg.replace(/\n/g, '<br>');

    return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0"
             style="background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08);max-width:600px;">

        <!-- Header -->
        <tr>
          <td style="background:#2563eb;padding:28px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:22px;letter-spacing:.5px;">${opts.systemName}</h1>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 40px;">
            <p style="margin:0 0 8px;font-size:16px;color:#111827;">
              Dear <strong>${opts.recipientName}</strong>,
            </p>
            <p style="margin:0 0 24px;font-size:14px;color:#6b7280;">
              Thank you for contacting us. Our team has reviewed your enquiry and provided the following response:
            </p>

            <!-- Reply box -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#eff6ff;border-left:4px solid #2563eb;border-radius:6px;padding:20px 24px;">
                  <p style="margin:0;font-size:15px;line-height:1.6;color:#1e3a5f;">${safeReply}</p>
                </td>
              </tr>
            </table>

            <hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0;">

            <!-- Original message -->
            <p style="margin:0 0 6px;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:.6px;">
              Your original message
            </p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#f9fafb;border-left:3px solid #d1d5db;border-radius:4px;padding:14px 18px;">
                  <p style="margin:0;font-size:13px;line-height:1.6;color:#6b7280;">${safeMsg}</p>
                </td>
              </tr>
            </table>

            <p style="margin:28px 0 8px;font-size:14px;color:#374151;">
              If you have any further questions, please don't hesitate to contact us:
            </p>

            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:4px 0;font-size:14px;color:#374151;">
                  &#128222; <strong>${opts.phonePrimary}</strong>
                </td>
              </tr>
              <tr>
                <td style="padding:4px 0;font-size:14px;color:#374151;">
                  &#9993;&#65039; <a href="mailto:${opts.systemEmail}"
                      style="color:#2563eb;text-decoration:none;">${opts.systemEmail}</a>
                </td>
              </tr>
            </table>

            <p style="margin:32px 0 0;font-size:14px;color:#374151;">
              Warm regards,<br>
              <strong>${opts.systemName} Team</strong>
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;padding:18px 40px;text-align:center;border-top:1px solid #e5e7eb;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">
              This is an automated response. Please do not reply directly to this email.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
  }
}
