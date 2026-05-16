import { Injectable, Logger } from '@nestjs/common';

// ─────────────────────────────────────────────────────────────────────────────
// MailService — Envoi d'emails transactionnels IRVE
//
// Variables .env (déjà configurées) :
//   MAIL_HOST=localhost
//   MAIL_PORT=1025
//   MAIL_SECURE=false
//   MAIL_FROM='IRVE Platform <noreply@irve-platform.fr>'
//   FRONTEND_URL=http://localhost:3000
//   # MAIL_USER et MAIL_PASS → pas d'auth avec Mailpit, laisser commentés
//
// UI Mailpit : http://localhost:8025
// ─────────────────────────────────────────────────────────────────────────────

// Labels lisibles
const PROJ_LABELS: Record<string, string> = {
  RESIDENTIAL: 'Particulier', COMMERCIAL: 'Entreprise',
  COPROPRIETE: 'Copropriété', HOTEL: 'Hôtel', SYNDIC: 'Syndic',
};
const POWER_LABELS: Record<string, string> = {
  P1: '3,7 kW', P2: '7,4 kW', P3: '11 kW', P4: '22 kW', P5: '> 22 kW',
};

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: any = null;

  // ── Initialisation lazy du transporter nodemailer ──────────────────────────
  private async getTransporter() {
    if (this.transporter) return this.transporter;
    const nodemailer = await import('nodemailer');

    const user = process.env.MAIL_USER;
    const pass = process.env.MAIL_PASS;

    this.transporter = nodemailer.createTransport({
      host:   process.env.MAIL_HOST   || 'localhost',
      port:   parseInt(process.env.MAIL_PORT || '1025'),
      secure: process.env.MAIL_SECURE === 'true',
      // Pas d'auth avec Mailpit — activé uniquement si MAIL_USER + MAIL_PASS définis
      ...(user && pass ? { auth: { user, pass } } : {}),
    });

    this.logger.log(
      `📬 Transporter initialisé → ${process.env.MAIL_HOST || 'localhost'}:${process.env.MAIL_PORT || '1025'}` +
      (user ? ' (avec auth)' : ' (sans auth — Mailpit)')
    );

    return this.transporter;
  }

  // ── Envoi générique ────────────────────────────────────────────────────────
  private async send(to: string, subject: string, html: string) {
    try {
      const transporter = await this.getTransporter();
      await transporter.sendMail({
        from:    process.env.MAIL_FROM || '"IRVE Platform" <noreply@irve-platform.fr>',
        to,
        subject,
        html,
      });
      this.logger.log(`✅ Email envoyé → ${to} | ${subject}`);
    } catch (err: any) {
      this.logger.error(`❌ Erreur envoi email → ${to}: ${err.message}`);
      throw err;
    }
  }

  // ── Email installateur : nouvelle demande ciblée reçue ────────────────────
  async sendRequestToInstaller(params: {
    request:   any;
    installer: any;
    client:    any;
  }) {
    const { request, installer, client } = params;
    const appUrl      = process.env.FRONTEND_URL || 'http://localhost:3000';
    const respondUrl  = `${appUrl}/dashboard/installer/requests/${request.id}`;
    const acceptUrl   = `${appUrl}/dashboard/installer/requests/${request.id}?action=accept`;
    const declineUrl  = `${appUrl}/dashboard/installer/requests/${request.id}?action=decline`;

    const clientName  = [client?.firstName, client?.lastName].filter(Boolean).join(' ') || 'Un client';
    const projLabel   = PROJ_LABELS[request.projectType]  || request.projectType;
    const powerLabel  = POWER_LABELS[request.powerLevel]  || request.powerLevel;

    const html = `
      <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;">

        <!-- Header vert -->
        <div style="background:#16a34a;border-radius:16px 16px 0 0;padding:28px 32px;">
          <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;">
            🔌 Nouvelle demande d'installation IRVE
          </h1>
          <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">
            ${clientName} souhaite que vous installiez une borne de recharge électrique.
          </p>
        </div>

        <!-- Corps -->
        <div style="padding:28px 32px;background:#f9fafb;border-radius:0 0 16px 16px;">

          <!-- Détails -->
          <div style="background:#fff;border-radius:12px;padding:20px;margin-bottom:20px;border:1px solid #e5e7eb;">
            <h2 style="font-size:15px;color:#111827;margin:0 0 16px;font-weight:600;">Détails de la demande</h2>
            <table style="width:100%;border-collapse:collapse;font-size:13px;">
              <tr>
                <td style="color:#6b7280;padding:6px 0;width:150px;">Type de projet</td>
                <td style="color:#111827;font-weight:600;padding:6px 0;">${projLabel}</td>
              </tr>
              <tr style="background:#f9fafb;">
                <td style="color:#6b7280;padding:6px 4px;">Puissance souhaitée</td>
                <td style="color:#111827;font-weight:600;padding:6px 4px;">${request.powerLevel} — ${powerLabel}</td>
              </tr>
              <tr>
                <td style="color:#6b7280;padding:6px 0;">Nb de bornes</td>
                <td style="color:#111827;font-weight:600;padding:6px 0;">${request.quantity || 1} point(s) de charge</td>
              </tr>
              <tr style="background:#f9fafb;">
                <td style="color:#6b7280;padding:6px 4px;">Lieu d'installation</td>
                <td style="color:#111827;font-weight:600;padding:6px 4px;">${request.address}, ${request.postalCode} ${request.city}</td>
              </tr>
              ${request.hasExistingPanel ? `
              <tr>
                <td style="color:#6b7280;padding:6px 0;">Tableau élec.</td>
                <td style="color:#16a34a;font-weight:600;padding:6px 0;">✓ Disponible sur site</td>
              </tr>` : ''}
              ${request.description ? `
              <tr style="background:#f9fafb;">
                <td style="color:#6b7280;padding:6px 4px;vertical-align:top;">Remarques client</td>
                <td style="color:#374151;padding:6px 4px;">${request.description}</td>
              </tr>` : ''}
            </table>
          </div>

          <!-- Bouton principal -->
          <div style="text-align:center;margin-bottom:16px;">
            <a href="${respondUrl}"
              style="display:inline-block;background:#16a34a;color:#fff;padding:14px 32px;
                border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;">
              Voir la demande et répondre →
            </a>
          </div>

          <!-- Boutons accept / decline -->
          <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
            <tr>
              <td style="padding-right:8px;">
                <a href="${acceptUrl}"
                  style="display:block;text-align:center;background:#16a34a;color:#fff;
                    padding:12px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;">
                  ✓ Accepter la demande
                </a>
              </td>
              <td style="padding-left:8px;">
                <a href="${declineUrl}"
                  style="display:block;text-align:center;background:#fff;color:#dc2626;
                    padding:12px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;
                    border:2px solid #fecaca;">
                  ✕ Décliner la demande
                </a>
              </td>
            </tr>
          </table>

          <!-- Note confidentialité -->
          <p style="color:#9ca3af;font-size:11px;text-align:center;margin:0;">
            Cette demande vous a été envoyée <strong>directement</strong> car le client a sélectionné votre profil.<br/>
            Elle n'est visible par aucun autre installateur.
          </p>
        </div>
      </div>
    `;

    await this.send(
      installer.user.email,
      `🔌 Nouvelle demande d'installation IRVE — ${request.city}`,
      html,
    );
  }

  // ── Email client : nouveau devis reçu ─────────────────────────────────────
  async sendQuoteNotificationToClient(params: {
    quote:     any;
    request:   any;
    installer: any;
    client:    any;
  }) {
    const { quote, request, installer, client } = params;
    const appUrl     = process.env.FRONTEND_URL || 'http://localhost:3000';
    const quoteUrl = `${appUrl}/dashboard/installer/quotes/${quote.id}`;
    const clientName = [client?.firstName, client?.lastName].filter(Boolean).join(' ') || 'Client';
    const instName   = installer?.companyName || "Un installateur";
    const projLabel  = PROJ_LABELS[request?.projectType] || request?.projectType || '';
    const totalTTC   = (quote.amount * (1 + (quote.vatRate ?? 20) / 100)).toFixed(2);

    const html = `
      <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;">

        <div style="background:#16a34a;border-radius:16px 16px 0 0;padding:28px 32px;">
          <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;">
            📋 Vous avez reçu un devis !
          </h1>
          <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">
            ${instName} a répondu à votre demande d'installation IRVE.
          </p>
        </div>

        <div style="padding:28px 32px;background:#f9fafb;border-radius:0 0 16px 16px;">
          <p style="color:#374151;font-size:14px;margin:0 0 20px;">Bonjour ${clientName},</p>

          <div style="background:#fff;border-radius:12px;padding:20px;margin-bottom:20px;border:1px solid #e5e7eb;">
            <h2 style="font-size:15px;color:#111827;margin:0 0 16px;font-weight:600;">Récapitulatif du devis</h2>
            <table style="width:100%;border-collapse:collapse;font-size:13px;">
              <tr>
                <td style="color:#6b7280;padding:6px 0;width:160px;">Installateur</td>
                <td style="color:#111827;font-weight:600;padding:6px 0;">${instName}</td>
              </tr>
              ${projLabel ? `
              <tr style="background:#f9fafb;">
                <td style="color:#6b7280;padding:6px 4px;">Type de projet</td>
                <td style="color:#111827;font-weight:600;padding:6px 4px;">${projLabel}</td>
              </tr>` : ''}
              <tr>
                <td style="color:#6b7280;padding:6px 0;">Main d'œuvre</td>
                <td style="color:#111827;font-weight:600;padding:6px 0;">${quote.laborCost?.toFixed(2)} €</td>
              </tr>
              <tr style="background:#f9fafb;">
                <td style="color:#6b7280;padding:6px 4px;">Matériel</td>
                <td style="color:#111827;font-weight:600;padding:6px 4px;">${quote.materialCost?.toFixed(2)} €</td>
              </tr>
              <tr>
                <td style="color:#6b7280;padding:6px 0;">TVA (${quote.vatRate ?? 20}%)</td>
                <td style="color:#111827;font-weight:600;padding:6px 0;">${((quote.amount * (quote.vatRate ?? 20)) / 100).toFixed(2)} €</td>
              </tr>
              <tr style="border-top:2px solid #e5e7eb;">
                <td style="color:#111827;padding:10px 0 6px;font-weight:700;font-size:15px;">Total TTC</td>
                <td style="color:#16a34a;font-weight:700;font-size:17px;padding:10px 0 6px;">${totalTTC} €</td>
              </tr>
            </table>
            ${quote.notes ? `
            <div style="margin-top:12px;padding-top:12px;border-top:1px solid #e5e7eb;">
              <p style="color:#6b7280;font-size:12px;margin:0 0 4px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Note de l'installateur</p>
              <p style="color:#374151;font-size:13px;margin:0;font-style:italic;">"${quote.notes}"</p>
            </div>` : ''}
          </div>

          <div style="text-align:center;margin-bottom:16px;">
            <a href="${quoteUrl}"
              style="display:inline-block;background:#16a34a;color:#fff;padding:14px 32px;
                border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;">
              Consulter et répondre au devis →
            </a>
          </div>

          <p style="color:#9ca3af;font-size:11px;text-align:center;margin:0;">
            Ce devis est valable 30 jours. IRVE Platform — Trouvez un installateur certifié près de chez vous.
          </p>
        </div>
      </div>
    `;

    await this.send(
      client.email,
      `📋 Nouveau devis reçu de ${instName} — ${totalTTC} € TTC`,
      html,
    );
  }

  // ── Email client : réponse de l'installateur (accept / decline) ───────────
  async sendResponseToClient(params: {
    request: any;
    action:  'ACCEPT' | 'DECLINE';
  }) {
    const { request, action } = params;
    const accepted   = action === 'ACCEPT';
    const appUrl     = process.env.FRONTEND_URL || 'http://localhost:3000';
    const clientName = [request.user?.firstName, request.user?.lastName].filter(Boolean).join(' ') || 'Client';
    const instName   = request.installer?.companyName || "l'installateur";

    const html = `
      <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;">

        <div style="background:${accepted ? '#16a34a' : '#dc2626'};border-radius:16px 16px 0 0;padding:28px 32px;">
          <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;">
            ${accepted ? '✅ Votre demande a été acceptée !' : '❌ Votre demande a été déclinée'}
          </h1>
          <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">
            ${instName} a ${accepted ? 'accepté' : 'décliné'} votre demande d'installation IRVE.
          </p>
        </div>

        <div style="padding:28px 32px;background:#f9fafb;border-radius:0 0 16px 16px;">
          <p style="color:#374151;font-size:14px;margin:0 0 20px;">Bonjour ${clientName},</p>

          ${request.installerNote ? `
          <div style="background:#fff;border-radius:12px;padding:16px;margin-bottom:20px;border:1px solid #e5e7eb;">
            <p style="color:#6b7280;font-size:12px;margin:0 0 6px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">
              Message de ${instName}
            </p>
            <p style="color:#111827;font-size:14px;margin:0;font-style:italic;">"${request.installerNote}"</p>
          </div>` : ''}

          <div style="text-align:center;margin-bottom:24px;">
            ${accepted ? `
            <a href="${appUrl}/dashboard"
              style="display:inline-block;background:#16a34a;color:#fff;padding:14px 32px;
                border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;">
              Voir ma demande →
            </a>` : `
            <a href="${appUrl}/installers/search"
              style="display:inline-block;background:#16a34a;color:#fff;padding:14px 32px;
                border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;">
              Trouver un autre installateur →
            </a>`}
          </div>

          <p style="color:#9ca3af;font-size:11px;text-align:center;margin:0;">
            IRVE Platform — Trouvez un installateur certifié près de chez vous
          </p>
        </div>
      </div>
    `;

    await this.send(
      request.user.email,
      accepted
        ? `✅ Demande acceptée par ${instName}`
        : `❌ Demande déclinée par ${instName}`,
      html,
    );
  }

  // ── Email installateur : nouveau lead reçu (formulaire de contact) ─────────
  async sendLeadNotification(
    to: string,
    firstName: string,
    lead: {
      clientName:  string;
      clientEmail: string;
      clientPhone: string;
      address:     string;
      message:     string;
    },
  ) {
    const appUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    const html = `
      <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;">
        <div style="background:#16a34a;border-radius:16px 16px 0 0;padding:28px 32px;">
          <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;">
            📩 Nouvelle demande de contact
          </h1>
          <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">
            Bonjour ${firstName}, un client souhaite vous contacter pour une installation IRVE.
          </p>
        </div>
        <div style="padding:28px 32px;background:#f9fafb;border-radius:0 0 16px 16px;">
          <div style="background:#fff;border-radius:12px;padding:20px;margin-bottom:20px;border:1px solid #e5e7eb;">
            <h2 style="font-size:15px;color:#111827;margin:0 0 16px;font-weight:600;">Informations du client</h2>
            <table style="width:100%;border-collapse:collapse;font-size:13px;">
              <tr>
                <td style="color:#6b7280;padding:6px 0;width:140px;">Nom</td>
                <td style="color:#111827;font-weight:600;padding:6px 0;">${lead.clientName}</td>
              </tr>
              <tr style="background:#f9fafb;">
                <td style="color:#6b7280;padding:6px 4px;">Email</td>
                <td style="color:#111827;font-weight:600;padding:6px 4px;">${lead.clientEmail}</td>
              </tr>
              <tr>
                <td style="color:#6b7280;padding:6px 0;">Téléphone</td>
                <td style="color:#111827;font-weight:600;padding:6px 0;">${lead.clientPhone}</td>
              </tr>
              <tr style="background:#f9fafb;">
                <td style="color:#6b7280;padding:6px 4px;">Adresse</td>
                <td style="color:#111827;font-weight:600;padding:6px 4px;">${lead.address}</td>
              </tr>
              <tr>
                <td style="color:#6b7280;padding:6px 0;vertical-align:top;">Message</td>
                <td style="color:#374151;padding:6px 0;font-style:italic;">"${lead.message}"</td>
              </tr>
            </table>
          </div>
          <div style="text-align:center;margin-bottom:16px;">
            <a href="${appUrl}/dashboard/installer/leads"
              style="display:inline-block;background:#16a34a;color:#fff;padding:14px 32px;
                border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;">
              Voir mes demandes →
            </a>
          </div>
          <p style="color:#9ca3af;font-size:11px;text-align:center;margin:0;">
            IRVE Platform — Trouvez un installateur certifié près de chez vous.
          </p>
        </div>
      </div>
    `;

    await this.send(to, `📩 Nouvelle demande de contact — ${lead.clientName}`, html);
  }

  // ── Email vérification de compte ──────────────────────────────────────────
  async sendVerificationEmail(to: string, firstName: string, token: string) {
    const appUrl    = process.env.FRONTEND_URL || 'http://localhost:3000';
    const verifyUrl = `${appUrl}/auth/verify-email?token=${token}`;

    const html = `
      <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;">
        <div style="background:#16a34a;border-radius:16px 16px 0 0;padding:28px 32px;">
          <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;">
            ✉️ Vérifiez votre adresse email
          </h1>
          <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">
            Bienvenue sur IRVE Platform, ${firstName} !
          </p>
        </div>
        <div style="padding:28px 32px;background:#f9fafb;border-radius:0 0 16px 16px;">
          <p style="color:#374151;font-size:14px;margin:0 0 20px;">
            Bonjour ${firstName},<br/><br/>
            Cliquez sur le bouton ci-dessous pour activer votre compte. Ce lien est valable <strong>24 heures</strong>.
          </p>
          <div style="text-align:center;margin-bottom:24px;">
            <a href="${verifyUrl}"
              style="display:inline-block;background:#16a34a;color:#fff;padding:14px 32px;
                border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;">
              Vérifier mon email →
            </a>
          </div>
          <p style="color:#9ca3af;font-size:11px;text-align:center;margin:0;">
            Si vous n'avez pas créé de compte, ignorez cet email.<br/>
            IRVE Platform — Trouvez un installateur certifié près de chez vous.
          </p>
        </div>
      </div>
    `;

    await this.send(to, '✉️ Activez votre compte IRVE Platform', html);
  }

  // ── Email réinitialisation de mot de passe ────────────────────────────────
  async sendPasswordResetEmail(to: string, firstName: string, token: string) {
    const appUrl   = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${appUrl}/auth/reset-password?token=${token}`;

    const html = `
      <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;">
        <div style="background:#16a34a;border-radius:16px 16px 0 0;padding:28px 32px;">
          <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;">
            🔑 Réinitialisation de votre mot de passe
          </h1>
          <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">
            Vous avez demandé à réinitialiser votre mot de passe.
          </p>
        </div>
        <div style="padding:28px 32px;background:#f9fafb;border-radius:0 0 16px 16px;">
          <p style="color:#374151;font-size:14px;margin:0 0 20px;">
            Bonjour ${firstName},<br/><br/>
            Cliquez ci-dessous pour choisir un nouveau mot de passe. Ce lien est valable <strong>1 heure</strong>.
          </p>
          <div style="text-align:center;margin-bottom:24px;">
            <a href="${resetUrl}"
              style="display:inline-block;background:#16a34a;color:#fff;padding:14px 32px;
                border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;">
              Réinitialiser mon mot de passe →
            </a>
          </div>
          <p style="color:#9ca3af;font-size:11px;text-align:center;margin:0;">
            Si vous n'avez pas fait cette demande, ignorez cet email.<br/>
            IRVE Platform — Trouvez un installateur certifié près de chez vous.
          </p>
        </div>
      </div>
    `;

    await this.send(to, '🔑 Réinitialisation de votre mot de passe IRVE Platform', html);
  }
}