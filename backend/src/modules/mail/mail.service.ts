import { 
  Injectable, 
  Logger, 
  OnModuleInit 
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer    from 'nodemailer';

import { MedicineItem } from '../prescription/entities/prescription.entity';

interface CredentialsEmailOpts {
  fullName:          string;
  email:             string;
  role:              string;
  temporaryPassword: string;
}

interface PasswordResetEmailOpts {
  fullName:     string;
  email:        string;
  tempPassword: string;
}

interface ReplyEmailOpts {
  recipientName: string;
  reply:         string;
  originalMsg:   string;
  phonePrimary:  string;
  systemEmail:   string;
}

interface PrescriptionEmailOpts {
  familyMemberName: string;
  patientName:      string;
  doctorName:       string;
  prescriptions: {
    issuedDate:       string;
    validUntil?:      string;
    diagnosis?:       string;
    notes?:           string;
    medicines:        MedicineItem[];
  }[];
}

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host:   this.configService.get<string>('SMTP_HOST') || 'smtp.gmail.com',
      port:   this.configService.get<number>('SMTP_PORT') || 587,
      secure: this.configService.get<string>('SMTP_SECURE') === 'true',
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });
  }

  // Verifies mail server connectivity at startup to ensure notification reliability
  async onModuleInit(): Promise<void> {
    try {
      await this.transporter.verify();
      this.logger.log('SMTP transporter verified successfully');
    } catch (err) {
      this.logger.warn(
        `SMTP verification failed — emails may not send: ${this.errMsg(err)}`,
      );
    }
  }

  private get systemName(): string {
    return this.configService.get<string>('SYSTEM_NAME') || 'Care Home System';
  }

  private get appUrl(): string {
    return this.configService.get<string>('APP_URL') || 'http://localhost:5173';
  }

  private get defaultFromAddress(): string {
    const user =
      this.configService.get<string>('MAIL_FROM') ||
      this.configService.get<string>('SMTP_USER') ||
      '';
    return `"${this.systemName}" <${user}>`;
  }

  private errMsg(err: unknown): string {
    return err instanceof Error ? err.message : String(err);
  }

  // Provides a generic entry point for dispatching custom email payloads
  async sendMail(options: nodemailer.SendMailOptions): Promise<void> {
    await this.transporter.sendMail(options);
  }

  // Delivers login access to new users to enable immediate system onboarding
  async sendAccountCredentials(
    email:             string,
    fullName:          string,
    role:              string,
    temporaryPassword: string,
  ): Promise<void> {
    const html = this.buildCredentialsHtml({ fullName, email, role, temporaryPassword });

    try {
      await this.transporter.sendMail({
        from:    this.defaultFromAddress,
        to:      `"${fullName}" <${email}>`,
        subject: `Welcome to ${this.systemName} — Your ${role} Account is Ready`,
        html,
      });
      this.logger.log(`Credentials email sent → ${email} (${role})`);
    } catch (err) {
      this.logger.error(`Failed to send credentials email → ${email}: ${this.errMsg(err)}`);
    }
  }

  // Safely transmits temporary recovery passwords to locked-out users
  async sendPasswordResetEmail(
    email:        string,
    fullName:     string,
    tempPassword: string,
  ): Promise<void> {
    const html = this.buildPasswordResetHtml({ fullName, email, tempPassword });

    try {
      await this.transporter.sendMail({
        from:    this.defaultFromAddress,
        to:      `"${fullName}" <${email}>`,
        subject: `${this.systemName} — Your Temporary Password`,
        html,
      });
      this.logger.log(`Password-reset email sent → ${email}`);
    } catch (err) {
      this.logger.error(`Failed to send password-reset email → ${email}: ${this.errMsg(err)}`);
      throw err;
    }
  }

  // Automates formal administrative responses to user inquiries
  async sendReplyEmail(
    recipientName:  string,
    recipientEmail: string,
    reply:          string,
    originalMsg:    string,
    phonePrimary:   string,
    systemEmail:    string,
  ): Promise<void> {
    const html = this.buildReplyHtml({ recipientName, reply, originalMsg, phonePrimary, systemEmail });

    try {
      await this.transporter.sendMail({
        from:    `"${this.systemName}" <${systemEmail}>`,
        to:      `"${recipientName}" <${recipientEmail}>`,
        subject: `Re: Your Enquiry — ${this.systemName}`,
        html,
      });
      this.logger.log(`Reply email sent → ${recipientEmail}`);
    } catch (err) {
      this.logger.error(`Failed to send reply email → ${recipientEmail}: ${this.errMsg(err)}`);
    }
  }

  // Informs family members of clinical updates to ensure medication compliance
  async sendPrescriptionNotification(opts: PrescriptionEmailOpts & { to: string }): Promise<void> {
    const html = this.buildPrescriptionHtml(opts);

    try {
      await this.transporter.sendMail({
        from:    this.defaultFromAddress,
        to:      `"${opts.familyMemberName}" <${opts.to}>`,
        subject: `New Prescription for ${opts.patientName} — ${this.systemName}`,
        html,
      });
      this.logger.log(`Prescription notification sent → ${opts.to}`);
    } catch (err) {
      this.logger.error(`Failed to send prescription notification → ${opts.to}: ${this.errMsg(err)}`);
    }
  }

  // Generates a branded HTML layout for delivering temporary recovery credentials
  private buildPasswordResetHtml(opts: PasswordResetEmailOpts): string {
    const { fullName, email, tempPassword } = opts;
    const year = new Date().getFullYear();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Password Reset – ${this.systemName}</title>
  <style>
    body        { font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif; background:#f1f5f9; margin:0; padding:0; }
    .wrapper    { max-width:560px; margin:40px auto; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,.08); }
    .header     { background:linear-gradient(135deg,#059669 0%,#047857 100%); padding:32px 40px; text-align:center; }
    .header h1  { color:#fff; margin:0; font-size:22px; font-weight:800; letter-spacing:-.5px; }
    .header p   { color:rgba(255,255,255,.85); margin:6px 0 0; font-size:14px; }
    .body       { padding:36px 40px; }
    .body p     { color:#475569; font-size:15px; line-height:1.7; margin:0 0 16px; }
    .cred-box   { background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:20px 24px; margin:24px 0; }
    .cred-table { width:100%; border-collapse:collapse; }
    .cred-table tr + tr td { padding-top:12px; }
    .cred-label { font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:.6px; color:#94a3b8; width:90px; white-space:nowrap; vertical-align:middle; padding-right:10px; }
    .cred-value { font-size:14px; font-weight:600; color:#0f172a; word-break:break-all; vertical-align:middle; }
    .pw-value   { font-family:monospace; font-size:18px; font-weight:800; color:#047857; background:#ecfdf5; border:1px solid #a7f3d0; border-radius:8px; padding:8px 16px; letter-spacing:2px; display:inline-block; }
    .warning    { background:#fff7ed; border:1px solid #fed7aa; border-radius:10px; padding:14px 18px; color:#9a3412; font-size:13px; line-height:1.6; }
    .footer     { background:#f8fafc; padding:20px 40px; text-align:center; color:#94a3b8; font-size:12px; border-top:1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>🏥 ${this.systemName}</h1>
      <p>Password Reset Request</p>
    </div>
    <div class="body">
      <p>Hello <strong>${fullName}</strong>,</p>
      <p>We received a password reset request for your account. Use the temporary password below to set a new password. It will expire once used.</p>
      <div class="cred-box">
        <table class="cred-table">
          <tr>
            <td class="cred-label">Email</td>
            <td class="cred-value">${email}</td>
          </tr>
          <tr>
            <td class="cred-label">Temp Password</td>
            <td class="cred-value"><span class="pw-value">${tempPassword}</span></td>
          </tr>
        </table>
      </div>
      <div class="warning">
        ⚠️ <strong>Security notice:</strong> This temporary password is valid for a single use only. After entering it, you will be prompted to choose a new personal password. If you did not request a password reset, please contact support immediately — someone may have access to your account.
      </div>
    </div>
    <div class="footer">
      © ${year} ${this.systemName} &nbsp;·&nbsp; Automated message — please do not reply.
    </div>
  </div>
</body>
</html>`;
  }

  // Constructs a welcoming template with initial login credentials for new accounts
  private buildCredentialsHtml(opts: CredentialsEmailOpts): string {
    const { fullName, email, role, temporaryPassword } = opts;
    const year = new Date().getFullYear();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Account Created – ${this.systemName}</title>
  <style>
    body        { font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif; background:#f1f5f9; margin:0; padding:0; }
    .wrapper    { max-width:560px; margin:40px auto; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,.08); }
    .header     { background:linear-gradient(135deg,#059669 0%,#047857 100%); padding:32px 40px; text-align:center; }
    .header h1  { color:#fff; margin:0; font-size:22px; font-weight:800; letter-spacing:-.5px; }
    .header p   { color:rgba(255,255,255,.85); margin:6px 0 0; font-size:14px; }
    .body       { padding:36px 40px; }
    .body p     { color:#475569; font-size:15px; line-height:1.7; margin:0 0 16px; }
    .cred-box   { background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:20px 24px; margin:24px 0; }
    .cred-table { width:100%; border-collapse:collapse; }
    .cred-table tr + tr td { padding-top:12px; }
    .cred-label { font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:.6px; color:#94a3b8; width:90px; white-space:nowrap; vertical-align:middle; padding-right:10px; }
    .cred-value { font-size:14px; font-weight:600; color:#0f172a; word-break:break-all; vertical-align:middle; }
    .pw-value   { font-family:monospace; font-size:16px; font-weight:800; color:#047857; background:#ecfdf5; border:1px solid #a7f3d0; border-radius:8px; padding:6px 12px; letter-spacing:.5px; }
    .btn        { display:inline-block; background:linear-gradient(135deg,#059669,#047857); color:#fff !important; padding:13px 28px; border-radius:10px; text-decoration:none; font-weight:700; font-size:14px; margin:8px 0 20px; }
    .warning    { background:#fff7ed; border:1px solid #fed7aa; border-radius:10px; padding:14px 18px; color:#9a3412; font-size:13px; }
    .footer     { background:#f8fafc; padding:20px 40px; text-align:center; color:#94a3b8; font-size:12px; border-top:1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>🏥 ${this.systemName}</h1>
      <p>Your ${role} account is ready</p>
    </div>
    <div class="body">
      <p>Hello <strong>${fullName}</strong>,</p>
      <p>An administrator has created a <strong>${role}</strong> account for you on the ${this.systemName}. Your one-time login credentials are below.</p>
      <div class="cred-box">
        <table class="cred-table">
          <tr>
            <td class="cred-label">Email</td>
            <td class="cred-value">${email}</td>
          </tr>
          <tr>
            <td class="cred-label">Password</td>
            <td class="cred-value"><span class="pw-value">${temporaryPassword}</span></td>
          </tr>
        </table>
      </div>
      <a href="${this.appUrl}/login" class="btn">Login to ${this.systemName} →</a>
      <div class="warning">
        ⚠️ <strong>Action required:</strong> You will be asked to set a new personal password immediately after your first login. This temporary password will stop working once you change it. Do <strong>not</strong> share these credentials with anyone.
      </div>
    </div>
    <div class="footer">
      © ${year} ${this.systemName} &nbsp;·&nbsp; Automated message — please do not reply.
    </div>
  </div>
</body>
</html>`;
  }

  // Formats a detailed clinical instruction layout for clear presentation to family members
  private buildPrescriptionHtml(opts: PrescriptionEmailOpts): string {
    const {
      familyMemberName, patientName, doctorName,
      prescriptions,
    } = opts;
    const year = new Date().getFullYear();

    const prescriptionBlocks = prescriptions.map((p, index) => {
      const medicineRows = p.medicines.map((m) => `
        <tr>
          <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#0f172a;font-weight:600;">${m.medicineName}</td>
          <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#475569;">${m.dosage}</td>
          <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#475569;">${m.frequency}</td>
          <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#475569;">${m.durationDays} day${m.durationDays !== 1 ? 's' : ''}</td>
          <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#64748b;">${m.instructions ?? '—'}</td>
        </tr>`).join('');

      const diagnosisBlock = p.diagnosis ? `
        <tr>
          <td style="padding:10px 0;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#94a3b8;width:130px;">Diagnosis</td>
          <td style="padding:10px 0;font-size:15px;color:#0f172a;">${p.diagnosis}</td>
        </tr>` : '';

      const notesBlock = p.notes ? `
        <tr>
          <td style="padding:10px 0;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#94a3b8;vertical-align:top;">Notes</td>
          <td style="padding:10px 0;font-size:15px;color:#0f172a;line-height:1.6;">${p.notes.replace(/\n/g, '<br>')}</td>
        </tr>` : '';

      const validUntilBlock = p.validUntil ? `
        <tr>
          <td style="padding:10px 0;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#94a3b8;">Valid Until</td>
          <td style="padding:10px 0;font-size:15px;color:#0f172a;">${p.validUntil}</td>
        </tr>` : '';

      return `
        <tr>
          <td style="padding:24px 40px 0;">
            <p style="margin:0 0 12px;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:#059669;">📝 Prescription ${prescriptions.length > 1 ? `#${index + 1}` : ''}</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px 24px;margin-bottom:16px;">
              <tr>
                <td style="padding:10px 0;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#94a3b8;width:130px;">Issued Date</td>
                <td style="padding:10px 0;font-size:15px;color:#0f172a;">${p.issuedDate}</td>
              </tr>
              ${validUntilBlock}
              ${diagnosisBlock}
              ${notesBlock}
            </table>
            
            <p style="margin:0 0 12px;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:#64748b;">💊 Prescribed Medicines</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;border-collapse:collapse;margin-bottom:16px;">
              <thead>
                <tr style="background:#f1f5f9;">
                  <th style="padding:10px 14px;text-align:left;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#64748b;">Medicine</th>
                  <th style="padding:10px 14px;text-align:left;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#64748b;">Dosage</th>
                  <th style="padding:10px 14px;text-align:left;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#64748b;">Frequency</th>
                  <th style="padding:10px 14px;text-align:left;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#64748b;">Duration</th>
                  <th style="padding:10px 14px;text-align:left;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#64748b;">Instructions</th>
                </tr>
              </thead>
              <tbody>${medicineRows}</tbody>
            </table>
          </td>
        </tr>
      `;
    }).join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Active Prescriptions Update — ${this.systemName}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);max-width:600px;">
        <tr>
          <td style="background:linear-gradient(135deg,#059669 0%,#047857 100%);padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-.5px;">🏥 ${this.systemName}</h1>
            <p style="margin:8px 0 0;color:rgba(255,255,255,.85);font-size:14px;">Active Prescriptions Update</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 40px 0;">
            <p style="margin:0 0 8px;font-size:16px;color:#0f172a;">Dear <strong>${familyMemberName}</strong>,</p>
            <p style="margin:0;font-size:15px;color:#475569;line-height:1.7;">Dr. <strong>${doctorName}</strong> has updated the prescriptions for <strong>${patientName}</strong>. Please find the full details of all active prescriptions below.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 40px 0;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px 24px;">
              <tr>
                <td style="padding:10px 0;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#94a3b8;width:130px;">Patient</td>
                <td style="padding:10px 0;font-size:15px;color:#0f172a;font-weight:600;">${patientName}</td>
              </tr>
              <tr>
                <td style="padding:10px 0;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#94a3b8;">Doctor</td>
                <td style="padding:10px 0;font-size:15px;color:#0f172a;">Dr. ${doctorName}</td>
              </tr>
            </table>
          </td>
        </tr>
        ${prescriptionBlocks}
        <tr>
          <td style="padding:24px 40px 0;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:10px;">
              <tr>
                <td style="padding:14px 18px;font-size:13px;color:#065f46;line-height:1.6;">
                  ℹ️ You can view these prescriptions at any time by logging into your <a href="${this.appUrl}" style="color:#059669;font-weight:600;">family member dashboard</a>. If you have any questions, please contact the clinic directly.
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 40px;text-align:center;border-top:1px solid #e2e8f0;margin-top:28px;">
            <p style="margin:0;font-size:12px;color:#94a3b8;">© ${year} ${this.systemName} &nbsp;·&nbsp; Automated message — please do not reply.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  }

  // Generates a professional reply template that quotes the user's original inquiry for context
  private buildReplyHtml(opts: ReplyEmailOpts): string {
    const { recipientName, reply, originalMsg, phonePrimary, systemEmail } = opts;
    const safeReply = reply.replace(/\n/g, '<br>');
    const safeMsg   = originalMsg.replace(/\n/g, '<br>');
    const year      = new Date().getFullYear();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Re: Your Enquiry – ${this.systemName}</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08);max-width:600px;">
        <tr>
          <td style="background:linear-gradient(135deg,#059669 0%,#047857 100%);padding:28px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:22px;letter-spacing:.5px;">🏥 ${this.systemName}</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px;">
            <p style="margin:0 0 8px;font-size:16px;color:#111827;">Dear <strong>${recipientName}</strong>,</p>
            <p style="margin:0 0 24px;font-size:14px;color:#6b7280;">Thank you for contacting us. Our team has reviewed your enquiry and provided the following response:</p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#ecfdf5;border-left:4px solid #059669;border-radius:6px;padding:20px 24px;">
                  <p style="margin:0;font-size:15px;line-height:1.6;color:#065f46;">${safeReply}</p>
                </td>
              </tr>
            </table>
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0;">
            <p style="margin:0 0 6px;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:.6px;">Your original message</p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#f9fafb;border-left:3px solid #d1d5db;border-radius:4px;padding:14px 18px;">
                  <p style="margin:0;font-size:13px;line-height:1.6;color:#6b7280;">${safeMsg}</p>
                </td>
              </tr>
            </table>
            <p style="margin:28px 0 8px;font-size:14px;color:#374151;">If you have any further questions, please don't hesitate to reach out:</p>
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:4px 0;font-size:14px;color:#374151;">📞 <strong>${phonePrimary}</strong></td>
              </tr>
              <tr>
                <td style="padding:4px 0;font-size:14px;color:#374151;">✉️ <a href="mailto:${systemEmail}" style="color:#059669;text-decoration:none;">${systemEmail}</a></td>
              </tr>
            </table>
            <p style="margin:32px 0 0;font-size:14px;color:#374151;">Warm regards,<br><strong>${this.systemName} Team</strong></p>
          </td>
        </tr>
        <tr>
          <td style="background:#f9fafb;padding:18px 40px;text-align:center;border-top:1px solid #e5e7eb;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">© ${year} ${this.systemName} &nbsp;·&nbsp; Automated message — please do not reply.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  }
}