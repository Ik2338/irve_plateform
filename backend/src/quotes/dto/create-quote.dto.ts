import { IsString, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateQuoteDto {
  @ApiProperty() @IsString() requestId: string;
  @ApiProperty() @IsNumber() @Min(0) laborCost: number;
  @ApiProperty({ required: false }) @IsOptional() @IsString() notes?: string;
}
