import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ConversationContext } from '@prisma/client';

export class StartConversationDto {
  @IsUUID()
  installerId: string;

  @IsOptional()
  @IsUUID()
  requestId?: string;

  @IsOptional()
  @IsUUID()
  leadId?: string;

  @IsOptional()
  @IsUUID()
  quoteId?: string;

  @IsOptional()
  @IsEnum(ConversationContext)
  context?: ConversationContext;

  @IsOptional()
  @IsString()
  message?: string;
}
