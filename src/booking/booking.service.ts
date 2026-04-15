import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';

@Injectable()
export class BookingService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createBookingDto: CreateBookingDto, userId: string) {
    const { propertyId, startDate, endDate } = createBookingDto;

    // Check if property exists
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    // Check if property is available
    if (property.status !== 'available') {
      throw new BadRequestException('Property is not available for booking');
    }

    // Check for overlapping bookings
    const overlappingBooking = await this.prisma.booking.findFirst({
      where: {
        propertyId,
        status: { in: ['pending', 'confirmed'] },
        OR: [
          {
            startDate: { lte: startDate },
            endDate: { gte: startDate },
          },
          {
            startDate: { lte: endDate },
            endDate: { gte: endDate },
          },
          {
            startDate: { gte: startDate },
            endDate: { lte: endDate },
          },
        ],
      },
    });

    if (overlappingBooking) {
      throw new BadRequestException(
        'Property is already booked for these dates',
      );
    }

    // Calculate total amount (you might want to implement more complex pricing logic)
    const days = Math.ceil(
      (new Date(endDate).getTime() - new Date(startDate).getTime()) /
        (1000 * 60 * 60 * 24),
    );
    const totalAmount = Number(property.price) * days;

    return this.prisma.booking.create({
      data: {
        propertyId,
        userId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        totalAmount,
      },
      include: {
        property: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async findAll(userId?: string) {
    const where = userId ? { userId } : {};

    return this.prisma.booking.findMany({
      where,
      include: {
        property: {
          include: {
            address: true,
            images: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string, userId?: string) {
    const where: any = { id };
    if (userId) {
      where.userId = userId;
    }

    const booking = await this.prisma.booking.findUnique({
      where,
      include: {
        property: {
          include: {
            address: true,
            images: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return booking;
  }

  async update(
    id: string,
    updateBookingDto: UpdateBookingDto,
    userId?: string,
  ) {
    const where: any = { id };
    if (userId) {
      where.userId = userId;
    }

    const existingBooking = await this.prisma.booking.findUnique({
      where,
    });

    if (!existingBooking) {
      throw new NotFoundException('Booking not found');
    }

    return this.prisma.booking.update({
      where: { id },
      data: updateBookingDto,
      include: {
        property: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async remove(id: string, userId?: string) {
    const where: any = { id };
    if (userId) {
      where.userId = userId;
    }

    const booking = await this.prisma.booking.findUnique({
      where,
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return this.prisma.booking.delete({
      where: { id },
    });
  }

  async findByProperty(propertyId: string) {
    return this.prisma.booking.findMany({
      where: { propertyId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findByUser(userId: string) {
    return this.prisma.booking.findMany({
      where: { userId },
      include: {
        property: {
          include: {
            address: true,
            images: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async hasBookingRelation(
    tenantId: string,
    ownerId: string,
  ): Promise<boolean> {
    const booking = await this.prisma.booking.findFirst({
      where: {
        userId: tenantId,
        property: {
          userId: ownerId,
        },
      },
    });
    return !!booking;
  }

  async getTenantOwnerRelations(tenantId: string) {
    const bookings = await this.prisma.booking.findMany({
      where: { userId: tenantId },
      include: {
        property: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // Extract unique owners
    const owners = new Map();
    bookings.forEach((booking) => {
      const owner = booking.property.user;
      if (!owners.has(owner.id)) {
        owners.set(owner.id, {
          ...owner,
          properties: [],
          bookings: [],
        });
      }
      owners.get(owner.id).properties.push({
        id: booking.property.id,
        title: booking.property.title,
      });
      owners.get(owner.id).bookings.push({
        id: booking.id,
        startDate: booking.startDate,
        endDate: booking.endDate,
        status: booking.status,
      });
    });

    return Array.from(owners.values());
  }
}
