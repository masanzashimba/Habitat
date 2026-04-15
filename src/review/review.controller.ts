import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ReviewService } from './review.service';

import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { JwtAccessGuard } from 'src/auth/guards/jwt-access.guard';

@Controller('properties/:propertyId/reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  /**
   * Créer un avis pour une propriété
   * POST /properties/:propertyId/reviews
   */
  @Post()
  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Param('propertyId') propertyId: string,
    @Body() createReviewDto: CreateReviewDto,
    @Request() req,
  ) {
    const userId = req.user.userId;
    return this.reviewService.create(propertyId, userId, createReviewDto);
  }

  /**
   * Récupérer tous les avis d'une propriété
   * GET /properties/:propertyId/reviews
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(@Param('propertyId') propertyId: string) {
    return this.reviewService.findAllByProperty(propertyId);
  }

  /**
   * Récupérer un avis spécifique
   * GET /properties/:propertyId/reviews/:reviewId
   */
  @Get(':reviewId')
  @HttpCode(HttpStatus.OK)
  async findOne(
    @Param('propertyId') propertyId: string,
    @Param('reviewId') reviewId: string,
  ) {
    return this.reviewService.findOne(reviewId, propertyId);
  }

  /**
   * Modifier son propre avis
   * PATCH /properties/:propertyId/reviews/:reviewId
   */
  @Patch(':reviewId')
  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('propertyId') propertyId: string,
    @Param('reviewId') reviewId: string,
    @Body() updateReviewDto: UpdateReviewDto,
    @Request() req,
  ) {
    const userId = req.user.userId;
    return this.reviewService.update(reviewId, propertyId, userId, updateReviewDto);
  }

  /**
   * Supprimer son propre avis
   * DELETE /properties/:propertyId/reviews/:reviewId
   */
  @Delete(':reviewId')
  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('propertyId') propertyId: string,
    @Param('reviewId') reviewId: string,
    @Request() req,
  ) {
    const userId = req.user.userId;
    return this.reviewService.remove(reviewId, propertyId, userId);
  }

  /**
   * Récupérer les statistiques des avis d'une propriété
   * GET /properties/:propertyId/reviews/stats
   */
  @Get('stats')
  @HttpCode(HttpStatus.OK)
  async getStats(@Param('propertyId') propertyId: string) {
    return this.reviewService.getStats(propertyId);
  }
}
