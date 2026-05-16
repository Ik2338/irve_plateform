import { IsString, IsInt, IsOptional, IsUUID, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReviewDto {
  @ApiProperty() @IsUUID()
  requestId: string;

  @ApiProperty() @IsUUID()
  installerId: string;

  @ApiProperty() @IsInt() @Min(1) @Max(5)
  rating: number; // ← "rating" pas "score"

  @ApiProperty({ required: false }) @IsOptional() @IsString()
  comment?: string;
}