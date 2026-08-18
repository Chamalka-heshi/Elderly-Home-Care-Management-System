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

// ─────────────────────────────────────────────────────────────────────────────
// Shared HTML primitives
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the opening wrapper, header, and body-start common to every email.
 * `title`   – displayed inside the header banner (e.g. "Account Created")
 * `pretext` – short preview text for email clients (hidden in body)
 */
function emailOpen(systemName: string, title: string, pretext: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>${title} — ${systemName}</title>
</head>
<body style="margin:0;padding:0;background:#f0f4f7;font-family:'Segoe UI',Arial,Helvetica,sans-serif;">
  <!-- Preview text (hidden) -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${pretext}</div>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f7;padding:36px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0"
             style="background:#ffffff;border-radius:10px;overflow:hidden;
                    box-shadow:0 2px 16px rgba(0,0,0,.08);max-width:600px;">

        <!-- ── Header ── -->
        <tr>
          <td style="background:linear-gradient(135deg,#0d6b6b 0%,#084f4f 100%);
                     padding:30px 40px;text-align:center;">
            <p style="margin:0 0 6px;font-size:11px;font-weight:700;
                      letter-spacing:2px;text-transform:uppercase;
                      color:rgba(255,255,255,.65);">${systemName}</p>
            <h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;
                       letter-spacing:-.3px;">${title}</h1>
          </td>
        </tr>

        <!-- ── Body ── -->
        <tr>
          <td style="padding:36px 40px;">`;
}

/** Closing: footer + closing tags */
function emailClose(systemName: string, year: number): string {
  return `
          </td>
        </tr>

        <!-- ── Footer ── -->
        <tr>
          <td style="background:#f5f7f9;padding:20px 40px;text-align:center;
                     border-top:1px solid #e4e9ee;">
            <p style="margin:0;font-size:12px;color:#8a97a8;line-height:1.6;">
              &copy; ${year} ${systemName} &nbsp;&middot;&nbsp; Elderly Care Management System<br/>
              This is an automated message. Please do not reply to this email.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/** Standard paragraph style */
const P  = 'margin:0 0 18px;font-size:15px;color:#3a4a5c;line-height:1.75;';
/** Section-label above a detail card */
const SL = 'margin:0 0 10px;font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#8a97a8;';
/** Detail card wrapper */
const CARD = 'background:#f5f7f9;border:1px solid #e4e9ee;border-radius:8px;padding:20px 24px;margin-bottom:20px;';
/** Table used inside detail cards */
const DT = 'width:100%;border-collapse:collapse;';
/** Label cell inside a detail table */
const DL = 'padding:9px 12px 9px 0;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:#8a97a8;width:140px;white-space:nowrap;vertical-align:top;border-bottom:1px solid #eaeef2;';
/** Value cell inside a detail table */
const DV = 'padding:9px 0;font-size:14px;color:#1a2332;font-weight:500;vertical-align:top;border-bottom:1px solid #eaeef2;';
/** Last row — no bottom border */
const DL_LAST = 'padding:9px 12px 9px 0;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:#8a97a8;width:140px;white-space:nowrap;vertical-align:top;';
const DV_LAST = 'padding:9px 0;font-size:14px;color:#1a2332;font-weight:500;vertical-align:top;';

/** Standard "Kind regards" sign-off block */
function signOff(systemName: string): string {
  return `<p style="margin:28px 0 0;font-size:14px;color:#3a4a5c;line-height:1.6;">
    Kind regards,<br/>
    <strong style="color:#0d6b6b;">${systemName} Team</strong><br/>
    <span style="font-size:12px;color:#8a97a8;">Elderly Care Management System</span>
  </p>`;
}

/** Monospaced password box */
function pwBox(password: string): string {
  return `<div style="display:inline-block;background:#eaf6f6;border:1px solid #a3d4d4;
                      border-radius:6px;padding:10px 20px;font-family:monospace;
                      font-size:20px;font-weight:700;letter-spacing:3px;color:#084f4f;">
    ${password}
  </div>`;
}

/** Warning / security notice box */
function warningBox(html: string): string {
  return `<div style="background:#fff8ed;border:1px solid #f5c97a;border-radius:8px;
                      padding:16px 20px;margin:20px 0;font-size:13px;
                      color:#7a4f00;line-height:1.65;">
    <strong>Please note:</strong> ${html}
  </div>`;
}

/** Info / tip box */
function infoBox(html: string): string {
  return `<div style="background:#eaf6f6;border:1px solid #a3d4d4;border-radius:8px;
                      padding:16px 20px;margin:20px 0;font-size:13px;
                      color:#084f4f;line-height:1.65;">
    ${html}
  </div>`;
}

/** Primary call-to-action button */
function ctaButton(label: string, href: string): string {
  return `<table cellpadding="0" cellspacing="0" style="margin:8px 0 20px;">
    <tr>
      <td style="background:#0d6b6b;border-radius:7px;">
        <a href="${href}"
           style="display:inline-block;padding:13px 28px;font-size:14px;
                  font-weight:600;color:#ffffff;text-decoration:none;
                  letter-spacing:.3px;">
          ${label}
        </a>
      </td>
    </tr>
  </table>`;
}

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST') || 'smtp.gmail.com',
      port: Number(this.configService.get<number>('SMTP_PORT')) || 587,
      secure: this.configService.get<string>('SMTP_SECURE') === 'true',
      auth: user && pass ? { user, pass } : undefined,
      connectionTimeout: 5000, // 5s connection timeout
      greetingTimeout: 5000,
      socketTimeout: 5000,
    });
  }

  // Verifies mail server connectivity at startup to ensure notification reliability
  async onModuleInit(): Promise<void> {
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    if (!user || !pass) {
      this.logger.warn(
        'SMTP_USER or SMTP_PASS not set — outgoing email notifications are disabled.',
      );
      return;
    }

    try {
      // Guard the verify() call with an explicit timeout to avoid long blocking startup
      const verifyPromise = this.transporter.verify();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('SMTP verification timed out after 5s')), 5000),
      );
      await Promise.race([verifyPromise, timeoutPromise]);
      this.logger.log('SMTP transporter verified successfully');
    } catch (err) {
      // Do not throw — verification failure should not prevent the app from starting.
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
        subject: `Your ${role} Account — ${this.systemName}`,
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
        subject: `Temporary Password — ${this.systemName}`,
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
        subject: `Prescription Update for ${opts.patientName} — ${this.systemName}`,
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
        subject: `Security Notice — New Login to Your Account`,
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
        subject: `Payment Confirmation — ${serviceLabel} | ${this.systemName}`,
        html,
      });
      this.logger.log(`Payment receipt email sent → ${opts.to}`);
    } catch (err) {
      this.logger.error(
        `Failed to send payment receipt email → ${opts.to}: ${this.errMsg(err)}`,
      );
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Template builders
  // ─────────────────────────────────────────────────────────────────────────

  // Constructs a welcoming template with initial login credentials for new accounts
  private buildCredentialsHtml(opts: CredentialsEmailOpts): string {
    const { fullName, email, role, temporaryPassword } = opts;
    const year = new Date().getFullYear();
    const roleLabel = role.charAt(0).toUpperCase() + role.slice(1).replace('_', ' ');

    return (
      emailOpen(this.systemName, 'Account Created', `Your ${roleLabel} account on ${this.systemName} is ready.`) +
      `<p style="${P}">Dear <strong>${fullName}</strong>,</p>
      <p style="${P}">An administrator has created a <strong>${roleLabel}</strong> account for you on the ${this.systemName}. You can use the credentials below to sign in for the first time.</p>

      <p style="${SL}">Your Login Credentials</p>
      <div style="${CARD}">
        <table style="${DT}">
          <tr>
            <td style="${DL}">Email Address</td>
            <td style="${DV}">${email}</td>
          </tr>
          <tr>
            <td style="${DL_LAST}">Temporary Password</td>
            <td style="${DV_LAST}">${pwBox(temporaryPassword)}</td>
          </tr>
        </table>
      </div>

      ${ctaButton('Sign In to Your Account', this.appUrl + '/login')}

      ${warningBox(`This is a one-time temporary password. You will be prompted to create a new personal password immediately after your first login. Please do not share these credentials with anyone.`)}

      ${signOff(this.systemName)}` +
      emailClose(this.systemName, year)
    );
  }

  // Generates a branded HTML layout for delivering temporary recovery credentials
  private buildPasswordResetHtml(opts: PasswordResetEmailOpts): string {
    const { fullName, email, tempPassword } = opts;
    const year = new Date().getFullYear();

    return (
      emailOpen(this.systemName, 'Password Reset', `A temporary password has been issued for your account.`) +
      `<p style="${P}">Dear <strong>${fullName}</strong>,</p>
      <p style="${P}">We received a request to reset the password for your account. A temporary password has been generated for you. Please use it to sign in and then set a new personal password.</p>

      <p style="${SL}">Your Temporary Access</p>
      <div style="${CARD}">
        <table style="${DT}">
          <tr>
            <td style="${DL}">Email Address</td>
            <td style="${DV}">${email}</td>
          </tr>
          <tr>
            <td style="${DL_LAST}">Temporary Password</td>
            <td style="${DV_LAST}">${pwBox(tempPassword)}</td>
          </tr>
        </table>
      </div>

      ${warningBox(`This temporary password is valid for a single use only. Once you log in, you will be required to create a new password. If you did not request a password reset, please contact the ECMS team immediately, as someone else may have attempted to access your account.`)}

      ${signOff(this.systemName)}` +
      emailClose(this.systemName, year)
    );
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
              <td style="padding:10px 12px;font-size:14px;color:#1a2332;font-weight:500;border-bottom:1px solid #eaeef2;">${m.medicineName}</td>
              <td style="padding:10px 12px;font-size:14px;color:#3a4a5c;border-bottom:1px solid #eaeef2;">${m.dosage}</td>
              <td style="padding:10px 12px;font-size:14px;color:#3a4a5c;border-bottom:1px solid #eaeef2;">${m.frequency}</td>
              <td style="padding:10px 12px;font-size:14px;color:#3a4a5c;border-bottom:1px solid #eaeef2;">${m.durationDays} day${m.durationDays !== 1 ? 's' : ''}</td>
              <td style="padding:10px 12px;font-size:13px;color:#5a6a7a;border-bottom:1px solid #eaeef2;">${m.instructions ?? '—'}</td>
            </tr>`,
          )
          .join('');

        const metaRows: string[] = [];
        metaRows.push(`<tr>
          <td style="${DL}">Date Issued</td>
          <td style="${DV}">${p.issuedDate}</td>
        </tr>`);
        if (p.validUntil) {
          metaRows.push(`<tr>
            <td style="${DL}">Valid Until</td>
            <td style="${DV}">${p.validUntil}</td>
          </tr>`);
        }
        if (p.diagnosis) {
          metaRows.push(`<tr>
            <td style="${DL}">Diagnosis</td>
            <td style="${DV}">${p.diagnosis}</td>
          </tr>`);
        }
        if (p.notes) {
          metaRows.push(`<tr>
            <td style="${DL_LAST}">Doctor's Notes</td>
            <td style="${DV_LAST}">${p.notes.replace(/\n/g, '<br/>')}</td>
          </tr>`);
        }

        const heading = prescriptions.length > 1
          ? `Prescription ${index + 1} of ${prescriptions.length}`
          : 'Prescription Details';

        return `
          <p style="${SL}">${heading}</p>
          <div style="${CARD}">
            <table style="${DT}">${metaRows.join('')}</table>
          </div>

          <p style="${SL}">Prescribed Medicines</p>
          <table width="100%" cellpadding="0" cellspacing="0"
                 style="border:1px solid #e4e9ee;border-radius:8px;overflow:hidden;
                        border-collapse:collapse;margin-bottom:24px;">
            <thead>
              <tr style="background:#f5f7f9;">
                <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#8a97a8;">Medicine</th>
                <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#8a97a8;">Dosage</th>
                <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#8a97a8;">Frequency</th>
                <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#8a97a8;">Duration</th>
                <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#8a97a8;">Instructions</th>
              </tr>
            </thead>
            <tbody>${medicineRows}</tbody>
          </table>`;
      })
      .join('');

    return (
      emailOpen(this.systemName, 'Prescription Update', `A prescription has been updated for ${patientName}.`) +
      `<p style="${P}">Dear <strong>${familyMemberName}</strong>,</p>
      <p style="${P}">Dr. <strong>${doctorName}</strong> has issued or updated a prescription for <strong>${patientName}</strong>. Please find the full details below.</p>

      <p style="${SL}">Patient Information</p>
      <div style="${CARD}">
        <table style="${DT}">
          <tr>
            <td style="${DL}">Patient</td>
            <td style="${DV}">${patientName}</td>
          </tr>
          <tr>
            <td style="${DL_LAST}">Attending Doctor</td>
            <td style="${DV_LAST}">Dr. ${doctorName}</td>
          </tr>
        </table>
      </div>

      ${prescriptionBlocks}

      ${infoBox(`You can view all prescriptions for ${patientName} at any time by signing in to your <a href="${this.appUrl}" style="color:#0d6b6b;font-weight:600;text-decoration:none;">family member dashboard</a>. If you have any questions, please contact the care home team directly.`)}

      ${signOff(this.systemName)}` +
      emailClose(this.systemName, year)
    );
  }

  // Renders a professional security-alert email with login metadata for privileged-role accounts
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

    const contactRows: string[] = [];
    if (displayPhone) {
      contactRows.push(`<tr>
        <td style="${DL}">Phone</td>
        <td style="${DV}"><a href="tel:${displayPhone}" style="color:#0d6b6b;text-decoration:none;">${displayPhone}</a></td>
      </tr>`);
    }
    if (displayEmail) {
      contactRows.push(`<tr>
        <td style="${DL_LAST}">Email</td>
        <td style="${DV_LAST}"><a href="mailto:${displayEmail}" style="color:#0d6b6b;text-decoration:none;">${displayEmail}</a></td>
      </tr>`);
    }

    return (
      emailOpen(this.systemName, 'New Login Detected', `A new login to your ${roleLabel} account was just detected.`) +
      `<p style="${P}">Dear <strong>${fullName}</strong>,</p>
      <p style="${P}">We are writing to inform you that a new login was recorded for your <strong>${roleLabel}</strong> account on the ${this.systemName}. The details are provided below.</p>

      <p style="${SL}">Login Details</p>
      <div style="${CARD}">
        <table style="${DT}">
          <tr>
            <td style="${DL}">Account Role</td>
            <td style="${DV}">${roleLabel}</td>
          </tr>
          <tr>
            <td style="${DL_LAST}">Login Time</td>
            <td style="${DV_LAST}">${loginTime}</td>
          </tr>
        </table>
      </div>

      ${warningBox(`If you did not initiate this login, your account may be at risk. Please contact the system administrator immediately and request that your account be secured.`)}

      ${contactRows.length > 0 ? `
      <p style="${SL}">Contact System Administrator</p>
      <div style="${CARD}">
        <table style="${DT}">${contactRows.join('')}</table>
      </div>` : ''}

      <p style="margin:0;font-size:14px;color:#5a6a7a;line-height:1.7;">If this login was made by you, no further action is required.</p>

      ${signOff(this.systemName)}` +
      emailClose(this.systemName, year)
    );
  }

  // Generates a professional reply template that quotes the user's original inquiry for context
  private buildReplyHtml(opts: ReplyEmailOpts): string {
    const { recipientName, reply, originalMsg, phonePrimary, systemEmail } =
      opts;
    const safeReply = reply.replace(/\n/g, '<br/>');
    const safeMsg = originalMsg.replace(/\n/g, '<br/>');
    const year = new Date().getFullYear();

    return (
      emailOpen(this.systemName, 'Response to Your Enquiry', `The ECMS team has responded to your recent enquiry.`) +
      `<p style="${P}">Dear <strong>${recipientName}</strong>,</p>
      <p style="${P}">Thank you for reaching out to us. Our team has reviewed your enquiry and prepared the following response.</p>

      <p style="${SL}">Our Response</p>
      <div style="background:#eaf6f6;border:1px solid #a3d4d4;border-left:4px solid #0d6b6b;
                  border-radius:0 8px 8px 0;padding:18px 22px;margin-bottom:20px;
                  font-size:15px;color:#1a2332;line-height:1.75;">
        ${safeReply}
      </div>

      <p style="${SL}">Your Original Message</p>
      <div style="background:#f5f7f9;border:1px solid #e4e9ee;border-left:4px solid #c8d0da;
                  border-radius:0 8px 8px 0;padding:16px 20px;margin-bottom:20px;
                  font-size:14px;color:#5a6a7a;line-height:1.7;font-style:italic;">
        ${safeMsg}
      </div>

      <p style="${P}">If you have any further questions, please do not hesitate to contact us.</p>

      <p style="${SL}">Contact Details</p>
      <div style="${CARD}">
        <table style="${DT}">
          ${phonePrimary ? `<tr>
            <td style="${DL}">Telephone</td>
            <td style="${DV}"><a href="tel:${phonePrimary}" style="color:#0d6b6b;text-decoration:none;">${phonePrimary}</a></td>
          </tr>` : ''}
          <tr>
            <td style="${DL_LAST}">Email</td>
            <td style="${DV_LAST}"><a href="mailto:${systemEmail}" style="color:#0d6b6b;text-decoration:none;">${systemEmail}</a></td>
          </tr>
        </table>
      </div>

      ${signOff(this.systemName)}` +
      emailClose(this.systemName, year)
    );
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
    const formattedDate = new Date(paidAt).toLocaleString('en-GB', {
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
      paymentMethod === 'card' ? 'Card Payment' : 'Bank Transfer';
    const serviceLabel =
      serviceType === 'appointment' ? 'Doctor Appointment' : 'Care Plan Booking';

    // ── Service-specific rows ─────────────────────────────────────────────
    const serviceDetailRows: string[] = [];
    serviceDetailRows.push(`<tr>
      <td style="${DL}">Patient</td>
      <td style="${DV}">${patientName}</td>
    </tr>`);

    if (serviceType === 'appointment') {
      if (opts.doctorName) {
        serviceDetailRows.push(`<tr>
          <td style="${DL}">Doctor</td>
          <td style="${DV}">Dr. ${opts.doctorName}</td>
        </tr>`);
      }
      if (opts.appointmentDate) {
        serviceDetailRows.push(`<tr>
          <td style="${DL}">Appointment Date</td>
          <td style="${DV}">${opts.appointmentDate}</td>
        </tr>`);
      }
      if (opts.appointmentStartTime && opts.appointmentEndTime) {
        serviceDetailRows.push(`<tr>
          <td style="${DL_LAST}">Appointment Time</td>
          <td style="${DV_LAST}">${opts.appointmentStartTime} &ndash; ${opts.appointmentEndTime}</td>
        </tr>`);
      }
    } else {
      if (opts.carePlanName) {
        serviceDetailRows.push(`<tr>
          <td style="${DL}">Care Plan</td>
          <td style="${DV}">${opts.carePlanName}</td>
        </tr>`);
      }
      if (opts.carePlanDuration) {
        serviceDetailRows.push(`<tr>
          <td style="${DL_LAST}">Duration</td>
          <td style="${DV_LAST}">${opts.carePlanDuration}</td>
        </tr>`);
      }
    }

    // Ensure last row has no bottom border
    if (serviceDetailRows.length > 0) {
      const last = serviceDetailRows[serviceDetailRows.length - 1];
      if (!last.includes(DL_LAST)) {
        serviceDetailRows[serviceDetailRows.length - 1] = last
          .replace(DL, DL_LAST)
          .replace(DV, DV_LAST);
      }
    }

    // ── Fee breakdown (appointment only) ─────────────────────────────────
    let feeBreakdownHtml = '';
    if (
      serviceType === 'appointment' &&
      opts.consultationFee !== undefined &&
      opts.careHomeFee !== undefined
    ) {
      feeBreakdownHtml = `
      <p style="${SL}">Fee Breakdown</p>
      <table width="100%" cellpadding="0" cellspacing="0"
             style="border:1px solid #e4e9ee;border-radius:8px;overflow:hidden;
                    border-collapse:collapse;margin-bottom:20px;">
        <tr>
          <td style="padding:11px 16px;font-size:14px;color:#3a4a5c;background:#f5f7f9;border-bottom:1px solid #e4e9ee;">Consultation Fee</td>
          <td style="padding:11px 16px;font-size:14px;color:#1a2332;font-weight:600;text-align:right;background:#f5f7f9;border-bottom:1px solid #e4e9ee;">LKR ${Number(opts.consultationFee).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
        </tr>
        <tr>
          <td style="padding:11px 16px;font-size:14px;color:#3a4a5c;">Care Home Fee</td>
          <td style="padding:11px 16px;font-size:14px;color:#1a2332;font-weight:600;text-align:right;">LKR ${Number(opts.careHomeFee).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
        </tr>
      </table>`;
    }

    return (
      emailOpen(this.systemName, 'Payment Confirmation', `Your payment of LKR ${formattedAmount} has been received.`) +
      `<p style="${P}">Dear <strong>${familyMemberName}</strong>,</p>
      <p style="${P}">Thank you for your payment. This email serves as your official receipt. Please retain it for your records.</p>

      <p style="${SL}">Receipt Summary</p>
      <div style="${CARD}">
        <table style="${DT}">
          <tr>
            <td style="${DL}">Receipt Number</td>
            <td style="${DV}"><strong>${receiptNumber}</strong></td>
          </tr>
          <tr>
            <td style="${DL}">Date and Time</td>
            <td style="${DV}">${formattedDate}</td>
          </tr>
          <tr>
            <td style="${DL}">Payment Method</td>
            <td style="${DV}">${methodLabel}</td>
          </tr>
          <tr>
            <td style="${DL_LAST}">Service</td>
            <td style="${DV_LAST}">${serviceLabel}</td>
          </tr>
        </table>
      </div>

      <p style="${SL}">Service Details</p>
      <div style="${CARD}">
        <table style="${DT}">${serviceDetailRows.join('')}</table>
      </div>

      ${feeBreakdownHtml}

      <!-- Total amount -->
      <table width="100%" cellpadding="0" cellspacing="0"
             style="background:#0d6b6b;border-radius:8px;margin-bottom:20px;">
        <tr>
          <td style="padding:20px 24px;">
            <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:1.2px;
                      text-transform:uppercase;color:rgba(255,255,255,.7);">Total Amount Paid</p>
            <p style="margin:0;font-size:28px;font-weight:700;color:#ffffff;">LKR ${formattedAmount}</p>
          </td>
        </tr>
      </table>

      ${infoBox(`You can view your full payment history at any time by signing in to your <a href="${this.appUrl}" style="color:#0d6b6b;font-weight:600;text-decoration:none;">family member dashboard</a>. If you have any questions regarding this payment, please contact the care home team directly.`)}

      ${signOff(this.systemName)}` +
      emailClose(this.systemName, year)
    );
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
      ? `Database Backup Completed — ${opts.backupName}`
      : `Database Backup Failed — ${opts.backupName}`;

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

    const formattedSize = opts.fileSizeBytes
      ? formatBytes(opts.fileSizeBytes)
      : '—';
    const dateStr = opts.completedAt
      ? new Date(opts.completedAt).toLocaleString('en-GB', {
          timeZone: 'Asia/Colombo',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }) + ' (Colombo time)'
      : '—';

    const statusLabel = isSuccess ? 'Completed Successfully' : 'Failed';

    const detailRows: string[] = [];
    detailRows.push(`<tr>
      <td style="${DL}">Backup Name</td>
      <td style="${DV}" >${opts.backupName}</td>
    </tr>`);
    detailRows.push(`<tr>
      <td style="${DL}">Status</td>
      <td style="${DV}">
        <span style="font-weight:600;color:${isSuccess ? '#0d6b6b' : '#c0392b'};">${statusLabel}</span>
      </td>
    </tr>`);
    detailRows.push(`<tr>
      <td style="${DL}">Completed At</td>
      <td style="${DV}">${dateStr}</td>
    </tr>`);
    if (isSuccess && opts.fileSizeBytes) {
      detailRows.push(`<tr>
        <td style="${DL}">File Size</td>
        <td style="${DV}">${formattedSize}</td>
      </tr>`);
    }
    if (!isSuccess && opts.errorMessage) {
      detailRows.push(`<tr>
        <td style="${DL}">Error Detail</td>
        <td style="${DV}" style="color:#c0392b;">${opts.errorMessage}</td>
      </tr>`);
    }
    if (opts.notes) {
      detailRows.push(`<tr>
        <td style="${DL}">Notes</td>
        <td style="${DV}">${opts.notes}</td>
      </tr>`);
    }

    // Fix last row border
    if (detailRows.length > 0) {
      const last = detailRows[detailRows.length - 1];
      detailRows[detailRows.length - 1] = last
        .replace(DL, DL_LAST)
        .replace(DV, DV_LAST);
    }

    const title = isSuccess
      ? 'Database Backup Completed'
      : 'Database Backup Failed';

    const statusBox = isSuccess
      ? infoBox(`The scheduled database backup has completed successfully. No action is required. The backup file is stored securely and is available for restoration if needed.`)
      : `<div style="background:#fdf2f2;border:1px solid #e8c4c4;border-radius:8px;
                    padding:16px 20px;margin:20px 0;font-size:13px;
                    color:#7a2020;line-height:1.65;">
          <strong>Action Required:</strong> The database backup process encountered an error and did not complete successfully. Please review the error details above and investigate the cause. If the issue persists, contact your system administrator.
        </div>`;

    return (
      emailOpen(this.systemName, title, `Database backup ${opts.backupName} ${isSuccess ? 'completed successfully' : 'failed'}.`) +
      `<p style="${P}">Dear Administrator,</p>
      <p style="${P}">This is an automated notification regarding the ${isSuccess ? 'successful completion' : 'failure'} of a database backup on the ${this.systemName}.</p>

      <p style="${SL}">Backup Details</p>
      <div style="${CARD}">
        <table style="${DT}">${detailRows.join('')}</table>
      </div>

      ${statusBox}

      ${signOff(this.systemName)}` +
      emailClose(this.systemName, year)
    );
  }
}