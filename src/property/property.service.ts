import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { CloudinaryService } from '../cloudinary.service';

@Injectable()
export class PropertyService {
  constructor(
    private prisma: PrismaService,
    private cloudinaryService: CloudinaryService,
  ) {}

  // async create(
  //   createPropertyDto: CreatePropertyDto,
  //   file?: Express.Multer.File,
  // ) {
  //   const { address, userId, ...propertyData } = createPropertyDto;

  //   const property = await this.prisma.property.create({
  //     data: {
  //       ...propertyData,
  //       user: { connect: { id: userId } }, // ✅ relie au user existant
  //       address: { create: address }, // ✅ crée une nouvelle adresse
  //     },
  //     include: {
  //       address: true,
  //     },
  //   });

  //   if (file) {
  //     const upload = await this.cloudinaryService.uploadImageBuffer(
  //       file.buffer,
  //       file.originalname,
  //     );
  //     await this.prisma.propertyImage.create({
  //       data: {
  //         imageUrl: upload.secure_url,
  //         propertyId: property.id,
  //         isPrimary: true,
  //       },
  //     });
  //   }

  //   return this.findOne(property.id);
  // }
  async create(
    createPropertyDto: CreatePropertyDto,
    userId: string,
    files?: Express.Multer.File[],
  ) {
    const { address, ...propertyData } = createPropertyDto;

    if (!address) {
      throw new BadRequestException('Address is required');
    }

    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    const property = await this.prisma.property.create({
      data: {
        ...propertyData,
        user: { connect: { id: userId } },
        address: {
          create: {
            commune: address.commune,
            quartier: address.quartier,
            avenue: address.avenue,
            number: address.number,
            city: address.city ?? 'Kinshasa',
            province: address.province ?? 'Kinshasa',
            latitude: address.latitude,
            longitude: address.longitude,
          },
        },
      },
      include: { address: true },
    });

    if (files?.length) {
      for (const [i, file] of files.entries()) {
        const upload = await this.cloudinaryService.uploadImageBuffer(
          file.buffer,
          file.originalname,
        );

        await this.prisma.propertyImage.create({
          data: {
            imageUrl: upload.secure_url,
            propertyId: property.id,
            isPrimary: i === 0,
          },
        });
      }
    }

    return this.findOne(property.id);
  }

  async findAll(userId?: string) {
    return this.prisma.property.findMany({
      include: {
        images: true,
        bookings: true,
        reviews: true,
        address: true,
        favorites: userId
          ? {
              where: { userId },
              select: { id: true },
            }
          : false,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const property = await this.prisma.property.findUnique({
      where: { id },
      include: { images: true, bookings: true, reviews: true, favorites: true },
    });
    if (!property) throw new NotFoundException(`Property ${id} not found`);
    return property;
  }
  async update(
    id: string,
    updatePropertyDto: UpdatePropertyDto,
    file?: Express.Multer.File,
  ) {
    await this.findOne(id);

    const { address, ...propertyData } = updatePropertyDto;

    const property = await this.prisma.property.update({
      where: { id },
      data: {
        ...propertyData,
        ...(address && {
          address: {
            update: address,
          },
        }),
      },
      include: { address: true },
    });

    if (file) {
      const upload = await this.cloudinaryService.uploadImageBuffer(
        file.buffer,
        file.originalname,
      );
      await this.prisma.propertyImage.create({
        data: {
          imageUrl: upload.secure_url,
          propertyId: property.id,
          isPrimary: false,
        },
      });
    }

    return this.findOne(property.id);
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.property.delete({ where: { id } });
  }

  async toggleFavorite(propertyId: string, userId: string) {
    if (!userId) throw new Error('User ID is required');

    // Vérifier si le favori existe déjà
    const existing = await this.prisma.favorite.findFirst({
      where: { propertyId, userId },
    });

    if (existing) {
      // Supprimer le favori
      await this.prisma.favorite.delete({
        where: { id: existing.id },
      });
      return { propertyId, liked: false };
    }

    // Ajouter un favori
    await this.prisma.favorite.create({
      data: { propertyId, userId },
    });

    return { propertyId, liked: true };
  }

  async getFavoritesByUser(userId: string) {
    const favorites = await this.prisma.favorite.findMany({
      where: { userId },
      select: { propertyId: true },
    });
    // Retourner juste les IDs des propriétés likées
    return favorites.map((fav) => fav.propertyId);
  }
  findSecure() {
    return { message: 'Accès sécurisé avec JwtCookieGuard ✅' };
  }
}
