// src/mail/mail.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter;

  constructor(private config: ConfigService) {
    const host   = this.config.get<string>('MAIL_HOST', 'localhost');
    const port   = this.config.get<number>('MAIL_PORT', 1025);
    const secure = this.config.get<string>('MAIL_SECURE') === 'true';
    const user   = this.config.get<string>('MAIL_USER');
    const pass   = this.config.get<string>('MAIL_PASS');

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      ignoreTLS: true,
      ...(user ? { auth: { user, pass } } : {}),
    });

    this.logger.log(`📧 Mail transport → ${host}:${port} (secure=${secure})`);
  }

  // ── Email de vérification ──────────────────────────────────────────────────
  async sendVerificationEmail(to: string, firstName: string, token: string): Promise<void> {
    const frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const verifyUrl   = `${frontendUrl}/auth/verify-email?token=${token}`;
    const from        = this.config.get<string>('MAIL_FROM', '"IRVE Platform" <noreply@irve-platform.fr>');

    try {
      const info = await this.transporter.sendMail({
        from,
        to,
        subject: '✅ Confirmez votre adresse email – IRVE Platform',
        html:    this.templateVerification(firstName, verifyUrl),
        text:    `Bonjour ${firstName},\n\nActivez votre compte ici :\n${verifyUrl}\n\nLien valable 24 heures.\n\n— IRVE Platform`,
      });
      this.logger.log(`✅ Email vérification → ${to} (messageId: ${info.messageId})`);
    } catch (err) {
      this.logger.error(`❌ Échec envoi email vérification → ${to}`, err);
      throw err;
    }
  }

  // ── Email reset mot de passe ───────────────────────────────────────────────
  async sendPasswordResetEmail(to: string, firstName: string, token: string): Promise<void> {
    const frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const resetUrl    = `${frontendUrl}/auth/reset-password?token=${token}`;
    const from        = this.config.get<string>('MAIL_FROM', '"IRVE Platform" <noreply@irve-platform.fr>');

    await this.transporter.sendMail({
      from,
      to,
      subject: '🔐 Réinitialisation de votre mot de passe – IRVE Platform',
      html:    this.templateReset(firstName, resetUrl),
      text:    `Bonjour ${firstName},\n\nRéinitialisez votre mot de passe ici :\n${resetUrl}\n\nLien valable 1 heure.`,
    });
  }

  // ── Notification nouvelle demande (lead) ──────────────────────────────────
  async sendLeadNotification(
    to: string,
    installerFirstName: string,
    lead: {
      clientName:  string;
      clientEmail: string;
      clientPhone: string;
      address:     string;
      message:     string;
    },
  ): Promise<void> {
    const from        = this.config.get<string>('MAIL_FROM', '"IRVE Platform" <noreply@irve-platform.fr>');
    const frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:3000');

    try {
      const info = await this.transporter.sendMail({
        from,
        to,
        subject: `📩 Nouvelle demande de ${lead.clientName} – IRVE Platform`,
        html:    this.templateLead(installerFirstName, lead, frontendUrl),
        text: [
          `Bonjour ${installerFirstName},`,
          ``,
          `Vous avez reçu une nouvelle demande de contact.`,
          ``,
          `Client : ${lead.clientName}`,
          `Email  : ${lead.clientEmail}`,
          `Tél.   : ${lead.clientPhone}`,
          `Adresse: ${lead.address}`,
          ``,
          `Message :`,
          lead.message,
          ``,
          `Connectez-vous sur ${frontendUrl}/dashboard pour répondre.`,
        ].join('\n'),
      });
      this.logger.log(`✅ Email lead → ${to} (messageId: ${info.messageId})`);
    } catch (err) {
      this.logger.error(`❌ Échec envoi email lead → ${to}`, err);
      throw err;
    }
  }

  // ── Templates HTML ─────────────────────────────────────────────────────────
  private templateVerification(firstName: string, url: string): string {
    return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 20px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0"
             style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">
        <tr>
          <td style="background:linear-gradient(135deg,#2563eb,#1d4ed8);padding:32px 40px;text-align:center">
            <span style="color:#fff;font-size:24px;font-weight:700">⚡ IRVE Platform</span>
          </td>
        </tr>
        <tr>
          <td style="padding:40px">
            <h1 style="margin:0 0 12px;font-size:22px;color:#111827;font-weight:700">Bonjour ${firstName} 👋</h1>
            <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6">
              Merci de vous être inscrit sur <strong>IRVE Platform</strong>.<br>
              Cliquez sur le bouton ci-dessous pour activer votre compte.
            </p>
            <div style="text-align:center;margin:32px 0">
              <a href="${url}"
                 style="display:inline-block;background:#2563eb;color:#ffffff;font-size:16px;
                        font-weight:600;text-decoration:none;padding:14px 40px;border-radius:10px">
                ✅ Confirmer mon email
              </a>
            </div>
            <p style="margin:0 0 8px;color:#9ca3af;font-size:13px;text-align:center">
              Ce lien expire dans <strong>24 heures</strong>.
            </p>
            <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;word-break:break-all">
              Lien direct : <a href="${url}" style="color:#2563eb">${url}</a>
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#f9fafb;padding:20px 40px;border-top:1px solid #e5e7eb;text-align:center">
            <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6">
              Si vous n'avez pas créé de compte, ignorez cet email.<br>
              © ${new Date().getFullYear()} IRVE Platform — Tous droits réservés.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  }

  private templateReset(firstName: string, url: string): string {
    return `<!DOCTYPE html>
<html lang="fr">
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 20px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0"
             style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">
        <tr>
          <td style="background:linear-gradient(135deg,#dc2626,#b91c1c);padding:32px 40px;text-align:center">
            <span style="color:#fff;font-size:24px;font-weight:700">⚡ IRVE Platform</span>
          </td>
        </tr>
        <tr>
          <td style="padding:40px">
            <h1 style="margin:0 0 12px;font-size:22px;color:#111827">Réinitialisation du mot de passe</h1>
            <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 28px">
              Bonjour <strong>${firstName}</strong>, une demande de réinitialisation a été effectuée.<br>
              Cliquez ci-dessous — lien valable <strong>1 heure</strong>.
            </p>
            <div style="text-align:center">
              <a href="${url}"
                 style="display:inline-block;background:#dc2626;color:#fff;font-size:16px;font-weight:600;
                        text-decoration:none;padding:14px 40px;border-radius:10px">
                🔐 Réinitialiser mon mot de passe
              </a>
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px;border-top:1px solid #e5e7eb;text-align:center">
            <p style="margin:0;color:#9ca3af;font-size:12px">
              Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  }

  private templateLead(
    installerFirstName: string,
    lead: { clientName: string; clientEmail: string; clientPhone: string; address: string; message: string },
    frontendUrl: string,
  ): string {
    return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 20px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0"
             style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">
        <tr>
          <td style="background:linear-gradient(135deg,#059669,#047857);padding:32px 40px;text-align:center">
            <span style="color:#fff;font-size:24px;font-weight:700">⚡ IRVE Platform</span>
          </td>
        </tr>
        <tr>
          <td style="padding:40px">
            <h1 style="margin:0 0 8px;font-size:22px;color:#111827;font-weight:700">
              📩 Nouvelle demande reçue
            </h1>
            <p style="margin:0 0 28px;color:#6b7280;font-size:15px">
              Bonjour <strong>${installerFirstName}</strong>, un client souhaite vous contacter.
            </p>

            <!-- Infos client -->
            <table width="100%" cellpadding="0" cellspacing="0"
                   style="background:#f9fafb;border-radius:10px;border:1px solid #e5e7eb;margin-bottom:24px">
              <tr>
                <td style="padding:20px 24px">
                  <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:.05em">
                    Informations client
                  </p>
                  <table width="100%" cellpadding="4" cellspacing="0">
                    <tr>
                      <td style="color:#6b7280;font-size:14px;width:90px">👤 Nom</td>
                      <td style="color:#111827;font-size:14px;font-weight:600">${lead.clientName}</td>
                    </tr>
                    <tr>
                      <td style="color:#6b7280;font-size:14px">✉️ Email</td>
                      <td style="font-size:14px"><a href="mailto:${lead.clientEmail}" style="color:#2563eb">${lead.clientEmail}</a></td>
                    </tr>
                    <tr>
                      <td style="color:#6b7280;font-size:14px">📞 Tél.</td>
                      <td style="color:#111827;font-size:14px">${lead.clientPhone}</td>
                    </tr>
                    <tr>
                      <td style="color:#6b7280;font-size:14px">📍 Adresse</td>
                      <td style="color:#111827;font-size:14px">${lead.address}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- Message -->
            <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:.05em">
              Message
            </p>
            <div style="background:#fffbeb;border-left:4px solid #f59e0b;border-radius:6px;padding:16px 20px;margin-bottom:32px">
              <p style="margin:0;color:#111827;font-size:15px;line-height:1.7">${lead.message}</p>
            </div>

            <div style="text-align:center">
              <a href="${frontendUrl}/dashboard/leads"
                 style="display:inline-block;background:#059669;color:#ffffff;font-size:16px;
                        font-weight:600;text-decoration:none;padding:14px 40px;border-radius:10px">
                Répondre depuis mon dashboard
              </a>
            </div>
          </td>
        </tr>
        <tr>
          <td style="background:#f9fafb;padding:20px 40px;border-top:1px solid #e5e7eb;text-align:center">
            <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6">
              © ${new Date().getFullYear()} IRVE Platform — Tous droits réservés.
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