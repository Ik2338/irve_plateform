import { Controller, Post, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MatchingService } from './matching.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('matching')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('matching')
export class MatchingController {
  constructor(private service: MatchingService) {}

  @Post('request/:id')
  @ApiOperation({ summary: 'Lancer le matching pour une demande' })
  match(@Param('id') id: string) {
    return this.service.matchRequest(id);
  }

  @Get('leads')
  @ApiOperation({ summary: 'Leads disponibles pour l\'installateur connecté' })
  leads(@CurrentUser() user: any) {
    return this.service.getInstallerLeads(user.id);
  }
}
