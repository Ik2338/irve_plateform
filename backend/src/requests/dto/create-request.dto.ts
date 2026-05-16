import {
  IsString, IsEnum, IsOptional, IsBoolean,
  IsInt, IsArray, IsUUID, Min, Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ProjectType, PowerLevel } from '@prisma/client';

enum ConnectorType { TYPE2_AC = 'TYPE2_AC', CCS = 'CCS', CHADEMO = 'CHADEMO' }
enum ParkingType   { INDOOR = 'INDOOR', OUTDOOR = 'OUTDOOR', SEMI_COVERED = 'SEMI_COVERED' }
enum ParkingAccess { PRIVATE = 'PRIVATE', PUBLIC = 'PUBLIC', MIXED = 'MIXED' }

export class CreateRequestDto {
  @ApiProperty({ enum: ProjectType })
  @IsEnum(ProjectType)
  projectType: ProjectType;

  @ApiProperty({ enum: PowerLevel })
  @IsEnum(PowerLevel)
  powerLevel: PowerLevel;

  @ApiProperty({ default: 1 })
  @IsOptional() @IsInt() @Min(1)
  quantity?: number;

  @ApiProperty()
  @IsString()
  address: string;

  @ApiProperty()
  @IsString()
  city: string;

  @ApiProperty({ example: '20000' })
  @Matches(/^\d{4,6}$/, {
    message: 'postalCode doit contenir entre 4 et 6 chiffres',
  })
  postalCode: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsBoolean()
  hasExistingPanel?: boolean;

  @ApiProperty({ required: false })
  @IsOptional() @IsString()
  urgency?: string;

  // ✅ UUID de l'installateur ciblé (demande depuis son profil)
  // Si présent → demande envoyée à lui seul + email automatique
  @ApiProperty({ required: false, description: 'UUID installateur ciblé (demande directe)' })
  @IsOptional() @IsUUID()
  targetInstallerId?: string;

  // ✅ Flag explicite — mis à true côté frontend quand demande ciblée
  @ApiProperty({ required: false, default: false })
  @IsOptional() @IsBoolean()
  isTargeted?: boolean;

  @ApiProperty({ enum: ConnectorType, isArray: true, required: false })
  @IsOptional() @IsArray() @IsEnum(ConnectorType, { each: true })
  connectors?: ConnectorType[];

  @ApiProperty({ enum: ParkingType, required: false })
  @IsOptional() @IsEnum(ParkingType)
  parkingType?: ParkingType;

  @ApiProperty({ enum: ParkingAccess, required: false })
  @IsOptional() @IsEnum(ParkingAccess)
  parkingAccess?: ParkingAccess;

  @ApiProperty({ required: false, default: 1 })
  @IsOptional() @IsInt() @Min(1)
  parkingSpots?: number;
}