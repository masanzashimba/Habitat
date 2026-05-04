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
      'otherRooms',
      'discount',
      'securityDepositMonths',
      'commissionMonths',
    ];

    const decimalFields = [
      'price',
      'landSize',
      'commissionPercentage',
      'discount',
    ];

    const boolFields = ['isFeatured', 'isVerified'];

    intFields.forEach((field) => {
      if (
        dto[field] !== undefined &&
        dto[field] !== null &&
        dto[field] !== ''
      ) {
        dto[field] = Number(dto[field]);
      }
    });

    decimalFields.forEach((field) => {
      if (
        dto[field] !== undefined &&
        dto[field] !== null &&
        dto[field] !== ''
      ) {
        dto[field] = Number(dto[field]);
      }
    });

    boolFields.forEach((field) => {
      if (dto[field] !== undefined) {
        dto[field] = dto[field] === 'true' || dto[field] === true;
      }
    });

    return dto;
  }

  // 🔥 FILTER ALLOWED FIELDS
  private filterAllowedFields(data: any) {
    const allowedFields = [
      'title',
      'shortDescription',
      'description',
      'propertyType',
      'price',
      'priceUnit',
      'currency',
      'status',
      'purpose',
      'bedrooms',
      'beds',
      'bathrooms',
      'kitchens',
      'livingRooms',
      'otherRooms',
      'maxGuests',
      'landSize',
      'securityDepositMonths',
      'commissionMonths',
      'commissionPercentage',
      'discount',
      'paymentType',
      'specialNotes',
      'isFeatured',
      'isVerified',
    ];

    return Object.keys(data)
      .filter((key) => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = data[key];
        return obj;
      }, {} as any);
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
  // CREATE - VERSION OPTIMISÉE
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

    // Filtrer uniquement les champs qui existent dans le schéma Property
    const filteredPropertyData = this.filterAllowedFields(propertyData);

    // 🚀 ÉTAPE 1: Créer la propriété dans une transaction ultra-rapide
    const property = await this.prisma.$transaction(
      async (tx) => {
        const createdProperty = await tx.property.create({
          data: {
            ...filteredPropertyData,
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
          // 🚀 Inclure les relations nécessaires directement
          include: {
            address: true,
            amenities: { include: { amenity: true } },
          },
        });

        return createdProperty;
      },
      {
        maxWait: 5000, // Réduire à 5s
        timeout: 10000, // Réduire à 10s
      },
    );

    // 🚀 ÉTAPE 2: Lancer l'upload d'images en parallèle SANS ATTENDRE
    const imageUploadPromise = this.uploadImagesAsync(files, property.id);

    // 🚀 ÉTAPE 3: Lancer les notifications en arrière-plan SANS ATTENDRE
    const notificationPromise = this.sendNotificationsAsync(
      userId,
      property.id,
      propertyData.title,
      propertyData.propertyType,
    );

    // 🚀 ÉTAPE 4: Retourner immédiatement la propriété (sans attendre images/notifications)
    const baseProperty = {
      ...property,
      images: [], // Les images seront ajoutées en arrière-plan
    };

    // 🔥 Gérer les erreurs d'upload en arrière-plan
    imageUploadPromise.catch((error) => {
      console.error('❌ Erreur upload images (arrière-plan):', error);
      // Optionnel: Marquer la propriété comme ayant des problèmes d'images
    });

    // 🔥 Gérer les erreurs de notifications en arrière-plan
    notificationPromise.catch((error) => {
      console.error('❌ Erreur notifications (arrière-plan):', error);
    });

    return baseProperty;
  }

  // 🚀 Méthode pour upload d'images en arrière-plan
  private async uploadImagesAsync(
    files: Express.Multer.File[],
    propertyId: string,
  ): Promise<void> {
    try {
      // Upload toutes les images en parallèle
      const uploadPromises = files.map(async (file, index) => {
        try {
          const upload = await this.cloudinaryService.uploadImageBuffer(
            file.buffer,
            file.originalname,
          );

          return this.prisma.propertyImage.create({
            data: {
              imageUrl: upload.secure_url,
              propertyId: propertyId,
              isPrimary: index === 0,
            },
          });
        } catch (error) {
          console.error(`❌ Erreur upload image ${index + 1}:`, error);
          throw error;
        }
      });

      await Promise.all(uploadPromises);
      console.log(`✅ ${files.length} images uploadées avec succès`);
    } catch (error) {
      console.error('❌ Erreur critique upload images:', error);

      // En cas d'erreur critique, marquer la propriété comme ayant des problèmes
      await this.prisma.property.update({
        where: { id: propertyId },
        data: {
          status: 'available', // Garder disponible mais noter le problème
          // Optionnel: ajouter un champ pour marquer les problèmes d'images
        },
      });

      throw error;
    }
  }

  // 🚀 Méthode pour notifications en arrière-plan
  private async sendNotificationsAsync(
    userId: string,
    propertyId: string,
    propertyTitle: string,
    propertyType: string,
  ): Promise<void> {
    try {
      // Récupérer les infos utilisateur
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

      // Envoyer les notifications en parallèle
      await Promise.all([
        this.notificationService.createPropertyCreatedNotification(
          userId,
          propertyId,
          propertyTitle,
          propertyType,
        ),
        this.notificationService.createPropertyCreatedAdminNotification(
          propertyId,
          propertyTitle,
          propertyType,
          ownerName,
          owner?.email || '',
        ),
      ]);

      console.log('✅ Notifications envoyées avec succès');
    } catch (error) {
      console.error('❌ Erreur envoi notifications:', error);
      // Ne pas faire échouer la création pour des notifications
    }
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

    // Filtrer uniquement les champs qui existent dans le schéma Property
    const filteredPropertyData = this.filterAllowedFields(propertyData);

    const property = await this.prisma.property.update({
      where: { id },
      data: {
        ...filteredPropertyData,

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
  // SECURE TEST
  // =============================
  findSecure() {
    return { message: 'Accès sécurisé OK 🔐' };
  }
}
