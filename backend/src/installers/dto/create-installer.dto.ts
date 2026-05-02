import { IsString, IsOptional, IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateInstallerDto {
  @ApiProperty() @IsString() companyName: string;
  @ApiProperty() @IsString() siret: string;
  @ApiProperty() @IsString() address: string;
  @ApiProperty() @IsString() city: string;
  @ApiProperty() @IsString() postalCode: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() description?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() website?: string;
  @ApiProperty({ required: false, default: 50 }) @IsOptional() @IsInt() @Min(5) @Max(200) interventionRadius?: number;
}
