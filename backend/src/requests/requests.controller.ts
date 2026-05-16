import {
  Controller, Get, Post, Patch, Delete, Body, Param,
  UseGuards, HttpCode, HttpStatus, ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RequestsService, RespondToRequestDto } from './requests.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { JwtAuthGuard }    from '../common/guards/jwt-auth.guard';
import { CurrentUser }     from '../common/decorators/current-user.decorator';
import { RequestStatus }   from '@prisma/client';

// Statuts qu'un installateur peut setter lui-même (progression chantier)
const INSTALLER_ALLOWED_STATUSES: RequestStatus[] = [
  'INSTALLATION',
  'MISE_EN_SERVICE',
  'COMPLETED',
];

@ApiTags('requests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('requests')
export class RequestsController {
  constructor(private service: RequestsService) {}

  // ── Créer une demande (standard ou ciblée via dto.targetInstallerId) ──────
  @Post()
  @ApiOperation({ summary: "Déposer une demande d'installation IRVE" })
  create(@CurrentUser() user: any, @Body() dto: CreateRequestDto) {
    return this.service.create(user.id, dto);
  }

  // ── Mes demandes (client) ─────────────────────────────────────────────────
  @Get()
  @ApiOperation({ summary: 'Mes demandes' })
  myRequests(@CurrentUser() user: any) {
    return this.service.findMyRequests(user.id);
  }

  // ── Demandes en attente de réponse (installateur) ─────────────────────────
  // IMPORTANT : cette route doit être AVANT /:id pour éviter le conflit de routing
  @Get('installer/pending')
  @ApiOperation({ summary: "Demandes ciblées en attente de réponse (installateur)" })
  async installerPending(@CurrentUser() user: any) {
    if (!user.installerId) {
      throw new ForbiddenException('Accès réservé aux installateurs');
    }
    return this.service.findPendingForInstaller(user.installerId);
  }

  // ── Détail d'une demande (client OU installateur ciblé) ───────────────────
  @Get(':id')
  @ApiOperation({ summary: "Détail d'une demande" })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.findOne(id, user.id, user.installerId);
  }

  // ── Installer : accepter ou refuser une demande ciblée ────────────────────
  @Patch(':id/respond')
  @ApiOperation({ summary: 'Accepter ou refuser une demande ciblée (installateur)' })
  async respond(
    @Param('id') id: string,
    @Body() dto: RespondToRequestDto,
    @CurrentUser() user: any,
  ) {
    if (!user.installerId) {
      throw new ForbiddenException('Accès réservé aux installateurs');
    }
    return this.service.respondToRequest(id, user.installerId, dto);
  }

  // ── Mise à jour du statut de progression (installateur) ───────────────────
  // ✅ Route manquante — utilisée par la page devis installateur pour
  //    passer la demande de QUOTE_ACCEPTED → INSTALLATION → COMPLETED
  @Patch(':id/status')
  @ApiOperation({ summary: "Mettre à jour le statut de progression (installateur)" })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: RequestStatus,
    @CurrentUser() user: any,
  ) {
    if (!user.installerId) {
      throw new ForbiddenException('Accès réservé aux installateurs');
    }
    if (!INSTALLER_ALLOWED_STATUSES.includes(status)) {
      throw new BadRequestException(
        `Statut invalide. Valeurs acceptées : ${INSTALLER_ALLOWED_STATUSES.join(', ')}`
      );
    }
    return this.service.updateStatus(id, status);
  }

  // ── Supprimer une demande (client) ────────────────────────────────────────
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer une demande' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.remove(id, user.id);
  }
}