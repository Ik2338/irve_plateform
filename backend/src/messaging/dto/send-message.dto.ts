import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class MessageAttachmentDto {
  @IsString()
  fileName: string;

  @IsOptional() @IsString()
  mimeType?: string;

  @IsOptional() @IsString()
  dataUrl?: string;
}

export class SendMessageDto {
  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => MessageAttachmentDto)
  attachments?: MessageAttachmentDto[];
}
