import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    // Récupère l'installerId si l'user est un installateur
    const installer = await this.prisma.installer.findUnique({
      where: { userId: payload.sub },
      select: { id: true },
    });

    return {
      id:          payload.sub,
      email:       payload.email,
      role:        payload.role,
      installerId: installer?.id ?? null,
    };
  }
}