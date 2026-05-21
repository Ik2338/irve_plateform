import {
  IsString, IsOptional, IsInt, Min, Max,
  IsArray, ValidateNested, IsEnum, IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CertificationLevel } from '@prisma/client';

export class CertificationDto {
  @ApiProperty({ enum: CertificationLevel })
  @IsEnum(CertificationLevel)
  level: CertificationLevel;

  @ApiProperty({ example: 'CERT-2024-001' })
  @IsString()
  certNumber: string;

  @ApiProperty({ example: '2027-01-01' })
  @IsDateString()
  expiresAt: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  documentUrl?: string;
}

export class CreateInstallerDto {
  @ApiProperty() @IsString() companyName: string;
  @ApiProperty() @IsString() siret: string;
  @ApiProperty() @IsString() address: string;
  @ApiProperty() @IsString() city: string;
  @ApiProperty() @IsString() postalCode: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsString() description?: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsString() website?: string;

  @ApiProperty({ required: false, default: 50 })
  @IsOptional() @IsInt() @Min(5) @Max(200) interventionRadius?: number;

  @ApiProperty({ required: false })
  @IsOptional() @IsString() phone?: string;

  // ✅ Certifs saisies à la création, en attente de validation admin
  @ApiProperty({ type: [CertificationDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CertificationDto)
  certifications?: CertificationDto[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  projectTypes?: string[];
}