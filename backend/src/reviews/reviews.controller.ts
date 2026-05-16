import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateReviewDto } from './dto/create-review.dto'; // ← seul import, pas de redéfinition

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private service: ReviewsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer un avis sur une installation terminée' })
  create(@CurrentUser() user: any, @Body() dto: CreateReviewDto) {
    return this.service.create(user.id, dto);
  }

  @Get('installer/:installerId')
  @ApiOperation({ summary: "Avis et note moyenne d'un installateur" })
  findByInstaller(@Param('installerId') installerId: string) {
    return this.service.findByInstaller(installerId);
  }
}