// src/auth/strategies/local.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({ usernameField: 'email' });
  }

  async validate(email: string, password: string) {
    try {
      return await this.authService.validateUser(email, password);
    } catch (err) {
      // Re-throw proprement — Passport capte les erreurs brutes et ferme
      // la connexion sans réponse HTTP ; on doit lui passer une vraie exception.
      throw err instanceof UnauthorizedException
        ? err
        : new UnauthorizedException('Identifiants invalides');
    }
  }
}