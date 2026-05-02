import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../common/prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { RegisterDto } from './dto/register.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
  const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
  if (existing) throw new ConflictException('Email déjà utilisé');

  const hashed = await bcrypt.hash(dto.password, 12);
  const user = await this.prisma.user.create({
    data: {
      email: dto.email,
      password: hashed,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      role: dto.role || UserRole.CLIENT,
    },
  });

  // ── Crée automatiquement le profil Installer si rôle INSTALLER ──
  if (user.role === UserRole.INSTALLER) {
    await this.prisma.installer.create({
      data: {
        userId: user.id,
        companyName: `${user.firstName} ${user.lastName}`,
        siret: dto.siret ?? '',
        qualifelecCertNumber: dto.qualifelecCertNumber ?? null,
        qualifelecIndices: dto.qualifelecIndices ?? [],
        qualifelecExpiresAt: dto.qualifelecExpiresAt ? new Date(dto.qualifelecExpiresAt) : null,
        city: '',
        postalCode: '',
        interventionRadius: 30,
        isVerified: false,
      },
    });
  }

  const { password, ...result } = user;
  return { user: result, token: this.signToken(user.id, user.email, user.role) };
}
  
  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('Identifiants invalides');
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException('Identifiants invalides');
    const { password: _, ...result } = user;
    return result;
  }

  async login(user: any) {
    return {
      user,
      token: this.signToken(user.id, user.email, user.role),
    };
  }

  private signToken(userId: string, email: string, role: string) {
    return this.jwt.sign({ sub: userId, email, role });
  }
}
