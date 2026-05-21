import { Controller, Get, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN' as any)
@Controller('admin')
export class AdminController {
  constructor(private service: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Stats globales tableau de bord admin' })
  stats() { return this.service.getDashboardStats(); }

  @Get('users')
  @ApiOperation({ summary: 'Liste tous les utilisateurs' })
  users(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.service.getAllUsers(+page, +limit);
  }

  @Get('installers')
  @ApiOperation({ summary: 'Liste tous les installateurs' })
  installers(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.service.getAllInstallers(+page, +limit);
  }

  @Patch('installers/:id/verify')
  @ApiOperation({ summary: 'Valider un installateur IRVE' })
  verify(@Param('id') id: string) { return this.service.verifyInstaller(id); }

  @Patch('installers/:id/deactivate')
  @ApiOperation({ summary: 'Désactiver un installateur' })
  deactivate(@Param('id') id: string) { return this.service.deactivateInstaller(id); }

  @Get('requests')
  @ApiOperation({ summary: 'Toutes les demandes' })
  requests(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.service.getAllRequests(+page, +limit);
  }
  

 // ✅ Ajouter ici
@Patch('installers/:id/activate')
@ApiOperation({ summary: 'Réactiver un installateur' })
activate(@Param('id') id: string) { return this.service.activateInstaller(id); }

}
