import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { CreateTemporaryBlockDto } from './dto/create-temporary-block.dto';
import { QueryTemporaryBlockDto } from './dto/query-temporary-block.dto';
import { PrismaService } from '../prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class TemporaryBlockService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createTemporaryBlockDto: CreateTemporaryBlockDto) {
    const {
      propertyId,
      startDate,
      endDate,
      sessionId,
      durationMinutes = 15,
    } = createTemporaryBlockDto;

    // Verify property exists
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

    if (start >= end) {
      throw new BadRequestException('Start date must be before end date');
    }

    if (start < now) {
      throw new BadRequestException('Start date cannot be in the past');
    }

    // Calculate expiration time
    const expiresAt = new Date(now.getTime() + durationMinutes * 60 * 1000);

    // Check for overlapping confirmed bookings
    const overlappingBooking = await this.prisma.booking.findFirst({
      where: {
        propertyId,
        status: { in: ['confirmed', 'pending'] },
        OR: [
          {
            startDate: { lte: start },
            endDate: { gte: start },
          },
          {
            startDate: { lte: end },
            endDate: { gte: end },
          },
          {
            startDate: { gte: start },
            endDate: { lte: end },
          },
        ],
      },
    });

    if (overlappingBooking) {
      throw new ConflictException('Property is already booked for these dates');
    }

    // Check for overlapping active temporary blocks (different sessions)
    const overlappingBlock = await this.prisma.temporaryBlock.findFirst({
      where: {
        propertyId,
        sessionId: { not: sessionId },
        expiresAt: { gte: now },
        OR: [
          {
            startDate: { lte: start },
            endDate: { gte: start },
          },
          {
            startDate: { lte: end },
            endDate: { gte: end },
          },
          {
            startDate: { gte: start },
            endDate: { lte: end },
          },
        ],
      },
    });

    if (overlappingBlock) {
      throw new ConflictException(
        'Property is temporarily blocked for these dates by another user',
      );
    }

    // Remove existing blocks for this session and property (extend/update)
    await this.prisma.temporaryBlock.deleteMany({
      where: {
        propertyId,
        sessionId,
      },
    });

    // Create new temporary block
    return this.prisma.temporaryBlock.create({
      data: {
        propertyId,
        startDate: start,
        endDate: end,
        sessionId,
        expiresAt,
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            price: true,
            status: true,
          },
        },
      },
    });
  }

  async findByProperty(propertyId: string, queryDto: QueryTemporaryBlockDto) {
    // Verify property exists
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    const { startDate, endDate, includeExpired = false } = queryDto;
    const now = new Date();

    // Build where clause
    const where: any = { propertyId };

    // Filter by expiration
    if (!includeExpired) {
      where.expiresAt = { gte: now };
    }

    // Filter by date range
    if (startDate || endDate) {
      where.OR = [];

      if (startDate && endDate) {
        // Blocks that overlap with the specified range
        where.OR = [
          {
            startDate: { lte: new Date(endDate) },
            endDate: { gte: new Date(startDate) },
          },
        ];
      } else if (startDate) {
        where.endDate = { gte: new Date(startDate) };
      } else if (endDate) {
        where.startDate = { lte: new Date(endDate) };
      }
    }

    return this.prisma.temporaryBlock.findMany({
      where,
      include: {
        property: {
          select: {
            id: true,
            title: true,
            price: true,
            status: true,
          },
        },
      },
      orderBy: { expiresAt: 'desc' },
    });
  }

  async remove(id: string) {
    const block = await this.prisma.temporaryBlock.findUnique({
      where: { id },
    });

    if (!block) {
      throw new NotFoundException('Temporary block not found');
    }

    return this.prisma.temporaryBlock.delete({
      where: { id },
    });
  }

  async removeBySession(sessionId: string) {
    const deletedBlocks = await this.prisma.temporaryBlock.deleteMany({
      where: { sessionId },
    });

    return {
      message: `Deleted ${deletedBlocks.count} temporary blocks for session`,
      deletedCount: deletedBlocks.count,
    };
  }

  async cleanup() {
    const now = new Date();

    const deletedBlocks = await this.prisma.temporaryBlock.deleteMany({
      where: {
        expiresAt: { lt: now },
      },
    });

    return {
      message: `Cleaned up ${deletedBlocks.count} expired temporary blocks`,
      deletedCount: deletedBlocks.count,
      cleanupTime: now,
    };
  }

  // Cron job to automatically cleanup expired blocks every 5 minutes
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleCronCleanup() {
    try {
      const result = await this.cleanup();
      if (result.deletedCount > 0) {
        console.log(`[TemporaryBlock] ${result.message}`);
      }
    } catch (error) {
      console.error('[TemporaryBlock] Cleanup failed:', error);
    }
  }

  // Check if dates are available for a property
  async checkAvailability(
    propertyId: string,
    startDate: string,
    endDate: string,
    excludeSessionId?: string,
  ) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

    // Check confirmed bookings
    const overlappingBooking = await this.prisma.booking.findFirst({
      where: {
        propertyId,
        status: { in: ['confirmed', 'pending'] },
        OR: [
          {
            startDate: { lte: start },
            endDate: { gte: start },
          },
          {
            startDate: { lte: end },
            endDate: { gte: end },
          },
          {
            startDate: { gte: start },
            endDate: { lte: end },
          },
        ],
      },
    });

    if (overlappingBooking) {
      return {
        available: false,
        reason: 'Property is already booked for these dates',
        conflictType: 'booking',
        conflictId: overlappingBooking.id,
      };
    }

    // Check active temporary blocks (excluding current session)
    const where: any = {
      propertyId,
      expiresAt: { gte: now },
      OR: [
        {
          startDate: { lte: start },
          endDate: { gte: start },
        },
        {
          startDate: { lte: end },
          endDate: { gte: end },
        },
        {
          startDate: { gte: start },
          endDate: { lte: end },
        },
      ],
    };

    if (excludeSessionId) {
      where.sessionId = { not: excludeSessionId };
    }

    const overlappingBlock = await this.prisma.temporaryBlock.findFirst({
      where,
    });

    if (overlappingBlock) {
      return {
        available: false,
        reason: 'Property is temporarily blocked for these dates',
        conflictType: 'temporary_block',
        conflictId: overlappingBlock.id,
        expiresAt: overlappingBlock.expiresAt,
      };
    }

    return {
      available: true,
      reason: 'Property is available for these dates',
    };
  }

  // Extend expiration of existing block
  async extendBlock(
    propertyId: string,
    sessionId: string,
    additionalMinutes: number = 15,
  ) {
    const now = new Date();

    const existingBlock = await this.prisma.temporaryBlock.findFirst({
      where: {
        propertyId,
        sessionId,
        expiresAt: { gte: now },
      },
    });

    if (!existingBlock) {
      throw new NotFoundException(
        'No active temporary block found for this session',
      );
    }

    const newExpiresAt = new Date(
      existingBlock.expiresAt.getTime() + additionalMinutes * 60 * 1000,
    );

    // Limit maximum extension to 1 hour from now
    const maxExpiresAt = new Date(now.getTime() + 60 * 60 * 1000);
    const finalExpiresAt =
      newExpiresAt > maxExpiresAt ? maxExpiresAt : newExpiresAt;

    return this.prisma.temporaryBlock.update({
      where: { id: existingBlock.id },
      data: { expiresAt: finalExpiresAt },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            price: true,
            status: true,
          },
        },
      },
    });
  }

  // Get statistics about temporary blocks
  async getStats() {
    const now = new Date();

    const [totalActive, totalExpired, totalToday, blocksByProperty] =
      await Promise.all([
        // Active blocks
        this.prisma.temporaryBlock.count({
          where: { expiresAt: { gte: now } },
        }),

        // Expired blocks (last 24h)
        this.prisma.temporaryBlock.count({
          where: {
            expiresAt: {
              lt: now,
              gte: new Date(now.getTime() - 24 * 60 * 60 * 1000),
            },
          },
        }),

        // Blocks created today
        this.prisma.temporaryBlock.count({
          where: {
            expiresAt: {
              gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
            },
          },
        }),

        // Blocks by property (top 10)
        this.prisma.temporaryBlock.groupBy({
          by: ['propertyId'],
          where: { expiresAt: { gte: now } },
          _count: { propertyId: true },
          orderBy: { _count: { propertyId: 'desc' } },
          take: 10,
        }),
      ]);

    return {
      totalActive,
      totalExpired,
      totalToday,
      blocksByProperty: blocksByProperty.map((block) => ({
        propertyId: block.propertyId,
        count: block._count.propertyId,
      })),
      lastUpdated: now,
    };
  }
}
