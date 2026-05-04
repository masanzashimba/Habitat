import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { BookingStatus } from '@prisma/client';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class BookingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  async create(createBookingDto: CreateBookingDto, userId: string) {
    const { propertyId, startDate, endDate, nights, totalAmount } =
      createBookingDto;

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
            startDate: { lte: new Date(startDate) },
            endDate: { gte: new Date(startDate) },
          },
          {
            startDate: { lte: new Date(endDate) },
            endDate: { gte: new Date(endDate) },
          },
          {
            startDate: { gte: new Date(startDate) },
            endDate: { lte: new Date(endDate) },
          },
        ],
      },
    });

    if (overlappingBooking) {
      throw new BadRequestException(
        'Property is already booked for these dates',
      );
    }

    // Calculate nights and total amount
    const calculatedNights =
      nights ||
      Math.ceil(
        (new Date(endDate).getTime() - new Date(startDate).getTime()) /
          (1000 * 60 * 60 * 24),
      );
    const calculatedTotalAmount =
      totalAmount || Number(property.price) * calculatedNights;

    const booking = await this.prisma.booking.create({
      data: {
        propertyId,
        userId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        nights: calculatedNights,
        totalAmount: calculatedTotalAmount,
      },
      include: {
        property: true,
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            role: true,
          },
        },
      },
    });

    // Create notification for property owner
    try {
      await this.notificationService.createBookingNotification(
        property.userId,
        booking.id,
        'new',
        property.title,
        {
          tenantUserId: userId, // Ajouter l'ID de l'utilisateur
          tenantName: booking.user?.email || 'Client',
          startDate: booking.startDate,
          endDate: booking.endDate,
          nights: calculatedNights,
          totalAmount: calculatedTotalAmount,
        },
      );
    } catch (error) {
      console.error('Failed to create notification for owner:', error);
      // Don't fail the booking if notification fails
    }

    // Create notification for the client (tenant)
    try {
      await this.notificationService.createClientBookingNotification(
        userId,
        booking.id,
        property.title,
        {
          startDate: booking.startDate,
          endDate: booking.endDate,
          nights: calculatedNights,
          totalAmount: calculatedTotalAmount,
        },
      );
    } catch (error) {
      console.error('Failed to create notification for client:', error);
      // Don't fail the booking if notification fails
    }

    // Create notification for all admins
    try {
      const admins = await this.prisma.user.findMany({
        where: { role: 'admin' },
        select: { id: true },
      });

      for (const admin of admins) {
        await this.notificationService.createBookingNotification(
          admin.id,
          booking.id,
          'new',
          property.title,
          {
            tenantUserId: userId, // Ajouter l'ID de l'utilisateur
            propertyOwner: property.userId,
            tenantName: booking.user?.email || 'Client',
            startDate: booking.startDate,
            endDate: booking.endDate,
            nights: calculatedNights,
            totalAmount: calculatedTotalAmount,
          },
        );
      }
    } catch (error) {
      console.error('Failed to create notification for admins:', error);
      // Don't fail the booking if notification fails
    }

    return booking;
  }

  async findAll(userId?: string, userRole?: string) {
    let where: any = {};

    // Admin sees all bookings (no filter)
    if (userRole === 'admin') {
      // No filter - admin sees everything
    } else {
      // For non-admin users, check if they own any properties
      const userProperties = await this.prisma.property.findMany({
        where: { userId },
        select: { id: true },
      });

      if (userProperties.length > 0) {
        // User owns properties - show bookings for their properties
        where = {
          property: {
            userId: userId,
          },
        };
      } else {
        // User doesn't own properties - show their own bookings (as tenant)
        where = {
          userId,
        };
      }
    }

    return this.prisma.booking.findMany({
      where,
      include: {
        property: {
          include: {
            images: {
              orderBy: {
                isPrimary: 'desc',
              },
            },
            address: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            role: true,
            firstName: true,
            lastName: true,
            profileImage: true,
          },
        },
        tenant: true,
        validatedBy: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string, userId?: string, userRole?: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        property: {
          include: {
            images: {
              orderBy: {
                isPrimary: 'desc',
              },
            },
            address: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            role: true,
            firstName: true,
            lastName: true,
            profileImage: true,
          },
        },
        tenant: true,
        validatedBy: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Check access rights
    if (userRole !== 'admin') {
      const isOwner = booking.property.userId === userId;
      const isTenant = booking.userId === userId;

      if (!isOwner && !isTenant) {
        throw new ForbiddenException('Access denied to this booking');
      }
    }

    return booking;
  }

  async update(
    id: string,
    updateBookingDto: UpdateBookingDto,
    userId: string,
    userRole: string,
  ) {
    const existingBooking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        property: true,
      },
    });

    if (!existingBooking) {
      throw new NotFoundException('Booking not found');
    }

    // Check access rights
    if (userRole !== 'admin') {
      const isOwner = existingBooking.property.userId === userId;
      const isTenant = existingBooking.userId === userId;

      if (!isOwner && !isTenant) {
        throw new ForbiddenException('Access denied to update this booking');
      }
    }

    return this.prisma.booking.update({
      where: { id },
      data: updateBookingDto,
      include: {
        property: {
          include: {
            images: {
              orderBy: {
                isPrimary: 'desc',
              },
            },
            address: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            role: true,
            firstName: true,
            lastName: true,
            profileImage: true,
          },
        },
        tenant: true,
      },
    });
  }

  async remove(id: string, userId: string, userRole: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        property: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Check access rights
    if (userRole !== 'admin') {
      const isOwner = booking.property.userId === userId;
      const isTenant = booking.userId === userId || booking.tenantId === userId;

      if (!isOwner && !isTenant) {
        throw new ForbiddenException('Access denied to delete this booking');
      }
    }

    return this.prisma.booking.delete({
      where: { id },
    });
  }

  async findByProperty(propertyId: string, userId?: string, userRole?: string) {
    // Verify property exists and check access
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    // Only owner or admin can see all bookings for a property
    if (userRole !== 'admin' && property.userId !== userId) {
      throw new ForbiddenException(
        'Access denied to view bookings for this property',
      );
    }

    return this.prisma.booking.findMany({
      where: { propertyId },
      include: {
        property: {
          include: {
            images: {
              orderBy: {
                isPrimary: 'desc',
              },
            },
            address: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            role: true,
            firstName: true,
            lastName: true,
            profileImage: true,
          },
        },
        tenant: true,
        validatedBy: {
          select: {
            id: true,
            email: true,
            role: true,
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
            images: {
              orderBy: {
                isPrimary: 'desc',
              },
            },
            address: true,
          },
        },
        tenant: true,
        validatedBy: {
          select: {
            id: true,
            email: true,
            role: true,
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
                email: true,
                phone: true,
                role: true,
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

  async validateBooking(
    id: string,
    userId: string,
    userRole: string,
    status: BookingStatus,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        property: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Only owner or admin can validate
    if (userRole !== 'admin' && booking.property.userId !== userId) {
      throw new ForbiddenException('Only property owner or admin can validate');
    }

    // Update booking status
    const updatedBooking = await this.prisma.booking.update({
      where: { id },
      data: {
        status,
        validatedById: userId,
        validatedAt: new Date(),
      },
      include: {
        property: {
          include: {
            images: {
              orderBy: {
                isPrimary: 'desc',
              },
            },
            address: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            role: true,
            firstName: true,
            lastName: true,
            profileImage: true,
          },
        },
        tenant: true,
        validatedBy: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    });

    // If booking is confirmed, mark property as reserved
    if (status === 'confirmed') {
      await this.prisma.property.update({
        where: { id: booking.propertyId },
        data: {
          status: 'reserved',
        },
      });

      // Notify property owner that their property is now booked
      try {
        const bookingWithUser = await this.prisma.booking.findUnique({
          where: { id: booking.id },
          include: {
            user: {
              select: {
                email: true,
              },
            },
          },
        });

        await this.notificationService.createPropertyBookedNotification(
          booking.property.userId,
          booking.id,
          booking.property.title,
          {
            tenantEmail: bookingWithUser?.user?.email || 'Client',
            startDate: booking.startDate,
            endDate: booking.endDate,
            nights: booking.nights,
            totalAmount: booking.totalAmount,
          },
        );
      } catch (error) {
        console.error('Failed to create property booked notification:', error);
      }
    }

    // If booking is rejected or cancelled, mark property as available again
    if (status === 'rejected' || status === 'cancelled') {
      await this.prisma.property.update({
        where: { id: booking.propertyId },
        data: {
          status: 'available',
        },
      });

      // Notify property owner that their property is available again
      try {
        await this.notificationService.create({
          userId: booking.property.userId,
          title: 'Bien à nouveau disponible',
          message: `Votre bien "${booking.property.title}" est maintenant disponible suite au ${status === 'rejected' ? 'rejet' : "l'annulation"} de la réservation. Vous pouvez accepter de nouvelles demandes de réservation.`,
          type: 'property_available',
          data: {
            bookingId: booking.id,
            propertyId: booking.propertyId,
            propertyTitle: booking.property.title,
          },
        });
      } catch (error) {
        console.error(
          'Failed to create property available notification:',
          error,
        );
      }
    }

    // Create notification for the booking user
    try {
      const notificationType =
        status === 'confirmed' ? 'validated' : 'rejected';

      if (booking.userId) {
        await this.notificationService.createBookingNotification(
          booking.userId,
          booking.id,
          notificationType,
          booking.property.title,
        );
      }

      // Also notify admins
      const admins = await this.prisma.user.findMany({
        where: { role: 'admin' },
        select: { id: true },
      });

      for (const admin of admins) {
        // Don't notify admin if they are the one who validated
        if (admin.id !== userId) {
          await this.notificationService.createBookingNotification(
            admin.id,
            booking.id,
            notificationType,
            booking.property.title,
          );
        }
      }
    } catch (error) {
      console.error('Failed to create notification:', error);
      // Don't fail the validation if notification fails
    }

    return updatedBooking;
  }

  async cancelBooking(id: string, userId: string, userRole: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        property: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Check access rights
    if (userRole !== 'admin') {
      const isOwner = booking.property.userId === userId;
      const isTenant = booking.userId === userId || booking.tenantId === userId;

      if (!isOwner && !isTenant) {
        throw new ForbiddenException('Access denied to cancel this booking');
      }
    }

    // Cannot cancel already cancelled or rejected bookings
    if (booking.status === 'cancelled' || booking.status === 'rejected') {
      throw new BadRequestException('Booking is already cancelled or rejected');
    }

    const cancelledBooking = await this.prisma.booking.update({
      where: { id },
      data: {
        status: 'cancelled',
      },
      include: {
        property: {
          include: {
            images: {
              orderBy: {
                isPrimary: 'desc',
              },
            },
            address: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            role: true,
            firstName: true,
            lastName: true,
            profileImage: true,
          },
        },
        tenant: true,
      },
    });

    // If booking was confirmed or if property is reserved, mark property as available again
    if (
      booking.status === 'confirmed' ||
      booking.property.status === 'reserved'
    ) {
      await this.prisma.property.update({
        where: { id: booking.propertyId },
        data: {
          status: 'available',
        },
      });

      // Notify property owner that their property is available again
      try {
        await this.notificationService.create({
          userId: booking.property.userId,
          title: 'Bien à nouveau disponible',
          message: `Votre bien "${booking.property.title}" est maintenant disponible suite à l'annulation de la réservation. Vous pouvez accepter de nouvelles demandes de réservation.`,
          type: 'property_available',
          data: {
            bookingId: booking.id,
            propertyId: booking.propertyId,
            propertyTitle: booking.property.title,
          },
        });
      } catch (error) {
        console.error(
          'Failed to create property available notification:',
          error,
        );
      }
    }

    // Create notification for property owner if cancelled by tenant
    try {
      if (booking.userId === userId) {
        // Tenant cancelled, notify owner
        await this.notificationService.createBookingNotification(
          booking.property.userId,
          booking.id,
          'cancelled',
          booking.property.title,
        );
      } else if (booking.userId) {
        // Owner cancelled, notify tenant
        await this.notificationService.createBookingNotification(
          booking.userId,
          booking.id,
          'cancelled',
          booking.property.title,
        );
      }

      // Also notify admins
      const admins = await this.prisma.user.findMany({
        where: { role: 'admin' },
        select: { id: true },
      });

      for (const admin of admins) {
        // Don't notify admin if they are the one who cancelled
        if (admin.id !== userId) {
          await this.notificationService.createBookingNotification(
            admin.id,
            booking.id,
            'cancelled',
            booking.property.title,
          );
        }
      }
    } catch (error) {
      console.error('Failed to create notification:', error);
      // Don't fail the cancellation if notification fails
    }

    return cancelledBooking;
  }
}
