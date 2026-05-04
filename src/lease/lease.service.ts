import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { CreateLeaseDto } from './dto/create-lease.dto';
import { UpdateLeaseDto } from './dto/update-lease.dto';
import { PrismaService } from '../prisma.service';
import { NotificationService } from '../notification/notification.service';
import { LeaseStatus } from '@prisma/client';

@Injectable()
export class LeaseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  async create(createLeaseDto: CreateLeaseDto, userId: string) {
    const {
      bookingId,
      propertyId,
      tenantId, // userId du locataire
      ownerId,
      startDate,
      endDate,
      rentAmount,
      currency,
      deposit,
    } = createLeaseDto;

    // Verify property exists
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    // Verify tenant (user) exists
    const tenant = await this.prisma.user.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant (user) not found');
    }

    // Verify owner exists
    const owner = await this.prisma.user.findUnique({
      where: { id: ownerId },
    });

    if (!owner) {
      throw new NotFoundException('Owner not found');
    }

    // If bookingId provided, verify it exists and is confirmed
    if (bookingId) {
      const booking = await this.prisma.booking.findUnique({
        where: { id: bookingId },
      });

      if (!booking) {
        throw new NotFoundException('Booking not found');
      }

      if (booking.status !== 'confirmed') {
        throw new BadRequestException(
          'Booking must be confirmed to create a lease',
        );
      }

      // Check if lease already exists for this booking
      const existingLease = await this.prisma.lease.findUnique({
        where: { bookingId },
      });

      if (existingLease) {
        throw new BadRequestException('Lease already exists for this booking');
      }
    }

    // Create lease
    const lease = await this.prisma.lease.create({
      data: {
        bookingId,
        propertyId,
        tenantId, // userId du locataire
        ownerId,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        rentAmount,
        currency: currency || 'USD',
        deposit,
      },
      include: {
        property: true,
        tenant: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            profileImage: true,
          },
        },
        owner: {
          select: {
            id: true,
            email: true,
            phone: true,
            role: true,
          },
        },
        booking: true,
      },
    });

    // Send notifications
    try {
      // Notify tenant
      await this.notificationService.createLeaseNotification(
        tenantId,
        lease.id,
        'created',
        property.title,
      );

      // Notify owner
      await this.notificationService.createLeaseNotification(
        ownerId,
        lease.id,
        'created',
        property.title,
      );
    } catch (error) {
      console.error('Failed to send lease notifications:', error);
    }

    return lease;
  }

  async createFromBooking(bookingId: string, userId: string, userRole: string) {
    // Verify booking exists
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        property: true,
        user: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Check if booking is confirmed
    if (booking.status !== 'confirmed') {
      throw new BadRequestException(
        'Booking must be confirmed to create a lease',
      );
    }

    // Check access rights (only owner or admin)
    if (userRole !== 'admin' && booking.property.userId !== userId) {
      throw new ForbiddenException(
        'Only property owner or admin can create lease',
      );
    }

    // Check if lease already exists
    const existingLease = await this.prisma.lease.findUnique({
      where: { bookingId },
    });

    if (existingLease) {
      throw new BadRequestException('Lease already exists for this booking');
    }

    // Le tenantId est maintenant le userId de l'utilisateur qui a fait la réservation
    const tenantId = booking.userId;

    if (!tenantId) {
      throw new BadRequestException('Cannot determine tenant for this booking');
    }

    console.log(
      `✅ Création du lease pour l'utilisateur ${booking.user.email} (ID: ${tenantId})`,
    );

    // Create lease from booking
    return this.create(
      {
        bookingId,
        propertyId: booking.propertyId,
        tenantId, // userId du locataire
        ownerId: booking.property.userId,
        startDate: booking.startDate.toISOString(),
        endDate: booking.endDate.toISOString(),
        rentAmount: Number(booking.totalAmount) / booking.nights, // Calculate monthly rent
        currency: 'USD',
        deposit: Number(booking.totalAmount), // Use total as deposit
      },
      userId,
    );
  }

  async findAll(userId: string, userRole: string) {
    let where: any = {};

    // Filter based on role
    if (userRole === 'owner') {
      where.ownerId = userId;
    } else if (userRole === 'tenant') {
      where.tenantId = userId; // tenantId est maintenant userId
    }
    // Admin sees all leases (no filter)

    return this.prisma.lease.findMany({
      where,
      include: {
        property: true,
        tenant: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            profileImage: true,
            address: true,
            city: true,
            isActive: true,
          },
        },
        owner: {
          select: {
            id: true,
            email: true,
            phone: true,
            role: true,
          },
        },
        booking: true,
        contract: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string, userId: string, userRole: string) {
    const lease = await this.prisma.lease.findUnique({
      where: { id },
      include: {
        property: true,
        tenant: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            profileImage: true,
            address: true,
            city: true,
            isActive: true,
          },
        },
        owner: {
          select: {
            id: true,
            email: true,
            phone: true,
            role: true,
          },
        },
        booking: true,
        contract: true,
      },
    });

    if (!lease) {
      throw new NotFoundException('Lease not found');
    }

    // Check access rights
    if (userRole !== 'admin') {
      const isOwner = lease.ownerId === userId;
      const isTenant = lease.tenantId === userId; // tenantId est maintenant userId

      if (!isOwner && !isTenant) {
        throw new ForbiddenException('Access denied to this lease');
      }
    }

    return lease;
  }

  async findByProperty(propertyId: string, userId: string, userRole: string) {
    // Verify property exists
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    // Check access rights
    if (userRole !== 'admin' && property.userId !== userId) {
      throw new ForbiddenException(
        'Access denied to view leases for this property',
      );
    }

    return this.prisma.lease.findMany({
      where: { propertyId },
      include: {
        tenant: true,
        owner: {
          select: {
            id: true,
            email: true,
            phone: true,
            role: true,
          },
        },
        booking: true,
        contract: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findByTenant(tenantId: string, userId: string, userRole: string) {
    // Verify tenant (user) exists
    const tenant = await this.prisma.user.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Check access rights
    if (userRole !== 'admin' && tenantId !== userId) {
      throw new ForbiddenException(
        'Access denied to view leases for this tenant',
      );
    }

    return this.prisma.lease.findMany({
      where: { tenantId },
      include: {
        property: true,
        tenant: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            profileImage: true,
          },
        },
        owner: {
          select: {
            id: true,
            email: true,
            phone: true,
            role: true,
          },
        },
        booking: true,
        contract: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findByOwner(ownerId: string, userId: string, userRole: string) {
    // Verify owner exists
    const owner = await this.prisma.user.findUnique({
      where: { id: ownerId },
    });

    if (!owner) {
      throw new NotFoundException('Owner not found');
    }

    // Check access rights
    if (userRole !== 'admin' && ownerId !== userId) {
      throw new ForbiddenException(
        'Access denied to view leases for this owner',
      );
    }

    return this.prisma.lease.findMany({
      where: { ownerId },
      include: {
        property: true,
        tenant: true,
        booking: true,
        contract: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async update(
    id: string,
    updateLeaseDto: UpdateLeaseDto,
    userId: string,
    userRole: string,
  ) {
    const lease = await this.prisma.lease.findUnique({
      where: { id },
      include: {
        property: true,
        tenant: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!lease) {
      throw new NotFoundException('Lease not found');
    }

    // Check access rights (only owner or admin)
    if (userRole !== 'admin' && lease.ownerId !== userId) {
      throw new ForbiddenException(
        'Only property owner or admin can update lease',
      );
    }

    const updatedLease = await this.prisma.lease.update({
      where: { id },
      data: updateLeaseDto,
      include: {
        property: true,
        tenant: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            profileImage: true,
          },
        },
        owner: {
          select: {
            id: true,
            email: true,
            phone: true,
            role: true,
          },
        },
        booking: true,
        contract: true,
      },
    });

    // Send notification
    try {
      await this.notificationService.createLeaseNotification(
        lease.tenantId, // tenantId est maintenant userId
        lease.id,
        'updated',
        lease.property.title,
      );
    } catch (error) {
      console.error('Failed to send lease update notification:', error);
    }

    return updatedLease;
  }

  async updateStatus(
    id: string,
    status: LeaseStatus,
    userId: string,
    userRole: string,
  ) {
    const lease = await this.prisma.lease.findUnique({
      where: { id },
      include: {
        property: true,
        tenant: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!lease) {
      throw new NotFoundException('Lease not found');
    }

    // Check access rights (only owner or admin)
    if (userRole !== 'admin' && lease.ownerId !== userId) {
      throw new ForbiddenException(
        'Only property owner or admin can update lease status',
      );
    }

    // If terminating, set endDate to now if not already set
    const updateData: any = { status };
    if (status === 'terminated' && !lease.endDate) {
      updateData.endDate = new Date();
    }

    const updatedLease = await this.prisma.lease.update({
      where: { id },
      data: updateData,
      include: {
        property: true,
        tenant: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            profileImage: true,
          },
        },
        owner: {
          select: {
            id: true,
            email: true,
            phone: true,
            role: true,
          },
        },
        booking: true,
        contract: true,
      },
    });

    // Send notification if terminated
    try {
      if (status === 'terminated') {
        await this.notificationService.createLeaseNotification(
          lease.tenantId, // tenantId est maintenant userId
          lease.id,
          'terminated',
          lease.property.title,
        );
      }
    } catch (error) {
      console.error('Failed to send lease termination notification:', error);
    }

    return updatedLease;
  }

  async remove(id: string, userId: string, userRole: string) {
    const lease = await this.prisma.lease.findUnique({
      where: { id },
      include: {
        contract: true,
      },
    });

    if (!lease) {
      throw new NotFoundException('Lease not found');
    }

    // Check access rights (only owner or admin)
    if (userRole !== 'admin' && lease.ownerId !== userId) {
      throw new ForbiddenException(
        'Only property owner or admin can delete lease',
      );
    }

    // Cannot delete if there's a contract
    if (lease.contract) {
      throw new BadRequestException(
        'Cannot delete lease with an associated contract',
      );
    }

    return this.prisma.lease.delete({
      where: { id },
    });
  }
}
