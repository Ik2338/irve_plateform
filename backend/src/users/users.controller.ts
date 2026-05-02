import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength } from 'class-validator';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

class UpdateProfileDto {
  @IsOptional() @IsString() firstName?: string;
  @IsOptional() @IsString() lastName?: string;
  @IsOptional() @IsString() phone?: string;
}

class ChangePasswordDto {
  @IsString() currentPassword: string;
  @IsString() @MinLength(8) newPassword: string;
}

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private service: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Mon profil' })
  me(@CurrentUser() user: any) { return this.service.findById(user.id); }

  @Patch('me')
  @ApiOperation({ summary: 'Modifier prénom, nom, téléphone' })
  update(@CurrentUser() user: any, @Body() body: UpdateProfileDto) {
    return this.service.updateProfile(user.id, body);
  }

  @Patch('me/password')
  @ApiOperation({ summary: 'Changer le mot de passe' })
  changePassword(@CurrentUser() user: any, @Body() body: ChangePasswordDto) {
    return this.service.changePassword(user.id, body.currentPassword, body.newPassword);
  }
}
