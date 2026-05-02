// dto/register.dto.ts
import { IsEmail, IsString, IsOptional, IsEnum, MinLength } from 'class-validator';
import { UserRole } from '@prisma/client';

export class RegisterDto {
  @IsString() firstName: string;
  @IsString() lastName: string;
  @IsEmail() email: string;
  @IsString() @MinLength(8) password: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsEnum(UserRole) role?: UserRole;

  // Champs installateur
  @IsOptional() @IsString() siret?: string;
  @IsOptional() @IsString() qualifelecCertNumber?: string;
  @IsOptional() qualifelecIndices?: string[];
  @IsOptional() @IsString() qualifelecExpiresAt?: string;
}