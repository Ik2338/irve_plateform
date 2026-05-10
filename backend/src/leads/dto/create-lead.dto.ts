import { IsString, IsEmail, IsUUID, IsOptional, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLeadDto {
  @ApiProperty({ example: 'a1b2c3d4-...' })
  @IsUUID()
  installerId: string;

  @ApiProperty({ example: '12 rue de la Paix, Casablanca' })
  @IsString()
  address: string;

  @ApiProperty({ example: 'Bonjour, je souhaite installer une borne IRVE...' })
  @IsString()
  @MinLength(10)
  message: string;
}