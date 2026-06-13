import {
  IsString, IsEnum, IsOptional, IsBoolean,
  IsInt, IsArray, IsUUID, Min, Matches, IsNumber,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ProjectType, PowerLevel, Reception4G } from '@prisma/client';

enum ConnectorType { TYPE2_AC = 'TYPE2_AC', CCS = 'CCS', CHADEMO = 'CHADEMO' }
enum ParkingType   { INDOOR = 'INDOOR', OUTDOOR = 'OUTDOOR', SEMI_COVERED = 'SEMI_COVERED' }
enum ParkingAccess { PRIVATE = 'PRIVATE', PUBLIC = 'PUBLIC', MIXED = 'MIXED' }
enum RequestMediaType {
  ELECTRICAL_PANEL = 'ELECTRICAL_PANEL',
  MAIN_BREAKER = 'MAIN_BREAKER',
  CHARGER_LOCATION = 'CHARGER_LOCATION',
  CABLE_ROUTE = 'CABLE_ROUTE',
  INSTALLATION_PLAN = 'INSTALLATION_PLAN',
  CABLE_ROUTE_VIDEO = 'CABLE_ROUTE_VIDEO',
  OTHER = 'OTHER',
}

export class RequestMediaDto {
  @ApiProperty({ enum: RequestMediaType })
  @IsEnum(RequestMediaType)
  type: RequestMediaType;

  @ApiProperty()
  @IsString()
  fileName: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsString()
  mimeType?: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsString()
  dataUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsString()
  addedAt?: string;
}

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

  @ApiProperty({ required: false })
  @IsOptional() @IsString()
  contactPreference?: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsString()
  desiredInstallDate?: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsNumber()
  indicativeBudget?: number;

  @ApiProperty({ required: false })
  @IsOptional() @IsString()
  evModel?: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsNumber()
  panelDistanceMeters?: number;

  @ApiProperty({ required: false })
  @IsOptional() @IsInt() @Min(0)
  drillingCount?: number;

  @ApiProperty({ required: false })
  @IsOptional() @IsInt() @Min(0)
  structuralDrillingCount?: number;

  @ApiProperty({ required: false })
  @IsOptional() @IsString()
  drillingThickness?: string;

  @ApiProperty({ enum: Reception4G, required: false })
  @IsOptional() @IsEnum(Reception4G)
  reception4g?: Reception4G;

  @ApiProperty({ required: false })
  @IsOptional() @IsBoolean()
  hasInternetBox?: boolean;

  @ApiProperty({ required: false })
  @IsOptional() @IsNumber()
  internetBoxDistanceMeters?: number;

  @ApiProperty({ type: [RequestMediaDto], required: false })
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => RequestMediaDto)
  mediaAttachments?: RequestMediaDto[];
}
