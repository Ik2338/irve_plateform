import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { QuotesService } from './quotes.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { QuoteStatus } from '@prisma/client';

@ApiTags('quotes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('quotes')
export class QuotesController {
  constructor(private service: QuotesService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un devis (installateur)' })
  create(@CurrentUser() user: any, @Body() dto: CreateQuoteDto) {
    return this.service.create(user.id, dto);
  }

  @Get('client')
  @ApiOperation({ summary: 'Mes devis reçus (client)' })
  forClient(@CurrentUser() user: any) {
    return this.service.findForClient(user.id);
  }

  @Get('installer')
  @ApiOperation({ summary: 'Mes devis envoyés (installateur)' })
  forInstaller(@CurrentUser() user: any) {
    return this.service.findForInstaller(user.id);
  }

  // Routes statiques AVANT :id
  @Patch(':id/accept')
  @ApiOperation({ summary: 'Accepter un devis' })
  accept(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.updateStatus(id, user.id, QuoteStatus.ACCEPTED);
  }

  @Patch(':id/refuse')
  @ApiOperation({ summary: 'Refuser un devis' })
  refuse(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.updateStatus(id, user.id, QuoteStatus.REFUSED);
  }

  // Détail complet pour installateur (avec infos client)
  @Get('installer/:id')
  @ApiOperation({ summary: 'Détail d\'un devis avec infos client (installateur)' })
  installerQuoteDetail(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.findOneForInstaller(id, user.id);
  }
}