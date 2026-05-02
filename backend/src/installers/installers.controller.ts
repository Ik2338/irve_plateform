import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InstallersService } from './installers.service';
import { CreateInstallerDto } from './dto/create-installer.dto';
import { SearchInstallersDto } from './dto/search-installers.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('installers')
@Controller('installers')
export class InstallersController {
  constructor(private service: InstallersService) {}

  // ⚠️ Routes statiques AVANT :id

  @Get('search')
  @ApiOperation({ summary: 'Recherche géographique installateurs IRVE' })
  search(@Query() dto: SearchInstallersDto) {
    return this.service.search(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mon profil installateur' })
  myProfile(@CurrentUser() user: any) {
    return this.service.findByUserId(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Créer son profil installateur' })
  create(@CurrentUser() user: any, @Body() dto: any) {
    return this.service.create(user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mettre à jour son profil installateur' })
  update(@CurrentUser() user: any, @Body() dto: any) {
    return this.service.update(user.id, dto);
  }

  // ⚠️ Route dynamique EN DERNIER
  @Get(':id')
  @ApiOperation({ summary: 'Profil public d\'un installateur' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}