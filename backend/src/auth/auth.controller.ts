// src/auth/auth.controller.ts
import { Controller, Post, Body, UseGuards, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

class ResendVerificationDto {
  @IsEmail()
  email: string;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // POST /auth/register
  @Post('register')
  @ApiOperation({ summary: 'Créer un compte — envoie un email de vérification' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  // POST /auth/login
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @ApiOperation({ summary: 'Connexion (bloqué si email non vérifié)' })
  login(@CurrentUser() user: any) {
    return this.authService.login(user);
  }

  // GET /auth/verify-email?token=xxx
  @Get('verify-email')
  @ApiOperation({ summary: 'Valide le token reçu par email' })
  @ApiQuery({ name: 'token', required: true })
  verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  // POST /auth/resend-verification
  @Post('resend-verification')
  @ApiOperation({ summary: "Renvoyer l'email de vérification" })
  resendVerification(@Body() dto: ResendVerificationDto) {
    return this.authService.resendVerification(dto.email);
  }

  // GET /auth/me
  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Profil utilisateur connecté' })
  me(@CurrentUser() user: any) {
    return user;
  }

  @Post('forgot-password')
@ApiOperation({ summary: 'Demande de réinitialisation de mot de passe' })
forgotPassword(@Body() body: { email: string }) {
  return this.authService.forgotPassword(body.email);
}

}