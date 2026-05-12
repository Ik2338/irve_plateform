// src/auth/auth.service.ts
import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../common/prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { RegisterDto } from './dto/register.dto';
import { UserRole } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt:    JwtService,
    private mail:   MailService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email déjà utilisé');

    // ── Pré-vérification SIRET ────────────────────────────────────────────────
    if (dto.role === UserRole.INSTALLER && dto.siret) {
      const existingSiret = await this.prisma.installer.findUnique({
        where: { siret: dto.siret },
      });
      if (existingSiret) throw new ConflictException('Un installateur avec ce SIRET existe déjà.');
    }

    const hashed              = await bcrypt.hash(dto.password, 12);
    const verificationToken   = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const user = await this.prisma.user.create({
      data: {
        email:                    dto.email,
        password:                 hashed,
        firstName:                dto.firstName,
        lastName:                 dto.lastName,
        phone:                    dto.phone,
        role:                     dto.role || UserRole.CLIENT,
        emailVerified:            false,
        emailVerificationToken:   verificationToken,
        emailVerificationExpires: verificationExpires,
      },
    });

    if (user.role === UserRole.INSTALLER) {
      try {
        await this.prisma.installer.create({
          data: {
            userId:               user.id,
            companyName:          `${user.firstName} ${user.lastName}`,
            siret:                dto.siret ?? '',
            qualifelecCertNumber: dto.qualifelecCertNumber ?? null,
            qualifelecIndices:    dto.qualifelecIndices ?? [],
            qualifelecExpiresAt:  dto.qualifelecExpiresAt ? new Date(dto.qualifelecExpiresAt) : null,
            city:                 '',
            postalCode:           '',
            interventionRadius:   30,
            isVerified:           false,
          },
        });
      } catch (error) {
        // Rollback : supprimer le user créé juste avant
        await this.prisma.user.delete({ where: { id: user.id } });

        if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
          const field = (error.meta?.target as string[])?.[0] ?? 'champ';
          throw new ConflictException(`Un installateur avec ce ${field} existe déjà.`);
        }
        throw error;
      }
    }

    this.mail
      .sendVerificationEmail(user.email, user.firstName, verificationToken)
      .catch(err => console.error('[MailService] Échec envoi:', err));

    const { password, emailVerificationToken, emailVerificationExpires, ...result } = user as any;
    return {
      user:    result,
      message: 'Compte créé ! Vérifiez votre boîte email pour activer votre compte.',
    };
  }

  // ── FIX : verifyEmail idempotent ──────────────────────────────────────────
  // Si emailVerified=true, on retourne un succès avec token (au lieu de 400)
  // → évite le 400 causé par le double appel React StrictMode en dev
  async verifyEmail(token: string) {
    const user = await this.prisma.user.findUnique({
      where: { emailVerificationToken: token },
    });

    // Token introuvable en base (déjà consommé ou invalide)
    if (!user) {
      // Cherche si un user a déjà été vérifié avec ce token (cas double appel)
      // On ne peut pas retrouver le user car le token est mis à null après vérif.
      // Dans ce cas, on lance une erreur générique.
      throw new BadRequestException('Lien de vérification invalide.');
    }

    // ✅ Déjà vérifié → réponse idempotente avec token (double appel StrictMode)
    if (user.emailVerified) {
      return {
        message: 'Email déjà vérifié. Vous pouvez vous connecter.',
        token:   this.signToken(user.id, user.email, user.role),
      };
    }

    // Token expiré
    if (user.emailVerificationExpires && user.emailVerificationExpires < new Date()) {
      throw new BadRequestException('Ce lien a expiré. Demandez un nouveau lien de vérification.');
    }

    // ✅ Première vérification : on marque le compte comme vérifié
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified:            true,
        emailVerificationToken:   null,
        emailVerificationExpires: null,
      },
    });

    return {
      message: 'Email vérifié ! Vous pouvez maintenant vous connecter.',
      token:   this.signToken(user.id, user.email, user.role),
    };
  }

  async resendVerification(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user)              throw new NotFoundException('Aucun compte associé à cet email.');
    if (user.emailVerified) return { message: 'Votre email est déjà vérifié.' };

    const newToken   = crypto.randomBytes(32).toString('hex');
    const newExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { emailVerificationToken: newToken, emailVerificationExpires: newExpires },
    });
    await this.mail.sendVerificationEmail(user.email, user.firstName, newToken);
    return { message: 'Un nouvel email de vérification a été envoyé.' };
  }

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('Identifiants invalides');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException('Identifiants invalides');

    if (!user.emailVerified) {
      throw new UnauthorizedException('EMAIL_NOT_VERIFIED');
    }

    const { password: _, ...result } = user;
    return result;
  }

  async login(user: any) {
    return { user, token: this.signToken(user.id, user.email, user.role) };
  }
  async forgotPassword(email: string) {
  console.log('🔑 forgotPassword appelé pour:', email);  // ← ajoutez ça
  const user = await this.prisma.user.findUnique({ where: { email } });
  console.log('👤 User trouvé:', user?.id, 'vérifié:', user?.emailVerified); // ← et ça
  
  if (!user || !user.emailVerified) return { message: 'Si ce compte existe, un email a été envoyé.' };
  
  const token   = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1h
  await this.prisma.user.update({
    where: { id: user.id },
    data:  { passwordResetToken: token, passwordResetExpires: expires },
  });
  await this.mail.sendPasswordResetEmail(user.email, user.firstName, token);
  return { message: 'Si ce compte existe, un email a été envoyé.' };
}

  private signToken(userId: string, email: string, role: string) {
    return this.jwt.sign({ sub: userId, email, role });
  }

  async resetPassword(token: string, password: string) {
  const user = await this.prisma.user.findFirst({
    where: {
      passwordResetToken:   token,
      passwordResetExpires: { gt: new Date() },   // token still valid
    },
  });

  if (!user) throw new BadRequestException('Lien invalide ou expiré.');

  const hashed = await bcrypt.hash(password, 12);

  await this.prisma.user.update({
    where: { id: user.id },
    data: {
      password:             hashed,
      passwordResetToken:   null,
      passwordResetExpires: null,
    },
  });

  return { message: 'Mot de passe réinitialisé avec succès.' };
}
}