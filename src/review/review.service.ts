import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ReviewService {
  constructor(private prisma: PrismaService) {}

  /**
   * Créer un avis
   */
  async create(
    propertyId: string,
    userId: string,
    createReviewDto: CreateReviewDto,
  ) {
    // Vérifier que la propriété existe
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      throw new NotFoundException('Propriété non trouvée');
    }

    // Vérifier que l'utilisateur n'a pas déjà laissé un avis
    const existingReview = await this.prisma.review.findFirst({
      where: {
        propertyId,
        userId,
      },
    });

    if (existingReview) {
      throw new ConflictException(
        'Vous avez déjà laissé un avis pour cette propriété',
      );
    }

    // Vérifier que l'utilisateur ne note pas sa propre propriété
    if (property.userId === userId) {
      throw new ForbiddenException(
        'Vous ne pouvez pas laisser un avis sur votre propre propriété',
      );
    }

    // Créer l'avis
    const review = await this.prisma.review.create({
      data: {
        propertyId,
        userId,
        rating: createReviewDto.rating,
        comment: createReviewDto.comment?.trim(),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    return {
      message: 'Avis ajouté avec succès',
      review,
    };
  }

  /**
   * Récupérer tous les avis d'une propriété
   */
  async findAllByProperty(propertyId: string) {
    // Vérifier que la propriété existe
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      throw new NotFoundException('Propriété non trouvée');
    }

    const reviews = await this.prisma.review.findMany({
      where: { propertyId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return reviews;
  }

  /**
   * Récupérer un avis spécifique
   */
  async findOne(reviewId: string, propertyId: string) {
    const review = await this.prisma.review.findFirst({
      where: {
        id: reviewId,
        propertyId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!review) {
      throw new NotFoundException('Avis non trouvé');
    }

    return review;
  }

  /**
   * Modifier un avis
   */
  async update(
    reviewId: string,
    propertyId: string,
    userId: string,
    updateReviewDto: UpdateReviewDto,
  ) {
    // Vérifier que l'avis existe et appartient à l'utilisateur
    const review = await this.prisma.review.findFirst({
      where: {
        id: reviewId,
        propertyId,
      },
    });

    if (!review) {
      throw new NotFoundException('Avis non trouvé');
    }

    if (review.userId !== userId) {
      throw new ForbiddenException(
        'Vous ne pouvez modifier que vos propres avis',
      );
    }

    // Mettre à jour l'avis
    const updatedReview = await this.prisma.review.update({
      where: { id: reviewId },
      data: {
        rating: updateReviewDto.rating ?? review.rating,
        comment: updateReviewDto.comment?.trim() ?? review.comment,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    return {
      message: 'Avis modifié avec succès',
      review: updatedReview,
    };
  }

  /**
   * Supprimer un avis
   */
  async remove(reviewId: string, propertyId: string, userId: string) {
    // Vérifier que l'avis existe et appartient à l'utilisateur
    const review = await this.prisma.review.findFirst({
      where: {
        id: reviewId,
        propertyId,
      },
    });

    if (!review) {
      throw new NotFoundException('Avis non trouvé');
    }

    if (review.userId !== userId) {
      throw new ForbiddenException(
        'Vous ne pouvez supprimer que vos propres avis',
      );
    }

    // Supprimer l'avis
    await this.prisma.review.delete({
      where: { id: reviewId },
    });

    return {
      message: 'Avis supprimé avec succès',
    };
  }

  /**
   * Récupérer les statistiques des avis
   */
  async getStats(propertyId: string) {
    // Vérifier que la propriété existe
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      throw new NotFoundException('Propriété non trouvée');
    }

    const reviews = await this.prisma.review.findMany({
      where: { propertyId },
      select: { rating: true },
    });

    const totalReviews = reviews.length;

    if (totalReviews === 0) {
      return {
        totalReviews: 0,
        averageRating: 0,
        distribution: {
          5: 0,
          4: 0,
          3: 0,
          2: 0,
          1: 0,
        },
      };
    }

    // Calculer la moyenne
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalRating / totalReviews;

    // Calculer la distribution
    const distribution = {
      5: reviews.filter((r) => r.rating === 5).length,
      4: reviews.filter((r) => r.rating === 4).length,
      3: reviews.filter((r) => r.rating === 3).length,
      2: reviews.filter((r) => r.rating === 2).length,
      1: reviews.filter((r) => r.rating === 1).length,
    };

    return {
      totalReviews,
      averageRating: Math.round(averageRating * 100) / 100,
      distribution,
    };
  }
}
