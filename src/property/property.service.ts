import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { CloudinaryService } from '../cloudinary.service';
import { NotificationService } from '../notification/notification.service';
import { PropertyGateway } from './property.gateway';

@Injectable()
export class PropertyService {
  constructor(
    private prisma: PrismaService,
    private cloudinaryService: CloudinaryService,
    private notificationService: NotificationService,
    private propertyGateway: PropertyGateway,
  ) {}

  // 🔥 SLUG
  private generateSlug(title: string): string {
    const timestamp = Date.now();
    return (
      title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '') + `-${timestamp}`
    );
  }

  // 🔥 TRANSFORM DATA
  private transformFormData(dto: any) {
    const intFields = [
      'maxGuests',
      'bedrooms',
      'beds',
      'bathrooms',
      'kitchens',
      'livingRooms',
      'discount',
    ];

    const boolFields = ['isFeatured', 'isVerified'];

    intFields.forEach((field) => {
      if (dto[field] !== undefined) dto[field] = Number(dto[field]);
    });

    boolFields.forEach((field) => {
      if (dto[field] !== undefined)
        dto[field] = dto[field] === 'true' || dto[field] === true;
    });

    return dto;
  }

  // 🔥 CHECK OWNER
  private async checkOwnership(propertyId: string, userId: string) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) throw new NotFoundException('Property not found');

    if (property.userId !== userId) {
      throw new ForbiddenException("Tu n'es pas autorisé à modifier ce bien");
    }

    return property;
  }

  // =============================
  // CREATE
  // =============================
  async create(
    createPropertyDto: CreatePropertyDto,
    userId: string,
    files?: Express.Multer.File[],
  ) {
    const { address, amenities, ...propertyData } =
      this.transformFormData(createPropertyDto);

    if (!address) throw new BadRequestException('Address is required');
    if (!userId) throw new BadRequestException('User ID is required');

    if (!files || files.length < 3) {
      throw new BadRequestException(
        `Minimum 3 images requises (reçu: ${files?.length || 0})`,
      );
    }

    // 🔥 ÉTAPE 1: Créer la propriété dans une transaction rapide
    const property = await this.prisma.$transaction(
      async (tx) => {
        const createdProperty = await tx.property.create({
          data: {
            ...propertyData,
            slug: this.generateSlug(propertyData.title),
            user: {
              connect: { id: userId },
            },

            address: {
              create: {
                commune: address.commune,
                quartier: address.quartier,
                avenue: address.avenue,
                number: address.number,
                city: address.city || 'Kinshasa',
                province: address.province || 'Kinshasa',
                latitude: address.latitude
                  ? Number(address.latitude)
                  : undefined,
                longitude: address.longitude
                  ? Number(address.longitude)
                  : undefined,
              },
            },

            ...(amenities && {
              amenities: {
                create: amenities.map((name) => ({
                  amenity: {
                    connectOrCreate: {
                      where: { name },
                      create: { name },
                    },
                  },
                })),
              },
            }),
          },
        });

        return createdProperty;
      },
      {
        maxWait: 10000, // Attendre max 10s pour acquérir la transaction
        timeout: 15000, // Timeout de 15s pour la transaction
      },
    );

    // 🔥 ÉTAPE 2: Uploader les images en parallèle (hors transaction)
    try {
      const uploadPromises = files.map(async (file, index) => {
        const upload = await this.cloudinaryService.uploadImageBuffer(
          file.buffer,
          file.originalname,
        );

        return this.prisma.propertyImage.create({
          data: {
            imageUrl: upload.secure_url,
            propertyId: property.id,
            isPrimary: index === 0,
          },
        });
      });

      // Attendre que tous les uploads soient terminés
      await Promise.all(uploadPromises);
    } catch (error) {
      // Si l'upload échoue, supprimer la propriété créée
      await this.prisma.property.delete({ where: { id: property.id } });
      throw new BadRequestException(
        `Erreur lors de l'upload des images: ${error.message}`,
      );
    }

    // 🔥 ÉTAPE 3: Retourner la propriété complète avec les images
    const completeProperty = await this.findOne(property.id);

    // 🔥 ÉTAPE 4: Envoyer les notifications
    try {
      // Get owner information
      const owner = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      });

      const ownerName = owner
        ? `${owner.firstName || ''} ${owner.lastName || ''}`.trim() ||
          owner.email
        : 'Propriétaire';

      // Notification pour le créateur
      await this.notificationService.createPropertyCreatedNotification(
        userId,
        property.id,
        propertyData.title,
        propertyData.type,
      );

      // Notification pour les admins
      await this.notificationService.createPropertyCreatedAdminNotification(
        property.id,
        propertyData.title,
        propertyData.type,
        ownerName,
        owner?.email || '',
      );
    } catch (notificationError) {
      // Log error but don't fail the property creation
      console.error('Error sending notifications:', notificationError);
    }

    return completeProperty;
  }

  // =============================
  // FIND ALL
  // =============================
  async findAll(userId?: string, includeUnavailable: boolean = false) {
    const whereClause: any = {};

    // Si on n'inclut pas les indisponibles, filtrer par statut
    if (!includeUnavailable) {
      whereClause.status = 'available';
    }

    return this.prisma.property.findMany({
      where: whereClause,
      include: {
        images: true,
        address: true,
        reviews: true,
        amenities: { include: { amenity: true } },
        favorites: true, // Retourner TOUS les favoris pour compter
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            profileImage: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // =============================
  // FIND USER PROPERTIES
  // =============================
  async findUserProperties(userId: string, includeUnavailable: boolean = true) {
    const whereClause: any = { userId };

    // Si on n'inclut pas les indisponibles, filtrer par statut
    if (!includeUnavailable) {
      whereClause.status = 'available';
    }

    return this.prisma.property.findMany({
      where: whereClause,
      include: {
        images: true,
        address: true,
        reviews: true,
        amenities: { include: { amenity: true } },
        favorites: true,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            profileImage: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // =============================
  // FIND USER PROPERTIES BY STATUS
  // =============================
  async findUserPropertiesByStatus(
    userId: string,
    status?: 'available' | 'reserved' | 'rented',
  ) {
    const whereClause: any = { userId };

    // Si un statut est spécifié, filtrer par ce statut
    if (status) {
      whereClause.status = status;
    }

    return this.prisma.property.findMany({
      where: whereClause,
      include: {
        images: true,
        address: true,
        reviews: true,
        amenities: { include: { amenity: true } },
        favorites: true,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            profileImage: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // =============================
  // FIND ONE
  // =============================
  async findOne(id: string) {
    const property = await this.prisma.property.findUnique({
      where: { id },
      include: {
        images: true,
        address: true,
        reviews: true,
        favorites: true,
        amenities: { include: { amenity: true } },
      },
    });

    if (!property) throw new NotFoundException('Property not found');

    return property;
  }

  // =============================
  // UPDATE
  // =============================
  async update(
    id: string,
    userId: string,
    updatePropertyDto: UpdatePropertyDto,
    file?: Express.Multer.File,
  ) {
    await this.checkOwnership(id, userId);

    const { address, amenities, ...propertyData } =
      this.transformFormData(updatePropertyDto);

    const property = await this.prisma.property.update({
      where: { id },
      data: {
        ...propertyData,

        ...(address && {
          address: {
            update: address,
          },
        }),

        ...(amenities && {
          amenities: {
            deleteMany: {}, // 🔥 reset avant ajout
            create: amenities.map((name) => ({
              amenity: {
                connectOrCreate: {
                  where: { name },
                  create: { name },
                },
              },
            })),
          },
        }),
      },
    });

    // 🔥 IMAGE UPDATE
    if (file) {
      const upload = await this.cloudinaryService.uploadImageBuffer(
        file.buffer,
        file.originalname,
      );

      await this.prisma.propertyImage.create({
        data: {
          imageUrl: upload.secure_url,
          propertyId: property.id,
        },
      });
    }

    return this.findOne(property.id);
  }

  // =============================
  // UPDATE STATUS
  // =============================
  async updateStatus(
    id: string,
    status: 'available' | 'reserved' | 'rented',
    userId: string,
  ) {
    await this.checkOwnership(id, userId);

    const property = await this.prisma.property.update({
      where: { id },
      data: { status },
    });

    return { property, message: `Statut mis à jour: ${status}` };
  }

  // =============================
  // DELETE
  // =============================
  async remove(id: string, userId: string) {
    await this.checkOwnership(id, userId);

    return this.prisma.property.delete({
      where: { id },
    });
  }

  // =============================
  // FAVORITES
  // =============================
  async toggleFavorite(propertyId: string, userId: string) {
    const existing = await this.prisma.favorite.findFirst({
      where: { propertyId, userId },
    });

    let liked: boolean;

    if (existing) {
      await this.prisma.favorite.delete({ where: { id: existing.id } });
      liked = false;
    } else {
      await this.prisma.favorite.create({
        data: { propertyId, userId },
      });
      liked = true;
    }

    // Compter le nombre total de likes pour cette propriété
    const likesCount = await this.prisma.favorite.count({
      where: { propertyId },
    });

    // 🔥 Émettre la mise à jour en temps réel à tous les clients
    this.propertyGateway.broadcastLikeUpdate(propertyId, likesCount, userId);

    // 🔥 Émettre une mise à jour spécifique à l'utilisateur
    this.propertyGateway.sendLikeUpdateToUser(
      userId,
      propertyId,
      liked,
      likesCount,
    );

    return { propertyId, liked, likesCount };
  }

  async getFavoritesByUser(userId: string) {
    const favorites = await this.prisma.favorite.findMany({
      where: { userId },
      select: { propertyId: true },
    });

    const propertyIds = favorites.map((f) => f.propertyId);

    // 🔍 Debug: Afficher les favoris de l'utilisateur
    console.log('🔍 getFavoritesByUser:', {
      userId,
      favoritesCount: favorites.length,
      propertyIds,
    });

    return propertyIds;
  }

  // =============================
  // FIND USER PROPERTIES
  // =============================
  async findUserProperties(userId: string, includeUnavailable: boolean = true) {
    return this.prisma.property.findMany({
      where: { userId },
      include: {
        images: true,
        address: true,
        reviews: true,
        amenities: { include: { amenity: true } },
        favorites: true, // Retourner TOUS les favoris pour compter
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // =============================
  // SECURE TEST
  // =============================
  findSecure() {
    return { message: 'Accès sécurisé OK 🔐' };
  }
}
