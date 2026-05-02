import { IsString, IsOptional, IsEnum, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ProjectType, CertificationLevel } from '@prisma/client';

export class SearchInstallersDto {
  @ApiProperty({ example: '75001 Paris' }) @IsString() address: string;
  @ApiProperty({ enum: ProjectType, required: false }) @IsOptional() @IsEnum(ProjectType) projectType?: ProjectType;
  @ApiProperty({ enum: CertificationLevel, required: false }) @IsOptional() @IsEnum(CertificationLevel) certificationLevel?: CertificationLevel;
  @ApiProperty({ required: false }) @IsOptional() @Type(() => Number) @IsInt() limit?: number;
}
