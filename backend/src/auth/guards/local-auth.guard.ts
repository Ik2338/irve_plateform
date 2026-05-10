// src/auth/guards/local-auth.guard.ts
import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
  // Surcharge handleRequest pour convertir les erreurs Passport
  // en réponses HTTP propres (évite ERR_EMPTY_RESPONSE)
  handleRequest(err: any, user: any, info: any) {
    // err = exception lancée dans validate()
    // info = message Passport (ex: "Missing credentials")
    // user = false si échec d'auth

    if (err) {
      // Relance l'exception telle quelle (UnauthorizedException avec notre message)
      throw err;
    }

    if (!user) {
      // Cas Passport : credentials manquants ou stratégie a renvoyé false
      const msg = info?.message || 'Identifiants invalides';
      throw new UnauthorizedException(msg);
    }

    return user;
  }
}