import { Controller, Post, Get, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('leads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('leads')
export class LeadsController {
  constructor(private service: LeadsService) {}

  // ─── Client : envoyer une demande à un installateur ───────────────────────
  @Post()
  @ApiOperation({ summary: 'Envoyer une demande à un installateur (sans contrainte de rayon)' })
  create(@CurrentUser() user: any, @Body() dto: CreateLeadDto) {
    return this.service.create(user, dto);
  }

  // ─── Client : ses propres demandes envoyées ───────────────────────────────
  @Get('my-requests')
  @ApiOperation({ summary: 'Mes demandes envoyées (vue client)' })
  myRequests(@CurrentUser() user: any) {
    return this.service.findForClient(user.id);
  }

  // ─── Installateur : demandes reçues dans son dashboard ────────────────────
  @Get('received')
  @ApiOperation({ summary: 'Demandes reçues (vue installateur)' })
  received(@CurrentUser() user: any) {
    return this.service.findForInstaller(user.id);
  }

  // ─── Installateur : accepter ou refuser une demande ───────────────────────
  @Patch(':id/status')
  @ApiOperation({ summary: 'Accepter ou refuser une demande' })
  updateStatus(
    @CurrentUser() user: any,
    @Param('id') leadId: string,
    @Body('status') status: 'ACCEPTED' | 'REJECTED',
  ) {
    return this.service.updateStatus(user.id, leadId, status);
  }
}