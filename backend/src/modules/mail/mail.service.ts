import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

import { MedicineItem } from '../prescription/entities/prescription.entity';

interface CredentialsEmailOpts {
  fullName: string;
  email: string;
  role: string;
  temporaryPassword: string;
}

interface PasswordResetEmailOpts {
  fullName: string;
  email: string;
  tempPassword: string;
}

interface ReplyEmailOpts {
  recipientName: string;
  reply: string;
  originalMsg: string;
  phonePrimary: string;
  systemEmail: string;
}

interface PrescriptionEmailOpts {
  familyMemberName: string;
  patientName: string;
  doctorName: string;
  prescriptions: {
    issuedDate: string;
    validUntil?: string;
    diagnosis?: string;
    notes?: string;
    medicines: MedicineItem[];
  }[];
}

interface LoginNotificationOpts {
  fullName: string;
  email: string;
  role: string;
  loginTime: string;
  phone: string;
  contactEmail: string;
}

interface ReceiptEmailOpts {
  /** Family member's full name and email address */
  familyMemberName: string;
  to: string;
  /** Unique payment id used to build receipt number */
  paymentId: string;
  paymentMethod: 'card' | 'bank_transfer';
  /** ISO date string when the payment was created / approved */
  paidAt: string;
  amount: number;
  /** 'appointment' | 'care_plan' */
  serviceType: 'appointment' | 'care_plan';
  /** Patient the service is for */
  patientName: string;
  // ── appointment-specific (optional) ──────────────────────────────────────
  doctorName?: string;
  appointmentDate?: string;
  appointmentStartTime?: string;
  appointmentEndTime?: string;
  consultationFee?: number;
  careHomeFee?: number;
  // ── care-plan-specific (optional) ────────────────────────────────────────
  carePlanName?: string;
  carePlanDuration?: string;
}

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
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
    email: string,
    fullName: string,
    role: string,
    temporaryPassword: string,
  ): Promise<void> {
    const html = this.buildCredentialsHtml({
      fullName,
      email,
      role,
      temporaryPassword,
    });

    try {
      await this.transporter.sendMail({
        from: this.defaultFromAddress,
        to: `"${fullName}" <${email}>`,
        subject: `Welcome to ${this.systemName} — Your ${role} Account is Ready`,
        html,
      });
      this.logger.log(`Credentials email sent → ${email} (${role})`);
    } catch (err) {
      this.logger.error(
        `Failed to send credentials email → ${email}: ${this.errMsg(err)}`,
      );
    }
  }

  // Safely transmits temporary recovery passwords to locked-out users
  async sendPasswordResetEmail(
    email: string,
    fullName: string,
    tempPassword: string,
  ): Promise<void> {
    const html = this.buildPasswordResetHtml({ fullName, email, tempPassword });

    try {
      await this.transporter.sendMail({
        from: this.defaultFromAddress,
        to: `"${fullName}" <${email}>`,
        subject: `${this.systemName} — Your Temporary Password`,
        html,
      });
      this.logger.log(`Password-reset email sent → ${email}`);
    } catch (err) {
      this.logger.error(
        `Failed to send password-reset email → ${email}: ${this.errMsg(err)}`,
      );
      throw err;
    }
  }

  // Automates formal administrative responses to user inquiries
  async sendReplyEmail(
    recipientName: string,
    recipientEmail: string,
    reply: string,
    originalMsg: string,
    phonePrimary: string,
    systemEmail: string,
  ): Promise<void> {
    const html = this.buildReplyHtml({
      recipientName,
      reply,
      originalMsg,
      phonePrimary,
      systemEmail,
    });

    try {
      await this.transporter.sendMail({
        from: `"${this.systemName}" <${systemEmail}>`,
        to: `"${recipientName}" <${recipientEmail}>`,
        subject: `Re: Your Enquiry — ${this.systemName}`,
        html,
      });
      this.logger.log(`Reply email sent → ${recipientEmail}`);
    } catch (err) {
      this.logger.error(
        `Failed to send reply email → ${recipientEmail}: ${this.errMsg(err)}`,
      );
    }
  }

  // Informs family members of clinical updates to ensure medication compliance
  async sendPrescriptionNotification(
    opts: PrescriptionEmailOpts & { to: string },
  ): Promise<void> {
    const html = this.buildPrescriptionHtml(opts);

    try {
      await this.transporter.sendMail({
        from: this.defaultFromAddress,
        to: `"${opts.familyMemberName}" <${opts.to}>`,
        subject: `New Prescription for ${opts.patientName} — ${this.systemName}`,
        html,
      });
      this.logger.log(`Prescription notification sent → ${opts.to}`);
    } catch (err) {
      this.logger.error(
        `Failed to send prescription notification → ${opts.to}: ${this.errMsg(err)}`,
      );
    }
  }

  // Dispatches an immediate security alert to privileged users upon a new session being established
  async sendLoginNotificationEmail(
    email: string,
    fullName: string,
    opts: Omit<LoginNotificationOpts, 'fullName' | 'email'>,
  ): Promise<void> {
    const html = this.buildLoginNotificationHtml({ fullName, email, ...opts });

    try {
      await this.transporter.sendMail({
        from: this.defaultFromAddress,
        to: `"${fullName}" <${email}>`,
        subject: `🔐 New Login Detected — ${this.systemName}`,
        html,
      });
      this.logger.log(`Login notification sent → ${email} (${opts.role})`);
    } catch (err) {
      // Non-fatal — log and continue; don't break the login flow
      this.logger.warn(
        `Failed to send login notification → ${email}: ${this.errMsg(err)}`,
      );
    }
  }

  // Sends an itemised payment receipt to the family member after a successful payment
  async sendPaymentReceiptEmail(opts: ReceiptEmailOpts): Promise<void> {
    const html = this.buildReceiptHtml(opts);
    const serviceLabel =
      opts.serviceType === 'appointment' ? 'Doctor Appointment' : 'Care Plan';

    try {
      await this.transporter.sendMail({
        from: this.defaultFromAddress,
        to: `"${opts.familyMemberName}" <${opts.to}>`,
        subject: `Payment Receipt — ${serviceLabel} | ${this.systemName}`,
        html,
      });
      this.logger.log(`Payment receipt email sent → ${opts.to}`);
    } catch (err) {
      this.logger.error(
        `Failed to send payment receipt email → ${opts.to}: ${this.errMsg(err)}`,
      );
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
      ©️ ${year} ${this.systemName} &nbsp;·&nbsp; Automated message — please do not reply.
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
      ©️ ${year} ${this.systemName} &nbsp;·&nbsp; Automated message — please do not reply.
    </div>
  </div>
</body>
</html>`;
  }

  // Formats a detailed clinical instruction layout for clear presentation to family members
  private buildPrescriptionHtml(opts: PrescriptionEmailOpts): string {
    const { familyMemberName, patientName, doctorName, prescriptions } = opts;
    const year = new Date().getFullYear();

    const prescriptionBlocks = prescriptions
      .map((p, index) => {
        const medicineRows = p.medicines
          .map(
            (m) => `
        <tr>
          <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#0f172a;font-weight:600;">${m.medicineName}</td>
          <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#475569;">${m.dosage}</td>
          <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#475569;">${m.frequency}</td>
          <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#475569;">${m.durationDays} day${m.durationDays !== 1 ? 's' : ''}</td>
          <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#64748b;">${m.instructions ?? '—'}</td>
        </tr>`,
          )
          .join('');

        const diagnosisBlock = p.diagnosis
          ? `
        <tr>
          <td style="padding:10px 0;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#94a3b8;width:130px;">Diagnosis</td>
          <td style="padding:10px 0;font-size:15px;color:#0f172a;">${p.diagnosis}</td>
        </tr>`
          : '';

        const notesBlock = p.notes
          ? `
        <tr>
          <td style="padding:10px 0;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#94a3b8;vertical-align:top;">Notes</td>
          <td style="padding:10px 0;font-size:15px;color:#0f172a;line-height:1.6;">${p.notes.replace(/\n/g, '<br>')}</td>
        </tr>`
          : '';

        const validUntilBlock = p.validUntil
          ? `
        <tr>
          <td style="padding:10px 0;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#94a3b8;">Valid Until</td>
          <td style="padding:10px 0;font-size:15px;color:#0f172a;">${p.validUntil}</td>
        </tr>`
          : '';

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
      })
      .join('');

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
            <p style="margin:0;font-size:12px;color:#94a3b8;">©️ ${year} ${this.systemName} &nbsp;·&nbsp; Automated message — please do not reply.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  }

  // Renders a premium security-alert email with login metadata for privileged-role accounts
  private buildLoginNotificationHtml(opts: LoginNotificationOpts): string {
    const { fullName, role, loginTime, phone, contactEmail } = opts;
    const year = new Date().getFullYear();
    const fallbackEmail =
      this.configService.get<string>('MAIL_FROM') ||
      this.configService.get<string>('SMTP_USER') ||
      '';
    const displayEmail = contactEmail || fallbackEmail;
    const displayPhone = phone || '';

    const roleLabel =
      role.charAt(0).toUpperCase() + role.slice(1).replace('_', ' ');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>New Login Detected – ${this.systemName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    body        { font-family:'Inter','Segoe UI',Tahoma,Geneva,Verdana,sans-serif; background:#0f172a; margin:0; padding:0; }
    .wrapper    { max-width:580px; margin:40px auto; background:#1e293b; border-radius:20px; overflow:hidden; box-shadow:0 25px 50px rgba(0,0,0,.5); border:1px solid #334155; }
    .header     { background:linear-gradient(135deg,#1d4ed8 0%,#4f46e5 50%,#7c3aed 100%); padding:40px; text-align:center; position:relative; }
    .header::before { content:''; position:absolute; inset:0; background:url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E"); }
    .shield     { width:64px; height:64px; background:rgba(255,255,255,.12); border-radius:50%; display:block; text-align:center; line-height:64px; margin:0 auto 16px; font-size:28px; border:2px solid rgba(255,255,255,.2); }
    .header h1  { color:#fff; margin:0 0 6px; font-size:24px; font-weight:800; letter-spacing:-.5px; position:relative; }
    .header p   { color:rgba(255,255,255,.7); margin:0; font-size:14px; position:relative; }
    .badge      { display:inline-block; background:rgba(255,255,255,.15); border:1px solid rgba(255,255,255,.25); border-radius:999px; padding:4px 14px; font-size:12px; font-weight:600; color:#fff; margin-top:12px; text-transform:uppercase; letter-spacing:.8px; position:relative; }
    .body       { padding:36px 40px; }
    .greeting   { font-size:17px; color:#e2e8f0; font-weight:600; margin:0 0 8px; }
    .subtext    { font-size:14px; color:#94a3b8; line-height:1.7; margin:0 0 28px; }
    .info-card  { background:#0f172a; border:1px solid #334155; border-radius:14px; overflow:hidden; margin-bottom:24px; }
    .info-row   { display:flex; align-items:center; padding:16px 20px; border-bottom:1px solid #1e293b; }
    .info-row:last-child { border-bottom:none; }
    .info-icon  { width:36px; height:36px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:16px; margin-right:14px; flex-shrink:0; }
    .icon-time  { background:rgba(99,102,241,.15); }
    .info-label { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.8px; color:#64748b; margin:0 0 3px; }
    .info-value { font-size:14px; font-weight:600; color:#e2e8f0; margin:0; }
    .alert-box  { background:linear-gradient(135deg,rgba(220,38,38,.1),rgba(153,27,27,.1)); border:1px solid rgba(220,38,38,.3); border-radius:14px; padding:20px 24px; margin-bottom:24px; }
    .alert-box p { margin:0; font-size:13px; color:#fca5a5; line-height:1.7; }
    .alert-box strong { color:#f87171; }
    .contact-card  { background:#0f172a; border:1px solid #334155; border-radius:14px; padding:20px 24px; margin-bottom:24px; }
    .contact-title { margin:0 0 14px; font-size:13px; font-weight:700; text-transform:uppercase; letter-spacing:.7px; color:#94a3b8; }
    .contact-row   { display:block; text-decoration:none; padding:10px 0; border-bottom:1px solid #1e293b; }
    .contact-row:last-of-type { border-bottom:none; }
    .contact-icon  { display:inline-block; width:24px; }
    .contact-val   { font-size:14px; font-weight:600; color:#a5b4fc; }
    .divider    { border:none; border-top:1px solid #334155; margin:0 0 24px; }
    .footer-txt { font-size:12px; color:#475569; text-align:center; line-height:1.6; margin:0; }
    .footer-txt a { color:#6366f1; text-decoration:none; }
    .footer     { background:#0f172a; padding:20px 40px; border-top:1px solid #334155; text-align:center; }
    .footer p   { margin:0; font-size:11px; color:#475569; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="shield">🛡️</div>
      <h1>New Login Detected</h1>
      <p>${this.systemName}</p>
      <span class="badge">${roleLabel}</span>
    </div>
    <div class="body">
      <p class="greeting">Hello ${fullName},</p>
      <p class="subtext">A new login to your <strong style="color:#a5b4fc">${roleLabel}</strong> account was just detected. Here are the details:</p>

      <div class="info-card">
        <div class="info-row">
          <div class="info-icon icon-time">🕐</div>
          <div>
            <p class="info-label">Login Time</p>
            <p class="info-value">${loginTime}</p>
          </div>
        </div>
      </div>

      <div class="alert-box">
        <p>⚠️ <strong>Wasn't you?</strong> If you did not initiate this login, your account may be compromised. Please contact your system administrator immediately and change your password.</p>
      </div>

      <div class="contact-card">
        <p class="contact-title">📞 Contact System Administrator</p>
        ${displayPhone ? `<a href="tel:${displayPhone}" class="contact-row"><span class="contact-icon">📱</span><span class="contact-val">${displayPhone}</span></a>` : ''}
        ${displayEmail ? `<a href="mailto:${displayEmail}" class="contact-row"><span class="contact-icon">✉️</span><span class="contact-val">${displayEmail}</span></a>` : ''}
      </div>

      <hr class="divider"/>
      <p class="footer-txt">If this login was initiated by you, no further action is required.<br/>For security questions, contact the admin team above.</p>
    </div>
    <div class="footer">
      <p>©️ ${year} ${this.systemName} &nbsp;·&nbsp; Automated security alert — please do not reply directly.</p>
    </div>
  </div>
</body>
</html>`;
  }

  // Generates a professional reply template that quotes the user's original inquiry for context
  private buildReplyHtml(opts: ReplyEmailOpts): string {
    const { recipientName, reply, originalMsg, phonePrimary, systemEmail } =
      opts;
    const safeReply = reply.replace(/\n/g, '<br>');
    const safeMsg = originalMsg.replace(/\n/g, '<br>');
    const year = new Date().getFullYear();

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
            <p style="margin:0;font-size:12px;color:#9ca3af;">©️ ${year} ${this.systemName} &nbsp;·&nbsp; Automated message — please do not reply.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  }

  // Builds a professional, itemised HTML receipt for appointment or care-plan payments
  private buildReceiptHtml(opts: ReceiptEmailOpts): string {
    const {
      familyMemberName,
      paymentId,
      paymentMethod,
      paidAt,
      amount,
      serviceType,
      patientName,
    } = opts;
    const year = new Date().getFullYear();
    const receiptNumber = `RCP-${paymentId.substring(0, 8).toUpperCase()}`;
    const formattedDate = new Date(paidAt).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    const formattedAmount = Number(amount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    const methodLabel =
      paymentMethod === 'card' ? '💳 Card Payment' : '🏦 Bank Transfer';
    const serviceLabel =
      serviceType === 'appointment' ? 'Doctor Appointment' : 'Care Plan Booking';

    // ── Service-specific rows ─────────────────────────────────────────────
    let serviceRows = '';
    if (serviceType === 'appointment') {
      if (opts.doctorName) {
        serviceRows += `
          <tr>
            <td class="rcpt-label">Doctor</td>
            <td class="rcpt-value">Dr. ${opts.doctorName}</td>
          </tr>`;
      }
      if (opts.appointmentDate) {
        serviceRows += `
          <tr>
            <td class="rcpt-label">Date</td>
            <td class="rcpt-value">${opts.appointmentDate}</td>
          </tr>`;
      }
      if (opts.appointmentStartTime && opts.appointmentEndTime) {
        serviceRows += `
          <tr>
            <td class="rcpt-label">Time</td>
            <td class="rcpt-value">${opts.appointmentStartTime} – ${opts.appointmentEndTime}</td>
          </tr>`;
      }
    } else {
      if (opts.carePlanName) {
        serviceRows += `
          <tr>
            <td class="rcpt-label">Care Plan</td>
            <td class="rcpt-value">${opts.carePlanName}</td>
          </tr>`;
      }
      if (opts.carePlanDuration) {
        serviceRows += `
          <tr>
            <td class="rcpt-label">Duration</td>
            <td class="rcpt-value">${opts.carePlanDuration}</td>
          </tr>`;
      }
    }

    // ── Fee breakdown (appointment only) ─────────────────────────────────
    let feeBreakdown = '';
    if (
      serviceType === 'appointment' &&
      opts.consultationFee !== undefined &&
      opts.careHomeFee !== undefined
    ) {
      feeBreakdown = `
        <tr>
          <td style="padding:20px 40px 0;">
            <p style="margin:0 0 10px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:#64748b;">Fee Breakdown</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;border-collapse:collapse;">
              <tr style="background:#f8fafc;">
                <td style="padding:10px 16px;font-size:14px;color:#475569;">Consultation Fee</td>
                <td style="padding:10px 16px;font-size:14px;color:#0f172a;font-weight:600;text-align:right;">LKR ${Number(opts.consultationFee).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr>
                <td style="padding:10px 16px;font-size:14px;color:#475569;border-top:1px solid #e2e8f0;">Care Home Fee</td>
                <td style="padding:10px 16px;font-size:14px;color:#0f172a;font-weight:600;text-align:right;border-top:1px solid #e2e8f0;">LKR ${Number(opts.careHomeFee).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
              </tr>
            </table>
          </td>
        </tr>`;
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Payment Receipt – ${this.systemName}</title>
  <style>
    body        { font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif; background:#f1f5f9; margin:0; padding:0; }
    .wrapper    { max-width:600px; margin:40px auto; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,.08); }
    .header     { background:linear-gradient(135deg,#059669 0%,#047857 100%); padding:32px 40px; text-align:center; }
    .header h1  { color:#fff; margin:0 0 4px; font-size:22px; font-weight:800; letter-spacing:-.5px; }
    .header p   { color:rgba(255,255,255,.85); margin:0; font-size:14px; }
    .rcpt-badge { display:inline-block; background:rgba(255,255,255,.2); border:1px solid rgba(255,255,255,.4); border-radius:999px; padding:4px 16px; font-size:12px; font-weight:700; color:#fff; margin-top:12px; letter-spacing:.8px; text-transform:uppercase; }
    .body       { padding:32px 40px 0; }
    .body p     { color:#475569; font-size:15px; line-height:1.7; margin:0 0 20px; }
    .rcpt-box   { background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:20px 24px; margin-bottom:20px; }
    .rcpt-table { width:100%; border-collapse:collapse; }
    .rcpt-table tr + tr td { border-top:1px solid #e2e8f0; }
    .rcpt-label { font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:.6px; color:#94a3b8; width:140px; white-space:nowrap; padding:10px 10px 10px 0; vertical-align:middle; }
    .rcpt-value { font-size:14px; font-weight:600; color:#0f172a; padding:10px 0; vertical-align:middle; }
    .total-box  { background:linear-gradient(135deg,#ecfdf5,#d1fae5); border:1px solid #a7f3d0; border-radius:12px; padding:20px 24px; margin-bottom:24px; display:flex; align-items:center; justify-content:space-between; }
    .total-lbl  { font-size:13px; font-weight:700; text-transform:uppercase; letter-spacing:.6px; color:#065f46; }
    .total-amt  { font-size:28px; font-weight:800; color:#047857; }
    .info-box   { background:#eff6ff; border:1px solid #bfdbfe; border-radius:10px; padding:14px 18px; color:#1d4ed8; font-size:13px; line-height:1.6; margin-bottom:28px; }
    .footer     { background:#f8fafc; padding:20px 40px; text-align:center; color:#94a3b8; font-size:12px; border-top:1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>🏥 ${this.systemName}</h1>
      <p>Payment Receipt</p>
      <span class="rcpt-badge">${receiptNumber}</span>
    </div>
    <div class="body">
      <p>Dear <strong>${familyMemberName}</strong>,</p>
      <p>Thank you for your payment. Please find your official receipt below for your records.</p>

      <div class="rcpt-box">
        <p style="margin:0 0 12px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:#059669;">📋 Receipt Details</p>
        <table class="rcpt-table">
          <tr>
            <td class="rcpt-label">Receipt No.</td>
            <td class="rcpt-value">${receiptNumber}</td>
          </tr>
          <tr>
            <td class="rcpt-label">Date &amp; Time</td>
            <td class="rcpt-value">${formattedDate}</td>
          </tr>
          <tr>
            <td class="rcpt-label">Payment Method</td>
            <td class="rcpt-value">${methodLabel}</td>
          </tr>
          <tr>
            <td class="rcpt-label">Service</td>
            <td class="rcpt-value">${serviceLabel}</td>
          </tr>
        </table>
      </div>

      <div class="rcpt-box">
        <p style="margin:0 0 12px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:#059669;">🩺 Service Details</p>
        <table class="rcpt-table">
          <tr>
            <td class="rcpt-label">Patient</td>
            <td class="rcpt-value">${patientName}</td>
          </tr>
          ${serviceRows}
        </table>
      </div>

      <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#ecfdf5,#d1fae5);border:1px solid #a7f3d0;border-radius:12px;margin-bottom:24px;">
        <tr>
          <td style="padding:20px 24px;">
            <p style="margin:0 0 4px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.7px;color:#065f46;">Total Amount Paid</p>
            <p style="margin:0;font-size:30px;font-weight:800;color:#047857;">LKR ${formattedAmount}</p>
          </td>
        </tr>
      </table>

      <div class="info-box">
        ℹ️ You can view all your payment history anytime by logging into your <a href="${this.appUrl}" style="color:#1d4ed8;font-weight:600;">family member dashboard</a>. If you have any questions, please contact the care home directly.
      </div>
    </div>
    ${feeBreakdown ? `<table width="100%" cellpadding="0" cellspacing="0"><${feeBreakdown}</table>` : ''}
    <div class="footer">
      ©️ ${year} ${this.systemName} &nbsp;·&nbsp; This is an automated receipt — please do not reply.
    </div>
  </div>
</body>
</html>`;
  }

  async sendBackupNotification(
    email: string,
    opts: {
      backupName: string;
      status: string;
      fileSizeBytes?: number;
      errorMessage?: string;
      notes?: string;
      completedAt?: Date;
    },
  ): Promise<void> {
    const html = this.buildBackupNotificationHtml(opts);
    const systemName = this.systemName;
    const isSuccess = opts.status === 'success';
    const subject = isSuccess
      ? `[${systemName}] Backup Completed Successfully - ${opts.backupName}`
      : `[${systemName}] Backup Creation Failed - ${opts.backupName}`;

    try {
      await this.transporter.sendMail({
        from: this.defaultFromAddress,
        to: email,
        subject,
        html,
      });
      this.logger.log(`Backup notification email sent → ${email}`);
    } catch (err) {
      this.logger.error(
        `Failed to send backup notification email → ${email}: ${this.errMsg(err)}`,
      );
    }
  }

  private buildBackupNotificationHtml(opts: {
    backupName: string;
    status: string;
    fileSizeBytes?: number;
    errorMessage?: string;
    notes?: string;
    completedAt?: Date;
  }): string {
    const isSuccess = opts.status === 'success';
    const year = new Date().getFullYear();

    const formatBytes = (bytes?: number): string => {
      if (!bytes || bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
    };

    const formattedSize = opts.fileSizeBytes ? formatBytes(opts.fileSizeBytes) : '—';
    const dateStr = opts.completedAt
      ? new Date(opts.completedAt).toLocaleString('en-US', { timeZone: 'Asia/Colombo' }) + ' (Colombo time)'
      : '—';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Database Backup Notification</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08);max-width:600px;">
        <tr>
          <td style="background:${isSuccess ? 'linear-gradient(135deg,#059669 0%,#047857 100%)' : 'linear-gradient(135deg,#dc2626 0%,#b91c1c 100%)'};padding:28px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:22px;letter-spacing:.5px;">🏥 ${this.systemName}</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px;">
            <h2 style="margin:0 0 16px;font-size:18px;color:${isSuccess ? '#059669' : '#dc2626'};">
              ${isSuccess ? '✔ Database Backup Succeeded' : '✕ Database Backup Failed'}
            </h2>
            <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">
              ${isSuccess
        ? 'A new database backup snapshot has been created successfully. Below are the details:'
        : 'An error occurred while creating the scheduled or manual database backup. Below are the details:'}
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:20px 0;">
              <tr style="border-bottom:1px solid #e5e7eb;">
                <td style="padding:10px 0;font-size:14px;font-weight:bold;color:#4b5563;width:150px;">Backup Name:</td>
                <td style="padding:10px 0;font-size:14px;color:#1f2937;font-family:monospace;">${opts.backupName}</td>
              </tr>
              <tr style="border-bottom:1px solid #e5e7eb;">
                <td style="padding:10px 0;font-size:14px;font-weight:bold;color:#4b5563;">Status:</td>
                <td style="padding:10px 0;font-size:14px;font-weight:bold;color:${isSuccess ? '#059669' : '#dc2626'};text-transform:capitalize;">${opts.status}</td>
              </tr>
              ${isSuccess ? `
              <tr style="border-bottom:1px solid #e5e7eb;">
                <td style="padding:10px 0;font-size:14px;font-weight:bold;color:#4b5563;">File Size:</td>
                <td style="padding:10px 0;font-size:14px;color:#1f2937;">${formattedSize}</td>
              </tr>
              ` : ''}
              ${!isSuccess && opts.errorMessage ? `
              <tr style="border-bottom:1px solid #e5e7eb;">
                <td style="padding:10px 0;font-size:14px;font-weight:bold;color:#dc2626;">Error Message:</td>
                <td style="padding:10px 0;font-size:14px;color:#dc2626;">${opts.errorMessage}</td>
              </tr>
              ` : ''}
              <tr style="border-bottom:1px solid #e5e7eb;">
                <td style="padding:10px 0;font-size:14px;font-weight:bold;color:#4b5563;">Completed At:</td>
                <td style="padding:10px 0;font-size:14px;color:#1f2937;">${dateStr}</td>
              </tr>
              ${opts.notes ? `
              <tr style="border-bottom:1px solid #e5e7eb;">
                <td style="padding:10px 0;font-size:14px;font-weight:bold;color:#4b5563;">Notes:</td>
                <td style="padding:10px 0;font-size:14px;color:#4b5563;font-style:italic;">${opts.notes}</td>
              </tr>
              ` : ''}
            </table>
            
            <p style="margin:32px 0 0;font-size:14px;color:#374151;line-height:1.6;">Warm regards,<br><strong>${this.systemName} System</strong></p>
          </td>
        </tr>
        <tr>
          <td style="background:#f9fafb;padding:24px 40px;text-align:center;border-top:1px solid #edf2f7;">
            <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.5;">©️ ${year} ${this.systemName} &nbsp;·&nbsp; Automated system alert — please do not reply directly.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  }
}