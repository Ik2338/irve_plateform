import { IsArray, IsOptional, IsString, MinLength, ValidateNested } from 'class-validator';
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
  @IsString()
  @MinLength(1)
  body: string;

  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => MessageAttachmentDto)
  attachments?: MessageAttachmentDto[];
}
