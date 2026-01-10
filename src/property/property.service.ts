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

  // Helper pour convertir strings en numbers/booleans
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

    for (const field of intFields) {
      if (dto[field] !== undefined) {
        dto[field] = Number(dto[field]);
      }
    }

    for (const field of boolFields) {
      if (dto[field] !== undefined) {
        dto[field] = dto[field] === 'true' || dto[field] === true;
      }
    }

    return dto;
  }

  async create(
    createPropertyDto: CreatePropertyDto,
    userId: string,
    files?: Express.Multer.File[],
  ) {
    const { address, amenities, ...propertyData } =
      this.transformFormData(createPropertyDto);

    if (!address) throw new BadRequestException('Address is required');
    if (!userId) throw new BadRequestException('User ID is required');
    if (!files || files.length < 5) {
      throw new BadRequestException(
        `At least 5 images are required. You provided ${files?.length || 0}`,
      );
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
            latitude: address.latitude ? Number(address.latitude) : undefined,
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
      include: { address: true, amenities: { include: { amenity: true } } },
    });

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

    return this.findOne(property.id);
  }

  async findAll(userId?: string) {
    return this.prisma.property.findMany({
      include: {
        images: true,
        bookings: true,
        reviews: true,
        address: true,
        amenities: { include: { amenity: true } },
        favorites: userId ? { where: { userId }, select: { id: true } } : false,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const property = await this.prisma.property.findUnique({
      where: { id },
      include: {
        images: true,
        bookings: true,
        reviews: true,
        favorites: true,
        amenities: { include: { amenity: true } },
      },
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

    const { address, amenities, ...propertyData } =
      this.transformFormData(updatePropertyDto);

    const property = await this.prisma.property.update({
      where: { id },
      data: {
        ...propertyData,
        ...(address && { address: { update: address } }),
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
      include: { address: true, amenities: { include: { amenity: true } } },
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
    const existing = await this.prisma.favorite.findFirst({
      where: { propertyId, userId },
    });

    if (existing) {
      await this.prisma.favorite.delete({ where: { id: existing.id } });
      return { propertyId, liked: false };
    }

    await this.prisma.favorite.create({ data: { propertyId, userId } });
    return { propertyId, liked: true };
  }

  async getFavoritesByUser(userId: string) {
    const favorites = await this.prisma.favorite.findMany({
      where: { userId },
      select: { propertyId: true },
    });
    return favorites.map((fav) => fav.propertyId);
  }

  findSecure() {
    return { message: 'Accès sécurisé avec JwtCookieGuard ✅' };
  }
}
